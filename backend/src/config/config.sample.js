module.exports = {
  development: {
    username: 'secrets',
    password: '***',
    database: 'secrets_development',
    host: '***',
    dialect: 'mysql',
    operatorsAliases: '0'
  },
  test: {
    username: 'secrets',
    password: '***',
    database: 'secrets_test',
    host: '***',
    dialect: 'mysql',
    operatorsAliases: '0'
  },
  production: {
    username: 'secrets',
    password: '***',
    database: 'secrets',
    host: '127.0.0.1',
    dialect: 'mysql',
    dialectOptions: {
      socketPath: '/var/run/mysqld/mysqld.sock'
    },
    operatorsAliases: '0'
  }
}
