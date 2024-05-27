import express from 'express'
import {
  resetPasswordRequestController,
  resetPasswordController,
  refreshController,
  registrationController
} from '../controllers/AuthController'
import { loginController } from '../controllers/LoginController'
import { logoutController } from '../controllers/LogoutController'
import { requireJwtAuth, requireLocalAuth } from '../middleware'

const router = express.Router()

//Local
router.post('/logout', requireJwtAuth, logoutController)
router.post('/login', requireLocalAuth, loginController)
router.post('/refresh', refreshController)
router.post('/register', registrationController)
router.post('/requestPasswordReset', resetPasswordRequestController)
router.post('/resetPassword', resetPasswordController)

export default router
