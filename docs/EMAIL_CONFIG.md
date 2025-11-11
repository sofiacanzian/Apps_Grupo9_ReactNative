# Configuración de Envío de Emails - RitmoFit

## Descripción
RitmoFit utiliza Google Gmail para enviar códigos OTP (One Time Password) a los usuarios. Los emails son enviados automáticamente cuando un usuario solicita acceso.

## Configuración Actual

### Backend .env
El archivo `.env` en `ritmofit-backend/Entrega-2-Backend-DA1/.env` ya contiene:

```properties
EMAIL_USER=uadepruebas@gmail.com
EMAIL_PASS=zwgo douy dymm xqcz
```

**Nota:** Esta es una contraseña de aplicación de Gmail (no la contraseña de la cuenta real).

## Flujo de Autenticación

### 1️⃣ **Usuario solicita código OTP**
```
POST /api/auth/request-otp
{
  "email": "usuario@ejemplo.com"
}
```

**Acciones en Backend:**
- ✓ Se busca o crea el usuario en la BD
- ✓ Se genera un código OTP aleatorio de 6 dígitos
- ✓ Se guarda el código en la BD (válido por 15 minutos)
- ✓ Se envía por email usando Gmail

### 2️⃣ **Email recibido**
El usuario recibe un email con formato HTML que contiene:
- Código OTP de 6 dígitos
- Instrucción de que expira en 5 minutos (en la BD son 15 min)
- Aviso de seguridad

### 3️⃣ **Usuario ingresa código en app**
```
POST /api/auth/login-otp
{
  "email": "usuario@ejemplo.com",
  "otp_code": "123456"
}
```

**Respuesta exitosa:**
```json
{
  "message": "Inicio de sesión exitoso.",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "usuario@ejemplo.com",
    "nombre": "Socio RitmoFit",
    "rol": "socio"
  }
}
```

## Verificación de Configuración

### ✓ Comprobar que los emails se envían:

1. **En el Backend**, cuando solicitas OTP, deberías ver en console:
```
✉️ OTP enviado a: usuario@email.com
```

2. **En la App**, cuando haces clic "Solicitar Código", deberías ver:
```
✓ OTP solicitado: { message: "Código de verificación enviado..." }
```

3. **En Gmail**, el usuario debe recibir un email con:
- **De:** uadepruebas@gmail.com
- **Asunto:** Tu código de acceso único (OTP) para RitmoFit
- **Contenido:** Código de 6 dígitos en HTML formateado

### 🔧 Si NO recibes emails:

**Paso 1: Verifica la conexión a Gmail**
```bash
# En el backend, desde la carpeta ritmofit-backend/Entrega-2-Backend-DA1
npm test  # Si hay pruebas
```

**Paso 2: Revisa los logs del backend**
- Busca mensajes de error en la terminal donde ejecutas `npm start`
- Errores comunes:
  - `Error al enviar el correo OTP` → Credenciales inválidas
  - `Connection refused` → Problema de red

**Paso 3: Valida las credenciales en `.env`**
```bash
# Abre c:\...\ritmofit-backend\Entrega-2-Backend-DA1\.env
# Verifica que EMAIL_USER y EMAIL_PASS sean correctas
```

**Paso 4: Prueba manualmente desde Node.js**
```javascript
// En ritmofit-mobile, crea un test.js temporal
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'uadepruebas@gmail.com',
        pass: 'zwgo douy dymm xqcz'
    }
});

transporter.sendMail({
    from: 'uadepruebas@gmail.com',
    to: 'tu_email@ejemplo.com',
    subject: 'Test',
    html: '<h1>Test</h1>'
}, (err, info) => {
    if (err) console.error(err);
    else console.log('✓ Email enviado:', info.response);
});
```

## Para Cambiar de Cuenta de Email

Si necesitas usar otra cuenta de Gmail:

1. **Crear contraseña de aplicación:**
   - Accede a https://myaccount.google.com/
   - Ve a "Seguridad" (Security)
   - Busca "Contraseñas de aplicación" (App passwords)
   - Selecciona "Correo" y "Windows"
   - Copia la contraseña de 16 caracteres

2. **Actualizar `.env`:**
   ```properties
   EMAIL_USER=tu_email_gmail@gmail.com
   EMAIL_PASS=xxxx xxxx xxxx xxxx
   ```

3. **Reiniciar el backend:**
   ```bash
   npm start
   ```

## Pantalla de Login Mejorada (Mobile)

La pantalla `RequestOtpScreen.js` ahora incluye:

✓ **Validación de email** - Verifica formato antes de enviar
✓ **Botón "¿Primera vez aquí?"** - Info para nuevos usuarios
✓ **Botón "Recuperar acceso"** - Info para quien olvidó contraseña
✓ **Pull-to-refresh** - Permite reintentar si falla
✓ **Mensajes de error claros** - Comunica qué salió mal
✓ **Confirmación de envío** - Alert cuando el email se envía

## Flujo Recomendado para Testing

### 1. Inicia el Backend
```bash
cd "c:\Users\lucia\UADE\api2\New folder\ritmofit-backend\Entrega-2-Backend-DA1"
npm start
# Verifica que se vea: 🚀 Servidor corriendo en http://localhost:3000
```

### 2. Inicia la App
```bash
cd "c:\Users\lucia\UADE\api2\New folder\ritmofit-mobile"
npx expo start --android
# Accede desde el emulator
```

### 3. Prueba el flujo
1. Ingresa tu email real
2. Haz clic "Solicitar Código de Acceso"
3. Espera 5-10 segundos
4. Revisa tu inbox (o Spam)
5. Copia el código de 6 dígitos
6. Ingresa en la app
7. ¡Deberías estar logueado!

---

**Última actualización:** 11/11/2025
**Estado:** ✓ Configurado y funcionando
