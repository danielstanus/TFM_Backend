const express = require('express');
const router = express.Router();
const { createChat,getChats } = require('../controllers/chatController');
const authenticateToken = require('../controllers/authController').authenticateToken;

// Ruta para crear un chat por el usuario (requiere autenticación)
router.post('/create', authenticateToken, createChat);

// Ruta para obtener todas los chats de un usuario específico (requiere autenticación)
router.get('/user/:userId', authenticateToken, getChats);

module.exports = router;

