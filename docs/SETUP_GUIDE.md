# RitmoFit - Guía Completa de Instalación y Ejecución

## 📋 Descripción del Proyecto

**RitmoFit** es una aplicación móvil React Native que permite a los socios de un gimnasio:
- ✅ Acceso sin contraseña con OTP (códigos de un solo uso)
- ✅ Reservar clases de fitness
- ✅ Ver historial de asistencias
- ✅ Perfil de usuario personalizado
- ✅ Escanear QR para check-in (en desarrollo)

---

## 🚀 Inicio Rápido (5 minutos)

### 1. Inicia el Backend

```bash
cd .\ritmofit-backend\Entrega-2-Backend-DA1
npm install
npm start
```

**Verifica que veas:**
```
🚀 Servidor corriendo en http://localhost:3000
```

### 2. Inicia la App

```bash
cd "c:\Users\lucia\UADE\api2\New folder\ritmofit-mobile"
npm install
npx expo start --android
```

**Espera a que diga:**
```
Local:   exp://10.0.2.2:8081
```

### 3. Abre en Android Studio

- Emulador debe estar corriendo
- La app debería cargar automáticamente

### 4. Prueba el Login

1. Ingresa tu email
2. Haz clic "Solicitar Código de Acceso"
3. Revisa tu email (o Spam)
4. Ingresa el código de 6 dígitos
5. ¡Acceso otorgado! ✅

---

## 📦 Requisitos Previos

### Sistema
- **Windows 10/11** con PowerShell
- **Node.js LTS** (v18+)
- **npm** (viene con Node.js)

### Software
- **MySQL 8.0+** (con usuario root creado)
- **Android Studio 2023+** (con emulador configurado)
- **Visual Studio Code** (recomendado)

### Verificar Instalación

```bash
# Node.js
node --version   # v18.0.0 o superior

# npm
npm --version    # 9.0.0 o superior

# MySQL
mysql --version  # 8.0.0 o superior
```

---

## 🗄️ Configuración de Base de Datos

### 1. Crear Base de Datos

```bash
# Abre terminal MySQL
mysql -u root -p

# Ingresa contraseña: Chicha@2840@
# Luego ejecuta:
CREATE DATABASE ritmofit_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Crear Tablas

Las tablas se crean automáticamente cuando ejecutas `npm start` en el backend (Sequelize sync).

### 3. Verificar Conexión

```bash
# En backend terminal
npm start

# Deberías ver:
# ✅ Conectado a la base de datos
# 🚀 Servidor corriendo en http://localhost:3000
```

---

## 🔐 Configuración de Emails (OTP)

### Credenciales Actuales

El backend ya tiene configurado el envío de emails:

| Campo | Valor |
|-------|-------|
| **Email** | uadepruebas@gmail.com |
| **Contraseña** | zwgo douy dymm xqcz |
| **Puerto SMTP** | 587 (automático) |

### Verificar que Funcionan

1. Abre la app
2. Ingresa email
3. Solicita código
4. En **5 segundos** deberías recibirlo

Si no lo recibes:
- Revisa carpeta **Spam**
- Ve a: `AUTH_TROUBLESHOOTING.md`

---

## 📱 Estructura de la App

```
ritmofit-mobile/
├── src/
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── RequestOtpScreen.js      (Solicitar código)
│   │   │   └── ValidateOtpScreen.js     (Ingresar código)
│   │   ├── home/
│   │   │   └── HomeScreen.js            (Catálogo clases)
│   │   ├── reservas/
│   │   │   └── ReservasScreen.js        (Mis reservas)
│   │   ├── historial/
│   │   │   └── HistorialScreen.js       (Historial asistencias)
│   │   ├── perfil/
│   │   │   └── PerfilScreen.js          (Perfil usuario)
│   │   └── qr/
│   │       └── QrScreen.js              (Scan QR - En desarrollo)
│   ├── services/
│   │   ├── api.js                       (Axios config)
│   │   ├── authService.js               (Login/OTP)
│   │   ├── claseService.js              (Clases API)
│   │   ├── reservaService.js            (Reservas API)
│   │   ├── userService.js               (Perfil API)
│   │   └── claseService.js              (Asistencias)
│   ├── store/
│   │   └── authStore.js                 (Zustand auth state)
│   └── navigation/
│       └── RootNavigator.js             (React Navigation)
│
└── app/
    ├── _layout.tsx                      (Expo Router root)
    └── (tabs)/
        ├── _layout.tsx
        └── index.tsx
```

---

## 🔄 Flujo de Autenticación

```
┌─────────────────────────┐
│ Abrir App               │
│ ¿Token guardado?        │
└────────────┬────────────┘
             │
        ┌────┴────┐
        │          │
       SÍ          NO
        │          │
    Ir a   RequestOtp
    Home    │
    ✅     └──▶ Ingresa email
             │
             └──▶ Click: "Solicitar Código"
                  │
                  └──▶ Backend genera OTP
                      │
                      └──▶ Envía email
                           │
                           └──▶ Usuario recibe en 5s
                                │
                                └──▶ Copia código
                                     │
                                     └──▶ ValidateOtp
                                          │
                                          └──▶ Ingresa código
                                               │
                                               └──▶ Click: "Verificar"
                                                    │
                                                    └──▶ Backend valida
                                                         │
                                                         └──▶ Envía JWT
                                                              │
                                                              └──▶ Guardar token
                                                                   │
                                                                   └──▶ Ir a Home ✅
```

---

## 📊 Pantallas Disponibles

### 1️⃣ **RequestOtpScreen** (Solicitar Código)
- Ingresa email
- Validación automática
- Botones de ayuda:
  - "¿Primera vez aquí?" → Explica registro
  - "Recuperar acceso" → Para olvidaste contraseña
- **Usuario nuevo:** Se crea automáticamente
- **Usuario existente:** Recibe código OTP

### 2️⃣ **ValidateOtpScreen** (Validar Código)
- Ingresa código 6 dígitos
- Contador regresivo (5 minutos)
- Botón reenvío cuando expira
- Validación:
  - 6 dígitos numéricos
  - No expirado
  - Correcto

### 3️⃣ **HomeScreen** (Catálogo de Clases)
- Lista todas las clases disponibles
- Filtros por sede
- Info por clase:
  - Nombre y horario
  - Profesor
  - Sede
  - Cupos disponibles
  - Fecha y duración
- Botón "Reservar"
- Pull-to-refresh (tirar hacia abajo)

### 4️⃣ **ReservasScreen** (Mis Reservas)
- Lista mis reservas actuales
- Estado por color:
  - Verde: Confirmada
  - Rojo: Cancelada
  - Gris: Expirada
- Botón cancelar
- Pull-to-refresh

### 5️⃣ **HistorialScreen** (Historial)
- Clases a las que asistí
- Mostrar calificación si existe
- Badge con número de estrellas
- Verde izquierdo = asistencia confirmada

### 6️⃣ **PerfilScreen** (Mi Perfil)
- Nombre del usuario
- Email (solo lectura)
- Botón editar nombre
- Botón logout (con confirmación)

### 7️⃣ **QrScreen** (Scan QR)
- 🚧 En desarrollo
- Próximo: Escanear QR para check-in

---

## 🛠️ Endpoints del Backend

### Autenticación
```
POST /api/auth/request-otp
{
  "email": "usuario@ejemplo.com"
}
Response: { message: "Código enviado" }

POST /api/auth/login-otp
{
  "email": "usuario@ejemplo.com",
  "otp_code": "123456"
}
Response: { token: "jwt...", user: { id, email, nombre } }
```

### Clases
```
GET /api/clases                    (Listar todas)
GET /api/clases?sede_id=1          (Filtrar por sede)
POST /api/clases                   (Crear - admin)
GET /api/sedes                     (Listar sedes)
```

### Reservas
```
GET /api/reservas                  (Mis reservas)
POST /api/reservas                 (Crear reserva)
{
  "claseId": 1
}
DELETE /api/reservas/:id           (Cancelar)
```

### Usuario
```
GET /api/users/profile             (Mi perfil)
PATCH /api/users/profile           (Actualizar perfil)
{
  "nombre": "Nuevo nombre"
}
```

### Asistencias
```
GET /api/asistencias               (Mi historial)
POST /api/asistencias              (Check-in)
```

---

## 🔧 Variables de Entorno

### Backend (.env)

Archivo: `ritmofit-backend/Entrega-2-Backend-DA1/.env`

```properties
# Base de Datos
DB_HOST=localhost
DB_USER=root
DB_PASS=Chicha@2840@
DB_NAME=ritmofit_db

# Servidor
PORT=3000

# JWT
JWT_SECRET=UNA_CLAVE_SUPER_SECRETA_LARGA_PARA_TOKENS_RITMOFIT
JWT_EXPIRES_IN=7d

# Email (OTP)
EMAIL_USER=uadepruebas@gmail.com
EMAIL_PASS=zwgo douy dymm xqcz
```

### App (Hardcoded)

Archivo: `ritmofit-mobile/src/services/api.js`

```javascript
// Android Emulator
const BASE_URL = 'http://10.0.2.2:3000/api'

// iOS Simulator / Web
// const BASE_URL = 'http://localhost:3000/api'
```

---

## 📝 Pruebas Recomendadas

### Test 1: Login Básico ✅
```
1. Email válido: lucia@uade.edu.ar
2. Recibe código
3. Valida y accede
```

### Test 2: Nuevo Usuario ✅
```
1. Email nuevo: pepe@ejemplo.com
2. Se crea automáticamente
3. Recibe código
4. Accede
```

### Test 3: Error de Código ✅
```
1. Ingresa código incorrecto
2. Muestra error "Código inválido"
3. Permite reintentar
```

### Test 4: Código Expirado ✅
```
1. Espera > 5 minutos
2. Intenta validar
3. Muestra "Código expirado"
4. Botón reenvío habilitado
```

### Test 5: Flujo Home ✅
```
1. Login exitoso
2. Ve catálogo de clases
3. Filtra por sede
4. Hace scroll
5. Observa información de clase
```

### Test 6: Reserva ✅
```
1. Click en "Reservar"
2. Confirma en alert
3. Reserva creada
4. Ve en ReservasScreen
```

---

## 🐛 Troubleshooting

### Error: "Could not connect to backend"
```
❌ Causa: Backend no está corriendo
✅ Solución:
  npm start en ritmofit-backend/Entrega-2-Backend-DA1
```

### Error: "Email not found"
```
❌ Causa: Email no existe en BD
✅ Solución:
  Usa email que existe (o será creado automáticamente)
```

### Error: "OTP invalid"
```
❌ Causa: Código incorrecto o expirado
✅ Solución:
  - Verifica número exacto
  - Solicita uno nuevo si pasaron > 5 min
```

### No llega email
```
❌ Causa: Gmail no configurado o Spam
✅ Solución:
  Ver AUTH_TROUBLESHOOTING.md
```

---

## 📚 Documentación Adicional

- **EMAIL_CONFIG.md** - Configuración de envío de emails
- **AUTH_TROUBLESHOOTING.md** - Solución de problemas autenticación
- **CHANGELOG_AUTH.md** - Cambios realizados en v2.0

---

## ✨ Características Implementadas

### Delivery 2
- ✅ Backend funcionando (endpoints OTP, clases, reservas, usuarios)
- ✅ App React Native con 5 pantallas principales
- ✅ Autenticación OTP sin contraseña
- ✅ Reservas de clases
- ✅ Historial de asistencias
- ✅ Perfil de usuario
- ✅ Filtros por sede
- ✅ 100% funcional en Android

### Próximas Entregas
- 🚧 QR check-in
- 🚧 Push notifications
- 🚧 Ratings y comentarios
- 🚧 News/Promotions

---

## 👥 Equipo

**Desarrollado con:** GitHub Copilot + Node.js + React Native + MySQL

---

## 📅 Versión

**Versión:** 2.0
**Fecha:** 11/11/2025
**Status:** ✅ Listo para entrega

---

## 🎯 Próximos Pasos

1. ✅ Ejecutar tests en emulador Android
2. ✅ Verificar flujo completo de autenticación
3. ✅ Probar todas las pantallas
4. ✅ Generar APK para distribución
5. 🔄 Deploy backend en servidor
6. 🔄 Deploy app en Google Play Store

---

**¡Listo para usar! 🚀**
