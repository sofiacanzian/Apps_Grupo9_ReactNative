// scripts/deleteUserByEmail.js
// Elimina completamente un usuario por email y sus datos asociados

require('dotenv').config();
const { Op } = require('sequelize');
const { sequelize } = require('../config/db.config');
const User = require('../models/user.model');
const Reserva = require('../models/reserva.model');
const Asistencia = require('../models/asistencia.model');
const Clase = require('../models/clase.model');

const parseArgs = () => {
  const args = {};
  process.argv.slice(2).forEach((arg) => {
    const [key, value] = arg.split('=');
    const normKey = key.replace(/^--/, '');
    args[normKey] = value ?? true;
  });
  return args;
};

const run = async () => {
  const args = parseArgs();
  const email = args.email || args.e;
  const reassignTo = args['reassign-to'];

  if (!email) {
    console.error('❌ Debes pasar el email del usuario. Ej: npm run delete-user -- --email=usuario@dominio.com');
    process.exit(1);
  }

  console.log('🧹 Eliminando usuario y datos asociados...');
  console.log('🔎 Email:', email);

  try {
    await sequelize.authenticate();

    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log('ℹ️ Usuario no encontrado. Nada para eliminar.');
      process.exit(0);
    }

    await sequelize.transaction(async (t) => {
      // Eliminar asistencias
      const delAsist = await Asistencia.destroy({ where: { userId: user.id }, transaction: t });
      console.log(`   - Asistencias eliminadas: ${delAsist}`);

      // Eliminar reservas
      const delRes = await Reserva.destroy({ where: { userId: user.id }, transaction: t });
      console.log(`   - Reservas eliminadas: ${delRes}`);

      // Si el usuario es instructor, reasignar o eliminar clases
      if (user.rol === 'instructor') {
        const classesCount = await Clase.count({ where: { instructorId: user.id }, transaction: t });
        if (classesCount > 0) {
          console.log(`   - Usuario es instructor de ${classesCount} clases.`);

          let targetInstructor = null;
          if (reassignTo) {
            targetInstructor = await User.findOne({ where: { email: reassignTo, rol: 'instructor' }, transaction: t });
            if (!targetInstructor) {
              throw new Error(`Instructor para reasignación no encontrado: ${reassignTo}`);
            }
          } else {
            targetInstructor = await User.findOne({ where: { rol: 'instructor', id: { [Op.ne]: user.id } }, transaction: t });
          }

          if (targetInstructor) {
            const upd = await Clase.update({ instructorId: targetInstructor.id }, { where: { instructorId: user.id }, transaction: t });
            console.log(`   - Clases reasignadas al instructor ${targetInstructor.email} (count=${upd[0]})`);
          } else {
            const del = await Clase.destroy({ where: { instructorId: user.id }, transaction: t });
            console.log(`   - No hay instructor alternativo. Clases eliminadas: ${del}`);
          }
        }
      }

      // Finalmente, eliminar usuario
      await user.destroy({ transaction: t });
      console.log('   - Usuario eliminado.');
    });

    console.log('✅ Eliminación completada.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error eliminando usuario:', err.message);
    process.exit(1);
  }
};

run();
