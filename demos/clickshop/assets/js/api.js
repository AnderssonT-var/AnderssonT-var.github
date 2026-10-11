import { STORE, TRACK } from './demo-data.js';
const clone = (x) => JSON.parse(JSON.stringify(x));
const KEY = 'clickshop-demo-orders';
function orders() { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } }
function saveOrders(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch {} }
const wait = () => new Promise((r) => setTimeout(r, 250));
function fail(msg, status = 404) { const e = new Error(msg); e.status = status; e.details = {}; throw e; }
function stamp() { return new Date().toISOString().slice(0, 19).replace('T', ' '); }
function sampleTracking(code) {
  const t = clone(TRACK); const now = stamp();
  Object.assign(t, { tracking_code: code, order_reference: 'WA-DEMO-0001', status: 'shipped', status_label: 'Enviado', status_detail: 'Tu pedido va en camino con la transportadora.', step_index: 2, carrier_name: 'Servientrega', carrier_tracking_code: 'SV-123456789', destination_city: 'Quito', ordered_at: now, dispatched_at: now, updated_at: now });
  t.events = [
    { id: 3, status: 'shipped', status_label: 'Enviado', title: 'Pedido enviado', detail: 'Entregado a Servientrega.', location: 'Quito', occurred_at: now },
    { id: 2, status: 'preparing', status_label: 'En preparación', title: 'Preparando tu pedido', detail: 'Estamos empacando tus productos.', location: 'Bodega', occurred_at: now },
    { id: 1, status: 'pending', status_label: 'Pedido recibido', title: 'Pedido recibido', detail: 'Recibimos tu pedido.', location: '', occurred_at: now },
  ];
  return t;
}
function trackingFor(code) {
  code = String(code || '').trim().toUpperCase();
  if (code === 'CS-DEMO-0001') return sampleTracking(code);
  const o = orders()[code]; if (!o) return null;
  const t = clone(TRACK); Object.assign(t, { tracking_code: code, order_reference: o.reference, destination_city: o.city || '', ordered_at: o.at, updated_at: o.at });
  t.events = t.events.map((e) => ({ ...e, occurred_at: o.at })); return t;
}
export async function request(resource, action = 'get', options = {}) {
  await wait();
  if (resource === 'public') return clone(STORE);
  if (resource === 'orders' && action === 'whatsapp') {
    const d = options.data || {}; let subtotal = 0;
    for (const l of d.lines || []) { const p = STORE.products.find((x) => x.id === l.product_id); if (p) subtotal += (p.sale_price ?? p.regular_price) * (l.quantity || 1); }
    const shipping = subtotal >= (STORE.settings.free_shipping_min || 0) && STORE.settings.free_shipping_min ? 0 : STORE.settings.shipping_fee || 0;
    const code = 'CS-' + Math.random().toString(36).slice(2, 10).toUpperCase(); const reference = 'WA-DEMO-' + Math.floor(1000 + Math.random() * 9000);
    const o = orders(); o[code] = { reference, at: stamp(), city: d.shipping_city || '' }; saveOrders(o);
    return { id: 1, reference, tracking_code: code, tracking_url: 'seguimiento.html?guia=' + code, subtotal, shipping, total: subtotal + shipping, currency: 'USD' };
  }
  if (resource === 'tracking' && action === 'lookup') { const t = trackingFor(options.query?.guide); if (!t) fail('No encontramos esa guía. En esta demo prueba con CS-DEMO-0001.'); return t; }
  if (resource === 'tracking' && action === 'mine') return String(options.query?.guides || '').split(',').map(trackingFor).filter(Boolean);
  if (resource === 'reviews') return { ok: true, pending: true };
  return {};
}

export const api = {
  publicStore: () => request('public'),
  session: () => request('auth', 'session'),
  login: (email, password) => request('auth', 'login', { method: 'POST', data: { email, password } }),
  logout: (csrf) => request('auth', 'logout', { method: 'POST', csrf }),
  adminBootstrap: () => request('admin', 'bootstrap'),
  list: (resource) => request(resource, 'list'),
  save: (resource, data, id, csrf) => request(resource, 'save', { method: 'POST', csrf, data: { data, ...(id ? { id } : {}) } }),
  remove: (resource, id, csrf) => request(resource, 'delete', { method: 'POST', csrf, data: { id } }),
  settings: (data, csrf) => request('settings', 'save', { method: 'POST', csrf, data: { data } }),
  upload: (file, kind, csrf) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('kind', kind);
    return request('upload', 'save', { method: 'POST', csrf, formData });
  },
  review: (data) => request('reviews', 'submit', { method: 'POST', data }),
  whatsappOrder: (data) => request('orders', 'whatsapp', { method: 'POST', data }),
  trackOrder: (guide) => request('tracking', 'lookup', { query: { guide } }),
  myOrders: (guides) => request('tracking', 'mine', { query: { guides: guides.join(',') } }),
};
