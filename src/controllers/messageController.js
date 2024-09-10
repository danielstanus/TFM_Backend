const db = require('../config/db');

// Función para guardar un mensaje en la base de datos
const saveMessage = async (req, res) => {
  const { chatId, userId, userText, assistantText } = req.body;

  if (chatId === undefined || chatId === null) {
    return res.status(400).json({ error: 'El chatId es obligatorio' });
  }

  if (userId === undefined || userId === null) {
    return res.status(400).json({ error: 'El userId es obligatorio' });
  }

  try {
    const result = await db.query(
      `INSERT INTO messages (chat_id, user_id, user_text, assistant_text) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id`,
      [chatId, userId, userText, assistantText]
    );
    res.status(201).json({ message: 'Mensaje guardado con éxito', mensajeId: result.rows[0].id });
  } catch (err) {
    console.error('Error al guardar el mensaje:', err);
    res.status(500).json({ error: 'Error al guardar el mensaje' });
  }
};
// Función para obtener los mensajes creados por un usuario y un chat específico
const getMessages = async (req, res) => {
  const userId = req.params.userId;
  const chatId = req.params.chatId;

  try {
    const result = await db.query(
      `SELECT * FROM messages 
      WHERE user_id = $1 AND chat_id = $2 
      ORDER BY created_at ASC;`,
      [userId, chatId]
    );

    const formattedMessages = result.rows.map(q => ({
      id: q.id,
      chatId: q.chat_id,
      userId: q.user_id,
      userText: q.user_text,
      assistantText: q.assistant_text,
      createdAt: q.created_at
    }));

    res.status(200).json(formattedMessages);
  } catch (err) {
    console.error('Error al obtener los mensajes:', err);
    res.status(500).json({ error: 'Error al obtener los mensajes' });
  }
};
// Función para crear un nuevo chat
const createChat = async (userId) => {
  try {
    const result = await db.query('INSERT INTO chats (user_id) VALUES ($1) RETURNING id;', [userId]);
    return result.rows[0].id;
  } catch (err) {
    console.error('Error al crear el chat:', err);
    throw err;
  }
};

module.exports = {
  getMessages,
  saveMessage
};
