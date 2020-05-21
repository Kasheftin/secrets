/* eslint-disable no-unused-expressions */
import chai, { expect } from 'chai'
import chaiHttp from 'chai-http'
import moment from 'moment'
import app from '../server'
import models from '../models'

chai.use(chaiHttp)
chai.should()

describe('Notes', () => {
  let requester = null

  before(() => {
    requester = chai.request(app).keepOpen()
  })

  after(() => {
    requester.close()
  })

  beforeEach(async () => {
    await models.Note.destroy({
      where: {},
      truncate: true
    })
  })

  it('should return 404 on incorrect hash', () =>
    Promise.resolve()
      .then(() => requester.get('/api/secret/invalidhash').send())
      .then((response) => {
        response.should.have.status(404)
      })
  )

  it('should create a note, then read it', () =>
    Promise.resolve()
      .then(() => requester.post('/api/secret/').send({ content: 'test' }))
      .then((response) => {
        response.should.have.status(200)
        expect(response.body.data.hash).to.be.a('string')
        return response.body.data.hash
      })
      .then((hash) => requester.get('/api/secret/' + hash).send())
      .then((response) => {
        response.should.have.status(200)
        expect(response.body.data.content).to.equal('test')
      })
  )

  it('should read a note with remainingViews=1 only once', () =>
    Promise.resolve()
      .then(() => requester.post('/api/secret/').send({ content: 'test', remainingViews: 1 }))
      .then((response) => {
        response.should.have.status(200)
        return response.body.data.hash
      })
      .then((hash) => requester.get('/api/secret/' + hash).send())
      .then((response) => {
        response.should.have.status(200)
        return response.body.data.hash
      })
      .then((hash) => requester.get('/api/secret/' + hash).send())
      .then((response) => {
        response.should.have.status(404)
      })
  )

  it('should read a note with expiresAt in the future and fail to read a note with expiresAt in the past', () =>
    Promise.resolve()
      .then(() => requester.post('/api/secret/').send({ content: 'test', expiresAt: moment().add(+1, 'hours').format() }))
      .then((response) => {
        response.should.have.status(200)
        return response.body.data.hash
      })
      .then((hash) => requester.get('/api/secret/' + hash).send())
      .then((response) => {
        response.should.have.status(200)
      })
      .then(() => requester.post('/api/secret/').send({ content: 'test', expiresAt: moment().add(-1, 'hours').format() }))
      .then((response) => {
        response.should.have.status(200)
        return response.body.data.hash
      })
      .then((hash) => requester.get('/api/secret/' + hash).send())
      .then((response) => {
        response.should.have.status(404)
      })
  )
})
