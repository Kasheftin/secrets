import isObject from 'lodash/isObject'
import isArray from 'lodash/isArray'
import isEmpty from 'lodash/isEmpty'
import cloneDeep from 'lodash/cloneDeep'
import pick from 'lodash/pick'
import omit from 'lodash/omit'
import isSet from 'lodash/isSet'
import last from 'lodash/last'

export function getId (instance, checkWithin) {
  if (isObject(instance) && !isArray(instance)) {
    if (!checkWithin) { checkWithin = ['id', 'code'] }
    for (let i = 0; i < checkWithin.length; i++) {
      if (Object.prototype.hasOwnProperty.call(instance, checkWithin[i])) {
        return instance[checkWithin[i]]
      }
    }
    return null
  }
  return instance
}

export function getIds (instance) {
  const out = {}
  Object.keys(instance).forEach((key) => {
    out[key] = getId(instance[key])
  })
  return out
}

export function getArrayIds (instance) {
  if (isArray(instance)) {
    return instance.map(item => getId(item))
  }
  return instance
}

// Two way: either prepare instance for internal use, or prepare form submit data, external for api;
export function getInstanceFieldValue (instance, field, forSubmit) {
  const out = { isset: false, value: field.multiple ? [] : null }
  if (!instance || !isObject(instance) || isEmpty(instance)) { return out }
  let value = instance
  if (forSubmit) {
    value = instance[field.key]
  } else {
    const ar = field.key.split(/\./)
    for (let i = 0; i < ar.length; i++) {
      if (Object.prototype.hasOwnProperty.call(value, ar[i])) {
        value = value[ar[i]]
      } else { return out }
    }
  }
  value = cloneDeep(value)
  if (field.multiple || isArray(value)) {
    if (isArray(value)) { out.value = value } else if (isSet(value)) { out.value.push(value) }
    out.value = out.value.reduce((out, item) => {
      let valueToPush = item
      if ((forSubmit && field.saveAsObject) || (!forSubmit && field.objectValue)) {
        out.push(valueToPush)
      } else if (isObject(valueToPush) && Object.prototype.hasOwnProperty.call(valueToPush, 'id')) {
        if (field.int && !isNaN(valueToPush.id)) {
          out.push(Number(valueToPush.id))
        } else if (!field.int) {
          out.push(valueToPush.id)
        }
      } else if (isObject(valueToPush) && Object.prototype.hasOwnProperty.call(valueToPush, 'code')) {
        if (field.int && !isNaN(valueToPush.code)) {
          out.push(Number(valueToPush.code))
        } else if (!field.int) {
          out.push(valueToPush.code)
        }
      } else if (!isObject(valueToPush)) {
        if (field.int) {
          valueToPush = isNaN(valueToPush) ? 0 : Number(valueToPush)
        } else if (field.type === 'boolean') {
          valueToPush = !!valueToPush
        }
        out.push(valueToPush)
      }
      return out
    }, [])
    out.isset = !!out.value.length
  } else {
    let valueToPush = value
    if ((forSubmit && field.saveAsObject) || (!forSubmit && field.objectValue)) {
      out.value = valueToPush
    } else if (isObject(valueToPush) && Object.prototype.hasOwnProperty.call(valueToPush, 'id')) {
      if (field.int) {
        out.value = isNaN(valueToPush.id) ? 0 : Number(valueToPush.id)
      } else {
        out.value = valueToPush.id
      }
    } else if (isObject(valueToPush) && Object.prototype.hasOwnProperty.call(valueToPush, 'code')) {
      if (field.int) {
        out.value = isNaN(valueToPush.code) ? 0 : Number(valueToPush.code)
      } else {
        out.value = valueToPush.code
      }
    } else if (!isObject(valueToPush)) {
      if (field.int) {
        valueToPush = isNaN(valueToPush) ? 0 : Number(valueToPush)
      } else if (field.type === 'boolean') {
        valueToPush = !!valueToPush
      }
      out.value = valueToPush
    }
    out.isset = !!out.value
  }
  return out
}

export function prepareInstance (instance, fields) {
  const out = {}
  const usedFields = {}
  const iterableFields = (fields ? (isArray(fields) ? fields : isObject(fields) ? Object.values(fields) : []) : []) || []
  iterableFields.forEach((field) => {
    const res = getInstanceFieldValue(instance, field)
    if (!res.isset && Object.prototype.hasOwnProperty.call(field, 'default')) { out[field.key] = field.default } else { out[field.key] = res.value }
    usedFields[field.key] = true
  })
  if (isObject(instance)) {
    Object.keys(instance).forEach((key) => {
      if (!usedFields[key]) {
        out[key] = cloneDeep(instance[key])
      }
    })
  }
  return out
}

export function prepareFormSubmitData (instance, fields) {
  const out = {}
  const iterableFields = (fields ? (isArray(fields) ? fields : isObject(fields) ? Object.values(fields) : []) : []) || []
  iterableFields.forEach((field) => {
    let target = out
    const ar = field.key.split(/\./)
    for (let i = 0; i < ar.length - 1; i++) {
      if (!Object.prototype.hasOwnProperty.call(target, ar[i])) { target[ar[i]] = {} }
      target = target[ar[i]]
    }
    const res = getInstanceFieldValue(instance, field, true)
    target[field.saveAs || last(ar)] = res.value
  })
  return out
}

export function extractErrorResponse (error) {
  const out = { message: '', ...omit(error, 'response') }
  if (error.response) {
    out.code = error.response.status
    out.status = error.response.status
    out.message = error.response.statusText || `Error #${out.code}`
    if (error.response.data) {
      if (Object.prototype.hasOwnProperty.call(error.response.data, 'message')) {
        out.message = error.response.data.message
      }
      if (Object.prototype.hasOwnProperty.call(error.response.data, 'isCriticalError')) {
        out.isCriticalError = error.response.data.isCriticalError
      }
      const validationErrors = {}
      if (error.response.data.validationErrors) {
        error.response.data.validationErrors.forEach((rw) => {
          if (!validationErrors[rw.field]) { validationErrors[rw.field] = [] }
          if (rw.messageArguments && rw.message) {
            validationErrors[rw.field].push(pick(rw, 'message', 'messageArguments'))
          } else {
            validationErrors[rw.field].push(rw.message)
          }
        })
      }
      if (error.response.data.errors && isObject(error.response.data.errors)) {
        Object.keys(error.response.data.errors).forEach((key) => {
          const rws = error.response.data.errors[key]
          if (rws && isArray(rws) && rws.length) {
            validationErrors[key] = [...rws]
          }
        })
      }
      if (!isEmpty(validationErrors)) {
        out.validationErrors = validationErrors
      }
    }
  } else if (error instanceof Error) {
    out.message = error.message
  }
  const isMinorError = Object.prototype.hasOwnProperty.call(out, 'isCriticalError') && !out.isCriticalError
  if (isMinorError) {
    out.minorMessage = out.message
  } else {
    out.criticalMessage = out.message
  }
  return out
}
