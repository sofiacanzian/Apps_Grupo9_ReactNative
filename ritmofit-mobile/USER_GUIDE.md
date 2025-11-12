# Guía de Usuario: Instalación y Ejecución RitmoFit

Esta guía te ayudará a instalar y ejecutar el backend y la app móvil de RitmoFit en Android Studio.

---

## 1. Requisitos previos
- Node.js (LTS)
- MySQL Community Server
- Android Studio
- Expo CLI (se instala localmente con `npx`)

---

## 2. Configuración de la base de datos MySQL
1. Instala MySQL y crea la base de datos:
   ```sql
   CREATE DATABASE ritmofit_db;
   ```
2. Configura el archivo `.env` en `ritmofit-backend/Entrega-2-Backend-DA1/` con:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=Chicha@2840@
   DB_NAME=ritmofit_db
   PORT=3000
   JWT_SECRET=UNA_CLAVE_SUPER_SECRETA_LARGA_PARA_TOKENS_RITMOFIT
   JWT_EXPIRES_IN=7d
   EMAIL_USER=uadepruebas@gmail.com
   EMAIL_PASS=zwgo douy dymm xqcz
   ```
3. Ejecuta los scripts/migraciones para crear las tablas si es necesario.

---

## 3. Instalación y ejecución del backend
1. Abre una terminal (PowerShell o CMD) y ejecuta:
   ```powershell
   cd "c:\Users\lucia\UADE\api2\New folder\ritmofit-backend\Entrega-2-Backend-DA1"
   npm install
   npm start
   ```
2. El backend debe correr en `localhost:3000`.
3. Deberías ver: `🚀 Servidor corriendo en http://localhost:3000`

---

## 4. Instalación y ejecución de la app móvil
1. Abre una nueva terminal (segunda ventana):
   ```powershell
   cd "c:\Users\lucia\UADE\api2\New folder\ritmofit-mobile"
   npm install
   ```

2. **Configura Android Studio:**
   - Abre Android Studio
   - Ve a **Device Manager** (ícono de teléfono en la barra superior)
   - Crea un dispositivo virtual Android (API 30+ recomendado)
   - Inicia el emulador (tarda ~2-3 minutos en abrir)

3. **Ejecuta la app Expo:**
   ```powershell
   npx expo start --android
   ```
   - Expo detectará el emulador corriendo y la app se abrirá automáticamente
   - O presiona `a` en la terminal para abrir en Android

---

## 5. Conexión entre app y backend
- La app accede al backend usando `http://10.0.2.2:3000/api` desde el emulador Android.
- Asegúrate que el backend esté corriendo **antes** de abrir la app.
- En dispositivo físico, cambia `10.0.2.2` por la IP local de tu PC (ej. `192.168.x.x:3000/api`).

---

## 6. Flujo de uso básico
1. **Login:** Abre la app, ingresa tu email y solicita el código OTP
2. **OTP:** Revisa tu correo (uadepruebas@gmail.com) y obtén el código
3. **Home:** Explora clases, filtra por sede
4. **Reserva:** Toca una clase y confirma la reserva
5. **Mis Reservas:** Consulta tus próximas clases (puedes cancelar)
6. **Historial:** Ver asistencias (una vez que hayas asistido a una clase)
7. **Perfil:** Edita tu nombre y cierra sesión

---

## 7. Solución de problemas

### Error: `expo is not recognized`
```powershell
# Usa npx en lugar de expo directamente
npx expo start --android
```

### Error: `ExpoMetroConfig.loadAsync is not a function`
- Debes usar `npx expo start --android` (no `expo start`)
- Cierra PowerShell y abre una nueva ventana
- Corre nuevamente: `npx expo start --android`

### La app no conecta al backend
- Verifica que el backend esté corriendo en `localhost:3000`
- Revisa que el emulador Android esté activo
- Comprueba el `.env` en el backend con credenciales MySQL correctas

### No recibo el código OTP en el email
- Verifica que las credenciales de Gmail en `.env` sean correctas
- Gmail requiere contraseña de aplicación (no la contraseña regular)
- Usa: `EMAIL_PASS=zwgo douy dymm xqcz` (ya configurada)

### Base de datos no existe
```sql
-- Desde MySQL Workbench o consola
CREATE DATABASE ritmofit_db;
```

---

## 8. Comandos útiles

```powershell
# Iniciar backend
cd ritmofit-backend/Entrega-2-Backend-DA1
npm start

# Iniciar app móvil
cd ritmofit-mobile
npx expo start --android

# Limpiar cache de Expo
npx expo start --clear

# Ver logs de Expo en tiempo real
npx expo start --localhost

# Reinstalar dependencias
rm -r node_modules package-lock.json
npm install
```

---

## 9. Contacto y soporte
Para dudas técnicas, revisa los README de cada carpeta o consulta al equipo de desarrollo.

**Última actualización:** 11 de Noviembre de 2025
