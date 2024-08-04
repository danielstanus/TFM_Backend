const express = require('express');
const cors = require('cors');
const db = require('./config/db'); 
const questionRoutes = require('./routes/questionRoutes');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require('./routes/messageRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);

// Endpoint de prueba para la conexión a la base de datos
app.get('/api/test-db', async (req, res) => {
    try {
      const result = await db.query('SELECT NOW()');
      res.json({
        message: 'Conexión a la base de datos exitosa',
        currentTime: result.rows[0].now
      });
    } catch (err) {
      console.error('Error al conectar con la base de datos:', err);
      res.status(500).json({
        error: 'Error al conectar con la base de datos',
        details: err.message
      });
    }
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;