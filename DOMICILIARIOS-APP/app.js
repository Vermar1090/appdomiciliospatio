// ============================================================
// DOMICILIARIOS APP — Lógica principal
// ============================================================

const API_URL = 'https://palpitate-mystify-lifting.ngrok-free.dev/api';

// ── Estado ──────────────────────────────────────────────────
let currentUser   = null;
let currentPedido = null;
let currentTab    = 'pedidos';

// ── Referencias DOM ─────────────────────────────────────────
const loginScreen           = document.getElementById('login-screen');
const homeScreen            = document.getElementById('home-screen');
const pedidoScreen          = document.getElementById('pedido-screen');
const estadisticasScreen    = document.getElementById('estadisticas-screen');
const loginForm             = document.getElementById('login-form');
const loginError            = document.getElementById('login-error');
const pedidosList           = document.getElementById('pedidos-list');
const pedidoDetail          = document.getElementById('pedido-detail');
const userName              = document.getElementById('user-name');
const pedidosCount          = document.getElementById('pedidos-count');
const completadosCount       = document.getElementById('completados-count');
const estadisticasBtn       = document.getElementById('estadisticas-btn');
const estadisticasBackBtn    = document.getElementById('estadisticas-back-btn');

// Modal de método de pago
const pagoModal             = document.getElementById('pago-modal');
const pagoModalOverlay      = document.getElementById('pago-modal-overlay');
const cerrarModalBtn        = document.getElementById('cerrar-modal-btn');
const cancelarPagoBtn       = document.getElementById('cancelar-pago-btn');
const confirmarPagoBtn      = document.getElementById('confirmar-pago-btn');

// ── Helpers ─────────────────────────────────────────────────

function initIcons() {
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function formatCOP(value) {
  return '$' + (value || 0).toLocaleString('es-CO');
}

function formatDate(isoString) {
  try {
    return new Date(isoString).toLocaleString('es-CO', {
      day:    '2-digit',
      month:  'short',
      hour:   '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

// Determina el badge según el estado del pedido
function getBadge(pedido) {
  const estado = (pedido.estado || '').toLowerCase();
  if (estado === 'nuevo' || estado === 'pendiente') {
    return '<span class="badge badge-new">Nuevo</span>';
  }
  if (estado === 'cerrado' || estado === 'entregado') {
    return '<span class="badge badge-done">Entregado</span>';
  }
  return '<span class="badge badge-orange">En curso</span>';
}

// ── Inicialización ───────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initIcons();

  const token = localStorage.getItem('token');
  const user  = localStorage.getItem('user');

  if (token && user) {
    currentUser = JSON.parse(user);
    showHomeScreen();
  }

  loginForm.addEventListener('submit', handleLogin);
  document.getElementById('logout-btn').addEventListener('click', handleLogout);

  document.getElementById('back-btn').addEventListener('click', () => {
    pedidoScreen.classList.add('hidden');
    homeScreen.classList.remove('hidden');
    initIcons();
  });

  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      const clicked = e.target.closest('.tab');
      clicked.classList.add('active');
      currentTab = clicked.dataset.tab;
      loadPedidos();
    });
  });

  document.getElementById('cerrar-pedido-btn').addEventListener('click', handleCerrarPedido);

  // Event listeners del modal de pago
  cerrarModalBtn.addEventListener('click', hidePagoModal);
  cancelarPagoBtn.addEventListener('click', hidePagoModal);
  pagoModalOverlay.addEventListener('click', hidePagoModal);
  confirmarPagoBtn.addEventListener('click', confirmarPago);

  // Botón de estadísticas
  estadisticasBtn.addEventListener('click', showEstadisticasScreen);
  estadisticasBackBtn.addEventListener('click', hideEstadisticasScreen);
});

// ── Login ────────────────────────────────────────────────────

async function handleLogin(e) {
  e.preventDefault();
  loginError.textContent = '';

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  try {
    const response = await fetch(`${API_URL}/usuarios/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok) {
      if (data.user.rol !== 'domiciliario') {
        loginError.textContent = 'Este usuario no tiene rol de domiciliario.';
        return;
      }
      currentUser = data.user;
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      showHomeScreen();
    } else {
      loginError.textContent = data.error || 'Usuario o contraseña incorrectos.';
    }
  } catch {
    loginError.textContent = 'Sin conexión con el servidor.';
  }
}

// ── Estadísticas ────────────────────────────────────────────────

function showEstadisticasScreen() {
  homeScreen.classList.add('hidden');
  estadisticasScreen.classList.remove('hidden');
  cargarEstadisticas();
  initIcons();
}

function hideEstadisticasScreen() {
  estadisticasScreen.classList.add('hidden');
  homeScreen.classList.remove('hidden');
  initIcons();
}

async function cargarEstadisticas() {
  const token = localStorage.getItem('token');

  try {
    // Obtener el turno activo del domiciliario logueado
    const turnosResponse = await fetch(`${API_URL}/domiciliarios/turnos`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const turnosData = await turnosResponse.json();

    if (!turnosResponse.ok || !turnosData || turnosData.length === 0) {
      displayEstadisticasError('No hay turno activo');
      return;
    }

    // Filtrar por el domiciliario logueado y obtener el turno activo
    const turnoActivo = turnosData.find(t => 
      t.estado === 'activo' && t.domiciliario_id === currentUser.id
    );
    
    if (!turnoActivo) {
      displayEstadisticasError('No tienes un turno activo');
      return;
    }

    // Obtener el consolidado del turno
    const consolidadoResponse = await fetch(`${API_URL}/domiciliarios/turnos/${turnoActivo.id}/consolidado`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const consolidadoData = await consolidadoResponse.json();

    if (consolidadoResponse.ok) {
      displayConsolidado(consolidadoData);
    } else {
      console.error('Error al cargar consolidado:', consolidadoData.error);
      displayEstadisticasError(consolidadoData.error || 'Error al cargar consolidado');
    }
  } catch (error) {
    console.error('Error al cargar estadísticas:', error);
    displayEstadisticasError('Error de conexión');
  }
}

function displayConsolidado(data) {
  const { turno, resumen, pedidos } = data;

  // Fondo inicial
  document.getElementById('cons-fondo-inicial').textContent = formatCOP(turno.fondo_inicial || 0);

  // Resumen del periodo
  document.getElementById('cons-num-facturas').textContent = resumen.numero_pedidos || 0;
  document.getElementById('cons-total-ventas').textContent = formatCOP(resumen.total_ventas || 0);
  document.getElementById('cons-total-efectivo').textContent = formatCOP(resumen.total_efectivo || 0);
  document.getElementById('cons-total-datafono').textContent = formatCOP(resumen.total_datafono || 0);
  document.getElementById('cons-total-transferencia').textContent = formatCOP(resumen.total_transferencia || 0);

  // Efectivo a entregar
  const efectivoEntregar = (resumen.total_efectivo || 0) + (turno.fondo_inicial || 0);
  document.getElementById('cons-efectivo-entregar').textContent = formatCOP(efectivoEntregar);
  document.getElementById('cons-efectivo-subtitle').textContent = `(Ventas en efectivo: ${formatCOP(resumen.total_efectivo || 0)} + Fondo inicial: ${formatCOP(turno.fondo_inicial || 0)})`;

  // Lista de pedidos
  const facturasList = document.getElementById('facturas-list');
  if (pedidos && pedidos.length > 0) {
    facturasList.innerHTML = pedidos.map(p => `
      <div class="factura-row">
        <span class="factura-numero">${p.numero_domicilio || '#' + p.id}</span>
        <span class="factura-cliente">${p.cliente_nombre || 'N/A'}</span>
        <span class="factura-efectivo">${formatCOP(p.monto_efectivo || 0)}</span>
        <span class="factura-datafono">${formatCOP(p.monto_datafono || 0)}</span>
        <span class="factura-transferencia">${formatCOP(p.monto_transferencia || 0)}</span>
      </div>
    `).join('');
  } else {
    facturasList.innerHTML = '<p class="muted">No hay pedidos en este turno</p>';
  }

  initIcons();
}

function displayEstadisticasError(message) {
  document.getElementById('cons-fondo-inicial').textContent = '$ 0';
  document.getElementById('cons-num-facturas').textContent = '0';
  document.getElementById('cons-total-ventas').textContent = '$ 0';
  document.getElementById('cons-total-efectivo').textContent = '$ 0';
  document.getElementById('cons-total-datafono').textContent = '$ 0';
  document.getElementById('cons-total-transferencia').textContent = '$ 0';
  document.getElementById('cons-efectivo-entregar').textContent = '$ 0';
  document.getElementById('cons-efectivo-subtitle').textContent = '';
  document.getElementById('facturas-list').innerHTML = `<p class="muted">${message}</p>`;
  initIcons();
}

// ── Logout ───────────────────────────────────────────────────

function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  currentUser = null;
  homeScreen.classList.add('hidden');
  pedidoScreen.classList.add('hidden');
  loginScreen.classList.remove('hidden');
  loginForm.reset();
  loginError.textContent = '';
  initIcons();
}

// ── Home ─────────────────────────────────────────────────────

function showHomeScreen() {
  loginScreen.classList.add('hidden');
  homeScreen.classList.remove('hidden');
  userName.textContent = currentUser.nombre_completo || currentUser.username;
  loadPedidos();
  initIcons();
}

// ── Cargar pedidos ───────────────────────────────────────────

async function loadPedidos() {
  pedidosList.innerHTML = `
    <div class="loading-state">
      <i data-lucide="loader-2" class="spinner"></i>
      <p>Cargando pedidos...</p>
    </div>`;
  initIcons();

  try {
    const token    = localStorage.getItem('token');
    const endpoint = `${API_URL}/domiciliarios/pedidos`;

    const response = await fetch(endpoint, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const pedidos = await response.json();

    if (response.ok) {
      displayPedidos(pedidos);
      updateStats(pedidos);
    } else {
      showListError(pedidos.error || 'No se pudieron cargar los pedidos.');
    }
  } catch {
    showListError('Sin conexión con el servidor.');
  }
}

function showListError(msg) {
  pedidosList.innerHTML = `
    <div class="error-state">
      <i data-lucide="wifi-off"></i>
      <p>${msg}</p>
    </div>`;
  initIcons();
}

// ── Actualizar stats ─────────────────────────────────────────

function updateStats(pedidos) {
  pedidosCount.textContent    = pedidos.length || 0;
  completadosCount.textContent = pedidos.filter(p =>
    ['cerrado','entregado'].includes((p.estado || '').toLowerCase())
  ).length;
}

// ── Mostrar lista ────────────────────────────────────────────

function displayPedidos(pedidos) {
  if (!pedidos || pedidos.length === 0) {
    pedidosList.innerHTML = `
      <div class="empty-state">
        <i data-lucide="inbox"></i>
        <p>No hay pedidos disponibles</p>
      </div>`;
    initIcons();
    return;
  }

  pedidosList.innerHTML = pedidos.map(pedido => `
    <div class="pedido-card" onclick="showPedidoDetail(${pedido.id})">
      <div class="pedido-card-top">
        <h3>
          <i data-lucide="package"></i>
          Pedido #${pedido.id}
          ${pedido.numero_domicilio ? `<span class="domicilio-numero">#${pedido.numero_domicilio}</span>` : ''}
        </h3>
        ${getBadge(pedido)}
      </div>

      <div class="pedido-card-info">
        <p><i data-lucide="user"></i>${pedido.cliente_nombre || 'Sin nombre'}</p>
        <p><i data-lucide="phone"></i>${pedido.cliente_telefono || 'Sin teléfono'}</p>
        <p><i data-lucide="map-pin"></i>${pedido.domicilio_direccion || 'Sin dirección'}</p>
        <p><i data-lucide="clock"></i>${formatDate(pedido.fecha_apertura)}</p>
      </div>

      <div class="pedido-card-footer">
        <span class="total">${formatCOP(pedido.subtotal)}</span>
        <div class="card-arrow">
          <i data-lucide="chevron-right"></i>
        </div>
      </div>
    </div>
  `).join('');

  initIcons();
}

// ── Detalle de pedido ────────────────────────────────────────

async function showPedidoDetail(pedidoId) {
  homeScreen.classList.add('hidden');
  pedidoScreen.classList.remove('hidden');

  pedidoDetail.innerHTML = `
    <div class="loading-state">
      <i data-lucide="loader-2" class="spinner"></i>
      <p>Cargando detalle...</p>
    </div>`;
  initIcons();

  try {
    const token    = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/domiciliarios/pedidos/${pedidoId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const pedido = await response.json();

    if (response.ok) {
      currentPedido = pedido;
      displayPedidoDetail(pedido);
      initIcons();
    } else {
      pedidoDetail.innerHTML = `
        <div class="error-state">
          <i data-lucide="alert-circle"></i>
          <p>${pedido.error || 'No se pudo cargar el pedido.'}</p>
        </div>`;
      initIcons();
    }
  } catch {
    pedidoDetail.innerHTML = `
      <div class="error-state">
        <i data-lucide="wifi-off"></i>
        <p>Sin conexión con el servidor.</p>
      </div>`;
    initIcons();
  }
}

function displayPedidoDetail(pedido) {
  const itemsHtml = (pedido.items || []).map(item => `
    <div class="item">
      <div class="item-info">
        <div class="item-name">${item.producto_nombre}</div>
        <div class="item-qty">x${item.cantidad} unidad${item.cantidad !== 1 ? 'es' : ''}</div>
      </div>
      <div class="item-price">${formatCOP(item.cantidad * item.precio_unitario)}</div>
    </div>
  `).join('');

  pedidoDetail.innerHTML = `
    <!-- Info del cliente -->
    <div class="detail-section">
      <div class="detail-section-title">Cliente</div>

      <div class="info-row">
        <span class="label"><i data-lucide="user"></i>Nombre</span>
        <span class="value">${pedido.cliente_nombre || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="label"><i data-lucide="phone"></i>Teléfono</span>
        <span class="value" style="color:var(--or-600)">${pedido.cliente_telefono || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="label"><i data-lucide="map-pin"></i>Dirección</span>
        <span class="value">${pedido.domicilio_direccion || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="label"><i data-lucide="clock"></i>Hora</span>
        <span class="value">${formatDate(pedido.fecha_apertura)}</span>
      </div>
    </div>

    <!-- Productos -->
    <div class="detail-section">
      <div class="detail-section-title">Productos</div>
      <div class="items-list">
        ${itemsHtml || '<p style="color:var(--txt-3);font-size:13px;padding:8px 0;">Sin productos</p>'}
      </div>
    </div>

    <!-- Total -->
    <div class="total-summary">
      <span class="total-label">Total a cobrar</span>
      <span class="total-value">${formatCOP(pedido.subtotal)}</span>
    </div>
  `;
}

// ── Cerrar pedido ────────────────────────────────────────────

async function handleCerrarPedido() {
  if (!currentPedido) return;

  if (!confirm('¿Confirmas el cierre de este pedido?')) return;

  // Mostrar modal de selección de método de pago
  showPagoModal();
}

function showPagoModal() {
  pagoModal.classList.remove('hidden');
  initIcons();
}

function hidePagoModal() {
  pagoModal.classList.add('hidden');
}

async function confirmarPago() {
  const selectedMetodo = document.querySelector('input[name="metodo_pago"]:checked');
  if (!selectedMetodo) {
    alert('Por favor selecciona un método de pago');
    return;
  }

  const metodoPago = selectedMetodo.value;
  hidePagoModal();

  try {
    const token    = localStorage.getItem('token');
    const response = await fetch(
      `${API_URL}/domiciliarios/pedidos/${currentPedido.id}/cerrar`,
      {
        method:  'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({ metodo_pago: metodoPago }),
      }
    );

    const result = await response.json();

    if (response.ok) {
      alert(
        `✅ Pedido cerrado\n\n` +
        `Factura: ${result.numero_factura}\n` +
        `Total:   ${formatCOP(result.total)}`
      );
      currentPedido = null;
      pedidoScreen.classList.add('hidden');
      homeScreen.classList.remove('hidden');
      loadPedidos();
      initIcons();
    } else {
      alert('Error al cerrar pedido: ' + (result.error || 'Error desconocido'));
    }
  } catch {
    alert('Sin conexión con el servidor.');
  }
}