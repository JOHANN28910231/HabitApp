# HabitApp
Proyecto Final Quinto Semestre
AppTiziHause (HabitApp)

Proyecto estilo Airbnb con Node.js + Express, MySQL y Frontend estático (HTML/CSS/JS/Bootstrap).

Cumple los RF/RNF definidos (autenticación, roles, búsqueda, reservas, pagos simulados, reseñas, reportes, notificaciones).

## Documento de requerimientos

A continuación, se presenta el documento de Requerimientos Funcionales(RF) y Requerimientos No Funcionales(RNF) del sistema AppTiziHause
- [Especificación de Requerimientos de Software.pdf](https://github.com/user-attachments/files/23600934/Especificacion.de.Requerimientos.de.Software.pdf)


## Stack

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

🚀 Inicio rápido
 1) Clonar

- git clone https://github.com/JOHANN28910231/HabitApp.git

- cd HabitApp

2) Node (usa la versión del proyecto)
- nvm install

- nvm use

3) Dependencias
- npm i

4) Variables de entorno
- cp .env.example .env
- -> Edita .env con tus credenciales locales de MySQL

5) Crear la base de datos y las tablas en MySQL Workbench

- Abran MySQL Workbench y conéctense.
- Menú File → Open SQL Script…
- Busquen dentro del proyecto: HabitApp/db/init.sql.
- Den clic en el botón de rayo ⚡ para ejecutarlo.
- Verificar que aparece el esquema habitapp con todas las tablas.
- Cargar datos de prueba (seed)
- En Workbench, File → Open SQL Script…
- Abran HabitApp/db/seed.sql.
- Ejecuten ⚡.

Verifiquen con algunos SELECT:

SELECT * FROM usuarios;

SELECT * FROM propiedades;

SELECT * FROM habitacion;

SELECT * FROM reservaciones;


6) Levantar el servidor

De nuevo en PowerShell, dentro de la carpeta HabitApp:

- nvm use 20.11.1
- npm run dev

La app se levantará en http://localhost:3000.

## Instrucciones adicionales
Ya con eso listo, cada uno puede:
- Crear una rama para su módulo:
- git checkout -b feat/mi-modulo
- Programar su parte en src/.
- Probar con el npm run dev usando la BD llena con seed.sql.

Hacer:

- git add .
- git commit -m "feat: descripcion de lo que hice"
- git push origin feat/mi-modulo


Y abrir un Pull Request hacia main


🗂️ Estructura de carpetas 

<img width="754" height="500" alt="image" src="https://github.com/user-attachments/assets/a7b7ba5c-5036-48c4-9456-7f08c3164ab9" />



🔧 Configuración de entorno

Node: el archivo .nvmrc fija v20.11.1.

nvm install && nvm use

Variables: copia .env.example a .env y edita:

DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME=habitapp

SESSION_SECRET (pongan uno largo y aleatorio)

MySQL:

Crea usuario de desarrollo en MYSQL (sugerido): dev_user/dev_pass

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

📚 Rutas base 

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

## Cálculos clave

Precio (RF013, RF016): src/utils/calc.js

noche = noches * precio_por_noche

semana = ceil(noches/7) * precio_por_semana

mes = ceil(noches/30) * precio_por_mes

Disponibilidad (RF014, RF017): comprobar solapes en reservaciones + habitacion_bloqueo.

## División de carga de trabajo para cada integrante

A continuación, en el siguiente archivo pdf podrán encontrar de manera detallada lo que tienen que hacer, hay algunas secciones donde dice "opcional" pero de preferencia háganlo para mejorar el flujo de trabajo.
- [DivisiónCargaTrabajo.pdf](https://github.com/user-attachments/files/23600819/DivisionCargaTrabajo.pdf)



## Estilo y calidad

ESLint + Prettier incluidos.

Convención de commits sugerida: Conventional Commits

feat:, fix:, chore:, docs:, refactor:, etc.
