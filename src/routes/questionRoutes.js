const express = require('express');
const router = express.Router();
const { generateQuestions, saveQuestionByUser, getQuestionsByUser } = require('../controllers/questionController');
const authenticateToken = require('../controllers/authController').authenticateToken;

/**
 * @swagger
 * /api/questions/generate:
 *   post:
 *     summary: Genera preguntas basadas en un texto dado
 *     tags: [Questions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *               - numQuestions
 *             properties:
 *               text:
 *                 type: string
 *                 description: El texto base para generar las preguntas
 *               numQuestions:
 *                 type: integer
 *                 description: El número de preguntas a generar
 *     responses:
 *       200:
 *         description: Preguntas generadas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   question:
 *                     type: string
 *                   options:
 *                     type: array
 *                     items:
 *                       type: string
 *                   answer:
 *                     type: string
 *       400:
 *         description: Datos de entrada inválidos
 *       500:
 *         description: Error del servidor
 */
router.post('/generate', generateQuestions);

/**
 * @swagger
 * /api/questions/save:
 *   post:
 *     summary: Guarda una pregunta creada por el usuario
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *               - options
 *               - answer
 *               - requestText
 *               - userId
 *             properties:
 *               text:
 *                 type: string
 *                 description: El texto de la pregunta
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Las opciones de respuesta
 *               answer:
 *                 type: string
 *                 description: La respuesta correcta
 *               requestText:
 *                 type: string
 *                 description: El texto original de la solicitud
 *               userId:
 *                 type: string
 *                 description: El ID del usuario que crea la pregunta
 *     responses:
 *       201:
 *         description: Pregunta guardada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 questionId:
 *                   type: string
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.post('/save', authenticateToken, saveQuestionByUser);

/**
 * @swagger
 * /api/questions/user/{userId}:
 *   get:
 *     summary: Obtiene todas las preguntas de un usuario específico
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: El ID del usuario
 *     responses:
 *       200:
 *         description: Lista de preguntas del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   chatId:
 *                     type: string
 *                   requestText:
 *                     type: string
 *                   question:
 *                     type: string
 *                   options:
 *                     type: array
 *                     items:
 *                       type: string
 *                   correctAnswer:
 *                     type: string
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.get('/user/:userId', authenticateToken, getQuestionsByUser);

module.exports = router;