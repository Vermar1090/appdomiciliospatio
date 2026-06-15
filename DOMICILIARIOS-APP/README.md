# App Domiciliarios - Frontend Profesional

Aplicación web profesional para domiciliarios que permite:
- Iniciar sesión con credenciales de domiciliario
- Ver pedidos asignados
- Ver pedidos disponibles para tomar
- Cerrar pedidos desde el móvil
- Generar impresión automática al cerrar

## 🚀 Características

- **Diseño Profesional**: Interfaz moderna con iconos Lucide
- **Animaciones Suaves**: Transiciones fluidas entre pantallas
- **Estadísticas en Tiempo Real**: Contador de pedidos y completados
- **Responsive**: Funciona perfectamente en móviles y escritorio
- **Estados de Carga**: Indicadores visuales durante carga
- **Manejo de Errores**: Mensajes claros cuando hay problemas de conexión
- **Iconos Intuitivos**: Cada acción tiene su icono correspondiente

## 🚀 Cómo usar

### 1. Iniciar el servidor BACKEND

```bash
cd BACKEND
node server.js
```

El servidor correrá en `http://localhost:3000`

### 2. Abrir la app de domiciliarios

Abre el archivo `index.html` en tu navegador:

```
c:\juan\DOMICILIARIOS-APP\index.html
```

O usa un servidor local:

```bash
cd DOMICILIARIOS-APP
python -m http.server 8080
```

Luego abre `http://localhost:8080` en el navegador.

### 3. Iniciar sesión

Usa las credenciales de prueba:

- **Usuario:** `domiciliario1`
- **Contraseña:** `123456`

### 4. Probar el flujo

1. **Login**: Ingresa con las credenciales
2. **Home**: Verás estadísticas y dos pestañas:
   - **Asignados**: Pedidos asignados a este domiciliario
   - **Disponibles**: Pedidos sin asignar
3. **Ver detalle**: Haz clic en un pedido para ver detalles
4. **Cerrar pedido**: En la pantalla de detalle, haz clic en "Cerrar Pedido"
5. **Confirmar**: Ingresa el método de pago y confirma

## 📋 API Endpoints

La app consume estos endpoints del BACKEND:

- `POST /api/usuarios/login` - Iniciar sesión
- `GET /api/domiciliarios/pedidos?domiciliario_id=X` - Listar pedidos asignados
- `GET /api/domiciliarios/disponibles` - Listar pedidos disponibles
- `GET /api/domiciliarios/pedidos/:id` - Ver detalle de pedido
- `POST /api/domiciliarios/pedidos/:id/cerrar` - Cerrar pedido

## 🔧 Configuración

La URL de la API está configurada en `app.js`:

```javascript
const API_URL = 'http://localhost:3000/api';
```

Si necesitas cambiarla, modifica esa línea.

## 🎨 Diseño

La app usa:
- **Lucide Icons**: Librería de iconos moderna y ligera
- **CSS Variables**: Para consistencia en colores y estilos
- **Animaciones CSS**: Para transiciones suaves
- **Responsive Design**: Grid y Flexbox para adaptabilidad
- **Gradientes Modernos**: Para un look profesional

## ⚠️ Notas importantes

- La autenticación está deshabilitada temporalmente en la API de domiciliarios para pruebas
- Para producción, habilita la autenticación en `routes/domiciliarios.js` descomentando la línea:
  ```javascript
  router.use(authenticate);
  ```
- Asegúrate de que el servidor Python de impresión (`printer_server.py`) esté corriendo para que funcione la impresión

## 🛠️ Crear más usuarios domiciliarios

Desde el BACKEND:

```bash
cd BACKEND
node create_domiciliario_test.js
```

O crea usuarios desde la interfaz de administración del sistema principal.
