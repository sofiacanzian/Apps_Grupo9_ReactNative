# Guía de Resolución de Problemas - Autenticación RitmoFit

## Problema: No llega el email con el código OTP

### Checklist de Diagnóstico

#### 1. **¿El backend está corriendo?**
```bash
# Verifica en la terminal del backend:
# Deberías ver: 🚀 Servidor corriendo en http://localhost:3000
```

Si no:
```bash
cd "c:\Users\lucia\UADE\api2\New folder\ritmofit-backend\Entrega-2-Backend-DA1"
npm start
```

---

#### 2. **¿El .env tiene credenciales de Gmail válidas?**

Abre: `c:\...\ritmofit-backend\Entrega-2-Backend-DA1\.env`

Verifica:
```properties
EMAIL_USER=uadepruebas@gmail.com
EMAIL_PASS=zwgo douy dymm xqcz
```

✅ **Si está bien:** Continúa al paso 3
❌ **Si está vacío:** Ve a "Configurar Gmail" abajo

---

#### 3. **¿La app está conectada al backend correcto?**

Abre: `c:\...\ritmofit-mobile\src\services\api.js`

Verifica que use:
- **Android Emulator:** `http://10.0.2.2:3000/api`
- **iOS Simulator:** `http://localhost:3000/api`
- **Web/Expo:** `http://localhost:3000/api`

---

#### 4. **¿Solicitaste correctamente el código?**

En la pantalla "RequestOtpScreen":
1. ✓ Ingresa un email válido
2. ✓ Haz clic "Solicitar Código de Acceso"
3. ✓ Espera a que diga "✓ Código Enviado"
4. ✓ Revisa tu inbox (o Spam)

---

## Soluciones por Síntoma

### Síntoma: "Error al solicitar el código"

**Causa 1: Conexión al backend**
```
❌ Respuesta: Could not connect to backend
✓ Solución:
  - Verifica que npm start esté corriendo en backend
  - Verifica que IP 10.0.2.2 sea accesible desde emulador
  - Intenta abrir en navegador: http://10.0.2.2:3000
```

**Causa 2: Email vacío o inválido**
```
❌ Respuesta: Email inválido
✓ Solución:
  - Ingresa formato válido: usuario@dominio.com
  - No incluyas espacios
  - Ejemplo correcto: lucia@uade.edu.ar
```

**Causa 3: Variables de entorno**
```
❌ Backend console: Error al enviar el correo
✓ Solución:
  - Verifica .env tiene EMAIL_USER y EMAIL_PASS
  - Reinicia backend: npm start
  - Si sigue, regenera credenciales Gmail (ver abajo)
```

---

### Síntoma: "Código OTP inválido"

**Causa 1: Código expirado**
```
❌ Respuesta: Código OTP inválido o expirado
✓ Solución:
  - Expiran en 5 minutos visible / 15 minutos en BD
  - Solicita uno nuevo: "🔄 Reenviar Código"
```

**Causa 2: Código incorrecto**
```
❌ Respuesta: Código OTP inválido
✓ Solución:
  - Verifica el número exacto en email
  - Copia/pega en lugar de escribir manualmente
  - Revisa que tenga 6 dígitos
```

**Causa 3: Email diferente**
```
❌ Error: Email no registrado
✓ Solución:
  - Usa el MISMO email en ambas pantallas
  - Pantalla 1: "Solicitar Código" con email X
  - Pantalla 2: "Validar Código" con email X
```

---

### Síntoma: "Email no recibido"

**Paso 1: Verifica la carpeta de SPAM**
- Búsqueda: "RitmoFit" o "uadepruebas"
- Si está ahí: Marca como "No es spam"
- Gmail recordará para próximos emails

**Paso 2: Reenvía el código**
- En la app, haz clic "🔄 Reenviar Código"
- Espera 30 segundos
- Revisa inbox nuevamente

**Paso 3: Verifica logs del backend**

En terminal de backend, busca:
```
✉️ OTP enviado a: tu_email@ejemplo.com
```

Si NO ves este mensaje:
```
❌ Error al enviar el correo OTP
❌ auth/request-otp endpoint no respondió
```

**Paso 4: Comprueba credenciales de Gmail**

```bash
# En c:\Users\lucia\UADE\api2\New folder\ritmofit-backend\Entrega-2-Backend-DA1
npm test  # Si hay tests

# O verifica manualmente:
# - EMAIL_USER: uadepruebas@gmail.com
# - EMAIL_PASS: zwgo douy dymm xqcz (es "App Password", no password real)
```

---

## Configurar Gmail desde Cero

### Si necesitas usar otra cuenta de email:

**Paso 1: Crear contraseña de aplicación**

1. Ve a https://myaccount.google.com/
2. Haz clic en "Seguridad" (izquierda)
3. Busca "Contraseñas de aplicación"
4. Selecciona:
   - **Aplicación:** "Correo"
   - **Dispositivo:** "Windows"
5. Google te genera 16 caracteres
6. **COPIA** esos 16 caracteres (con espacios)

**Paso 2: Actualizar .env**

Abre: `c:\...\ritmofit-backend\Entrega-2-Backend-DA1\.env`

```properties
# Cambia estos valores:
EMAIL_USER=tu_email_nuevo@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx  # Los 16 caracteres que Google te dio
```

**Paso 3: Reiniciar backend**

```bash
cd "c:\Users\lucia\UADE\api2\New folder\ritmofit-backend\Entrega-2-Backend-DA1"
npm start
```

**Paso 4: Probar**

En la app, ingresa email y solicita código.
Deberías recibirlo en pocos segundos.

---

## Testing Manual de Email

### Opción 1: Usar la app (más fácil)

1. Abre la app en emulador
2. Ingresa un email
3. Solicita código
4. Revisa tu inbox

### Opción 2: Crear test.js (avanzado)

```javascript
// test-email.js (en ritmofit-backend)
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: 'tu_email_aqui@gmail.com',  // CAMBIAR
    subject: 'Test RitmoFit',
    html: '<h1>Código: 123456</h1>'
}, (err, info) => {
    if (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    } else {
        console.log('✓ Email enviado:', info.response);
        process.exit(0);
    }
});
```

Ejecutar:
```bash
cd ritmofit-backend/Entrega-2-Backend-DA1
node test-email.js
```

---

## Mejoras Realizadas en Autenticación (v2)

### RequestOtpScreen:
✅ Validación de email antes de enviar
✅ Botón "¿Primera vez aquí?" - para nuevos usuarios
✅ Botón "Recuperar acceso" - para olvidar contraseña
✅ Mensajes de error claros
✅ Confirmación cuando el email se envía

### ValidateOtpScreen:
✅ Contador de tiempo regresivo (5 minutos)
✅ Validación de 6 dígitos
✅ Botón de reenvío habilitado cuando expira
✅ Información adicional en tooltip
✅ Mejor UI con emojis

---

## Credenciales Actuales

| Campo | Valor |
|-------|-------|
| **Email Gmail** | uadepruebas@gmail.com |
| **App Password** | zwgo douy dymm xqcz |
| **Backend URL** | http://10.0.2.2:3000 |
| **OTP Válido** | 5 minutos (visible), 15 minutos (BD) |
| **Formato OTP** | 6 dígitos numéricos |

---

## Checklist Final

- [ ] Backend corriendo en puerto 3000
- [ ] `.env` tiene EMAIL_USER y EMAIL_PASS
- [ ] App conecta a 10.0.2.2:3000 (Android)
- [ ] Ingresaste email válido
- [ ] Hiciste clic "Solicitar Código"
- [ ] Esperaste confirmación "✓ Código Enviado"
- [ ] Revisaste inbox (incluyendo Spam)
- [ ] Copiaste el código correcto
- [ ] Lo pegaste en pantalla de validación
- [ ] Presionaste "Verificar Código"

**Si aún no funciona:** Revisa los logs de la terminal del backend en busca de mensajes de error.

---

**Última actualización:** 11/11/2025
**Versión:** 2.0 - Con mejoras de UX en flujo de autenticación
