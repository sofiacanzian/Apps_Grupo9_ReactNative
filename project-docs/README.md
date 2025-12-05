# RitmoFit – Resumen y setup

Documentación condensada del proyecto (API Node.js + app móvil React Native/Expo).

## Estructura del repo
- `ritmofit-backend/Entrega-2-Backend-DA1`: API Express + MySQL.
- `ritmofit-mobile`: App Expo/React Native.
- `project-docs`: Documentación vigente (este folder).

## Requisitos
- Node.js 18+ y npm 9+.
- MySQL 8+ en localhost.
- Android Studio con SDK 24–36 y un AVD activo.
- Expo CLI opcional (se usa vía `npx`).

## Backend (API)
```bash
cd ritmofit-backend/Entrega-2-Backend-DA1
npm install
```
`.env` mínimo:
```ini
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASS=tu_password
DB_NAME=ritmofit_db
JWT_SECRET=una_clave_segura_para_tokens
JWT_EXPIRES_IN=7d
EMAIL_USER=tu_email_gmail@gmail.com
EMAIL_PASS=contraseña_de_aplicacion
EXPO_ACCESS_TOKEN=token_de_acceso_expo_opcional
```
Crea la base:
```sql
CREATE DATABASE ritmofit_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
Levanta el servidor:
```bash
npm run dev
# Log esperado: "Servidor corriendo en http://localhost:3000"
```

## App móvil (Expo)
```bash
cd ritmofit-mobile
npm install
```
Configura Android SDK en `android/local.properties`:
```properties
sdk.dir=C:\\Users\\tu_usuario\\AppData\\Local\\Android\\Sdk
```
En `app.json` define tu `projectId` de Expo:
```json
"extra": {
  "eas": { "projectId": "TU-EXPO-PROJECT-ID" }
}
```
URL de API por plataforma (en `src/services/api.js`):
- Emulador Android: `http://10.0.2.2:3000/api`
- Dispositivo físico: `http://<IP_local>:3000/api`

Compila e instala build de desarrollo (requerido para push/biometría):
```bash
npx expo run:android
```

## Notificaciones y recordatorios
- Coloca `google-services.json` en `ritmofit-mobile/android/app/` antes de `expo run:android`.
- El job de recordatorios (`jobs/reminder.job.js`) corre cada 30 minutos y envía push a reservas de clases que inician en 1–2 horas (requiere `expo_push_token` en usuarios).
- Al cancelar una reserva se envía push automático.

## Datos de prueba
- `npm run seed` en el backend: crea sedes, usuarios, clases y reservas para probar flujo completo.
- `npm run seed:reminder-class`: genera una clase a ~1h para validar recordatorios.

## Comandos útiles
```bash
# Backend
cd ritmofit-backend/Entrega-2-Backend-DA1
npm run dev
npm run seed
npm run seed:reminder-class

# App móvil
cd ritmofit-mobile
npx expo start -c         # limpia caché de Metro
npx expo run:android      # build de desarrollo (usa para push)
```

## Flujo funcional (resumen)
- Login OTP por email (sin contraseña).
- Catálogo de clases con filtros y reservas.
- Historial y perfil de usuario.
- Notificaciones push para reservas y recordatorios.

## Checklist rápido
- `.env` completo y MySQL corriendo.
- Backend en `http://localhost:3000`.
- App configurada con SDK y `google-services.json`.
- Build instalada con `expo run:android`.
- Prueba login OTP; si falla, revisa guía de usuario en `project-docs/USER_GUIDE.md`.
