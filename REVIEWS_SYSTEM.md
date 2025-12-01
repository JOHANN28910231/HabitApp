# Sistema de Reseñas por Correo Electrónico

## 📧 Descripción General

Sistema automatizado que envía invitaciones por correo electrónico a los huéspedes una vez que su reservación ha finalizado, permitiéndoles dejar una reseña de su estancia.

## 🔄 Flujo del Sistema

```
1. Huésped realiza reservación → Define fecha de salida
2. Fecha de salida concluye
3. Sistema detecta reservación finalizada (cron job diario a las 10:00 AM)
4. Se genera un token JWT único y temporal (válido por 30 días)
5. Se envía correo automático con link personalizado
6. Huésped hace clic en el link → reviews.html?token=xxxxx
7. Sistema valida el token
8. Huésped completa formulario de reseña
9. Reseña guardada en base de datos
10. El token se marca como usado (no permite reseñas duplicadas)
```

## 🎯 Características Principales

### ✅ Seguridad
- **Token único JWT**: Cada invitación tiene un token firmado digitalmente
- **Un solo uso**: No se pueden crear múltiples reseñas con el mismo link
- **Expiración**: Los tokens expiran después de 30 días
- **Verificación**: Solo pueden dejar reseñas quienes realmente reservaron

### 📨 Envío Automático
- **Cron Job**: Se ejecuta diariamente a las 10:00 AM
- **Detección inteligente**: Solo envía a reservaciones finalizadas sin reseña
- **Modo MOCK**: En desarrollo local, los correos se imprimen en consola
- **Producción**: Compatible con Gmail y otros proveedores SMTP

### 🎨 Interfaz Moderna
- Diseño responsive y atractivo
- Sistema de calificación con estrellas interactivas
- Validación en tiempo real
- Mensajes de éxito/error claros
- Contador de caracteres
- Estilos consistentes con el resto del sitio

## 📁 Archivos del Sistema

### Backend
- **`src/utils/reviewCron.js`**: Cron job que envía correos automáticamente
- **`src/utils/email.js`**: Template HTML del correo (mejorado)
- **`src/controllers/reviews.controller.js`**: Lógica de validación de tokens y creación de reseñas
- **`src/controllers/notifications.controller.js`**: Endpoints para testing
- **`src/models/review.model.js`**: Modelo de base de datos para reseñas
- **`src/routes/reviews.routes.js`**: Rutas de la API
- **`src/routes/notifications.routes.js`**: Rutas para testing manual

### Frontend
- **`public/reviews.html`**: Página de captura de reseñas (rediseñada)
- **`public/js/reviews.js`**: Lógica del formulario de reseñas
- **`public/css/styles.css`**: Estilos (sección "REVIEWS PAGE")
- **`public/js/main.js`**: Muestra reseñas en el modal de reservación

## 🚀 Configuración para Producción

### 1. Configurar Gmail

Para que los correos reales funcionen en producción:

1. **Crea una cuenta Gmail** para tu aplicación (ej: `noreply.tizihause@gmail.com`)

2. **Activa la verificación en 2 pasos**:
   - Ve a https://myaccount.google.com/security
   - En "Verificación en dos pasos", actívala

3. **Genera una contraseña de aplicación**:
   - Ve a https://myaccount.google.com/apppasswords
   - Selecciona "Correo" y "Otro (nombre personalizado)"
   - Escribe "TiziHause" y haz clic en "Generar"
   - Copia la contraseña de 16 caracteres

4. **Configura las variables de entorno**:

```env
# En tu archivo .env de producción
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply.tizihause@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx  # Contraseña de aplicación de 16 caracteres
MAIL_FROM="TiziHause <noreply.tizihause@gmail.com>"
PUBLIC_BASE_URL=https://tu-dominio.com
REVIEW_SECRET=pon_un_secreto_muy_largo_y_aleatorio_aqui_de_al_menos_32_caracteres
```

5. **Reinicia el servidor** para que los cambios surtan efecto

### 2. Variables de Entorno Requeridas

```env
# Obligatorias para que funcione el sistema
REVIEW_SECRET=secreto_largo_para_firmar_tokens_jwt
PUBLIC_BASE_URL=https://tu-dominio.com

# Para correos reales (producción)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASS=contraseña-de-aplicacion

# Para modo MOCK (desarrollo local)
# Deja SMTP_HOST vacío y los correos se imprimirán en consola
SMTP_HOST=
```

## 🧪 Testing en Desarrollo Local

### Modo MOCK (Recomendado para desarrollo)

1. **Asegúrate de que `SMTP_HOST` esté vacío** en tu `.env`:
```env
SMTP_HOST=
```

2. **Inicia el servidor**:
```bash
npm start
```

3. **Envía un correo de prueba** (con Thunder Client o Postman):
```
POST http://localhost:3000/api/notifications/test-email
Content-Type: application/json

{
  "to": "test@ejemplo.com",
  "id_reservacion": 1,
  "id_huesped": 1,
  "id_habitacion": 1
}
```

4. **Revisa la consola del servidor**, verás algo como:
```
📨 MOCK EMAIL ENVIADO:
A: test@ejemplo.com
Asunto: ✨ ¡Cuéntanos sobre tu estancia en TiziHause!
HTML: [contenido del correo]
```

5. **Copia el `reviewUrl`** de la respuesta JSON y ábrelo en tu navegador

6. **Completa el formulario** de reseña y verifica que funcione

### Envío Manual de Invitaciones

Para probar el envío masivo (busca todas las reservas finalizadas sin reseña):

```
POST http://localhost:3000/api/notifications/review-invites
```

Este endpoint ejecuta la misma lógica que el cron job.

## 📊 Base de Datos

### Tabla `resenas`
```sql
CREATE TABLE resenas (
  id_resena      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_huesped     BIGINT UNSIGNED NOT NULL,
  id_habitacion  BIGINT UNSIGNED NULL,
  id_propiedad   BIGINT UNSIGNED NULL,
  rating         TINYINT UNSIGNED NOT NULL CHECK (rating BETWEEN 1 AND 5),
  titulo         VARCHAR(120),
  comentario     TEXT,
  fecha          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  visible        BOOLEAN NOT NULL DEFAULT 1,
  FOREIGN KEY (id_huesped) REFERENCES usuarios(id_usuario),
  FOREIGN KEY (id_habitacion) REFERENCES habitacion(id_habitacion),
  FOREIGN KEY (id_propiedad) REFERENCES propiedades(id_propiedad)
);
```

### Consulta del Cron Job

El sistema busca reservaciones que cumplan:
- `fecha_salida <= HOY`
- `estado_reserva IN ('reservado', 'finalizado')`
- **NO existe** una reseña del mismo huésped para la misma habitación

```sql
SELECT r.id_reservacion, r.id_huesped, r.id_habitacion, 
       u.correo_electronico, u.nombre_completo,
       h.numero, p.nombre
FROM reservaciones r
JOIN usuarios u ON u.id_usuario = r.id_huesped
JOIN habitacion h ON h.id_habitacion = r.id_habitacion
JOIN propiedades p ON p.id_propiedad = h.id_propiedad
WHERE r.fecha_salida <= CURDATE()
  AND r.estado_reserva IN ('reservado', 'finalizado')
  AND NOT EXISTS (
    SELECT 1 FROM resenas rs
    WHERE rs.id_huesped = r.id_huesped
      AND rs.id_habitacion = r.id_habitacion
  )
```

## 🎨 Visualización de Reseñas

Las reseñas se muestran en dos lugares:

### 1. Modal de Reservación (`public/index.html`)
- Cuando el usuario busca habitaciones y ve los detalles
- Sección scrollable con todas las reseñas de esa habitación
- Muestra: estrellas, título, comentario, nombre del huésped, fecha

### 2. Página de Captura (`public/reviews.html`)
- Accesible solo con token válido
- Formulario completo para dejar reseña
- Validación en tiempo real
- Mensaje de éxito al completar

## 🔧 Personalización del Cron

El cron está configurado para ejecutarse **diariamente a las 10:00 AM** (zona horaria México).

Para cambiar la hora o frecuencia, edita `src/utils/reviewCron.js`:

```javascript
// Formato: "minuto hora * * *"
cron.schedule('0 10 * * *', async () => {
    await sendPendingReviewInvites();
}, {
    scheduled: true,
    timezone: "America/Mexico_City" // Cambia tu zona horaria
});
```

Ejemplos:
- `'0 10 * * *'` → Todos los días a las 10:00 AM
- `'0 14 * * *'` → Todos los días a las 2:00 PM
- `'0 9 * * 1'` → Todos los lunes a las 9:00 AM
- `'0 20 * * *'` → Todos los días a las 8:00 PM

## 🐛 Troubleshooting

### "Error: Token inválido o expirado"
- El token tiene 30 días de validez
- Verifica que `REVIEW_SECRET` sea el mismo en servidor y token
- Prueba generando un nuevo token con el endpoint de test

### "Ya existe una reseña para esta estancia"
- El sistema detectó que ya se dejó una reseña para esa habitación
- Esto es intencional para prevenir reseñas duplicadas
- Verifica en la base de datos: `SELECT * FROM resenas WHERE id_huesped=X AND id_habitacion=Y`

### Los correos no se envían en producción
- Verifica que `SMTP_HOST` esté configurado
- Confirma que la contraseña de aplicación de Gmail sea correcta (16 caracteres sin espacios)
- Revisa los logs del servidor para errores de SMTP
- Verifica que la cuenta de Gmail tenga la verificación en 2 pasos activa

### El cron no se ejecuta
- Verifica que el servidor esté corriendo (no se ejecuta si el servidor está apagado)
- Revisa los logs: deberías ver "✓ Cron job de reseñas inicializado"
- Prueba ejecutar manualmente: `POST /api/notifications/review-invites`

### "Acceso Restringido" en reviews.html
- Esta página requiere un token en la URL
- Los usuarios no pueden acceder directamente, solo mediante el link del correo
- Para testing, usa el endpoint `/api/notifications/test-email`

## 📝 Notas de Seguridad

1. **REVIEW_SECRET**: Debe ser un string largo y aleatorio (mínimo 32 caracteres)
2. **Contraseñas de Gmail**: Nunca uses tu contraseña personal, solo contraseñas de aplicación
3. **Tokens**: Los tokens expiran y solo funcionan una vez por huésped/habitación
4. **HTTPS**: En producción, asegúrate de usar HTTPS para proteger los tokens en tránsito
5. **Rate Limiting**: Los endpoints de envío de correo deberían tener rate limiting en producción

## 🎉 Resultado Final

Los huéspedes recibirán un correo profesional y atractivo con:
- Header con gradiente morado
- Mensaje personalizado con su nombre
- Botón grande y visible para dejar reseña
- Información clara sobre el proceso
- Footer con copyright y marca

La página de reseñas tendrá:
- Diseño moderno y responsive
- Sistema de estrellas interactivo
- Validación en tiempo real
- Mensajes claros de éxito/error
- Experiencia de usuario fluida

---

**Desarrollado para TiziHause** 🏠
Sistema de reseñas automáticas con correo electrónico
