<template>
  <v-layout
    column
    justify-center
    align-center
  >
    <v-card>
      <v-card-title class="headline">
        Secrets
      </v-card-title>
      <v-card-text>
        <p class="body-1">
          This is the page where you can create a new secret.
        </p>
        <p class="body-1">
          If you want to read a secret, you have you have to open a link with the valid access token.
        </p>
        <p class="body-1">
          Find a bug? Report it on the github <a
            href="https://github.com/kasheftin/secrets/issues"
            target="_blank"
          >
            issue board
          </a>
        </p>
      </v-card-text>
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn
          large
          @click="newSecretModal.isOpened = true"
        >
          Create a new secret
        </v-btn>
      </v-card-actions>
    </v-card>
    <NewSecretModal :is-opened.sync="newSecretModal.isOpened" @created="handleCreated" />
    <CreatedModal :is-opened.sync="createdModal.isOpened" v-bind="createdModal" />
  </v-layout>
</template>

<script>
import NewSecretModal from '~/components/NewSecretModal'
import CreatedModal from '~/components/CreatedModal'

export default {
  components: {
    NewSecretModal,
    CreatedModal
  },
  data () {
    return {
      newSecretModal: {
        isOpened: false
      },
      createdModal: {
        isOpened: false,
        hash: ''
      }
    }
  },
  methods: {
    handleCreated ({ hash, encryptionKey, nonce }) {
      this.createdModal = {
        isOpened: true,
        hash,
        encryptionKey,
        nonce
      }
    }
  }
}
</script>
