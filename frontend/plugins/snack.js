import Vue from 'vue'

const snack = function (data) {
  this.$store.dispatch('ux/updateSnack', data)
}

const VueSnack = function () {
}

VueSnack.install = function (Vue) {
  Vue.snack = snack
  if (!Object.prototype.hasOwnProperty.call(Vue.prototype, '$snack')) {
    Object.defineProperty(Vue.prototype, '$snack', {
      get () {
        return snack
      }
    })
  }
}

Vue.use(VueSnack)
