➔ El socio podrá definir objetivos simples (por ejemplo: “asistir 8 veces este mes” o “tomar 3 clases de yoga por semana”). HECHO
➔ La app mostrará el progreso de manera visual (barra o contador) y avisará cuando un objetivo esté por cumplirse o se haya logrado. HECHO
➔ Cada alumno podrá editar o borrar sus objetivos cuando lo desee. HECHO

Para probrar el trabajo practico lo mejor es seguir este paso a paso.

1. Correr ./scripts/seedDatabaseHistorial.js

Ejecutar el comando 'node .\scripts\seedDatabaseHistorial.js' desde Entrega-2-Backend-DA1
este script borrara las clases ya establecidas en el historial (si las hay) y creara nuevas clases que serviran para probar los objetivos.

Las clases creadas son las siguientes:

    - Yoga Relax  (hoy − 1 dia)
    - Yoga Flow  (hoy − 3 dias)
    - Yoga Energético  (hoy - 8 dias)
    - Yoga Postural  (hoy - 10 dias)


    - Box Técnico  (hoy - 8 dias)
    - Box Cardio  (hoy - 12 dias)
    - Box Avanzado  (hoy - 15 dias)


    - Pilates Serie 1  (hoy − 330 dias)
    - Pilates Serie 2  (hoy − 270 dias)
    - Pilates Serie 3  (hoy − 210 dias)
    - Pilates Serie 4  (hoy − 150 dias)
    - Pilates Serie 5  (hoy − 90 dias)
    - Pilates Serie 6  (hoy − 30 dias)
    - Pilates Serie 7  (hoy - 20 dias)
    - Pilates Serie 8  (hoy - 18 dias)
    - Pilates Serie 9  (hoy - 9 dias)
    - Pilates Serie 10  hoy

    - CrossFit WOD (hoy − 7 días)
    - Zumba Fiesta (hoy − 14 días)
    - Spinning Endurance (hoy − 21 días)
    - Pilates Extra (hoy − 28 días)

2. Crear objetivos

Si el usuario crea el objetivo: 2 clases de yoga en la semana. Resultado esperado: Objetivo cumplido

Si el usuario crea el objetivo: 3 clases de yoga en la semana. Resultado esperado: Casi! falta 1 clase

Si el usuario crea el objetivo: 4 clases de yoga en el mes. Resultado esperado: Objetivo cumplido

Si el usuario crea el objetivo: 10 clases de yoga en el mes. Resultado esperado: 40% completado

Si el usuario crea el objetivo: 10 clases de pilates en el anno. Resultado esperado: Objetivo cumplido.

3. Cambia objetivos

Si el usuario crea el objetivo: 3 clases de yoga en la semana y despues lo modifica a 2 clases de yoga en la semana. Resultado esperado: Casi! falta 1 clase, luego de modificarlo: Objetivo cumplido.

Si el usuario crea el objetivo: 2 clases de yoga en la semana y despues lo modifica a 3 clases de yoga en la semana. Resultado esperado: Objetivo cumplido, luego de modificarla: Casi! falta 1 clase

4. Borrar objetivos

Si el usuario crea un objetivo y toca el boton borrar. Resultado esperado: La clase es desactivada y el usuario no lo ve mas.

/////////////////////////////////////////////////////////////////////////////////////////////

Por motivos de brevedad, no vamos a poner todas las infinitas combinaciones posibles, pero los objetivos deberian funcionar con las clases de boxeo, zumba, spinning, crossfit y pilates.
