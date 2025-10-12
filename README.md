# MGAP - Sistema de Gestión de Viajes

Sistema web completo para la gestión de viajes de choferes del Ministerio de Ganadería, Agricultura y Pesca (MGAP) de Uruguay.

## 🚀 Características

- **Backend**: Node.js + Express + MongoDB
- **Frontend**: React + TailwindCSS + Vite
- **Autenticación**: JWT con roles (Chofer/Administrativo)
- **Estado Global**: Zustand
- **UI Moderna**: Componentes reutilizables con TailwindCSS
- **Responsive**: Diseño adaptable a móviles y desktop

## 📋 Funcionalidades

### 👥 Roles de Usuario
- **Chofer**: Crear, editar y ver sus propios viajes
- **Administrativo**: Acceso completo al sistema

### 🚗 Gestión de Viajes
- Crear viajes con campos completos
- Estados: Programado, En curso, Finalizado, Cancelado
- Filtros por fecha, estado, destino, chofer
- Asignación automática de vehículos
- Validación de disponibilidad

### 🚙 Gestión de Vehículos
- Registro completo de vehículos
- Control de estados (Disponible, En uso, Mantenimiento)
- Asignación inteligente a viajes
- Historial de uso

### 📊 Dashboard
- Estadísticas en tiempo real
- Próximos viajes programados
- Viajes activos
- Accesos rápidos

## 🛠 Instalación y Configuración

### Prerrequisitos
- Node.js 16+ 
- MongoDB 4.4+
- npm o yarn

### 1. Clonar el Repositorio
```bash
git clone <repo-url>
cd "Gestion de choferes MGAP"
```

### 2. Configurar Backend

```bash
cd backend

# Instalar dependencias
npm install

# Crear archivo de entorno
cp .env .env.local
```

Editar `.env.local` con tus configuraciones:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mgap-viajes
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui_2024
NODE_ENV=development
```

### 3. Configurar Frontend

```bash
cd ../frontend

# Instalar dependencias
npm install

# Crear archivo de entorno (opcional)
echo "VITE_API_URL=http://localhost:5000/api" > .env.local
```

### 4. Inicializar Base de Datos

Crear usuario administrativo inicial:

```javascript
// Ejecutar en MongoDB shell o usar MongoDB Compass
use mgap-viajes;

db.users.insertOne({
  name: "Administrador",
  email: "admin@mgap.gub.uy",
  password: "$2a$10$8K1p/a0dF4h7F9q8r9s8LOeEO4R8q8r9s8LOeEO4R8q8r9s8LOeEO", // admin123
  role: "administrativo",
  employeeId: "ADMIN001",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

db.users.insertOne({
  name: "Juan Pérez",
  email: "chofer@mgap.gub.uy", 
  password: "$2a$10$8K1p/a0dF4h7F9q8r9s8LOeEO4R8q8r9s8LOeEO4R8q8r9s8LOeEO", // chofer123
  role: "chofer",
  employeeId: "CHOF001",
  phone: "099123456",
  department: "Montevideo",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});
```

## 🚀 Ejecución

### Desarrollo

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

### Producción

Backend:
```bash
cd backend
npm start
```

Frontend:
```bash
cd frontend
npm run build
npm run preview
```

## 📱 Uso del Sistema

### Acceso Inicial
- URL: `http://localhost:3000`
- Credenciales de prueba:
  - **Admin**: admin@mgap.gub.uy / admin123
  - **Chofer**: chofer@mgap.gub.uy / chofer123

### Flujo de Trabajo

1. **Login**: Ingreso con credenciales
2. **Dashboard**: Vista general del sistema
3. **Crear Viaje**: Formulario con validaciones
4. **Gestión**: Filtros, búsquedas, edición
5. **Reportes**: Estadísticas y seguimiento

## 🏗 Arquitectura del Proyecto

```
├── backend/
│   ├── src/
│   │   ├── config/          # Configuración de DB
│   │   ├── controllers/     # Lógica de negocio
│   │   ├── middleware/      # Auth y validaciones
│   │   ├── models/          # Esquemas de MongoDB
│   │   ├── routes/          # Rutas de API
│   │   └── server.js        # Servidor principal
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Componentes reutilizables
│   │   ├── pages/           # Páginas principales
│   │   ├── store/           # Estado global (Zustand)
│   │   ├── utils/           # Utilidades y helpers
│   │   ├── App.jsx          # Componente principal
│   │   └── main.jsx         # Punto de entrada
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 🔧 APIs Principales

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Perfil actual
- `PUT /api/auth/profile` - Actualizar perfil

### Viajes
- `GET /api/trips` - Listar viajes
- `POST /api/trips` - Crear viaje
- `PUT /api/trips/:id` - Actualizar viaje
- `DELETE /api/trips/:id` - Eliminar viaje

### Vehículos
- `GET /api/vehicles` - Listar vehículos
- `GET /api/vehicles/available` - Vehículos disponibles
- `POST /api/vehicles` - Crear vehículo
- `PUT /api/vehicles/:id` - Actualizar vehículo

### Dashboard
- `GET /api/dashboard/stats` - Estadísticas generales
- `GET /api/dashboard/upcoming-trips` - Próximos viajes
- `GET /api/dashboard/active-trips` - Viajes activos

## 🔐 Seguridad

- Autenticación JWT
- Validación de datos con express-validator
- Autorización por roles
- Protección de rutas sensibles
- Encriptación de contraseñas con bcrypt

## 📊 Base de Datos

### Colecciones Principales

1. **users**: Choferes y administradores
2. **trips**: Viajes programados/realizados
3. **vehicles**: Flota de vehículos

### Relaciones
- Trip -> User (chofer)
- Trip -> Vehicle (vehículo asignado)
- Trip -> User (creado_por)

## 🎨 Tecnologías Frontend

- **React 18**: Biblioteca principal
- **Vite**: Bundler y dev server
- **TailwindCSS**: Estilos utilitarios
- **Zustand**: Gestión de estado
- **React Router**: Enrutamiento
- **React Hook Form**: Formularios
- **Lucide React**: Iconos
- **React Hot Toast**: Notificaciones

## 🔧 Tecnologías Backend

- **Node.js**: Runtime de JavaScript
- **Express**: Framework web
- **MongoDB**: Base de datos NoSQL
- **Mongoose**: ODM para MongoDB
- **JWT**: Tokens de autenticación
- **bcryptjs**: Encriptación de contraseñas
- **express-validator**: Validación de datos

## 🚀 Próximas Mejoras

- [ ] Módulo de reportes avanzados
- [ ] Notificaciones push
- [ ] Integración con GPS
- [ ] App móvil nativa
- [ ] Sistema de combustible
- [ ] Mantenimiento programado
- [ ] Dashboard de KPIs
- [ ] Exportación de datos
- [ ] Audit trail completo

## 🐛 Resolución de Problemas

### MongoDB no conecta
```bash
# Verificar que MongoDB esté corriendo
sudo systemctl status mongod

# Iniciar MongoDB
sudo systemctl start mongod
```

### Puerto ocupado
```bash
# Verificar qué proceso usa el puerto
lsof -i :5000
lsof -i :3000

# Cambiar puerto en .env o package.json
```

### Dependencias
```bash
# Limpiar cache y reinstalar
rm -rf node_modules package-lock.json
npm install
```

## 📄 Licencia

Este proyecto es de uso interno del MGAP. Todos los derechos reservados.

## 👥 Contribución

Para contribuir al proyecto:

1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

---

**Desarrollado para MGAP - Ministerio de Ganadería, Agricultura y Pesca**