# Scripts de Base de Datos

## Seed Database

Este script puebla la base de datos con datos de prueba para el desarrollo y testing de la aplicación.

### ¿Qué crea el script?

1. **3 Sedes de RitmoFit**
   - RitmoFit Centro (CABA)
   - RitmoFit Palermo
   - RitmoFit Belgrano

2. **5 Instructores**
   - Con nombres, emails y fotos de perfil

3. **15+ Clases variadas** distribuidas en los próximos 7 días
   - Spinning
   - Yoga
   - CrossFit
   - Pilates
   - Zumba
   - Box
   - Funcional
   - Stretching

### Cómo usar

Desde el directorio `Entrega-2-Backend-DA1`:

```bash
npm run seed
```

### Notas importantes

- ✅ El script NO borra datos existentes (`force: false`)
- ✅ Usa `ignoreDuplicates: true` para evitar errores si los datos ya existen
- ✅ Las clases se crean desde HOY hasta dentro de 7 días
- ⚠️ Asegúrate de que el backend esté configurado correctamente (`.env` con credenciales de MySQL)
- ⚠️ El servidor MySQL debe estar corriendo antes de ejecutar el seed

### Después del seed

Una vez ejecutado, puedes:
1. Abrir la app móvil
2. Ver las clases en la pantalla principal (Home/Clases)
3. Filtrar por sede
4. Hacer reservas de las clases disponibles

### Re-ejecutar el seed

Puedes ejecutar el script múltiples veces sin problemas. Los registros duplicados serán ignorados.

Si necesitas LIMPIAR la base de datos primero, puedes cambiar en el script:
```javascript
await sequelize.sync({ force: true }); // ⚠️ BORRA TODO
```

Pero esto **eliminará todos tus datos**, incluyendo usuarios y reservas existentes.
