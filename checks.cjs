const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const core = require('./core.js');
const context = {window:{}};
vm.runInNewContext(fs.readFileSync('./data.js','utf8'), context);
const store = JSON.parse(JSON.stringify(context.window.STORE_DATA));
let passed = 0;
function test(name, run) { run();passed++;console.log('PASS',name); }

test('empty cart and corrupt storage do not produce an order', () => {
  assert.deepEqual(core.sanitizeCart(null, store.products), []);
  assert.deepEqual(core.sanitizeCart({quantity:2}, store.products), []);
  assert.equal(core.orderMessage(store, [], {}), '');
  assert.deepEqual(core.totals([], store.products), {count:0,knownCents:0,pendingPrice:false});
});
test('restored cart rejects removed products and non-finite quantities', () => {
  const cart = core.sanitizeCart([{id:'classico',quantity:2},{id:'missing',quantity:5},{id:'duplo',quantity:'Infinity'},{id:'combo',quantity:-1},{id:'fritas',quantity:0.4}],store.products);
  assert.deepEqual(cart,[{id:'classico',quantity:2,note:''}]);
});
test('duplicate lines merge and quantity limits survive restored state', () => {
  const cart = core.sanitizeCart([{id:'classico',quantity:80},{id:'classico',quantity:80}], store.products);
  assert.equal(cart.length,1);assert.equal(cart[0].quantity,99);
  assert.equal(core.changeQuantity(cart,store.products,'classico',1)[0].quantity,99);
});
test('quantity changes are immutable and zero removes the line', () => {
  const raw = [{id:'classico',quantity:1,note:'sem sal'}];
  const next = core.changeQuantity(raw,store.products,'classico',1);
  assert.equal(next[0].quantity,2);assert.equal(next[0].note,'sem sal');
  assert.equal(raw[0].quantity,1);
  assert.deepEqual(core.changeQuantity(raw,store.products,'classico',-1),[]);
  assert.deepEqual(core.changeQuantity([],store.products,'missing',1),[]);
});
test('an unknown price prevents a fabricated numeric subtotal', () => {
  const products = [{id:'a',name:'A',priceCents:1490},{id:'b',name:'B',priceCents:null}];
  const cart = [{id:'a',quantity:2},{id:'b',quantity:1}];
  assert.deepEqual(core.totals(cart,products),{count:3,knownCents:2980,pendingPrice:true});
  const message = core.orderMessage({...store,products},cart,{method:'pickup'});
  assert.ok(message.includes('Subtotal: sob consulta'));
  assert.ok(message.includes('valor a confirmar'));
});
test('integer cents produce accurate totals without rounding per item', () => {
  const products = [{id:'a',name:'A',priceCents:1999},{id:'b',name:'B',priceCents:0}];
  assert.deepEqual(core.totals([{id:'a',quantity:3},{id:'b',quantity:2}],products),{count:5,knownCents:5997,pendingPrice:false});
  assert.equal(core.money(5997).replace(/\s/g,' '),'R$ 59,97');
});
test('pedido preserves accents, item observations and delivery information', () => {
  const message = core.orderMessage(store,[{id:'classico',quantity:2,note:'sem cebola'}],{name:'João & Maria',method:'delivery',address:'Rua A, 10 — apto 2',notes:'Tocar a campainha'});
  for(const text of ['2x Burger clássico','sem cebola','João & Maria','Rua A, 10 — apto 2','Tocar a campainha','PRÉVIA']) assert.ok(message.includes(text));
  const pickup = core.orderMessage(store,[{id:'classico',quantity:1}],{method:'pickup',address:'old address'});
  assert.ok(!pickup.includes('old address'));
});
test('missing or invalid contact cannot send the customer to another business', () => {
  assert.equal(core.whatsappUrl(store,'pedido'),null);
  assert.equal(core.whatsappUrl({...store,menuVerified:true,whatsapp:null},'pedido'),null);
  assert.equal(core.whatsappUrl({...store,menuVerified:true,whatsapp:'javascript:123'},'pedido'),null);
  assert.equal(core.whatsappUrl({...store,menuVerified:false,whatsapp:'5531999999999'},'pedido'),null);
});
test('verified contact receives one safely encoded message', () => {
  // Synthetic test fixture only; this phone is never included in shipped store data.
  const configured = {...store,menuVerified:true,whatsapp:'+55 (31) 99999-9999'};
  const message = 'Olá! João & Maria\n2x café + água? #pedido';
  const url = new URL(core.whatsappUrl(configured,message));
  assert.equal(url.origin,'https://wa.me');assert.equal(url.pathname,'/5531999999999');
  assert.equal(url.searchParams.get('text'),message);assert.equal(Array.from(url.searchParams).length,1);
  assert.equal(core.whatsappUrl(configured,''),null);
});
test('search folds Portuguese accents', () => {
  assert.ok(core.normalizeText('Porções • Hambúrguer').includes('porcoes'));
  assert.ok(core.normalizeText('Porções • Hambúrguer').includes('hamburguer'));
});
test('private draft has explicit demo labels and valid local assets', () => {
  assert.equal(store.whatsapp,null);assert.equal(store.menuVerified,false);
  assert.ok(store.products.every(p => p.priceCents === null));
  const html=fs.readFileSync('./index.html','utf8');
  assert.ok(html.includes('noindex,nofollow'));assert.ok(html.includes('Cardápio demonstrativo'));
  for(const product of store.products) assert.ok(fs.existsSync('./'+product.image),product.image);
  for(const asset of ['styles.css','core.js','app.js','data.js','assets/logo.jpg','assets/display.ttf']) assert.ok(fs.existsSync('./'+asset),asset);
  const ids=Array.from(html.matchAll(/\bid="([^"]+)"/g),match=>match[1]);
  assert.equal(new Set(ids).size,ids.length,'duplicate HTML ids');
  const app=fs.readFileSync('./app.js','utf8');
  for(const [,id] of app.matchAll(/\$\('#([a-z0-9-]+)'\)/g)) assert.ok(ids.includes(id),'missing target: '+id);
});
console.log(`${passed} checks passed.`);
