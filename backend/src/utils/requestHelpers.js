import isObject from 'lodash/isObject'
import pick from 'lodash/pick'
import logger from './logger'

export const errorTypes = {
  validation: { status: 400, statusMessage: 'Validation Error', isCriticalError: false },
  badrequest: { status: 400, statusMessage: 'Bad Request', isCriticalError: true },
  unauthorized: { status: 401, statusMessage: 'Access Denied', isCriticalError: true },
  forbidden: { status: 403, statusMessage: 'Forbidden', isCriticalError: true },
  notfound: { status: 404, statusMessage: 'Not Found', isCriticalError: true },
  critical: { status: 500, statusMessage: 'Critical Error', isCriticalError: true },
  default: { status: 500, statusMessage: 'Default Error', isCriticalError: false },
  db: { status: 500, statusMessage: 'DB Error', isCriticalError: true },
  bcrypt: { status: 500, statusMessage: 'BCrypt Error', isCriticalError: true },
  sodium: { status: 500, statusMessage: 'Sodium Error', isCriticalError: true },
  badgateway: { status: 502, statusMessage: 'Bad Gateway', isCriticalError: true },
  exec: { status: 500, statusMessage: 'Model Execution Error', isCriticalError: true }
}

export const createError = (e, obj) => {
  if (!isObject(obj)) obj = { type: obj }
  obj = { ...obj }
  if (!obj.type || !errorTypes[obj.type]) obj.type = 'critical'
  Object.assign(obj, errorTypes[obj.type])
  if (!obj.message) {
    obj.message = obj.statusMessage
  }
  if (e) {
    obj.message = e.message
  } else {
    e = new Error(obj.message)
  }
  Object.assign(e, obj)
  return e
}

export const throwError = (obj) => {
  return e => {
    e = createError(e, obj)
    e.stage = 'thrown'
    logger.error(pick(e, 'errorType', 'message', 'status', 'stack'))
    e.logged = true
    throw e
  }
}

export const throwIf = (fn, obj) => {
  return result => {
    return fn(result) ? throwError(obj)() : result
  }
}

export const catchError = (res, e) => {
  if (!e) e = createError(e, 'default')
  e.stage = 'caught'
  if (!e.logged) {
    logger.error(pick(e, 'errorType', 'message', 'status', 'stack'))
  }
  const response = {
    type: 'error',
    errorType: e.type,
    isCriticalError: e.isCriticalError,
    message: e.message,
    statusMessage: e.statusMessage
  }
  if (e.validationErrors) {
    response.validationErrors = e.validationErrors
  }
  res.status(e.status || 500).json(response)
}

export const sendSuccess = (res, obj) => {
  return (data, globalData) => {
    if (!isObject(obj)) obj = { message: obj }
    res.status(200).json({ type: 'success', ...obj, data, ...globalData })
  }
}

export default {
  errorTypes,
  createError,
  throwError,
  throwIf,
  catchError,
  sendSuccess
}
