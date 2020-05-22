<template>
  <v-dialog
    v-model="isOpenedInner"
    max-width="600"
  >
    <v-card>
      <v-toolbar color="primary" dark>
        <v-toolbar-title>
          New secret has been created
        </v-toolbar-title>
      </v-toolbar>
      <v-card-text class="pa-4">
        <v-alert color="info" outlined>
          <p>
            That is the link to your new secret:
          </p>
          <div style="word-break: break-all;">
            <nuxt-link :to="link" target="_blank">
              {{ link }}
            </nuxt-link>
          </div>
        </v-alert>
      </v-card-text>
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn
          text
          @click="isOpenedInner = false"
        >
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>

export default {
  props: {
    isOpened: {
      type: Boolean,
      default: false
    },
    hash: {
      type: String,
      default: null
    },
    encryptionKey: {
      type: String,
      default: null
    },
    nonce: {
      type: String,
      default: null
    }
  },
  data () {
    return {
      isOpenedInner: false
    }
  },
  computed: {
    link () {
      if (this.hash) {
        return this.$router.resolve({
          name: 'secret-:hash',
          params: {
            hash: this.hash
          },
          query: {
            key: this.encryptionKey,
            nonce: this.nonce
          }
        }).href
      } else {
        return '/'
      }
    }
  },
  watch: {
    isOpened: {
      immediate: true,
      handler (value) {
        this.isOpenedInner = value
      }
    },
    isOpenedInner (value) {
      this.$emit('update:is-opened', value)
    }
  }
}
</script>
