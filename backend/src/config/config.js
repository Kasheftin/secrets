module.exports = {
  development: {
    username: 'secrets',
    password: 'G5Pv9Wi4IIZcaMDy',
    database: 'secrets_development',
    host: '92.62.139.12',
    dialect: 'mysql',
    operatorsAliases: '0'
  },
  test: {
    username: 'secrets',
    password: 'G5Pv9Wi4IIZcaMDy',
    database: 'secrets_test',
    host: '92.62.139.12',
    dialect: 'mysql',
    operatorsAliases: '0'
  },
  production: {
    username: 'secrets',
    password: 'G5Pv9Wi4IIZcaMDy',
    database: 'secrets',
    host: '127.0.0.1',
    dialect: 'mysql',
    dialectOptions: {
      socketPath: '/var/run/mysqld/mysqld.sock'
    },
    operatorsAliases: '0'
  }
}
