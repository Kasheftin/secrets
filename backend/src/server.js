import 'module-alias/register'
import bodyParser from 'body-parser'
import express from 'express'
import '~/utils/dotenv'
import routes from '~/routes'

const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: true
}))

app.get('/', function (req, res) {
  res.send('The default API route leaves here.')
})

app.use('/', routes)

app.listen(process.env.APP_PORT, function () {
  console.log(`Back-end is listening on port ${process.env.APP_PORT}.`)
})

export default app
