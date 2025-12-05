# Guía de uso y soporte

## Puesta en marcha
1) Backend
```bash
cd ritmofit-backend/Entrega-2-Backend-DA1
npm install
npm run dev
```
Verifica `.env` y que MySQL esté arriba (base `ritmofit_db` creada).

2) App móvil
```bash
cd ritmofit-mobile
npm install
npx expo start --dev-client --clear   # build de desarrollo; instala en el emulador/dispositivo
```
Asegura `android/local.properties` con el SDK y `app.json` con tu `projectId`.

3) Conexión backend
- Emulador Android: `http://10.0.2.2:3000/api`
- Dispositivo físico: `http://<IP_local>:3000/api`

## Flujo de usuario
- Abrir app → ingresar email → solicitar código (OTP).
- Recibir email (6 dígitos) → validar → Home.
- Home: ver catálogo, filtrar por sede, reservar.
- Mis reservas: cancelar o ver estado.
- Historial: asistencias y calificaciones.
- Perfil: editar datos y cerrar sesión.

## Troubleshooting rápido
### No llega el email OTP
- Backend corriendo en `3000`.
- `.env` con `EMAIL_USER` y `EMAIL_PASS` (contraseña de aplicación de Gmail).
- Revisar spam y reenviar código.
- Revisar consola del backend: debería mostrar `OTP enviado a...`.

### App no conecta al backend
- Confirma la URL en `src/services/api.js`.
- En emulador Android debe usarse `10.0.2.2`.
- Valida que el backend responda en navegador `http://localhost:3000/api`.

### Push/recordatorios no llegan
- `google-services.json` presente antes de `expo run:android`.
- Usuarios deben tener `expo_push_token` en la base.
- Job de recordatorios activo: al iniciar backend se loguea “Reminder job iniciado”.
- Para forzar pruebas: `npm run seed:reminder-class` y espera el job (30 min) o ajusta cron a `* * * * *` en `jobs/reminder.job.js` para pruebas locales.

## Datos y seeds
- `npm run seed`: escenario completo (sedes, usuarios, clases, reservas, noticias).
- Usuarios de referencia y contraseñas quedan impresos en consola del seed.
- Para limpiar y resembrar, vuelve a correr el seed (no usar en producción).

## Comandos útiles
```bash
# Backend
npm run dev
npm run seed
npm run seed:reminder-class

# App
npx expo start -c    # limpia caché de Metro
npx expo run:android # reinstala build de desarrollo
```

## Recordatorios: flujo mínimo de prueba
1. Backend encendido con job activo.
2. Ejecuta `npm run seed:reminder-class`.
3. Asegura que un usuario tenga `expo_push_token`.
4. Espera al cron (30 min por defecto) y revisa logs: “Recordatorio enviado a...”.

## Contacto interno
Si algo sigue fallando, revisa logs del backend y confirma credenciales en `.env`; los pasos anteriores cubren los casos más comunes.
