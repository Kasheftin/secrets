import * as formInstanceMethods from '~/utils/form'

export default {
  data () {
    return {
      loading: false,
      alert: null,
      validationErrors: {}
    }
  },
  methods: {
    ...formInstanceMethods,
    resetAlert () {
      this.alert = null
    },
    setValidationErrors (value) {
      this.validationErrors = value || {}
    },
    resetValidationErrors () {
      this.validationErrors = {}
    },
    setLoading (value) {
      this.loading = value
    },
    handleError (res, options) {
      if (!options) { options = {} }
      return new Promise((resolve, reject) => {
        const error = formInstanceMethods.extractErrorResponse(res)
        console.error(res, error)
        this.validationErrors = error.validationErrors || {}
        if (error.criticalMessage) {
          if (options.criticalToAlert) {
            this.alert = { type: 'error', message: error.criticalMessage }
          } else {
            this.$swal({ type: 'error', title: error.code ? 'Error #' + error.code : 'Error!', text: error.criticalMessage })
          }
        }
        if (error.minorMessage) {
          this.$snack({ type: 'error', message: error.minorMessage })
        }
        return options.throwError ? reject(res) : resolve(res)
      })
    }
  }
}
