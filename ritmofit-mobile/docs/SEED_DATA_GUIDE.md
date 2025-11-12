# Guía Rápida: Cargar Datos de Prueba

## ✅ Completado

Se creó exitosamente un script de seed que pobló la base de datos con:

- **3 Sedes**: RitmoFit Centro, Palermo y Belgrano
- **5 Instructores**: Martín, Laura, Carlos, Ana y Diego
- **15 Clases variadas**: Distribuidas en los próximos 7 días

## Verificar en la App

1. **Asegúrate que el backend esté corriendo:**
   ```bash
   cd ritmofit-backend/Entrega-2-Backend-DA1
   npm start
   ```

2. **Abre la app móvil**
   - Navega a la pantalla "Clases" (Home)
   - Deberías ver las 15 clases disponibles
   - Prueba el filtro por sede

3. **Haz una reserva de prueba**
   - Selecciona una clase
   - Presiona "Reservar"
   - Ve a "Mis Reservas" para verificar

## Tipos de Clases Disponibles

- 🚴 **Spinning**: Matutino, Power, Sunset
- 🧘 **Yoga**: Flow, Restaurativo, Vinyasa
- 💪 **CrossFit**: Extremo, Basics
- 🏋️ **Pilates**: Matinal, Avanzado
- 💃 **Zumba**: Party, Toning
- 🥊 **Box**: Fitness
- ⚡ **Funcional**: Total
- 🤸 **Stretching**: y Movilidad

## Comandos Útiles

**Ver clases en la base de datos:**
```bash
npm run seed
```

**Si necesitas recargar datos desde cero:**
Edita `scripts/seedDatabase.js` y cambia:
```javascript
await sequelize.sync({ force: true }); // Borra TODO
```

**Reiniciar el backend:**
```bash
npm start
# o para desarrollo:
npm run dev
```

## Troubleshooting

**No veo clases en la app:**
1. ✅ Verifica que el backend esté corriendo (`http://localhost:3000`)
2. ✅ Revisa la consola del backend para errores
3. ✅ Confirma que la app móvil esté conectada a `http://10.0.2.2:3000/api` (Android emulator)
4. ✅ Asegúrate de estar autenticado (token válido)

**Error de conexión a MySQL:**
1. ✅ MySQL Server debe estar corriendo
2. ✅ Verifica credenciales en `.env`:
   ```
   DB_HOST=localhost
   DB_NAME=ritmofit_db
   DB_USER=root
   DB_PASS=tu_password
   ```

## Próximos Pasos

- ✅ Datos de prueba cargados
- 🔄 Prueba hacer reservas
- 🔄 Verifica el historial de clases
- 🔄 Escanea QR (próxima funcionalidad)
- 🔄 Deja valoraciones (próxima funcionalidad)
