const express = require('express');
const router = express.Router();
const { saveMessage, getMessages } = require('../controllers/messageController');
const { authenticateToken } = require('../controllers/authController');

/**
 * @swagger
 * /api/messages/save:
 *   post:
 *     summary: Guarda un mensaje creado por el usuario
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - chatId
 *               - userId
 *               - userText
 *               - assistantText
 *             properties:
 *               chatId:
 *                 type: string
 *               userId:
 *                 type: string
 *               userText:
 *                 type: string
 *               assistantText:
 *                 type: string
 *     responses:
 *       201:
 *         description: Mensaje guardado exitosamente
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.post('/save', authenticateToken, saveMessage);



/**
 * @swagger
 * /api/messages/user/{userId}/chat/{chatId}:
 *   get:
 *     summary: Obtiene todos los mensajes de un usuario específico en un chat específico
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: El ID del usuario
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: El ID del chat
 *     responses:
 *       200:
 *         description: Lista de mensajes del usuario en el chat especificado
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
 *                   userId:
 *                     type: string
 *                   userText:
 *                     type: string
 *                   assistantText:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.get('/user/:userId/chat/:chatId', authenticateToken, getMessages);

module.exports = router;