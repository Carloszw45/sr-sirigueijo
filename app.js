(() => {
  'use strict';
  const store = window.STORE_DATA;
  const core = window.OrderCore;
  const $ = selector => document.querySelector(selector);
  const $$ = selector => Array.from(document.querySelectorAll(selector));
  const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const icon = name => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const cartKey = 'sr-sirigueijo-cart-v1';
  const favoritesKey = 'sr-sirigueijo-favorites-v1';
  const validIds = new Set(store.products.map(product => product.id));
  const dialog = $('#cart-dialog');
  const form = $('#checkout-form');
  const sendButton = $('#send-order');
  const connected = Boolean(core.whatsappUrl(store, 'Verificação de configuração'));
  const collator = new Intl.Collator('pt-BR', {sensitivity:'base', numeric:true});
  let cart = [];
  let favorites = new Set();
  let view = 'home';
  let category = 'Todos';
  let query = '';
  let sort = 'default';
  let slide = 0;
  let touchStartX = null;
  let toastTimer;
  let storageWarningShown = false;
  const returnFocus = new WeakMap();
  try { cart = core.sanitizeCart(JSON.parse(localStorage.getItem(cartKey) || '[]'), store.products); } catch { cart = []; }
  try {
    const raw = JSON.parse(localStorage.getItem(favoritesKey) || '[]');
    if (Array.isArray(raw)) favorites = new Set(raw.filter(id => validIds.has(id)));
  } catch { favorites = new Set(); }

  function notify(text) {
    $('#toast').textContent = text;
    $('#toast').classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 2700);
  }
  function saveLocal(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch {
      if (!storageWarningShown) {storageWarningShown = true;notify('Suas escolhas funcionam aqui, mas não puderam ser salvas neste navegador.');}
    }
  }
  function persistCart() { cart = core.sanitizeCart(cart, store.products);saveLocal(cartKey,cart); }
  function hasPrice(product) { return Number.isSafeInteger(product.priceCents) && product.priceCents >= 0; }
  function productPrice(product, quantity = 1) { return hasPrice(product) ? core.money(product.priceCents * quantity) : 'Sob consulta'; }
  function setActiveNavigation() {
    $$('.bottom-nav [data-view]').forEach(button => {
      const active = button.dataset.view === view;
      button.classList.toggle('active',active);
      if (active) button.setAttribute('aria-current','page');
      else button.removeAttribute('aria-current');
    });
    $$('.category').forEach(button => {
      const active = view === 'favorites' ? button.dataset.category === 'Favoritos' : button.dataset.category === category;
      button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));
    });
  }
  function renderProducts() {
    let matches = store.products.filter(product =>
      (view !== 'favorites' || favorites.has(product.id)) &&
      (category === 'Todos' || product.category === category) &&
      core.normalizeText(`${product.name} ${product.category} ${product.description}`).includes(core.normalizeText(query))
    );
    if (sort === 'name') matches.sort((a,b) => collator.compare(a.name,b.name));
    if (view === 'home') matches = matches.slice(0,3);
    $('#product-grid').innerHTML = matches.map(product => {
      const maxed = (cart.find(item => item.id === product.id)?.quantity || 0) >= core.MAX_QUANTITY;
      const favorite = favorites.has(product.id);
      const description = product.description.replace(/^Exemplo(?: de)?[: ]?\s*/i,'');
      return `<article class="product-card"><div class="product-media"><img src="${escape(product.image)}" alt="${escape(product.name)} — imagem ilustrativa" width="900" height="900" loading="lazy" decoding="async"><span class="product-badge${product.id === 'duplo' ? ' amber' : ''}">${escape(product.badge)}</span><button class="favorite-button" type="button" data-favorite="${escape(product.id)}" aria-pressed="${favorite}" aria-label="${favorite ? 'Remover' : 'Favoritar'} ${escape(product.name)}${favorite ? ' dos favoritos' : ''}">${icon('heart')}</button></div><div class="product-info"><h3>${escape(product.name)}</h3><p class="product-description">${escape(description.charAt(0).toUpperCase()+description.slice(1))}</p><p class="product-meta">${store.menuVerified ? escape(product.category) : 'Imagem ilustrativa'}</p><div class="product-buy"><div class="product-price${hasPrice(product) ? '' : ' is-pending'}">${productPrice(product)}${hasPrice(product) ? '<small>por unidade</small>' : ''}</div><button class="add-button" type="button" data-add="${escape(product.id)}" aria-label="Adicionar ${escape(product.name)} ao carrinho" ${maxed ? 'disabled' : ''}>${icon('plus')}</button></div></div></article>`;
    }).join('');
    const empty = matches.length === 0;
    $('#product-grid').dataset.empty = String(empty);
    $('#no-results').hidden = !empty;
    $('#empty-title').textContent = view === 'favorites' && !query ? 'Guarde seus favoritos.' : 'Nenhum item encontrado.';
    $('#empty-copy').textContent = view === 'favorites' && !query ? 'Toque no coração de um produto para encontrá-lo aqui.' : 'Tente outro nome ou explore as categorias.';
    $('#results-status').textContent = `${matches.length} ${matches.length === 1 ? 'item encontrado' : 'itens encontrados'}.`;
    $('#item-count').textContent = `${matches.length} ${matches.length === 1 ? 'item' : 'itens'}`;
    $('#menu-title').textContent = view === 'home' ? 'Destaques do cardápio' : view === 'favorites' ? 'Meus favoritos' : query ? 'Resultado da busca' : category === 'Todos' ? 'Cardápio completo' : category;
    $('#see-all').hidden = view !== 'home';
    $('#item-count').hidden = view === 'home';
    setActiveNavigation();
  }
  function closeDialogs() { $$('dialog[open]').forEach(pane => pane.close()); }
  function setView(next, options = {}) {
    if (!['home','menu','favorites'].includes(next)) return;
    closeDialogs();view = next;
    if (!options.keepQuery) {query = '';$('#search').value = '';}
    category = options.category || 'Todos';
    $$('[data-home-only]').forEach(section => {section.hidden = next !== 'home';});
    renderProducts();
    if (options.scroll !== false) window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
  }
  function openPane(pane, trigger) {
    closeDialogs();returnFocus.set(pane, trigger || document.activeElement);
    pane.showModal();
  }
  $$('dialog').forEach(pane => {
    pane.addEventListener('click',event => {
      if (event.target !== pane) return;
      const rect = pane.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) pane.close();
    });
    pane.addEventListener('close',() => {
      const target = returnFocus.get(pane);
      if (!$('dialog[open]') && target?.isConnected && !target.hidden) target.focus({preventScroll:true});
    });
  });
  $$('[data-close-dialog]').forEach(button => button.addEventListener('click',() => button.closest('dialog').close()));
  $('#open-navigation').addEventListener('click',event => openPane($('#navigation-dialog'),event.currentTarget));
  $$('[data-open-shop]').forEach(button => button.addEventListener('click',() => openPane($('#shop-dialog'),button)));
  $$('[data-view]').forEach(button => button.addEventListener('click',() => setView(button.dataset.view)));
  $$('.category').forEach(button => button.addEventListener('click',() => {
    const next = button.dataset.category;
    setView(next === 'Favoritos' ? 'favorites' : 'menu',{category:next === 'Favoritos' ? 'Todos' : next,keepQuery:true,scroll:false});
  }));
  $('#search').addEventListener('input',event => {
    query = event.target.value;
    if (view === 'home' && query) setView('menu',{keepQuery:true,category,scroll:false});
    else renderProducts();
  });
  $('#see-all').addEventListener('click',() => setView('menu',{scroll:false}));
  $('#reset-search').addEventListener('click',() => setView('menu',{scroll:false}));
  $('#toggle-filters').addEventListener('click',event => {
    const open = $('#filter-panel').hidden;
    $('#filter-panel').hidden = !open;
    event.currentTarget.setAttribute('aria-expanded',String(open));
    if (open && view === 'home') setView('menu',{scroll:false});
  });
  $('#sort-order').addEventListener('change',event => {sort = event.target.value;renderProducts();});
  $('#clear-filters').addEventListener('click',() => {sort = 'default';$('#sort-order').value = 'default';setView('menu',{scroll:false});});

  function customer() { return {name:form.elements.name.value.trim(),method:form.elements.method.value,address:form.elements.address.value.trim(),notes:form.elements.notes.value.trim()}; }
  function updateMessage() {
    const data = customer();
    const delivery = data.method === 'delivery';
    $('#address-group').hidden = !delivery;$('#customer-address').required = delivery;
    $('#order-preview').value = core.orderMessage(store,cart,data);
  }
  function renderCount() {
    const {count} = core.totals(cart,store.products);
    $$('[data-cart-count]').forEach(element => {element.textContent = count;element.hidden = count === 0;});
  }
  function renderCart() {
    const empty = cart.length === 0;
    $('#cart-empty').hidden = !empty;$('#cart-filled').hidden = empty;
    $('#cart-items').innerHTML = cart.map(item => {
      const product = store.products.find(product => product.id === item.id);
      return `<article class="cart-item"><img src="${escape(product.image)}" alt="${escape(product.name)}" width="69" height="76"><div class="cart-item-info"><h3>${escape(product.name)}</h3><span class="cart-item-price">${productPrice(product,item.quantity)}</span><div class="quantity"><button type="button" data-delta="-1" data-id="${escape(item.id)}" aria-label="Diminuir quantidade de ${escape(product.name)}">${icon('minus')}</button><span aria-label="Quantidade">${item.quantity}</span><button type="button" data-delta="1" data-id="${escape(item.id)}" aria-label="Aumentar quantidade de ${escape(product.name)}" ${item.quantity >= core.MAX_QUANTITY ? 'disabled' : ''}>${icon('plus')}</button></div></div><button class="remove-item" type="button" data-remove="${escape(item.id)}" aria-label="Remover ${escape(product.name)}">${icon('close')}</button><details class="item-note" ${item.note ? 'open' : ''}><summary>Observação deste item</summary><label class="sr-only" for="note-${escape(item.id)}">Observação para ${escape(product.name)}</label><textarea id="note-${escape(item.id)}" data-note="${escape(item.id)}" maxlength="240" rows="2" placeholder="Ex.: sem algum ingrediente">${escape(item.note)}</textarea></details></article>`;
    }).join('');
    const total = core.totals(cart,store.products);
    $('#cart-item-total').textContent = total.count;$('#cart-subtotal').textContent = total.pendingPrice ? 'Sob consulta' : core.money(total.knownCents);
    sendButton.disabled = empty || !connected;updateMessage();renderCount();
  }
  function modifyCart(id,delta) {
    const focusKey = document.activeElement?.getAttribute('data-id');
    const focusDelta = document.activeElement?.getAttribute('data-delta');
    cart = core.changeQuantity(cart,store.products,id,delta);
    persistCart();renderProducts();renderCart();
    if (focusKey && dialog.open) {
      const target = $$('[data-delta]').find(button => button.dataset.id === focusKey && button.dataset.delta === focusDelta && !button.disabled);
      (target || $('#close-cart')).focus();
    }
  }
  $('#product-grid').addEventListener('click',event => {
    const favoriteButton = event.target.closest('[data-favorite]');
    if (favoriteButton) {
      const id = favoriteButton.dataset.favorite;
      if (!validIds.has(id)) return;
      if (favorites.has(id)) favorites.delete(id);else favorites.add(id);
      saveLocal(favoritesKey,Array.from(favorites));renderProducts();
      const target = $$('[data-favorite]').find(button => button.dataset.favorite === id);
      (target || $('.bottom-nav [data-view="favorites"]')).focus({preventScroll:true});
      return;
    }
    const button = event.target.closest('[data-add]');
    if (!button || button.disabled || !validIds.has(button.dataset.add)) return;
    const id = button.dataset.add;
    modifyCart(id,1);
    const target = $$('[data-add]').find(button => button.dataset.add === id && !button.disabled);
    if (target) target.focus({preventScroll:true});
    notify(`${store.products.find(product => product.id === id).name} adicionado ao pedido.`);
  });
  $$('[data-open-cart]').forEach(button => button.addEventListener('click',() => {renderCart();openPane(dialog,button);}));
  $('#close-cart').addEventListener('click',() => dialog.close());
  $('#continue-shopping').addEventListener('click',() => setView('menu'));
  $('#cart-items').addEventListener('click',event => {
    const deltaButton = event.target.closest('[data-delta]');
    if (deltaButton && !deltaButton.disabled) {modifyCart(deltaButton.dataset.id,Number(deltaButton.dataset.delta));return;}
    const removeButton = event.target.closest('[data-remove]');
    if (removeButton) {cart = cart.filter(item => item.id !== removeButton.dataset.remove);persistCart();renderProducts();renderCart();(cart.length ? $('#close-cart') : $('#continue-shopping')).focus();}
  });
  $('#cart-items').addEventListener('input',event => {
    const note = event.target.closest('[data-note]');
    if (!note) return;
    cart = cart.map(item => item.id === note.dataset.note ? {...item,note:note.value.slice(0,240)} : item);
    persistCart();updateMessage();
  });
  form.addEventListener('input',updateMessage);form.addEventListener('change',updateMessage);
  form.addEventListener('submit',event => {
    event.preventDefault();
    if (!cart.length) {notify('Adicione um item antes de continuar.');return;}
    if (!connected) {notify('O WhatsApp e o cardápio da loja ainda precisam ser confirmados.');return;}
    if (!form.reportValidity()) return;
    const url = core.whatsappUrl(store,core.orderMessage(store,cart,customer()));
    if (!url) {notify('O número de WhatsApp da loja precisa ser verificado.');return;}
    window.open(url,'_blank','noopener,noreferrer');notify('Continue no WhatsApp para confirmar o envio.');
  });
  $('#copy-order').addEventListener('click',async () => {
    updateMessage();const preview = $('#order-preview');
    if (!preview.value) return;
    try {await navigator.clipboard.writeText(preview.value);notify('Resumo copiado. Confira os itens antes de enviar.');}
    catch {preview.focus();preview.select();notify('Resumo selecionado. Use a opção Copiar do seu celular.');}
  });
  const banners = [
    {eyebrow:'MONTE SEU PEDIDO',lines:['ESCOLHA.','COMBINE.','APROVEITE.'],copy:'Seu próximo pedido<br>começa por aqui.',image:'assets/cutout-combo-v2.webp',alt:'Hambúrguer com batatas e bebida — imagem ilustrativa',category:'Todos'},
    {eyebrow:'ENCONTRE SEU FAVORITO',lines:['BATEU','AQUELA','FOME?'],copy:'Explore os lanches<br>do nosso catálogo.',image:'assets/cutout-double-v2.webp',alt:'Hambúrguer duplo — imagem ilustrativa',category:'Lanches'},
    {eyebrow:'PARA ACOMPANHAR',lines:['MAIS UM','SABOR.','NO PEDIDO.'],copy:'Monte seu pedido<br>com acompanhamentos.',image:'assets/cutout-fries-v2.webp',alt:'Porção de fritas — imagem ilustrativa',category:'Porções'},
    {eyebrow:'SEU PEDIDO COMPLETO',lines:['LANCHE.','BEBIDA.','SEU COMBO.'],copy:'Junte seus favoritos<br>em um só carrinho.',image:'assets/cutout-combo-v2.webp',alt:'Combo de lanche, fritas e bebida — imagem ilustrativa',category:'Combos'}
  ];
  function renderBanner(index) {
    slide = (index + banners.length) % banners.length;
    const banner = banners[slide];
    $('#hero-eyebrow').textContent = banner.eyebrow;$('#hero-title').innerHTML = banner.lines.map(escape).join('<br>');$('#hero-copy').innerHTML = banner.copy;
    $('#hero-food').src = banner.image;$('#hero-food').alt = banner.alt;
    $$('[data-slide]').forEach(button => {const active = Number(button.dataset.slide) === slide;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
  }
  $$('[data-slide]').forEach(button => button.addEventListener('click',() => renderBanner(Number(button.dataset.slide))));
  $('#hero-action').addEventListener('click',() => setView('menu',{category:banners[slide].category,scroll:false}));
  $('#combo-action').addEventListener('click',() => setView('menu',{category:'Todos'}));
  $('#hero-banner').addEventListener('pointerdown',event => {touchStartX = event.target.closest('button') ? null : event.clientX;});
  $('#hero-banner').addEventListener('pointerup',event => {if (touchStartX !== null && Math.abs(event.clientX-touchStartX)>45) renderBanner(slide+(event.clientX<touchStartX ? 1 : -1));touchStartX = null;});
  $('#hero-banner').addEventListener('pointercancel',() => {touchStartX = null;});
  $('.skip-link').addEventListener('click',() => setView('menu',{scroll:false}));
  if (store.menuVerified) {$('#preview-notice').hidden = true;$('#demo-note').hidden = true;}
  if (connected) {
    sendButton.querySelector('span').textContent = 'Enviar pedido pelo WhatsApp';
    $('#checkout-notice').querySelector('p').textContent = 'O WhatsApp abrirá com seu pedido preenchido. Confirme disponibilidade, frete e pagamento com a loja antes de concluir.';
  }
  renderProducts();renderCart();
})();
