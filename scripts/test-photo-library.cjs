const assert = require('node:assert/strict');
const { load, req, mockModule, memory } = require('./test-property-access.cjs');
const React = req('react');
let hooks = [], index = 0, confirms = 0, allowed = false;
const calls = [];
mockModule('react', { ...React, useState(value) { const slot = index++; if (!(slot in hooks)) hooks[slot] = value; return [hooks[slot], next => { hooks[slot] = typeof next === 'function' ? next(hooks[slot]) : next; }]; }, useRef: value => ({ current: value }), useEffect() {} });
mockModule('next-intl', { useTranslations: () => key => key });
mockModule('./request', { panelRequest: async (...args) => calls.push(args), inputClass: '', buttonClass: '' });
const Editor = load('apps/web/src/components/panel/ResourceEditor.tsx').default;
const photo = { id: 'photo', url: 'https://example.com/photo.jpg', type: 'PHOTO', category: 'habitaciones', order: 7 };
function nodes(node) { if (!node || typeof node !== 'object') return []; return [node, ...[node.props?.children].flat(Infinity).flatMap(nodes)]; }
function render(resource = 'media') { index = 0; return nodes(Editor({ propertyId: 'pa', resource, items: resource === 'media' ? [photo] : [] })); }
async function main() {
  for (const locale of ['es', 'en', 'fr']) {
    const messages = require('../apps/web/messages/' + locale + '.json');
    assert.ok(messages.panel.addPhotoUrl);
    assert.ok(messages.panel.edit && messages.panel.remove && messages.panel.habitaciones);
  }
  let tree = render();
  const image = tree.find(node => node.props?.src === photo.url);
  assert.equal(image.props.loading, 'lazy'); assert.equal(image.props.alt, 'habitaciones · 1');
  assert.ok(!tree.some(node => node.props?.children === photo.url));
  assert.equal(tree.find(node => node.type === 'details').props.open, undefined);
  assert.ok(tree.some(node => node.type === 'form' && node.props.ref));
  tree.find(node => node.props?.title === 'edit').props.onClick();
  tree = render(); assert.equal(tree.find(node => node.type === 'details').props.open, true);
  assert.equal(tree.find(node => node.type === 'input' && node.props.name === 'order').props.defaultValue, 7);
  assert.equal(tree.find(node => node.type === 'input' && node.props.name === 'url').props.defaultValue, photo.url);
  const nativeWindow = global.window, NativeFormData = global.FormData;
  global.window = { confirm() { confirms++; return allowed; } };
  try {
    await tree.find(node => node.props?.title === 'remove').props.onClick();
    assert.equal(calls.length, 0); allowed = true;
    await tree.find(node => node.props?.title === 'remove').props.onClick();
    assert.deepEqual(calls[0], ['/api/properties/pa/media/photo', 'DELETE']); assert.equal(confirms, 2);
    tree = render(); tree.find(node => node.props?.title === 'edit').props.onClick(); tree = render();
    global.FormData = class { get(key) { return { url: photo.url, category: 'habitaciones', order: '9' }[key]; } };
    await tree.find(node => node.type === 'form').props.onSubmit({ preventDefault() {}, currentTarget: { reset() {} } });
    assert.deepEqual(calls[1], ['/api/properties/pa/media/photo', 'PATCH', { url: photo.url, category: 'habitaciones', order: 9 }]);
  } finally { global.window = nativeWindow; global.FormData = NativeFormData; }
  hooks = []; tree = render('rates'); assert.ok(!tree.some(node => node.type === 'details')); assert.ok(tree.some(node => node.type === 'form'));
  console.log('OK biblioteca: miniaturas lazy, URL oculta, alta plegada, editar conserva URL/categoría/orden, confirmación y DELETE/PATCH existentes; tarifas sin plegar.');
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => memory.close());
