import { Router } from 'express'
import NotesController from './controllers/NotesController'

const routes = Router()

routes.get('/api/secret/:hash', NotesController.getByHash)
routes.post('/api/secret', NotesController.createNote)

export default routes
