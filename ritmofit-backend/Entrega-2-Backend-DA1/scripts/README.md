# Scripts de Base de Datos

## Seed principal (`npm run seed`)

`scripts/seedDatabase.js` es ahora el único punto de entrada para poblar la base con datos coherentes para testing end-to-end. El script limpia las tablas más relevantes y crea un escenario completo con entidades relacionadas.

### Datos generados

- **Sedes:** 4 ubicaciones (Centro, Palermo, Belgrano, Nordelta) con coordenadas y disciplinas.
- **Usuarios:** 1 admin, 4 instructores y 4 socios con contraseñas y PINs ya hasheados (ver credenciales de referencia abajo).
- **Clases:** 8 clases destacadas (con alias fijados para pruebas) **+ un calendario completo que cubre todo diciembre** con sesiones cada ~2 días.
- **Reservas:** Estados combinados (activa, asistida, cancelada) que conectan socios con clases.
- **Asistencias y calificaciones:** Historia mínima para probar pantallas de historial/ratings.
- **Noticias, promociones y eventos:** 4 publicaciones que cubren todos los tipos soportados por `Noticia`.
- **Notificaciones push:** 3 ejemplos para probar recordatorios, cancelaciones y reprogramaciones.

### Ejecución

Desde `Entrega-2-Backend-DA1`:

```bash
npm run seed
```

El script realiza lo siguiente:

1. Autentica la conexión Sequelize (usa `.env`).
2. Borra el contenido existente de `sedes`, `users`, `clases`, `reservas`, `asistencias`, `calificaciones`, `noticias` y `notificaciones` (no usar en producción).
3. Inserta los datos enumerados arriba dentro de una misma transacción.
4. Resume en consola la cantidad de filas creadas por entidad.

### Credenciales de referencia

| Rol | Email | Usuario | Password | PIN |
| --- | --- | --- | --- | --- |
| Admin | `admin@ritmofit.com` | `ritmoadmin` | `Admin123!` | `4321` |
| Instructor | `martina.instructor@ritmofit.com` | `martina.fit` | `Instructor123!` | `1111` |
| Instructor | `diego.instructor@ritmofit.com` | `diegofit` | `Instructor123!` | `2222` |
| Instructor | `valentina.instructor@ritmofit.com` | `valen.rios` | `Instructor123!` | `3333` |
| Instructor | `carlos.instructor@ritmofit.com` | `coachcarlos` | `Instructor123!` | `4444` |
| Socio | `sofia@ritmofit.com` | `sofia.castro` | `Socio123!` | `5555` |
| Socio | `lucas@ritmofit.com` | `lucas.b` | `Socio123!` | `6666` |
| Socio | `camila@ritmofit.com` | `camid` | `Socio123!` | `7777` |
| Socio | `nicolas@ritmofit.com` | `nicoh` | `Socio123!` | `8888` |

> Las contraseñas y PINs anteriores están hasheados dentro del seed; se listan solo para referencia funcional.

### Notas

- Verifica que el servicio MySQL esté activo y accesible con la configuración de `.env` antes de correr el seed.
- El script está pensado para entornos de desarrollo y QA. Ejecutarlo en producción eliminará datos existentes.
- Los antiguos scripts parciales (`seedDatabaseHistorial.js`, `seedNoticias.js`) se eliminaron para evitar divergencias; todo el contenido relevante está incorporado en `seedDatabase.js`.

## Clase de prueba para recordatorios (`npm run seed:reminder-class`)

Cuando necesites generar rápidamente una clase que dispare recordatorios push, ejecuta:

```bash
npm run seed:reminder-class
```

Esto crea (y reemplaza, si ya existe) la clase `Clase prueba recordatorios` exactamente **1 hora y 3 minutos después** del momento de ejecución, usando la primera sede e instructor disponibles. Ideal para validar jobs/notificaciones sin volver a correr el seed completo.

## Scripts de pruebas de notificaciones

### Recordatorios (`node scripts/testReminders.js`)

- Verifica que exista al menos un usuario con `expo_push_token` configurado.
- Busca la clase `Clase prueba recordatorios` (creada con `npm run seed:reminder-class`).
- Crea o reactiva una reserva activa para el primer usuario con push token y muestra un resumen listo para que el job de recordatorios envíe el aviso.

### Cancelaciones (`node scripts/testCancellation.js`)

- Usa la misma clase y la misma reserva preparada por el script anterior.
- Si no existe la reserva, la crea automáticamente y la vuelve a dejar en estado `activa` tras la prueba.
- Marca la reserva como `cancelada`, llama a `sendCancellationNotification`, registra el resultado y finalmente vuelve a dejarla activa para que puedas repetir el test las veces que necesites.
