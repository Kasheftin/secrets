<template>
  <v-layout
    justify-center
    align-center
  >
    <v-card class="card">
      <v-card-title class="headline">
        Secret
      </v-card-title>
      <v-card-text>
        <v-alert v-if="alert" :type="alert.type">
          {{ alert.message }}
        </v-alert>
        <template v-if="isReady">
          <v-alert outlined>
            {{ note.content }}
          </v-alert>
          <div>
            <strong>
              Expiration Date:
            </strong>
            <span>
              {{ note.expiresAt || 'is not set' }}
            </span>
          </div>
          <div>
            <strong>
              Remaining Views:
            </strong>
            <span>
              {{ note.remainingViews === -1 ? 'is not set' : note.remainingViews }}
            </span>
          </div>
        </template>
      </v-card-text>
    </v-card>
  </v-layout>
</template>

<script>
import sodium from 'sodium-javascript'
import { urlDecodeBytes } from '~/utils/buffer'
import generalFormMixin from '~/mixins/generalFormMixin'

export default {
  mixins: [generalFormMixin],
  data () {
    return {
      note: {},
      isReady: false
    }
  },
  mounted () {
    this.setLoading()
    Promise.resolve()
      .then(() => this.$store.dispatch('fetch/fetch', { path: 'secret.get', data: { hash: this.$route.params.hash } }))
      .then((response) => {
        const note = response.data.data
        let content = note.content
        if (note.isEncryptedOnTheClient) {
          if (!this.$route.query.key || !this.$route.query.nonce) {
            throw new Error('The secret is encrypted on the client, key and nonce values must be provided to decrypt it.')
          }
          const key = urlDecodeBytes(this.$route.query.key)
          const nonce = urlDecodeBytes(this.$route.query.nonce)
          const cipher = urlDecodeBytes(content)
          const plainContent = Buffer.alloc(cipher.length - sodium.crypto_secretbox_MACBYTES)
          sodium.crypto_secretbox_open_easy(plainContent, cipher, nonce, key)
          content = plainContent.toString()
        }
        this.note = {
          ...note,
          content
        }
        this.isReady = true
        this.$snack(response.data.message)
      })
      .catch(error => this.handleError(error, { criticalToAlert: true }))
      .finally(() => {
        this.setLoading(false)
      })
  }
}
</script>

<style scoped>
.card {
  max-width: 400px;
  flex-grow: 1;
}
</style>
