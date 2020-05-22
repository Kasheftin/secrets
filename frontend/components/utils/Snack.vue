<template>
  <v-snackbar v-model="snack.value" :color="snack.type" :timeout="snack.timeout">
    {{ snack.message }}
    <v-btn v-if="snack.hideable" dark text @click="snack.value = false">
      Close
    </v-btn>
  </v-snackbar>
</template>

<script>
export default {
  data () {
    const defaultOptions = {
      value: false,
      type: '',
      timeout: 5000,
      hideable: true,
      message: ''
    }
    return {
      defaultOptions,
      snack: { ...defaultOptions }
    }
  },
  computed: {
    snackInput () { return this.$store.state.ux.snack }
  },
  watch: {
    snackInput (data) {
      this.updateSnack(data)
    }
  },
  beforeDestroy () {
    this._timeout && clearTimeout(this._timeout)
  },
  methods: {
    updateSnack (msg) {
      if (!msg) {
        this.snack.value = false
        return false
      }
      if (this.snack.value) {
        this.snack.value = false
        this._timeout = setTimeout(() => {
          this.updateSnack(msg)
        }, 200)
        return false
      }
      let message = msg
      if (msg instanceof Error && msg.response) {
        let errorMessage = msg.response.status + ' ' + msg.response.statusText
        if (msg.response.data) {
          if (msg.response.data.message) {
            errorMessage = msg.response.data.message
          }
          if (msg.response.data.errorType) {
            errorMessage = msg.response.data.errorType + ': ' + errorMessage
          }
          if (msg.response.data.error && msg.response.data.error.errors) {
            errorMessage += ': ' + msg.response.data.error.errors.map(e => e.message).join(', ')
          }
        }
        message = {
          type: 'error',
          message: errorMessage
        }
      } else if (msg instanceof Error) {
        message = {
          type: 'error',
          message: msg.message
        }
      } else if (msg && typeof msg === 'string') {
        message = {
          type: 'info',
          message: msg
        }
      }
      Object.keys(this.defaultOptions).forEach((field) => {
        this.snack[field] = (Object.prototype.hasOwnProperty.call(message, field) ? message[field] : this.defaultOptions[field])
      })
      this.snack.value = true
    }
  }
}
</script>
