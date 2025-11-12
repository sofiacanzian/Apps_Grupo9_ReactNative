# RitmoFit – Guía Rápida de Instalación

Versión abreviada con todo lo necesario para levantar **backend + app móvil** desde cero usando **Android Studio**, **MySQL** y el nuevo **development build (expo run:android)**.

---

## 1. Requisitos

| Tipo | Detalle |
|------|---------|
| Sistema | Windows 10/11 (PowerShell) |
| Node.js | v18+ (`node -v`) |
| npm | v9+ (`npm -v`) |
| MySQL | 8.0+ (`mysql --version`) |
| Android Studio | 2023+ con SDK 24–36 e imagen de emulador instalada |
| Expo CLI | viene con `npm i -g expo-cli` (opcional) |

> Sugerido: ejecuta `npx expo login` una sola vez para evitar prompts del CLI.

---

## 2. Backend (API)

```bash
cd ritmofit-backend/Entrega-2-Backend-DA1
npm install
```

### 2.1 Configura `.env`

```ini
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASS=Chicha@2840@
DB_NAME=ritmofit_db
JWT_SECRET=UNA_CLAVE_SUPER_SECRETA_LARGA_PARA_TOKENS_RITMOFIT
JWT_EXPIRES_IN=7d
EMAIL_USER=uadepruebas@gmail.com
EMAIL_PASS=zwgo douy dymm xqcz
EXPO_ACCESS_TOKEN=TU_TOKEN_DE_EXPO   # ver sección Push
```

### 2.2 Base de datos MySQL
```sql
CREATE DATABASE ritmofit_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2.3 Ejecuta el servidor
```bash
npm run dev
```
Verás: `🚀 Servidor corriendo en http://localhost:3000`.

---

## 3. App móvil (Expo / React Native)

```bash
cd ritmofit-mobile
npm install
```

### 3.1 Configura Android SDK
1. Abre Android Studio → **Settings > Appearance & Behavior > System Settings > Android SDK** y copia la ruta (ej. `C:\Users\lucia\AppData\Local\Android\Sdk`).
2. Crea `android/local.properties`:
   ```properties
   sdk.dir=C:\\Users\\lucia\\AppData\\Local\\Android\\Sdk
   ```

### 3.2 Ajusta `app.json`
```json
"extra": {
  "eas": { "projectId": "TU_PROJECT_ID_EXPO" }
}
```
Obtén el `projectId` en https://expo.dev → tu proyecto → Settings.

### 3.3 URL del backend
`src/services/api.js`: para emulador Android deja `http://10.0.2.2:3000/api`. Para dispositivo físico usa tu IP local (ej. `http://192.168.0.10:3000/api`).

### 3.4 Build de desarrollo
```bash
npx expo run:android
```
Esto crea (o actualiza) la carpeta `android/` y compila un APK debug que se instala en el emulador. Usa *este* build para probar push y biometría (Expo Go no sirve).

> Si falla por `SDK location not found` vuelve a revisar `local.properties`.  
> Para recompilar desde cero: `npx expo prebuild --clean && npx expo run:android`.

---

## 4. Notificaciones Push (Expo + FCM)

1. **Firebase Console** → crea proyecto → añade app Android (package `com.anonymous.ritmofitmobile` o el que definas).  
2. Descarga `google-services.json` → colócalo en `ritmofit-mobile/android/app/`.  
3. `npx expo run:android` nuevamente (necesita el archivo).  
4. En Expo Dashboard genera un Access Token (`Account Settings > Access Tokens`) y guárdalo en `EXPO_ACCESS_TOKEN`.  
5. Al iniciar sesión, la app pedirá permisos y registrará el `ExponentPushToken` mediante `POST /api/users/push-token`.  
6. El backend envía push al confirmar o cancelar reservas. Para otras notificaciones llama a `sendPushNotification` donde lo necesites.

> Mientras uses Expo Go no habrá push (el hook se salta en `appOwnership === 'expo'`). Usa siempre el development build generado por `run:android`.

---

## 5. Flujo básico de uso

1. **Backend** corriendo (`npm run dev`).  
2. **App** instalada con `npx expo run:android`.  
3. **Login/Registro**: usuario/email + contraseña. Registro requiere verificar OTP (email).  
4. **Reservas**: desde Home → “Reservar”. Recibirás push + notificación local 1 hora antes.  
5. **QR**: usa un QR con `{ "claseId": 1 }` para registrar asistencia (requiere reserva activa).  
6. **Perfil**: puedes actualizar datos, cerrar sesión, eliminar cuenta (envía OTP y borra registros).

---

## 6. Problemas comunes

| Mensaje | Solución |
|---------|----------|
| `Data truncated for column 'estado'` | Corre `npm run dev` nuevamente (Sequelize agrega el estado `expirada`). Si persiste, ajusta el ENUM manualmente en MySQL. |
| `SDK location not found` al compilar | Verifica `android/local.properties` y que el SDK exista. |
| Push: `Default FirebaseApp is not initialized` | Falta `google-services.json` o `npx expo run:android` luego de agregarlo. |
| App congelada en Expo Go | Usa el development build; Expo Go no soporta push ni biometría. |
| No llegan correos OTP | Revisa Spam; si Gmail bloquea, activa “Less secure apps” o genera nueva contraseña de aplicación. |

---

## 7. Comandos útiles

```bash
# Backend
cd ritmofit-backend/Entrega-2-Backend-DA1
npm run dev

# Mobile (limpiar Metro + reiniciar)
cd ritmofit-mobile
npx expo start -c

# Reinstalar app en emulador
npx expo run:android
```

---

Listo. Con estos pasos el entorno queda idéntico al usado en `main`, incluyendo soporte para notificaciones push, biometría y el flujo completo de reservas. Para cualquier detalle adicional (seed de datos, checklist OTP, troubleshooting extendido) revisa los demás documentos en `docs/`.`
