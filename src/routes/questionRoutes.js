const express = require('express');
const router = express.Router();
const { generateQuestions, saveQuestionByUser, getQuestionsByUser } = require('../controllers/questionController');
const authenticateToken = require('../controllers/authController').authenticateToken;

// Ruta para generar preguntas
router.post('/generate', generateQuestions);

// Ruta para guardar una pregunta creada por el usuario (requiere autenticación)
router.post('/save', authenticateToken, saveQuestionByUser);

// Ruta para obtener todas las preguntas de un usuario específico (requiere autenticación)
router.get('/user/:userId', authenticateToken, getQuestionsByUser);

module.exports = router;
