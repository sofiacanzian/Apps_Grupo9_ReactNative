Este es un read me para mi (santino) en particular ya que estuve como 3 horas intentando levantar esto.

## 1. Iniciar el backend

```bash
cd backend
npm run dev

## 2. Asegurarse que el env tenga lo siguiente
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=ritmofit_db
DB_PORT=3306

## 3. Iniciar el front en Mobile
cd ritmofit-mobile
npx expo start --dev-client --lan -c
##el lan es para forzar el EAS utilizar una conexion lan y no se especificamente por que pero asi funciono y no de otra manera

## 4. Conectar el emulador
- Abrí el emulador Android (Pixel 3 API 36 o el que uses).
- Abrí la app ritmofitmobile (APK ya instalado).
- En la pantalla de Development Build:
- Tocá Connect.
- Pegá esta URL ritmofitmobile://expo-development-client/?url=http://192.168.0.38:8081
- Y confirmar

repito no se porque no se me ejecuta de manera correcta pero bueno, esto me lo guardo de recordatorio
```

Esto es para el sql: \connect root@localhost
