(function (root, factory) {
  const core = factory();
  if (typeof module === 'object' && module.exports) module.exports = core;
  else root.OrderCore = core;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const MAX_QUANTITY = 99;
  const money = cents => new Intl.NumberFormat('pt-BR', {style:'currency', currency:'BRL'}).format(cents / 100);
  const normalizeText = text => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  function sanitizeCart(raw, products) {
    if (!Array.isArray(raw)) return [];
    const allowed = new Set(products.map(p => p.id));
    const items = new Map();
    for (const item of raw) {
      if (!item || !allowed.has(item.id)) continue;
      const number = Number(item.quantity);
      if (!Number.isFinite(number) || number < 1) continue;
      const quantity = Math.min(MAX_QUANTITY, Math.floor(number));
      const prior = items.get(item.id);
      items.set(item.id, {id:item.id, quantity:Math.min(MAX_QUANTITY, quantity + (prior?.quantity || 0)), note:String(item.note || '').trim().slice(0, 240)});
    }
    return Array.from(items.values());
  }
  function changeQuantity(raw, products, id, delta) {
    const cart = sanitizeCart(raw, products);
    if (!products.some(p => p.id === id) || !Number.isInteger(delta)) return cart;
    const index = cart.findIndex(item => item.id === id);
    const quantity = Math.min(MAX_QUANTITY, (index >= 0 ? cart[index].quantity : 0) + delta);
    if (quantity <= 0) return cart.filter(item => item.id !== id);
    if (index < 0) cart.push({id, quantity, note:''});
    else cart[index] = {...cart[index], quantity};
    return cart;
  }
  function totals(cart, products) {
    let knownCents = 0;
    let count = 0;
    let pendingPrice = false;
    for (const item of sanitizeCart(cart, products)) {
      const product = products.find(p => p.id === item.id);
      count += item.quantity;
      if (Number.isSafeInteger(product.priceCents) && product.priceCents >= 0) knownCents += product.priceCents * item.quantity;
      else pendingPrice = true;
    }
    return {count, knownCents, pendingPrice};
  }
  function orderMessage(store, cart, customer) {
    const items = sanitizeCart(cart, store.products);
    if (!items.length) return '';
    const summary = totals(items, store.products);
    const clean = value => String(value || '').trim().slice(0, 700);
    const lines = [
      `Olá, ${store.name}! Gostaria de consultar este pedido.`,
      ...(store.menuVerified ? [] : ['PRÉVIA: itens demonstrativos; cardápio a confirmar.']),
      '',
      ...items.flatMap(item => {
        const product = store.products.find(p => p.id === item.id);
        const price = Number.isSafeInteger(product.priceCents) && product.priceCents >= 0 ? money(product.priceCents * item.quantity) : 'valor a confirmar';
        return [`• ${item.quantity}x ${product.name} — ${price}`, ...(item.note ? [`  Observação: ${clean(item.note)}`] : [])];
      }),
      '',
      `Itens: ${summary.count}`,
      `Subtotal: ${summary.pendingPrice ? 'sob consulta' : money(summary.knownCents)}`,
      'Frete, disponibilidade e valor final: confirmar com a loja.',
      '',
      ...(clean(customer.name) ? [`Nome: ${clean(customer.name)}`] : []),
      `Opção desejada: ${customer.method === 'delivery' ? 'entrega (a confirmar)' : 'retirada (a confirmar)'}`,
      ...(customer.method === 'delivery' && clean(customer.address) ? [`Endereço: ${clean(customer.address)}`] : []),
      ...(clean(customer.notes) ? [`Observações: ${clean(customer.notes)}`] : [])
    ];
    return lines.join('\n');
  }
  function whatsappUrl(store, message) {
    if (!store.menuVerified || !message) return null;
    const phone = String(store.whatsapp || '').replace(/[\s()+.-]/g, '');
    if (!/^55[1-9][0-9][0-9]{8,9}$/.test(phone)) return null;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }
  return {MAX_QUANTITY, money, normalizeText, sanitizeCart, changeQuantity, totals, orderMessage, whatsappUrl};
});
