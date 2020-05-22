<template>
  <v-dialog
    v-model="isOpenedInner"
    :persistent="loading"
    max-width="800"
  >
    <v-card>
      <v-toolbar color="primary" dark>
        <v-toolbar-title>
          Create a new secret
        </v-toolbar-title>
      </v-toolbar>
      <v-form @submit.prevent="handleSubmit">
        <v-card-text class="pa-4">
          <v-row>
            <v-col cols="12">
              <v-textarea
                v-model="instance.content"
                outlined
                label="Secret Content"
                hide-details
              />
            </v-col>
            <v-col cols="5">
              <v-switch
                v-model="instance.expires"
                label="Set Time to Live"
              />
            </v-col>
            <v-col cols="7">
              <v-text-field
                v-if="instance.expires"
                v-model="instance.ttl"
                label="TTL in seconds"
                type="number"
                hide-details
              />
            </v-col>
            <v-col cols="5">
              <v-switch
                v-model="instance.remainingViewsLimited"
                label="Limit the Number of Uses"
              />
            </v-col>
            <v-col cols="7">
              <v-text-field
                v-if="instance.remainingViewsLimited"
                v-model="instance.remainingViews"
                label="Total Views Count"
                type="number"
                hide-details
              />
            </v-col>
            <v-col cols="5">
              <v-switch
                v-model="instance.encrypt"
                label="Encrypt before sending to server"
              />
            </v-col>
            <v-col cols="7">
              <v-text-field
                v-if="instance.encrypt"
                :value="instance.encryptionKey"
                label="Encryption Key"
                hint="This key will not be sent to the server"
                persistent-hint
                readonly
              >
                <template #append>
                  <v-btn icon small @click="updateEncryptionKey">
                    <v-icon>
                      mdi-refresh
                    </v-icon>
                  </v-btn>
                </template>
              </v-text-field>
            </v-col>
            <v-col v-if="alert" cols="12">
              <v-alert type="error" outlined>
                {{ alert }}
              </v-alert>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn
            :loading="loading"
            text
            large
            @click="isOpenedInner = false"
          >
            Cancel
          </v-btn>
          <v-btn
            :loading="loading"
            large
            type="submit"
          >
            Create
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script>
import sodium from 'sodium-javascript'
import { urlEncodeBytes, urlDecodeBytes } from '~/utils/buffer'
import generalFormMixin from '~/mixins/generalFormMixin'

const defaultInstance = {
  content: '',
  expires: false,
  ttl: 3600,
  remainingViewsLimited: false,
  remainingViews: 10,
  encrypt: false,
  encryptionKey: ''
}

export default {
  mixins: [generalFormMixin],
  props: {
    isOpened: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      isOpenedInner: false,
      instance: {}
    }
  },
  watch: {
    isOpened: {
      immediate: true,
      handler (value) {
        this.isOpenedInner = value
        if (value) {
          this.instance = {
            ...defaultInstance
          }
        }
      }
    },
    isOpenedInner (value) {
      this.$emit('update:is-opened', value)
    },
    'instance.encrypt' (value) {
      if (value) {
        this.updateEncryptionKey()
      }
    }
  },
  methods: {
    updateEncryptionKey () {
      const key = Buffer.alloc(sodium.crypto_secretbox_KEYBYTES)
      sodium.randombytes_buf(key)
      this.instance.encryptionKey = urlEncodeBytes(key)
    },
    handleSubmit () {
      let content = this.instance.content
      let clientQuery = {}
      if (this.instance.encrypt) {
        if (!this.instance.encryptionKey) {
          this.updateEncryptionKey()
        }
        const key = urlDecodeBytes(this.instance.encryptionKey)
        const nonce = Buffer.alloc(sodium.crypto_secretbox_NONCEBYTES)
        sodium.randombytes_buf(nonce)
        const contentBuffer = Buffer.from(this.instance.content)
        const cipher = Buffer.alloc(contentBuffer.length + sodium.crypto_secretbox_MACBYTES)
        sodium.crypto_secretbox_easy(cipher, contentBuffer, nonce, key)
        content = urlEncodeBytes(cipher)
        clientQuery = {
          encryptionKey: this.instance.encryptionKey,
          nonce: urlEncodeBytes(nonce)
        }
        /*
        const nonce2 = urlDecodeBytes(clientQuery.nonce)
        const key2 = urlDecodeBytes(clientQuery.encryptionKey)
        const cipher2 = urlDecodeBytes(content)
        const plainText = Buffer.alloc(cipher2.length - sodium.crypto_secretbox_MACBYTES)
        sodium.crypto_secretbox_open_easy(plainText, cipher2, nonce2, key2)
        console.log('values', clientQuery.nonce, clientQuery.encryptionKey, content)
        console.log('Plaintext:', plainText.toString())
        */
      }
      const data = {
        content,
        ttl: (this.instance.expires ? this.instance.ttl : -1) || -1,
        remainingViews: (this.instance.remainingViewsLimited ? this.instance.remainingViews : -1) || -1,
        isEncryptedOnTheClient: this.instance.encrypt
      }
      this.setLoading(true)
      this.resetAlert()
      return Promise.resolve()
        .then(() => this.$store.dispatch('fetch/fetch', { path: 'secret.create', data }))
        .then((response) => {
          this.$emit('created', {
            hash: response.data.data.hash,
            ...clientQuery
          })
          this.isOpenedInner = false
          this.$snack(response.data.message)
        })
        .catch(this.handleError)
        .finally(() => {
          this.setLoading(false)
        })
    }
  }
}
</script>
