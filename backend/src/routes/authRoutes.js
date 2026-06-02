const express = require('express');
const router = express.Router();
const { register, login, refreshToken, logout, getMe, updateProfile, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { registerValidator, loginValidator, updateProfileValidator, changePasswordValidator } = require('../validators/authValidators');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication & User management
 */

router.post('/register', registerValidator, validate, register);
router.post('/login', loginValidator, validate, login);
router.post('/refresh-token', refreshToken);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfileValidator, validate, updateProfile);
router.put('/change-password', protect, changePasswordValidator, validate, changePassword);

module.exports = router;
