const express = require("express");
const cors = require("cors");

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swaggerConfig");
const path = require("path");

const db = require("./config/db");
const questionRoutes = require("./routes/questionRoutes");
const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");

const app = express();

// Orígenes permitidos
const allowedOrigins = [
  'https://tfm-frontend-khaki.vercel.app', // Origen de producción
  'http://localhost:3000' // Origen local (ajusta el puerto si es necesario)
];

// Configuración de CORS para permitir solicitudes desde orígenes permitidos
app.use(cors({
  origin: function (origin, callback) {
    // Permitir solicitudes sin origen (como POSTMAN) o si el origen está en la lista de permitidos
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
}));

app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

// Página de inicio con test de la base de datos
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Endpoint de prueba para la conexión a la base de datos
app.get("/api/test", async (req, res) => {
  try {
    const result = await db.query("SELECT NOW()");
    res.json({
      message: "Conexión a la base de datos exitosa",
      currentTime: result.rows[0].now,
    });
  } catch (err) {
    console.error("Error al conectar con la base de datos:", err);
    res.status(500).json({
      error: "Error al conectar con la base de datos",
      details: err.message,
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Captura de excepciones no manejadas
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
