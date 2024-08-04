const db = require('../config/db');



// Función para obtener las preguntas creadas por un usuario
const getChats = async (req, res) => {
  const userId = req.params.userId;
  try {
    const [questions] = await db.query(
      `SELECT m.chat_id AS id, m.user_text
      FROM messages m
      INNER JOIN chats c ON m.chat_id = c.id
      WHERE c.user_id = ?
      AND m.created_at = (
          SELECT MIN(m2.created_at)
          FROM messages m2
          WHERE m2.chat_id = m.chat_id
      )
      ORDER BY c.created_at DESC
      LIMIT 20;
    `,
      [userId]
    );

 
    res.status(200).json(questions);
  } catch (err) {
    console.error('Error al obtener las preguntas:', err);
    res.status(500).json({ error: 'Error al obtener las preguntas' });
  }
};


// Función para guardar una pregunta creada por el usuario
const createChat = async (req, res) => {
  const { userId } = req.body;

  // Validar que userId no sea undefined o null
  if (userId === undefined || userId === null) {
    return res.status(400).json({ error: 'El userId es obligatorio' });
  }

  try {
    // Insertar un nuevo registro en la tabla 'chats' sin especificar el ID
    const [result] = await db.query('INSERT INTO chats (user_id) VALUES (?)', [userId]);

    // Devolver el ID del chat generado automáticamente
    return res.status(201).json({ chatId: result.insertId });
  } catch (err) {
    console.error('Error al crear el chat:', err);
    return res.status(500).json({ error: 'Error al crear el chat' });
  }
};


module.exports = {
  getChats,
  createChat
};
