const express = require('express');
const router = express.Router();
const {saveMessage, getMessages} = require('../controllers/messageController');
const authenticateToken = require('../controllers/authController').authenticateToken;

// Ruta para guardar un mensaje creado por el usuario (requiere autenticación)
router.post('/save', authenticateToken, saveMessage);

// Ruta para obtener todas los mensajes de un usuario específico (requiere autenticación)
router.get('/user/:userId/chat/:chatId', authenticateToken, getMessages);

module.exports = router;
