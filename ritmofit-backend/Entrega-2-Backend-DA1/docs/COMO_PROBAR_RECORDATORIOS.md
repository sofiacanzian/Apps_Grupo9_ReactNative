# Guía Rápida: Cómo Probar el Sistema de Recordatorios

## Opción 1: Prueba Completa (Recomendada)

### Paso 1: Verifica tu archivo .env
El backend necesita conexión a MySQL. Tu archivo `.env` debe tener:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=ritmofit_db
DB_PORT=3306
```

### Paso 2: Inicia el servidor
```bash
cd ritmofit-backend/Entrega-2-Backend-DA1
npm run dev
```

**Deberías ver:**
```
✅ Reminder job iniciado - se ejecutará cada 30 minutos
```

### Paso 3: Prepara datos de prueba

**A. Asegúrate que un usuario tiene expo_push_token:**
```sql
-- Abre MySQL y ejecuta:
UPDATE users 
SET expo_push_token = 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]' 
WHERE email = 'sofia@ritmofit.com';
```

**B. Crea una clase que comience en ~1 hora:**
```sql
-- Inserta una clase para HOY a la hora actual + 1 hora
INSERT INTO clases (
    nombre,
    disciplina,
    descripcion,
    fecha,
    hora_inicio,
    duracion_minutos,
    cupo_maximo,
    nivel,
    imagen_url,
    sedeId,
    instructorId,
    createdAt,
    updatedAt
) VALUES (
    'Clase de Prueba - Recordatorios',
    'Funcional',                              -- disciplina libre, ajusta según necesites
    'Para probar notificaciones push',
    CURDATE(),                                -- hoy
    ADDTIME(CURTIME(), '01:30:00'),           -- empieza en 1.5 h
    90,                                       -- duración (en minutos)
    20,                                       -- cupo máximo
    'intermedio',                             -- principiante | intermedio | avanzado
    NULL,                                     -- o una URL si querés imagen
    1,                                        -- sedeId existente
    1,                                        -- instructorId existente
    NOW(),
    NOW()
);
```

**C. Crea una reserva para esa clase:**
```sql
-- Obtén el ID de la clase recién creada
SET @clase_id = LAST_INSERT_ID();

-- Crea la reserva
INSERT INTO reservas (user_id, clase_id, estado, createdAt, updatedAt)
VALUES (
    1,  -- user_id del usuario con expo_push_token (ajusta según tu DB)
    @clase_id,
    'activa',
    NOW(),
    NOW()
);
```

### Paso 4: Monitorea los logs

El job se ejecuta cada 30 minutos. Verás:
```
🕐 [Reminder Job] Ejecutando revisión de recordatorios...
✅ Recordatorio enviado a sofia@ritmofit.com para clase Spinning
📢 Recordatorios enviados: 1
```

---

## Opción 2: Testing Rápido (Para desarrolladores)

### Modificar frecuencia del job a cada minuto

**Edita:** `ritmofit-backend/Entrega-2-Backend-DA1/jobs/reminder.job.js`

**Cambia:**
```javascript
// De esto:
cron.schedule('*/30 * * * *', async () => {
    
// A esto (cada minuto):
cron.schedule('* * * * *', async () => {
```

**Reinicia el servidor** y el job correrá cada minuto para testing rápido.

---

## Opción 3: Usar el Script de Diagnóstico

```bash
cd ritmofit-backend/Entrega-2-Backend-DA1

# Ver estado del sistema
npm run dev

# En otra terminal (con el servidor corriendo):
node scripts/testReminders.js

# O crear datos de prueba automáticamente:
node scripts/testReminders.js --create
```

---

## Probar Notificación de Cancelación

Una vez que tengas una reserva activa:

**Opción A: Desde Postman/Thunder Client**
```http
DELETE http://localhost:3000/api/reservas/123
Authorization: Bearer TU_TOKEN_JWT
```

**Opción B: Desde la app móvil**
- Ve a "Mis Reservas"
- Cancela una reserva
- El usuario recibirá una notificación push inmediatamente

**Deberías ver en logs:**
```
✅ Notificación de cancelación enviada a sofia@ritmofit.com
```

---

## Verificar Push Tokens en la Base de Datos

```sql
-- Ver usuarios con push token
SELECT id, email, nombre, expo_push_token 
FROM users 
WHERE expo_push_token IS NOT NULL;

-- Si no hay ninguno, agrega uno de prueba:
UPDATE users 
SET expo_push_token = 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]'
WHERE email = 'tu@email.com';
```

---

## Troubleshooting

### ❌ "No se enviaron recordatorios"
- ✅ Verifica que hay clases en la ventana de 1-2 horas
- ✅ Verifica que hay reservas activas para esas clases
- ✅ Verifica que los usuarios tienen `expo_push_token` válido
- ✅ Revisa los logs del servidor para ver errores

### ❌ "Error al enviar push notification"
- El token debe empezar con `ExponentPushToken[`
- Verifica conectividad con Expo Push API
- Revisa formato de fecha/hora de la clase

### ❌ "Job no se ejecuta"
- Verifica el log al iniciar: "✅ Reminder job iniciado"
- Revisa sintaxis del cron pattern en `jobs/reminder.job.js`
- Asegúrate que `initReminderJob()` se llama en `server.js`

---

## Logs Esperados

### ✅ Servidor iniciado correctamente
```
🚀 Servidor corriendo en http://localhost:3000
✅ Conexión con MySQL establecida correctamente.
✅ Reminder job iniciado - se ejecutará cada 30 minutos
```

### ✅ Job ejecutándose (sin recordatorios)
```
🕐 [Reminder Job] Ejecutando revisión de recordatorios...
📢 Recordatorios enviados: 0
```

### ✅ Job ejecutándose (con recordatorios enviados)
```
🕐 [Reminder Job] Ejecutando revisión de recordatorios...
✅ Recordatorio enviado a sofia@ritmofit.com para clase Spinning
✅ Recordatorio enviado a martin@ritmofit.com para clase Yoga
📢 Recordatorios enviados: 2
```

### ✅ Cancelación de reserva
```
✅ Notificación de cancelación enviada a sofia@ritmofit.com
```

---

## Resumen de Pasos Mínimos

1. ✅ Tener el `.env` configurado con MySQL
2. ✅ Iniciar servidor: `npm run dev`
3. ✅ Verificar: "Reminder job iniciado"
4. ✅ Crear una clase que comience en ~1 hora
5. ✅ Crear una reserva con usuario que tenga `expo_push_token`
6. ✅ Esperar a que el job se ejecute (cada 30 min)
7. ✅ Ver en logs: "Recordatorio enviado"

**¡Listo!** 🎉
