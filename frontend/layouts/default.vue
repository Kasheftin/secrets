<template>
  <v-app>
    <v-content>
      <v-container fill-height>
        <nuxt />
      </v-container>
    </v-content>
    <snack />
    <swal />
  </v-app>
</template>

<script>
import Snack from '~/components/utils/Snack'
import Swal from '~/components/utils/Swal'

export default {
  components: {
    Snack,
    Swal
  }
}
</script>
