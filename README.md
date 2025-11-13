# HabitApp
Proyecto Final Quinto Semestre
AppTiziHause (HabitApp)

Proyecto estilo Airbnb con Node.js + Express, MySQL y Frontend estático (HTML/CSS/JS/Bootstrap).
Cumple los RF/RNF definidos (autenticación, roles, búsqueda, reservas, pagos simulados, reseñas, reportes, notificaciones).

🧱 Stack

Frontend: HTML5, CSS3, JavaScript, Bootstrap (estático servido por Express)

Backend: Node.js 20 LTS (ES Modules) + Express

BD: MySQL 8.x (esquema habitapp)

Utilidades: dotenv, bcrypt, express-session, helmet, cors, express-rate-limit, dayjs

Dev: nvm, nodemon, ESLint, Prettier

✅ Requisitos

Git (último estable)

Node.js 20.11.1 (con nvm)

MySQL 8.x

Windows (recomendado): nvm-windows con NVM_HOME=C:\nvm y NVM_SYMLINK=C:\nvm\nodejs.
Activa Developer Mode en Windows para que nvm cree symlinks sin admin.

🚀 Inicio rápido (3 minutos)
# 1) Clonar
git clone https://github.com/JOHANN28910231/HabitApp.git
cd HabitApp

# 2) Node (usa la versión del proyecto)
nvm install
nvm use

# 3) Dependencias
npm i

# 4) Variables de entorno
cp .env.example .env
# -> Edita .env con tus credenciales locales de MySQL

# 5) Base de datos (una vez)
# Importa db/init.sql y luego db/seed.sql en tu MySQL (Workbench o CLI)

# 6) Correr en desarrollo
npm run dev
# http://localhost:3000 (sirve /public) | API en /api/*

🗂️ Estructura de carpetas

HabitApp/
├─ public/                 # Frontend estático (Bootstrap, JS del cliente)
│  ├─ css/
│  ├─ js/
│  └─ index.html
├─ db/
│  ├─ init.sql             # Esquema "habitapp" (pega aquí el SQL del proyecto)
│  └─ seed.sql             # Semillas: roles y datos mínimos
├─ src/
│  ├─ app.js               # Config principal de Express (middlewares, rutas, estáticos)
│  ├─ server.js            # Punto de entrada
│  ├─ middlewares/         # auth.js (sesión, roles)
│  ├─ utils/               # db.js (pool MySQL), calc.js (cálculos noche/semana/mes)
│  ├─ models/              # Acceso a MySQL por entidad (usuarios, propiedades, etc.)
│  ├─ controllers/         # Lógica de endpoints
│  └─ routes/              # Definición de endpoints (por módulo)
├─ scripts/                # utilidades (reset BD, etc.)
├─ .nvmrc
├─ .env.example
├─ .gitignore
└─ package.json

🔧 Configuración de entorno

Node: el archivo .nvmrc fija v20.11.1.

nvm install && nvm use

Variables: copia .env.example a .env y edita:

DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME=habitapp

SESSION_SECRET (pon uno largo y aleatorio)

MySQL:

Crea usuario de desarrollo (sugerido): dev_user/dev_pass

Importa db/init.sql y db/seed.sql

🧩 Scripts de npm

npm run dev → Levanta el server con nodemon (hot reload)

npm start → Levanta el server con Node

npm run lint → Revisa estilo con ESLint

npm run format → Formatea con Prettier

🔐 Seguridad & Sesiones

bcrypt para contraseñas (RF030).

express-session para recordar usuario y saludar (RF07).

helmet, cors, rate-limit activados (aporta a RF031/RNF05).

En producción, sirve detrás de HTTPS (Nginx/Reverse Proxy).

📚 Rutas base (resumen)

Los módulos se dividen por responsabilidad. Algunos ejemplos:

Auth: /api/auth/register, /api/auth/login, /api/auth/logout

Usuarios: /api/users/me, /api/users/:id (perfil, RF06)

Propiedades: /api/propiedades (CRUD anfitrión, RF08)

Habitaciones: /api/habitaciones (CRUD, fotos, servicios, RF09–RF010)

Búsqueda: /api/buscar (ubicación, fechas, rango, servicios, RF012–RF014)

Reservas: /api/reservas (crear, bloquear fechas, RF015–RF018, RF017)

Pagos: /api/pagos/checkout (mock, RF021–RF024)

Reseñas: /api/resenas (RF011)

Reportes: /api/reportes (diario/semanal/mensual/anual + descarga PDF, RF025–RF027)

🧮 Cálculos clave

Precio (RF013, RF016): src/utils/calc.js

noche = noches * precio_por_noche

semana = ceil(noches/7) * precio_por_semana

mes = ceil(noches/30) * precio_por_mes

Disponibilidad (RF014, RF017): comprobar solapes en reservaciones + habitacion_bloqueo.

👥 Flujo de trabajo del equipo (5 personas)

Ramas: main (estable), dev (integración), feat/* por módulo.

Antes de push: npm run format && npm run lint.

PRs de feat/* → dev. Tras pruebas manuales → merge a main.

Sugerencia de asignación:

A: Autenticación/Sesiones/Usuarios (RF01–RF07)

B: Propiedades/Habitaciones/Fotos/Servicios (RF08–RF010)

C: Búsqueda/Disponibilidad/Calendario (RF012–RF014)

D: Reservas/Pagos (mock)/Comprobante (RF015–RF024)

E: Reseñas/Reportes (RF011, RF025–RF027)

🧹 Estilo y calidad

ESLint + Prettier incluidos.

Convención de commits sugerida: Conventional Commits

feat:, fix:, chore:, docs:, refactor:, etc.
