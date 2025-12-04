# HabitApp
Proyecto Final Quinto Semestre
AppTiziHause (HabitApp)

Proyecto estilo Airbnb con Node.js + Express, MySQL y Frontend estático (HTML/CSS/JS/Bootstrap).

Cumple los RF/RNF definidos (autenticación, roles, búsqueda, reservas, pagos simulados, reseñas, reportes, notificaciones).

## Documento de requerimientos

A continuación, se presenta el documento de Requerimientos Funcionales(RF) y Requerimientos No Funcionales(RNF) del sistema AppTiziHause
- [Especificación de Requerimientos de Software.pdf](https://github.com/user-attachments/files/23600934/Especificacion.de.Requerimientos.de.Software.pdf)

## Diseño de la base de datos
Se tiene como diseño de la estructura de la base de datos el siguiente archivo tipo pdf donde viene especificado cada tabla con respecto a sus atributos y tipos de datos. Los cuáles fueron respetados al 100% para el desarrollo del sistema:
- [DiseñoBD.pdf](https://github.com/user-attachments/files/23774402/DisenoBD.pdf)

## Stack

Frontend: HTML5, CSS3, JavaScript/Express, Bootstrap

Backend: Node.js 20 LTS (ES Modules) + Express

BD: MySQL 8.x 

Utilidades: dotenv, bcrypt, express-session, helmet, cors, express-rate-limit, dayjs

Dev: nvm, nodemon, ESLint, Prettier

Pruebas : Jest

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

Rutas de las carpetas

public/ Contiene el Frondent Estático, lo que el servidor entrega directamente al navegador 
   - /css/ Aquí están los archivos de Bootstrap y los estilos personalizados
   - /js/ Archivos JavaScript. Contiene la lógica que se ejecuta directamente en el navegador del usuario
   - /index.html/ Página principal que carga el usuario. 

db/ Contiene todo los archivos relacionado con la base de datos
   - /init.sql/ Contiene la creación de las tablas, columnas, relaciones y estructuras necesarias
   - /seed.sql/ Las semillas de datos Contiene sentencias SQL para insertar datos iniciales, roles, usuarios de prueba.

src/ Todo el código del backend, esta es la carpeta principal de la lógica de negocio de Express y Node.js
   - /app.js/ Archivo que configura toda la aplicación Express.
En él se activan middlewares, rutas, archivos estáticos y manejo de errores.
   - /server.js/ Punto de arranque del servidor. Inicia la aplicación, es donde se llama a app.js y se inicia el servido
   - /middlewares/ Pequeñas funciones que se ejecutan antes de que una ruta reciba una petición. Incluye la lógica de autenticación
   - /utils/  Funciones auxiliares, bibliotecas comunes que no encajan en otras categorías. 
   - /models/ interactúa directamente con la base de datos. Cada archivo representa una entidad del sistema (usuarios, propiedades etc.).
   - /controllers/ Contienen la Lógica de Endpoints que responde a las peticiones del cliente. Cada controlador se encarga de la lógica de un módulo (usuarios, inicio de sesión, propiedades, etc.).
   - /routes/ Define los endpoints de la API. Cada archivo representa un grupo de rutas (usuarios, autenticación, hábitos, etc.).

scripts/  Utilidades ejecutables del proyecto
  - /.nvmrc/ Archivo de configuración para Node Version Manager, especifica la versión de Node.js que se usa en el proyecto.
  - /.env.example/ Un ejemplo de archivo de configuración de variables de entorno
  - /.gitignore/ Define qué archivos NO deben subirse al repositorio
  - /package.json/ Archivo principal de configuración del proyecto Node.js. Define dependencias, scripts para ejecutar la app y metadatos del proyecto.
  - /.env/El archivo .env es un archivo privado que contiene datos importantes y sensibles que la aplicación necesita para funcionar, pero que no deben subirse al repositorio por motivos de seguridad. Es un archivo usado para configurar el proyecto sin tener que escribir valores directamente en el código.



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

## Casos de Uso
En este apartado podras encontrar los Casos de Uso 
<img width="1415" height="461" alt="CU01 Registro de Huésped" src="https://github.com/user-attachments/assets/ab1c0ab7-9aa8-4094-896c-423f9ec1caea" />
CU01 Registro de Huésped


Este proceso describe cómo un Huésped se registra en el sistema usando su correo electrónico.
El Huésped comienza seleccionando la Opción registrarse por correo. El sistema automáticamente muestra el formulario de registro para que el Huésped ingrese sus datos.
Una vez ingresados los datos, el sistema debe obligatoriamente verificar que el correo no esté repetido.

Flujo de Éxito:
Si la verificación es exitosa (el correo es nuevo), se procede a Confirmar datos personales.
Esta confirmación final siempre resulta en Guardar datos personales en BD y mostrar un Mensaje de registro exitoso.

Flujo Alternativo Error:
Si durante la verificación se detecta que el correo ya está en uso, el flujo se interrumpe y se extiende para mostrar un Mensaje de Correo en uso, terminando el intento de registro.

-------------------------------------------------------------------------------------------------------------------------------------------------------------
<img width="1383" height="477" alt="CU02 Registro de Anfitrión" src="https://github.com/user-attachments/assets/08a5c583-4b0b-4276-a8f9-e1f2a1f2376d" />

CU02 Registro de Anfitrión



Este proceso describe cómo un Anfitrión se registra en el sistema utilizando su correo electrónico. El flujo es iniciado por el Anfitrión y gestionado por el sistema.
El Anfitrión comienza seleccionando la Opción registrarse por correo. El sistema automáticamente muestra el formulario de registro para que el Anfitrión ingrese sus datos. Una vez que el Anfitrión ha completado el formulario, el sistema debe obligatoriamente verificar que el correo no esté repetido.

Flujo de Éxito:
Si la verificación es exitosa (el correo es nuevo y único), el proceso avanza a Confirmar datos personales. Esta confirmación final siempre resulta en Guardar datos personales en BD y, posteriormente, mostrar un Mensaje de registro exitoso al Anfitrión.

Flujo Alternativo Error:
Si durante la verificación se detecta que el correo ya está en uso, el flujo de registro principal se interrumpe, y el sistema se extiende para mostrar un Mensaje de Correo en uso, terminando el intento de registro sin guardar datos.

--------------------------------------------------------------------------------------------------------------------------------------------------------------
<img width="1351" height="442" alt="CU03 Registro de Habitación" src="https://github.com/user-attachments/assets/e7936e66-99ab-4326-91ac-032eaaed0277" />
CU03 Registro de habitación 



Este proceso describe cómo un Anfitrión, una vez autenticado, gestiona la información de una habitación, ya sea registrándola, editándola o eliminándola.

El Anfitrión inicia el proceso con Iniciar sesión. El sistema requiere que el Anfitrión esté autentificado para poder acceder a la funcionalidad de Registro habitación.

Flujo Principal (Registro Inicial):
Una vez dentro de la funcionalidad de Registro habitación, el Anfitrión ingresa los datos de la nueva habitación. Esta acción obligatoriamente resulta en Guardar en BD (Base de Datos).

Flujo Alternativo (Extensión - Edición):
Si el Anfitrión decide modificar una habitación existente, desde el punto de Registro habitación puede acceder a Editar datos de habitación. Esta acción de edición siempre resulta en Guardar en BD para actualizar la información.

Flujo Alternativo (Extensión - Eliminación):
Si el Anfitrión decide eliminar una habitación, desde el punto de Registro habitación puede acceder a Eliminar datos de habitación. Esta acción de eliminación siempre resulta en Guardar en BD para aplicar el cambio (de la eliminación del registro).

--------------------------------------------------------------------------------------------------------------------------------------------------------------
<img width="1066" height="432" alt="CU04 Búsqueda y visualización" src="https://github.com/user-attachments/assets/5fcd014d-5acb-40e1-90c7-f515d5980e46" />
CU04 Búsqueda y visualización



Este proceso describe cómo un Huésped busca habitaciones disponibles y visualiza su calendario de disponibilidad en el sistema.

El Huésped inicia el proceso con Iniciar sesión. El sistema requiere que el Huésped esté autenticado para poder acceder a la funcionalidad de búsqueda.
Una vez que el Huésped aplica los filtros de búsqueda (ubicación, precio, fechas, servicios, etc.), el sistema debe mostrar obligatoriamente un Calendario con disponibilidad de cada habitación que cumpla con los criterios definidos. El Huésped puede, entonces, visualizar rápidamente qué habitaciones están libres en las fechas seleccionadas.

-------------------------------------------------------------------------------------------------------------------------------------------------------------
<img width="1556" height="335" alt="CU05 Rerserva de Habitación" src="https://github.com/user-attachments/assets/547cf59a-10b3-43fa-aac4-2a5baad4cf56" />
CU05 Reserva de habitación



Este proceso describe cómo un Huésped realiza la reserva de una habitación, desde el inicio de sesión hasta el pago.

El Huésped inicia el proceso con Iniciar sesión. El sistema requiere que el Huésped esté autentificado para poder proceder con la reserva. El Huésped debe obligatoriamente Seleccionar habitación de las opciones disponibles. Tras la selección, el sistema obliga al Huésped a Ingresar datos de fecha y personas para validar la reserva. Posteriormente, el Huésped debe Confirmar reservación para finalizar el proceso de selección de detalles. Finalmente, la confirmación resulta obligatoriamente en la acción de Pagar reservación, que concluye el caso de uso.

-------------------------------------------------------------------------------------------------------------------------------------------------------------
<img width="1609" height="451" alt="CU06 Modificar habitación  " src="https://github.com/user-attachments/assets/b1c062f0-b783-44bd-bb48-8d86ecc6aa48" />
CU06 Modificar Habitación



Este proceso describe cómo un Anfitrión gestiona la información de sus habitaciones, permitiendo su modificación o eliminación.

El Anfitrión inicia el proceso con Iniciar sesión. El sistema requiere la autentificación para permitir el acceso a la gestión de habitaciones. Una vez autentificado, el Anfitrión debe obligatoriamente Seleccionar habitación de su lista para realizar alguna acción.

lujo de Éxito (Modificación):
Tras Seleccionar habitación, el flujo principal continúa obligatoriamente con Editar habitación. Una vez realizados los cambios, el Anfitrión debe Confirmar cambios. Finalmente, la confirmación resulta obligatoriamente en la acción de Guardar en BD, donde los datos actualizados de la habitación son registrados.

Flujo Alternativo (Eliminación):
Desde el punto de Seleccionar habitación, el Anfitrión tiene la opción de Eliminar habitación. Si el Anfitrión elige esta opción, la eliminación obliga al sistema a Eliminar de BD, removiendo el registro de la habitación del sistema.

-------------------------------------------------------------------------------------------------------------------------------------------------------------
<img width="1397" height="463" alt="CU07 Proceso de pago" src="https://github.com/user-attachments/assets/7f9f9a37-e612-469d-84dd-c4d7b965cebc" />
CU07 Proceso de pago



Este proceso describe cómo un Huésped completa la transacción financiera para una reserva
El Huésped inicia el proceso al ver el Mensaje de monto total a pagar por su reserva. Posteriormente, el Huésped debe obligatoriamente seleccionar el Método de pago (ingresar datos de tarjeta, PayPal, etc.). Una vez completado el método de pago, el sistema procede a Pago finalizado.

El Pago finalizado desencadena obligatoriamente dos acciones paralelas y exitosas:
Guardar en BD: Se registra la transacción y el estado de la reserva como pagada.

Mensaje de confirmación de pago: Se notifica al Huésped que la transacción ha sido exitosa.

-------------------------------------------------------------------------------------------------------------------------------------------------------------
<img width="1355" height="517" alt="CU08 Cancelación de reservación" src="https://github.com/user-attachments/assets/3ee59b3b-0a7f-430c-a7d3-9d01b15967b5" />
CU08 Cancelación de reservación



Este proceso describe cómo un Huésped puede intentar cancelar una reserva existente y las condiciones bajo las cuales la cancelación es posible o no.

El Huésped inicia el proceso con Seleccionar reservación de su lista de reservas. Una vez seleccionada, el sistema debe obligatoriamente Verificar plazo de cancelación para determinar si la reserva aún cumple con los términos para ser cancelada (si no ha pasado una fecha límite).

Flujo de Éxito (Cancelación Procedente):
Si la verificación del plazo es exitosa (la cancelación es permitida), el sistema procede a Cancelar Reservación. La acción de cancelar obligatoriamente desencadena dos pasos:

Mensaje Rembolso del 50% del monto total: Se informa al Huésped sobre la cantidad que será devuelta.

Ambas acciones (el mensaje de reembolso y la cancelación) obligatoriamente resultan en Guardar en BD, donde se actualiza el estado de la reserva a "cancelada" y se registra el proceso de reembolso.

Flujo Alternativo (Cancelación No Procedente):
Si durante la verificación del plazo se detecta que la reserva no cumple con los términos de cancelación, el flujo de cancelación se interrumpe, y el sistema muestra un Mensaje: No se puede cancelar su reservación. Este mensaje, aunque no conlleva una cancelación, también resulta en Guardar en BD para registrar el intento fallido de cancelación por parte del Huésped.

-------------------------------------------------------------------------------------------------------------------------------------------------------------
<img width="1237" height="474" alt="CU09 Gestión de usuarios " src="https://github.com/user-attachments/assets/5010deef-fe6f-4e55-9f28-abd3ffebbe8f" />
CU09 Gestión de usuarios



Este proceso describe cómo el Administrador interactúa con el sistema para gestionar consultar, modificar, eliminar o cambiar el estado de las cuentas de los usuarios.

El Administrador inicia el proceso al acceder a la funcionalidad de Consultar usuarios. Esta es la acción principal que permite el acceso a todas las demás gestiones.

El flujo principal es la simple Consulta de usuarios, que permite al Administrador visualizar la lista o el detalle de las cuentas.

Flujo Alternativo (Modificación):
Desde la consulta, el Administrador tiene la opción de Modificar datos de usuario. Esta acción de modificación siempre resulta obligatoriamente en Guardar en BD para registrar los cambios.

Flujo Alternativo (Eliminación):
Desde la consulta, el Administrador tiene la opción de Eliminar usuario. Esta acción de eliminación siempre resulta obligatoriamente en Guardar en BD, lo que implica la eliminación o inhabilitación permanente de la cuenta.

Flujo Alternativo (Cambio de Estado):
Desde la consulta, el Administrador tiene la opción de Cambiar estado de usuario. Esta acción siempre resulta obligatoriamente en Guardar en BD para actualizar el estado funcional de la cuenta.

-------------------------------------------------------------------------------------------------------------------------------------------------------------

## Estilo y calidad

ESLint + Prettier incluidos.

Convención de commits sugerida: Conventional Commits

feat:, fix:, chore:, docs:, refactor:, etc.

-------------------------------------------------------------------------------------------------------------------------------------------------------------

## Manual de usuario

A continuación, en el siguiente archivo PDF podrá encontrar el manual de usuario, un docuemnto que explica de manera sencilla como usar AppTiziHause. Se describe cómo navegar por las diferentes secciones, cómo realizar búsquedas, gestionar reservaciones y otras funciones que ofrece TiziHause. Su propósito es guiar al usuario para que pueda utilizar el sistema de manera correcta, eficiente y sin complicaciones.

[MANUAL DE USUARIO (1).pdf](https://github.com/user-attachments/files/23924500/MANUAL.DE.USUARIO.1.pdf)


