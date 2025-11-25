# 🎉 Guía Rápida: Funcionalidad de Noticias y Promociones

## ¿Qué se implementó?

Se ha agregado una **completa sección de Noticias, Promociones y Eventos** a tu app RitmoFit Mobile, permitiendo que los usuarios se mantengan informados sobre las novedades del gimnasio.

---

## 📱 Dónde está la funcionalidad

### 1️⃣ **En la pantalla Home** (Catálogo de Clases)
- Verás un carrusel con las **3 noticias destacadas más recientes**
- Puedes hacer click en cualquiera para ver el detalle completo
- Hay un botón "Ver todas →" para ir al listado completo

### 2️⃣ **Nueva pestaña: NOTICIAS** 
- En el menú inferior, junto a Clases, Historial, Reservas, etc.
- Icono: 📰 (periódico)
- Aquí verás el listado completo de noticias con opciones de filtrado

### 3️⃣ **Pantalla de Detalle**
- Al hacer click en una noticia, ves todos los detalles
- Puedes compartir en redes sociales 📤
- Puedes copiar códigos de promoción
- Puedes abrir enlaces externos

---

## 🔧 Pasos para Activar en Backend

Para que todo funcione, tu backend debe exponer estos endpoints:

### Endpoint 1: Obtener todas las noticias
```
GET /api/noticias
Query params (opcionales):
  - page: número de página
  - limit: cantidad por página
  - tipo: "noticia" | "promocion" | "evento"
  - destacadas: true/false
  - vigente: true/false
  - sort: "-fecha_publicacion"

Response:
[
  {
    id: 1,
    titulo: "Gran Promoción de Verano",
    descripcion: "Descripción corta...",
    contenido: "Contenido largo...",
    tipo: "promocion",
    imagen_url: "https://...",
    fecha_publicacion: "2025-11-24T00:00:00Z",
    autor: "RitmoFit",
    vigente: true,
    destacada: true,
    enlace: "https://...",
    ubicacion: "Sede Centro",
    fecha_evento: "2025-12-15T18:00:00Z",
    fecha_vencimiento: "2025-12-31T23:59:59Z",
    codigo_promocion: "VERANO2025"
  }
]
```

### Endpoint 2: Obtener detalle de una noticia
```
GET /api/noticias/:id

Response:
{
  id: 1,
  titulo: "Gran Promoción de Verano",
  descripcion: "Descripción corta...",
  contenido: "Contenido largo...",
  tipo: "promocion",
  imagen_url: "https://...",
  fecha_publicacion: "2025-11-24T00:00:00Z",
  autor: "RitmoFit",
  vigente: true,
  destacada: true,
  enlace: "https://...",
  ubicacion: "Sede Centro",
  fecha_evento: "2025-12-15T18:00:00Z",
  fecha_vencimiento: "2025-12-31T23:59:59Z",
  codigo_promocion: "VERANO2025"
}
```

### Endpoint 3: Marcar noticia como leída (Opcional, para tracking)
```
POST /api/noticias/:id/leida

Response:
{
  success: true,
  message: "Noticia marcada como leída"
}
```

---

## 📊 Estructura esperada de datos

### Campos Obligatorios
- `id` (number)
- `titulo` (string)
- `tipo` ("noticia" | "promocion" | "evento")
- `fecha_publicacion` (ISO date)

### Campos Opcionales
- `descripcion` (string)
- `contenido` (string) - Para contenido extendido
- `imagen_url` (string) - URL pública de la imagen
- `autor` (string)
- `vigente` (boolean) - Default: true
- `destacada` (boolean) - Default: false
- `enlace` (string) - URL externa
- `ubicacion` (string) - Para eventos
- `fecha_evento` (ISO date) - Para eventos
- `fecha_vencimiento` (ISO date) - Para promociones
- `codigo_promocion` (string) - Código único para promociones

---

## 🎨 Ejemplos de Datos

### Ejemplo 1: Noticia Regular
```javascript
{
  id: 1,
  titulo: "Nuevas clases de Pilates disponibles",
  descripcion: "Ya disponibles las nuevas clases de Pilates matutinas",
  contenido: "A partir del 1 de diciembre, ofreceremos nuevas horarios para Pilates...",
  tipo: "noticia",
  imagen_url: "https://example.com/pilates.jpg",
  fecha_publicacion: "2025-11-20T10:00:00Z",
  autor: "Equipo RitmoFit",
  vigente: true,
  destacada: false
}
```

### Ejemplo 2: Promoción con Código
```javascript
{
  id: 2,
  titulo: "Black Friday: 30% descuento en membresías",
  descripcion: "¡Aprovecha nuestro Black Friday!",
  tipo: "promocion",
  imagen_url: "https://example.com/blackfriday.jpg",
  fecha_publicacion: "2025-11-24T00:00:00Z",
  autor: "Marketing",
  vigente: true,
  destacada: true,
  fecha_vencimiento: "2025-11-30T23:59:59Z",
  codigo_promocion: "BF2025RITMO",
  enlace: "https://ritmofit.com/promocion"
}
```

### Ejemplo 3: Evento
```javascript
{
  id: 3,
  titulo: "Torneo de CrossFit RitmoFit 2025",
  descripcion: "Participa en el torneo más esperado del año",
  contenido: "Torneo abierto para todos los niveles. Inscripciones abiertas...",
  tipo: "evento",
  imagen_url: "https://example.com/torneo.jpg",
  fecha_publicacion: "2025-11-24T00:00:00Z",
  autor: "Eventos",
  vigente: true,
  destacada: true,
  fecha_evento: "2025-12-15T09:00:00Z",
  ubicacion: "Sede Centro - Cancha Principal",
  enlace: "https://ritmofit.com/torneo"
}
```

---

## 🚀 Paso a Paso para Implementar en Backend

### 1. Crear Modelo/Tabla
```sql
CREATE TABLE noticias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  contenido LONGTEXT,
  tipo ENUM('noticia', 'promocion', 'evento') DEFAULT 'noticia',
  imagen_url VARCHAR(500),
  fecha_publicacion DATETIME NOT NULL,
  autor VARCHAR(100),
  vigente BOOLEAN DEFAULT true,
  destacada BOOLEAN DEFAULT false,
  enlace VARCHAR(500),
  ubicacion VARCHAR(255),
  fecha_evento DATETIME,
  fecha_vencimiento DATETIME,
  codigo_promocion VARCHAR(50) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 2. Crear Controller (Node.js/Express)
```javascript
// controllers/noticias.controller.js
exports.getNoticias = async (req, res) => {
  try {
    const { page = 1, limit = 10, tipo, destacadas, vigente } = req.query;
    
    let query = Noticia.find();
    
    if (tipo) query = query.where('tipo').equals(tipo);
    if (destacadas === 'true') query = query.where('destacada').equals(true);
    if (vigente === 'true') query = query.where('vigente').equals(true);
    
    const skip = (page - 1) * limit;
    const noticias = await query
      .sort({ fecha_publicacion: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    res.json(noticias);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getNoticiaById = async (req, res) => {
  try {
    const noticia = await Noticia.findById(req.params.id);
    if (!noticia) return res.status(404).json({ message: 'Noticia no encontrada' });
    res.json(noticia);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.marcarLeida = async (req, res) => {
  try {
    // Implementar tracking si lo deseas
    res.json({ success: true, message: 'Noticia marcada como leída' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

### 3. Crear Routes
```javascript
// routes/noticias.routes.js
router.get('/', noticias.getNoticias);
router.get('/:id', noticias.getNoticiaById);
router.post('/:id/leida', auth, noticias.marcarLeida);
```

---

## ✅ Testing

Para verificar que todo funciona:

1. **En HomeScreen**: Debe aparecer carrusel con noticias
2. **Nueva pestaña**: "Noticias" debe estar visible
3. **Click en noticia**: Debe abrir pantalla de detalle
4. **Filtros**: Debe funcionar filtrado por tipo
5. **Pull-to-refresh**: Debe recargar datos
6. **Compartir**: Debe permitir compartir en redes
7. **Enlaces**: Debe abrir URLs externas

---

## 📱 Archivos Importantes

```
├── src/
│   ├── services/
│   │   └── noticiasService.js         ← Servicio de API
│   └── screens/
│       └── home/
│           ├── HomeScreen.js           ← Con carrusel integrado
│           ├── NoticiasScreen.js       ← Listado principal
│           └── NoticiaDetalleScreen.js ← Pantalla de detalle
└── app/
    └── _layout.tsx                     ← Navegación actualizada
```

---

## 🔐 Seguridad

- ✅ Token Bearer se envía automáticamente en cada request
- ✅ 401 Unauthorized dispara logout automático
- ✅ Timeout de 10 segundos en requests
- ✅ Validación de datos en el cliente

---

## 💬 Soporte

Si necesitas ayuda:
1. Revisa que los endpoints estén correctamente implementados
2. Verifica que los datos tengan la estructura esperada
3. Abre la consola para ver errores detallados
4. Comprueba que el token sea válido

¡La funcionalidad está lista para usar! 🎉
