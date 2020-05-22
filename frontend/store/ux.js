import Vue from 'vue'
import cookies from 'js-cookie'
import merge from 'lodash/merge'
import configSettings from '~/config/settings'

export const state = () => ({
  settings: { ...configSettings.default },
  serverSettings: {
    dateFormat: 'DD.MM.YYYY',
    dateFormatShort: 'DD MMM',
    timeFormat: 'HH:mm'
  },
  snack: {},
  swal: {},
  window: {
    clientHeight: 0,
    offsetHeight: 0,
    scrollTop: 0,
    width: 0,
    height: 0
  },
  appClass: '',
  pings: {}
})

export const getters = {
  serverSettings: (state) => {
    return {
      ...state.serverSettings
    }
  }
}

export const mutations = {
  replaceSettings (state, data) {
    state.settings = data
  },
  extendSettings (state, data) {
    // We need deep merge here;
    Vue.set(state, 'settings', merge({ updated: true }, state.settings, data))
  },
  updateSnack (state, data) {
    state.snack = data
  },
  updateSwal (state, data) {
    state.swal = data
  },
  setWindowSize (state, window) {
    state.window = {
      ...state.window,
      ...window
    }
  },
  setAppClass (state, appClass) {
    state.appClass = appClass
  },
  setPings (state, pings) {
    state.pings = {
      ...state.pings,
      ...pings
    }
  }
}

export const actions = {
  updateSettings ({ commit, dispatch, state }, data) {
    commit('extendSettings', data)
    cookies.set(configSettings.cookieName, state.settings)
    return Promise.resolve(data)
  },
  clearSettings ({ commit, dispatch, state }) {
    commit('replaceSettings', { ...configSettings.default })
    cookies.remove(configSettings.cookieName)
    return Promise.resolve()
  },
  updateSnack ({ commit }, value) {
    commit('updateSnack', value)
    return Promise.resolve(value)
  },
  updateSwal ({ commit }, value) {
    commit('updateSwal', value)
    return Promise.resolve(value)
  },
  setWindowSize ({ commit }, window) {
    commit('setWindowSize', window)
    return Promise.resolve()
  },
  setAppClass ({ commit }, appClass) {
    commit('setAppClass', appClass)
    return Promise.resolve()
  },
  setPings ({ commit }, pings) {
    commit('setPings', pings)
    return Promise.resolve()
  },
  updatePings ({ dispatch }) {
    return Promise.resolve()
      .then(() => dispatch('fetch/fetch', { path: 'pings.list' }, { root: true }))
      .then((response) => {
        dispatch('setPings', response.data.badgeCounts)
      })
  }
}
