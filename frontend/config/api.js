export default {
  secret: {
    create: {
      post: '/api/secret'
    },
    get: {
      get: '/api/secret/:hash'
    }
  }
}
