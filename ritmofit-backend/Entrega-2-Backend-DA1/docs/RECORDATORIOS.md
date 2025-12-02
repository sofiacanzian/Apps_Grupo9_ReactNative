# Sistema de Recordatorios y Avisos - RitmoFit

## Funcionalidad Implementada

Este módulo implementa el sistema de recordatorios automáticos para reservas de clases:

### 1. Recordatorios Automáticos (1 hora antes)
- **Job Scheduler**: Se ejecuta cada 30 minutos usando `node-cron`
- **Lógica**: Busca reservas activas cuyas clases comienzan entre 1-2 horas desde el momento actual
- **Notificación Push**: Envía recordatorio con:
  - Título: "🔔 Recordatorio de clase"
  - Cuerpo: Nombre de la clase, hora y ubicación
  - Data: `tipo: 'recordatorio'`, `reservaId`, `claseId`, `fecha`, `hora`

### 2. Avisos de Cancelación
- Se envía automáticamente al cancelar una reserva
- Incluye detalles de la clase cancelada (nombre, fecha, hora)
- Notificación con título: "❌ Reserva cancelada"

### 3. Avisos de Reprogramación
- Función preparada: `sendRescheduleNotification`
- Se puede integrar cuando se implemente la funcionalidad de reprogramación de clases
- Compara fecha antigua vs nueva y notifica al usuario

## Archivos Creados/Modificados

### Nuevos archivos:
1. **`utils/reminder.service.js`**
   - `sendUpcomingReminders()`: Busca y envía recordatorios de clases próximas
   - `sendCancellationNotification()`: Notifica cancelaciones
   - `sendRescheduleNotification()`: Notifica reprogramaciones

2. **`jobs/reminder.job.js`**
   - Configura el cron job (cada 30 minutos por defecto)
   - Llama a `sendUpcomingReminders()` automáticamente

### Archivos modificados:
3. **`controllers/reserva.controller.js`**
   - Importa `sendCancellationNotification`
   - Actualizado método `deleteReserva` para enviar notificación detallada al cancelar

4. **`server.js`**
   - Importa e inicializa `initReminderJob()`
   - El job arranca automáticamente al iniciar el servidor

5. **`package.json`**
   - Añadida dependencia: `"node-cron": "^3.0.3"`

## Requisitos

### Backend
- Usuario debe tener `expo_push_token` guardado en la DB (campo en modelo `User`)
- Reserva debe estar en estado `activa`
- Clase debe tener `fecha` y `hora_inicio` válidas

### Variables de entorno (.env)
```env
EXPO_ACCESS_TOKEN=tu_token_opcional_de_expo
```
*(Opcional - solo si usas un token de acceso de Expo para push notifications)*

## Cómo Probar

### 1. Iniciar el servidor
```bash
cd ritmofit-backend/Entrega-2-Backend-DA1
npm install
npm run dev
```

Deberías ver en la consola:
```
✅ Reminder job iniciado - se ejecutará cada 30 minutos
```

### 2. Crear una reserva de prueba
- Crear una clase que comience en aproximadamente 1 hora
- Reservar esa clase con un usuario que tenga `expo_push_token`
- Esperar a que el job se ejecute (cada 30 minutos)

### 3. Monitorear logs
El job mostrará en consola:
```
🕐 [Reminder Job] Ejecutando revisión de recordatorios...
✅ Recordatorio enviado a usuario@email.com para clase Spinning
📢 Recordatorios enviados: 1
```

### 4. Probar cancelación
```bash
# Hacer DELETE a /api/reservas/:id
curl -X DELETE http://localhost:3000/api/reservas/123 \
  -H "Authorization: Bearer TU_TOKEN"
```

Deberías ver:
```
✅ Notificación de cancelación enviada a usuario@email.com
```

## Configuración del Job

Para cambiar la frecuencia del job, edita `jobs/reminder.job.js`:

```javascript
// Cada 30 minutos (producción)
cron.schedule('*/30 * * * *', async () => { ... });

// Cada minuto (testing)
cron.schedule('* * * * *', async () => { ... });

// Cada 5 minutos
cron.schedule('*/5 * * * *', async () => { ... });
```

## Ventana de Recordatorio

El sistema envía recordatorios a clases que:
- Comienzan **entre 1 y 2 horas** desde ahora
- Están en estado `activa`
- El usuario tiene `expo_push_token` válido

Esta ventana evita enviar múltiples recordatorios si el job corre frecuentemente.

## Próximas Mejoras

- [ ] Endpoint para reprogramar clases (llamará a `sendRescheduleNotification`)
- [ ] Configuración de preferencias de notificaciones por usuario
- [ ] Dashboard admin para ver estadísticas de recordatorios enviados
- [ ] Recordatorios adicionales (ej: 24 horas antes, al confirmar reserva)
- [ ] Tests unitarios para `reminder.service.js`

## Troubleshooting

### Los recordatorios no se envían
1. Verificar que el job está activo: revisar logs al iniciar servidor
2. Verificar que hay reservas activas en la ventana 1-2 horas
3. Verificar que los usuarios tienen `expo_push_token` válido
4. Revisar logs de errores en consola del servidor

### Error al enviar push notification
- Verificar que el token push comienza con `ExponentPushToken`
- Verificar conectividad con `https://exp.host/--/api/v2/push/send`
- Revisar formato de `fecha` y `hora_inicio` en la clase

### El job no arranca
- Verificar que `node-cron` está instalado: `npm list node-cron`
- Verificar sintaxis del cron pattern
- Verificar que `initReminderJob()` se llama en `server.js`

## Arquitectura

```
┌─────────────────────────────────────────────────────┐
│  server.js (inicia job al arrancar)                 │
└───────────────────┬─────────────────────────────────┘
                    │
                    v
┌─────────────────────────────────────────────────────┐
│  jobs/reminder.job.js                               │
│  - Cron: cada 30 min                                │
│  - Llama a sendUpcomingReminders()                  │
└───────────────────┬─────────────────────────────────┘
                    │
                    v
┌─────────────────────────────────────────────────────┐
│  utils/reminder.service.js                          │
│  - sendUpcomingReminders()                          │
│  - sendCancellationNotification()                   │
│  - sendRescheduleNotification()                     │
└───────────────────┬─────────────────────────────────┘
                    │
                    v
┌─────────────────────────────────────────────────────┐
│  utils/push.service.js                              │
│  - sendPushNotification() (a Expo Push API)         │
└─────────────────────────────────────────────────────┘
```

## Logs de Ejemplo

### Servidor iniciado
```
🚀 Servidor corriendo en http://localhost:3000
✅ Conexión con MySQL establecida correctamente.
✅ Reminder job iniciado - se ejecutará cada 30 minutos
```

### Job ejecutándose (sin reservas próximas)
```
🕐 [Reminder Job] Ejecutando revisión de recordatorios...
📢 Recordatorios enviados: 0
```

### Job ejecutándose (con recordatorios enviados)
```
🕐 [Reminder Job] Ejecutando revisión de recordatorios...
✅ Recordatorio enviado a sofia@ritmofit.com para clase Spinning Matutino
✅ Recordatorio enviado a martin@ritmofit.com para clase Yoga Flow
📢 Recordatorios enviados: 2
```

### Cancelación de reserva
```
✅ Notificación de cancelación enviada a sofia@ritmofit.com
```

---

**Fecha de implementación**: Diciembre 2025  
**Desarrollado por**: Equipo RitmoFit
