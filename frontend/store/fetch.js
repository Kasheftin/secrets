/*
 * New API cacher.
 * Why do we need this at all? Why don't keep caches as plain objects inside the api?
 * The reason is ssr.
 * We want to be able to make some requests on server side and cache them, and then use the cache on client side.
 * But plain objects are not transfered from ssr to client side, only the store does.
 * That's why we keep cache in the store, and also we will try to restrict vuex reactivity by Object.freeze.
 * We will test if it gives any memory/performance optimization.
 * $store.dispatch('fetch/fetch', {path, data, formData, injectData, options, ...plainOptions})
 * - path: 'student.typeahead', 'activity.update' etc. related to the resources object inside ~/api2;
 * - data: an object that's sent as query params for get and data for post;
 * - formData: for file upload;
 * - injectData: if specified (and is not empty array), then no request will go; injectData will be set as the cache data and returned;
 * - options: merged with the api config;
 * - ...plainOptions: the other way to set options - also merged with the api config.
 * fetch({path: '...', force: true}) is the same as fetch({path: '...', options: {force: true}})
 *
 * API config options:
 * - cache: 0 (no cache), 1 (5s cache), 2 (60s cache), 3 (1h cache);
 * - force: the same as cache=0;
 * - rerun: by default if there's pending request, the next one will wait for it's result. This option will stop the current request and will send the new one, so that the old callback will be triggered after this new request will pass;
 * - cacheKey: if set, the cache key will be `path-cacheKey`, otherwise it will be `path-JSON.stringify(data)`
 */
import Vue from 'vue'
import Qs from 'qs'
import deepFreeze from 'deep-freeze'
import isArray from 'lodash/isArray'
import isFunction from 'lodash/isFunction'
import isObject from 'lodash/isObject'
import api from '~/config/api'
import { sortStrings } from '~/utils/string'

export const state = () => ({
  cachedReactiveData: {},
  loading: false,
  loadingCompletedAt: null
})

const cachedLocalData = {}

export const mutations = {
  setEntry (state, { cacheKey, marker, response, receivedAt }) {
    Vue.set(state.cachedReactiveData, cacheKey, {
      marker: marker || cacheKey,
      response: deepFreeze(response),
      receivedAt
    })
  },
  clearEntry (state, cacheKey) {
    Vue.delete(state.cachedReactiveData, cacheKey)
    delete cachedLocalData[cacheKey]
  },
  setLoading (state, value) {
    state.loading = value
  },
  setLoadingCompletedAt (state, value) {
    state.loadingCompletedAt = value
  }
}

const getNestedByPath = (nestedObject, path) => {
  const parts = path.split('.')
  let out = nestedObject
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] in out) {
      out = out[parts[i]]
    } else {
      return undefined
    }
  }
  return out
}

const dataToCacheKey = (data) => {
  return JSON.stringify(Object.keys(data).sort(sortStrings).reduce((out, key) => {
    if (data[key]) {
      out[key] = data[key]
    }
    return out
  }, {}))
}

const initCacheEntry = (cacheKey, marker) => {
  if (!Object.prototype.hasOwnProperty.call(cachedLocalData, cacheKey)) {
    cachedLocalData[cacheKey] = {
      marker: marker || cacheKey,
      loading: false,
      axiosSource: null,
      resolvers: [],
      rejecters: []
    }
  }
  return cachedLocalData[cacheKey]
}

const processResponse = (response, resource) => {
  if (resource.prepareItem) {
    if (isArray(response.data.results) && response.data.results.length) {
      response.data.results = response.data.results.map(resultRw => resource.prepareItem(resultRw))
    } else if (isArray(response.data) && response.data.length) {
      response.data = response.data.map(resultRw => resource.prepareItem(resultRw))
    }
  } else if (resource.prepareResponse) {
    response.data = resource.prepareResponse(response.data)
  }
  return response
}

const getCacheMs = (c) => {
  if (c === 1) { return 5000 }
  if (c === 2) { return 60000 }
  if (c === 3) { return 3600000 }
  return 0
}

const runRequest = ({ axios, resource, data, formData, options }) => {
  data = { ...(data || {}) }
  if (!options) { options = {} }
  if (resource.emulate && resource.emulate.run) {
    return Promise.resolve()
      .then(() => new Promise((resolve, reject) => {
        setTimeout(resolve, resource.emulate.delay || 0)
      }))
      .then(() => resource.emulate.run({ data }))
  }
  if (resource.custom) { return resource.custom({ axios, data, formData, options }) }
  const methods = ['get', 'post', 'patch', 'put', 'delete']
  const method = methods.find(m => !!resource[m]) || 'get'
  let url = resource.url || (isFunction(resource[method]) ? resource[method]({ data }) : resource[method])
  if (!url) { return Promise.reject(new Error('fetch/fetch: runRequest url is not defined')) }
  // url = url.replace(/^.*?\/api\//, '') + (url.includes('?') || url[url.length - 1] === '/' ? '' : '/')
  // url = url.replace(/^.*?\/api\//, '')
  url = url.replace(/(:[a-zA-Z]+)/g, (match) => {
    if (Object.prototype.hasOwnProperty.call(data, match.substr(1))) {
      const value = data[match.substr(1)]
      delete data[match.substr(1)]
      return value
    }
  })
  if (method === 'get') {
    return axios.request({ url, method, params: resource.url ? null : data, ...options })
  } else {
    return axios.request({ url, method, data: formData || data, ...options })
  }
}

const runRequests = ({ axios, resource, data, options }) => {
  resource = { ...resource }
  return new Promise((resolve, reject) => {
    let items = []
    const run = () => {
      runRequest({ axios, resource, data, options }).then((response) => {
        if (resource.iteratePages) {
          if (isArray(response.data.results) && response.data.results.length) {
            items = [...items, ...response.data.results]
          } else if (isArray(response.data) && response.data.length) {
            items = [...items, ...response.data]
          }
          if (response.data.next) {
            resource.url = response.data.next
            run()
          } else {
            resolve({ data: { results: items, count: items.count, previous: null, next: null } })
          }
        } else {
          resolve(response)
        }
      }).catch(reject)
    }
    run()
  })
}

export const actions = {
  setAxiosDefaults ({ commit }, data) {
    Object.assign(this.$axios.defaults, data)
    this.$axios.interceptors.request.use((config) => {
      config.paramsSerializer = params => Qs.stringify(params, {
        arrayFormat: 'brackets',
        encode: false
      })
      return config
    })
  },
  setToken ({ commit }, token) {
    if (token) {
      this.$axios.defaults.headers.common.Authorization = `Bearer ${token}`
    } else {
      this.$axios.defaults.headers.common = {}
    }
  },
  cancelByMarker ({ state }, marker) {
    if (!marker) { return false }
    Object.keys(cachedLocalData).forEach((key) => {
      if (cachedLocalData[key].marker.substr(0, marker.length) === marker && cachedLocalData[key].axiosSource) {
        cachedLocalData[key].axiosSource.cancel()
      }
    })
  },
  invalidateByMarker ({ state, commit, dispatch }, marker) {
    if (!marker) { return false }
    dispatch('cancelByMarker', marker)
    Object.keys(state.cachedReactiveData).forEach((key) => {
      if (state.cachedReactiveData[key].marker.substr(0, marker.length) === marker) {
        commit('clearEntry', key)
      }
    })
  },
  fetch ({ state, commit, rootState, rootGetters }, { path, data, formData, injectData, options, ajaxOptions, ...plainOptions }) {
    let resource = getNestedByPath(api, path)
    if (!resource) {
      throw new Error(`fetch/fetch: Path ${path} is not supported in api/api2.`)
    }
    if (!resource.custom && !resource.post && !resource.get && !resource.patch && !resource.put && !resource.delete) {
      throw new Error(`fetch/fetch: Path ${path} is not evaluable: custom/post/get/patch/delete option not found.`)
    }
    resource = {
      ...resource,
      ...options,
      ...plainOptions
    }
    if (resource.storeLink) {
      const storeData = getNestedByPath(rootState, resource.storeLink)
      if (isArray(storeData) && storeData.length) {
        // We can't use processResponse here since the data is some store value, and prepareItem/prepareResponse will mutate it.
        // We assume it has already been processed by the first initial fetch.
        // return processResponse({data: storeData}, opts, {state: rootState})
        return { data: storeData }
      }
    }
    // The default cache value = 1 for get requests and 0 for everything else; cache=1 means 5s cache (simultaneous requests prevention only);
    if (!Object.prototype.hasOwnProperty.call(resource, 'cache')) {
      resource.cache = resource.get ? 1 : 0
    }
    data = { ...data }
    if (resource.usePrimaryLocation && rootState.ux2.serverSettings.primary_location) {
      const paramName = isObject(resource.usePrimaryLocation) && resource.usePrimaryLocation.param ? resource.usePrimaryLocation.param : 'related_locations_ids'
      if (Object.prototype.hasOwnProperty.call(data, paramName)) {
        data[paramName] += '+' + rootState.ux2.serverSettings.primary_location
      } else {
        data[paramName] = rootState.ux2.serverSettings.primary_location
      }
    }
    if (resource.data && isFunction(resource.data)) {
      data = { ...resource.data({ data }), ...data }
    } else if (resource.data) {
      data = { ...resource.data, ...data }
    }
    if (formData) {
      return runRequest({ axios: this.$axios, resource, data, formData })
    }
    if (!resource.cache && injectData) {
      return Promise.resolve({ data: injectData })
    }
    if (!resource.cache) {
      return Promise.resolve()
        .then(() => {
          commit('setLoading', true)
        })
        .then(() => runRequests({ axios: this.$axios, resource, data, options: ajaxOptions }))
        .then(response => processResponse(response, resource))
        .finally(() => {
          commit('setLoading', false)
          commit('setLoadingCompletedAt', (new Date()).getTime())
        })
    }
    const cacheKey = path + '-' + (resource.cacheKey || dataToCacheKey(data)) + (resource.url || '')
    const cacheEntry = initCacheEntry(cacheKey, resource.marker)
    if (!resource.force && state.cachedReactiveData[cacheKey] && ((new Date()).getTime() - state.cachedReactiveData[cacheKey].receivedAt < getCacheMs(resource.cache))) {
      return Promise.resolve(state.cachedReactiveData[cacheKey].response)
    }
    return new Promise((resolve, reject) => {
      if (cacheEntry.loading) {
        if (resource.rerun) {
          cacheEntry.axiosSource && cacheEntry.axiosSource.cancel()
        } else {
          cacheEntry.resolvers.push(resolve)
          cacheEntry.rejecters.push(reject)
          return
        }
      }
      cacheEntry.loading = true
      cacheEntry.axiosSource = this.$axios.CancelToken.source()
      cacheEntry.resolvers.push(resolve)
      cacheEntry.rejecters.push(reject)
      Promise.resolve()
        .then(() => {
          if (injectData) { return { data: injectData } }
          commit('setLoading', true)
          return runRequests({ axios: this.$axios, resource, data, options: { cancelToken: cacheEntry.axiosSource.token } })
        })
        .then(response => processResponse(response, resource))
        .then((response) => {
          commit('setEntry', { cacheKey, marker: resource.marker || cacheKey, response: { data: response.data }, receivedAt: (new Date()).getTime() })
          cacheEntry.resolvers.forEach(resolve => resolve(response))
          cacheEntry.loading = false
          cacheEntry.axiosSource = null
          cacheEntry.resolvers = []
          cacheEntry.rejecters = []
        })
        .catch((error) => {
          if (!this.$axios.isCancel(error)) {
            cacheEntry.rejecters.forEach(reject => reject(error))
          }
          cacheEntry.loading = false
          cacheEntry.axiosSource = null
          cacheEntry.resolvers = []
          cacheEntry.rejecters = []
        })
        .finally(() => {
          commit('setLoading', false)
          commit('setLoadingCompletedAt', (new Date()).getTime())
        })
    })
  }
}
