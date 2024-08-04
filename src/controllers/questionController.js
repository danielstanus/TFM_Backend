const db = require('../config/db');
const { generateQuestionsFromAI } = require('../services/aiService');

// Función para generar preguntas
const generateQuestions = async (req, res) => {
  try {
    const { text, numQuestions, chatId } = req.body; // Extraer 'text' y 'numQuestions' del cuerpo de la solicitud
    console.log("Texto recibido:", text);
    console.log("Número de preguntas recibido:", numQuestions);

    if (!text) {
      return res.status(400).json({ error: 'Se requiere texto' });
    }

    if (!numQuestions || typeof numQuestions !== 'number') {
      return res.status(400).json({ error: 'Se requiere un número válido de preguntas' });
    }

    console.log("Llamando a generateQuestionsFromAI...");
    const questions = await generateQuestionsFromAI(text, numQuestions);
    console.log("Preguntas generadas:", questions);
    res.json(questions);
  } catch (err) {
    console.error("Error detallado en generateQuestions:", err);
    
    let errorMessage = 'Error al generar preguntas';
    let errorDetails = 'Error desconocido';

    if (err && typeof err === 'object') {
      errorMessage = err.message || errorMessage;
      errorDetails = err.stack || JSON.stringify(err);
    } else if (err !== undefined) {
      errorDetails = String(err);
    }

    console.error("Mensaje de error:", errorMessage);
    console.error("Detalles del error:", errorDetails);

    res.status(500).json({ 
      error: errorMessage, 
      details: errorDetails 
    });
  }
};


// Función para guardar una pregunta creada por el usuario
const saveQuestionByUser = async (req, res) => {
  const { text, options, answer, requestText, userId } = req.body;
  const createdAt = new Date();
  let chatId = req.body.chatId;

  if(chatId === undefined || chatId === null){
    chatId = await createChat(req.user.id);
  }

  try {
    const [result] = await db.query(
      `INSERT INTO questions (chat_id, request_text, question, options, correct_answer, created_by, created_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING id;`,
      [chatId, requestText, text, JSON.stringify(options), answer, userId, createdAt]
    );
    res.status(201).json({ message: 'Pregunta creada con éxito', questionId: result.rows[0].id });
  } catch (err) {
    console.error('Error al crear la pregunta:', err);
    res.status(500).json({ error: 'Error al crear la pregunta' });
  }
};






// Función para obtener las preguntas creadas por un usuario
const getQuestionsByUser = async (req, res) => {
  const userId = req.params.userId;
  try {
    const result = await db.query(
      'SELECT * FROM questions WHERE created_by = $1 ORDER BY created_at DESC',
      [userId]
    );

    const formattedQuestions = result.rows.map(q => ({
      id: q.id,
      chatId: q.chat_id,
      requestText: q.request_text,
      question: q.question,
      options: JSON.parse(q.options),
      correctAnswer: q.correct_answer,
    }));

    res.status(200).json(formattedQuestions);
  } catch (err) {
    console.error('Error al obtener las preguntas:', err);
    res.status(500).json({ error: 'Error al obtener las preguntas' });
  }
};





// Función para crear un nuevo chat
const createChat = async (userId) => {
  // Insertar un nuevo registro sin especificar el ID
  const result = await db.query('INSERT INTO chats (user_id) VALUES ($1) RETURNING id;', [userId]);
  
  // Obtener el ID generado automáticamente
  const chatId = result.rows[0].id;
  
  return chatId;
};




module.exports = {
  generateQuestions,
  saveQuestionByUser,
  getQuestionsByUser
};
