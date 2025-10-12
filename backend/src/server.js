const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');

// Cargar variables de entorno
dotenv.config();

// Conectar a MongoDB
connectDB();

const app = express();

// Middleware CORS - Permitir acceso público
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001', 
  'http://192.168.1.8:3000',
  'http://192.168.1.8:3001',
  'http://192.168.1.10:3000',
  'http://192.168.1.10:3001',
  // Vercel Hosting
  /\.vercel\.app$/,
  /\.vercel\.com$/,
  // Ngrok tunnels
  /\.ngrok\.io$/,
  /\.ngrok-free\.app$/,
  /\.ngrok-free\.dev$/
];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    // Verificar si el origin está permitido
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      }
      return allowedOrigin.test(origin);
    });
    
    callback(null, isAllowed);
  },
  credentials: true
}));
app.use(express.json());

// Rutas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/trips', require('./routes/trips'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/notifications', require('./routes/notifications'));

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API de Gestión de Viajes MGAP funcionando!' });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  console.log(`Acceso local: http://localhost:${PORT}`);
  console.log(`Acceso red local: http://192.168.1.8:${PORT}`);
  
  // Inicializar el servicio de notificaciones
  const { initializeFirebase } = require('./services/notificationService');
  initializeFirebase();
  
  // SCHEDULER DESACTIVADO - No se ejecutará automáticamente
  // const tripScheduler = require('./services/tripScheduler');
  // tripScheduler.start();
  console.log('📴 Scheduler automático desactivado');
});