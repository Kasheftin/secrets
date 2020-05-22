import Vue from 'vue'

const swal = function (data) {
  this.$store.dispatch('ux/updateSwal', data)
}

const VueSwal = function () {
}

VueSwal.install = function (Vue) {
  Vue.swal = swal
  if (!Object.prototype.hasOwnProperty.call(Vue.prototype, '$swal')) {
    Object.defineProperty(Vue.prototype, '$swal', {
      get () {
        return swal
      }
    })
  }
}

Vue.use(VueSwal)
/*
import Vue from 'vue'
import VueSweetalert2 from 'vue-sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'

Vue.use(VueSweetalert2)
*/
