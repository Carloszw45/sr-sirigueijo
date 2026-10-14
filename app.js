(() => {
  'use strict';
  const store = window.STORE_DATA;
  const core = window.OrderCore;
  const $ = selector => document.querySelector(selector);
  const $$ = selector => Array.from(document.querySelectorAll(selector));
  const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const icon = name => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const storageKey = 'sr-sirigueijo-cart-v1';
  let cart = [];
  let category = 'Todos';
  let query = '';
  let toastTimer;
  let lastCartTrigger;
  let storageWarningShown = false;
  const dialog = $('#cart-dialog');
  const form = $('#checkout-form');
  const sendButton = $('#send-order');
  const connected = Boolean(core.whatsappUrl(store, 'Teste de configuração'));

  try { cart = core.sanitizeCart(JSON.parse(localStorage.getItem(storageKey) || '[]'), store.products); }
  catch { cart = []; }

  function notify(text) {
    const toast = $('#toast');
    toast.textContent = text;
    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 2900);
  }
  function persist() {
    cart = core.sanitizeCart(cart, store.products);
    try { localStorage.setItem(storageKey, JSON.stringify(cart)); }
    catch {
      if (!storageWarningShown) { storageWarningShown = true; notify('O carrinho funciona nesta página, mas não pôde ser salvo neste navegador.'); }
    }
  }
  function productPrice(product, quantity = 1) {
    return Number.isSafeInteger(product.priceCents) && product.priceCents >= 0 ? core.money(product.priceCents * quantity) : 'Sob consulta';
  }
  function renderProducts() {
    const matches = store.products.filter(product =>
      (category === 'Todos' || product.category === category) &&
      core.normalizeText(`${product.name} ${product.category} ${product.description}`).includes(core.normalizeText(query))
    );
    $('#product-grid').innerHTML = matches.map(product => {
      const maxed = (cart.find(item => item.id === product.id)?.quantity || 0) >= core.MAX_QUANTITY;
      return `<article class="product-card">
        <div class="product-photo"><img src="${escape(product.image)}" alt="${escape(product.name)} — foto ilustrativa" width="800" height="600" loading="lazy" decoding="async"><span class="product-badge">${escape(product.badge)}</span>${store.menuVerified ? '' : '<span class="product-example">FOTO ILUSTRATIVA</span>'}</div>
        <div class="product-info"><span class="product-category">${escape(product.category)}</span><h3>${escape(product.name)}</h3><p>${escape(product.description)}</p>
          <div class="product-buy"><div class="product-price">${productPrice(product)}<small>${store.menuVerified ? 'por unidade' : 'valor a confirmar'}</small></div><button class="add-button" type="button" data-add="${escape(product.id)}" aria-label="Adicionar ${escape(product.name)} ao carrinho" ${maxed ? 'disabled' : ''}>${icon('plus')}<span class="add-label">Adicionar</span></button></div>
        </div></article>`;
    }).join('');
    $('#no-results').hidden = matches.length > 0;
    $('#results-status').textContent = `${matches.length} ${matches.length === 1 ? 'item encontrado' : 'itens encontrados'}.`;
  }
  function customer() {
    return {name:form.elements.name.value.trim(), method:form.elements.method.value, address:form.elements.address.value.trim(), notes:form.elements.notes.value.trim()};
  }
  function updateMessage() {
    const data = customer();
    const delivery = data.method === 'delivery';
    $('#address-group').hidden = !delivery;
    $('#customer-address').required = delivery;
    $('#order-preview').value = core.orderMessage(store, cart, data);
  }
  function renderCount() {
    const total = core.totals(cart, store.products);
    $$('[data-cart-count]').forEach(element => { element.textContent = total.count; });
    $('.floating-cart').hidden = total.count === 0 || dialog.open;
    $('#floating-total').textContent = total.pendingPrice ? `${total.count} ${total.count === 1 ? 'item' : 'itens'} · Sob consulta` : core.money(total.knownCents);
  }
  function renderCart() {
    const empty = cart.length === 0;
    $('#cart-empty').hidden = !empty;
    $('#cart-filled').hidden = empty;
    $('#cart-items').innerHTML = cart.map(item => {
      const product = store.products.find(p => p.id === item.id);
      return `<article class="cart-item"><img src="${escape(product.image)}" alt="${escape(product.name)}" width="69" height="75"><div class="cart-item-info"><h3>${escape(product.name)}</h3><span class="cart-item-price">${productPrice(product, item.quantity)}</span><div class="quantity"><button type="button" data-delta="-1" data-id="${escape(item.id)}" aria-label="Diminuir quantidade de ${escape(product.name)}">${icon('minus')}</button><span aria-label="Quantidade">${item.quantity}</span><button type="button" data-delta="1" data-id="${escape(item.id)}" aria-label="Aumentar quantidade de ${escape(product.name)}" ${item.quantity >= core.MAX_QUANTITY ? 'disabled' : ''}>${icon('plus')}</button></div></div><button class="remove-item" type="button" data-remove="${escape(item.id)}" aria-label="Remover ${escape(product.name)}">${icon('close')}</button><details class="item-note" ${item.note ? 'open' : ''}><summary>Observação deste item</summary><label class="sr-only" for="note-${escape(item.id)}">Observação para ${escape(product.name)}</label><textarea id="note-${escape(item.id)}" data-note="${escape(item.id)}" maxlength="240" rows="2" placeholder="Ex.: sem algum ingrediente">${escape(item.note)}</textarea></details></article>`;
    }).join('');
    const total = core.totals(cart, store.products);
    $('#cart-item-total').textContent = total.count;
    $('#cart-subtotal').textContent = total.pendingPrice ? 'Sob consulta' : core.money(total.knownCents);
    sendButton.disabled = empty || !connected;
    updateMessage();
    renderCount();
  }
  function openCart(trigger) {
    lastCartTrigger = trigger;
    renderCart();
    if (!dialog.open) dialog.showModal();
    renderCount();
  }
  function closeCart() { dialog.close(); }
  function modifyCart(id, delta) {
    const focusKey = document.activeElement?.getAttribute('data-id');
    const focusDelta = document.activeElement?.getAttribute('data-delta');
    cart = core.changeQuantity(cart, store.products, id, delta);
    persist(); renderProducts(); renderCart();
    if (focusKey && dialog.open) {
      const focusTarget = $$('[data-delta]').find(button => button.dataset.id === focusKey && button.dataset.delta === focusDelta && !button.disabled);
      (focusTarget || $('#close-cart')).focus();
    }
  }
  $('#product-grid').addEventListener('click', event => {
    const button = event.target.closest('[data-add]');
    if (!button || button.disabled) return;
    const product = store.products.find(p => p.id === button.dataset.add);
    if (!product) return;
    modifyCart(product.id, 1);
    const updatedButton = $$('[data-add]').find(el => el.dataset.add === product.id);
    if (updatedButton && !updatedButton.disabled) updatedButton.focus({preventScroll:true});
    notify(`${product.name} adicionado ao carrinho.`);
  });
  $$('.category').forEach(button => button.addEventListener('click', () => {
    category = button.dataset.category;
    $$('.category').forEach(other => {const active = other === button;other.classList.toggle('active', active);other.setAttribute('aria-pressed', String(active));});
    renderProducts();
  }));
  $('#search').addEventListener('input', event => { query = event.target.value; renderProducts(); });
  $('#reset-search').addEventListener('click', () => { query = '';$('#search').value = '';$('.category[data-category="Todos"]').click(); });
  $$('[data-open-cart]').forEach(button => button.addEventListener('click', () => openCart(button)));
  $('#close-cart').addEventListener('click', closeCart);
  $('#continue-shopping').addEventListener('click', () => { closeCart();$('#cardapio').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'}); });
  dialog.addEventListener('click', event => {if (event.target === dialog) {const rect = dialog.getBoundingClientRect();if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeCart();}});
  dialog.addEventListener('close', () => { renderCount();if (lastCartTrigger && !lastCartTrigger.hidden) lastCartTrigger.focus({preventScroll:true}); });
  $('#cart-items').addEventListener('click', event => {
    const deltaButton = event.target.closest('[data-delta]');
    if (deltaButton && !deltaButton.disabled) { modifyCart(deltaButton.dataset.id, Number(deltaButton.dataset.delta)); return; }
    const removeButton = event.target.closest('[data-remove]');
    if (removeButton) {cart = cart.filter(item => item.id !== removeButton.dataset.remove);persist();renderProducts();renderCart();(cart.length ? $('#close-cart') : $('#continue-shopping')).focus();}
  });
  $('#cart-items').addEventListener('input', event => {
    const note = event.target.closest('[data-note]');
    if (!note) return;
    cart = cart.map(item => item.id === note.dataset.note ? {...item, note:note.value.slice(0,240)} : item);
    persist();updateMessage();
  });
  form.addEventListener('input', updateMessage);
  form.addEventListener('change', updateMessage);
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!cart.length) {notify('Adicione um item antes de continuar.');return;}
    if (!connected) {notify('O WhatsApp e o cardápio da loja ainda precisam ser confirmados.');return;}
    if (!form.reportValidity()) return;
    const url = core.whatsappUrl(store, core.orderMessage(store, cart, customer()));
    if (!url) {notify('O número de WhatsApp da loja precisa ser verificado.');return;}
    window.open(url, '_blank', 'noopener,noreferrer');
    notify('Continue no WhatsApp para confirmar o envio.');
  });
  $('#copy-order').addEventListener('click', async () => {
    const preview = $('#order-preview');
    updateMessage();
    if (!preview.value) return;
    try {
      await navigator.clipboard.writeText(preview.value);
      notify('Resumo copiado. Confira os itens antes de enviar.');
    } catch {
      preview.focus();preview.select();
      notify('Resumo selecionado. Use a opção Copiar do seu celular.');
    }
  });
  if (store.menuVerified) {$('#preview-notice').hidden = true;$('#demo-note').hidden = true;}
  if (connected) {
    sendButton.querySelector('span').textContent = 'Enviar pedido pelo WhatsApp';
    $('#checkout-notice').querySelector('p').textContent = 'O WhatsApp abrirá com seu pedido preenchido. Confirme disponibilidade, frete e pagamento com a loja antes de concluir.';
    $('#send-step-copy').textContent = 'Envie o resumo pelo WhatsApp e confirme disponibilidade, entrega e valor final com a loja.';
  }
  const totalBadge = $('.category[data-category="Todos"]>span');
  totalBadge.textContent = String(store.products.length).padStart(2,'0');
  renderProducts();renderCart();
})();
