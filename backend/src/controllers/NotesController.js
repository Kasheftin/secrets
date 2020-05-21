import moment from 'moment'
import pick from 'lodash/pick'
import { SodiumPlus, CryptographyKey } from 'sodium-plus'
import { catchError, sendSuccess, throwError, throwIf } from '~/utils/requestHelpers'
import models from '~/models'

export default class NotesController {
  static async createNote (req, res) {
    try {
      // That's an additional encryption of already encrypted message that aims to not being able using DB without APP_PRIVATE_KEY;
      const sodium = await SodiumPlus.auto()
        .catch(throwError({ type: 'sodium', message: 'Error creating new SodiumPlus.' }))

      const hash = await sodium.crypto_secretbox_keygen()
        .catch(throwError({ type: 'sodium', message: 'Error generating SodiumPlus secretbox.' }))

      const key = CryptographyKey.from(process.env.APP_PRIVATE_KEY, 'hex')

      const nonce = await sodium.randombytes_buf(24)
        .catch(throwError({ type: 'sodium', message: 'Error generating SodiumPlus randombytes.' }))

      const encrypted = await sodium.crypto_secretbox(req.body.content, nonce, key)
        .catch(throwError({ type: 'sodium', message: 'Error encrypting content.' }))

      const note = await models.Note
        .build({
          hash: hash.toString('hex'),
          encryptedContent: nonce.toString('hex') + encrypted.toString('hex'),
          expiresAt: req.body.expiresAt,
          remainingViews: req.body.remainingViews || -1
        })
        .save()
        .catch(throwError('db'))

      sendSuccess(res)({
        hash: note.hash
      })
    } catch (error) {
      catchError(res, error)
    }
  }

  static async getByHash (req, res) {
    try {
      const note = await models.Note
        .findOne({ where: { hash: req.params.hash } })
        .then(
          throwIf(r => !r, { type: 'notfound', message: 'Note does not exist' }),
          throwError('db')
        )

      if (note.remainingViews === 0) {
        throwError({
          type: 'notfound',
          message: 'The note can not be shown anymore since the remaining count of views is zero'
        })()
      } else if (note.remainingViews > 0) {
        // It's possible to postpone this to async call, but then our syncronous tests can fail;
        await note.update({
          remainingViews: note.remainingViews - 1
        }).catch(throwError('db'))
      }

      if (note.expiresAt && moment().isAfter(note.expiresAt)) {
        throwError({
          type: 'notfound',
          message: 'The note can not be shown anymore since it\'s expired'
        })()
      }

      const sodium = await SodiumPlus.auto()
        .catch(throwError({ type: 'sodium', message: 'Error creating new SodiumPlus.' }))

      const key = CryptographyKey.from(process.env.APP_PRIVATE_KEY, 'hex')

      const nonce = await sodium.sodium_hex2bin(note.encryptedContent.substr(0, 48))
        .catch(throwError({ type: 'sodium', message: 'Error extracting nonce.' }))

      const ciphercontent = await sodium.sodium_hex2bin(note.encryptedContent.substr(48))
        .catch(throwError({ type: 'sodium', message: 'Error extracting content.' }))

      const decrypted = await sodium.crypto_secretbox_open(ciphercontent, nonce, key)
        .catch(throwError({ type: 'sodium', message: 'Error decrypting content.' }))

      sendSuccess(res)({
        ...pick(note, 'hash', 'remainingViews', 'expiresAt', 'createdAt'),
        content: decrypted.toString('utf-8')
      })
    } catch (error) {
      catchError(res, error)
    }
  }
}
