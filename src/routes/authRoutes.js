const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

// Ruta para el registro de nuevos usuarios
router.post('/register', register);

// Ruta para el inicio de sesión de usuarios
router.post('/login', login);

module.exports = router;

