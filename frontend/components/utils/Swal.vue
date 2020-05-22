<template>
  <v-dialog v-model="swal.value" max-width="600">
    <v-alert v-model="swal.value" :type="swal.type" :dismissible="true" class="ma-0 antegenes--alert">
      {{ swal.message }}
      <template v-slot:close>
        <v-btn x-small icon class="align-self-start antegenes--alert__close" @click="swal.value = false">
          <v-icon>
            mdi-close
          </v-icon>
        </v-btn>
      </template>
    </v-alert>
  </v-dialog>
</template>

<script>
export default {
  data () {
    return {
      swal: {
        type: '',
        value: false,
        message: ''
      }
    }
  },
  computed: {
    swalInput () { return this.$store.state.ux.swal }
  },
  watch: {
    swalInput (data) {
      this.updateSwal(data)
    }
  },
  beforeDestroy () {
    this._timeout && clearTimeout(this._timeout)
  },
  methods: {
    updateSwal (data) {
      if (!data || !data.text) {
        this.swal.value = false
        return false
      }
      if (this.swal.value) {
        this.snack.value = false
        setTimeout(() => {
          this.updateSwal(data)
        }, 200)
        return false
      }
      this.swal = {
        value: true,
        message: data.text,
        type: data.type || 'info'
      }
    }
  }
}
</script>
