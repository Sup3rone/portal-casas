// Catálogo aislado: sin BD, navegador, red ni dependencias nuevas.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const req = createRequire(path.resolve(__dirname, '../apps/web/package.json'));
const ts = req('typescript');
const source = fs.readFileSync(path.resolve(__dirname, '../apps/web/src/lib/destinations.ts'), 'utf8');
const output = { exports: {} };
new Function('exports', ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(output.exports);
const { DESTINATIONS_BY_STATE, DESTINATION_STATES, citiesByState, normalizeDestination } = output.exports;

// 44 pares de la lista SECTUR, con las erratas documentadas corregidas.
const expected = [
  ['Aguascalientes', 'Aguascalientes'], ['Ensenada', 'Baja California'], ['Tijuana', 'Baja California'],
  ['Los Cabos', 'Baja California Sur'], ['Campeche', 'Campeche'], ['Tuxtla Gutiérrez', 'Chiapas'],
  ['Ciudad Juárez', 'Chihuahua'], ['Torreón', 'Coahuila'], ['Manzanillo', 'Colima'],
  ['Ciudad de México', 'Distrito Federal'], ['Durango', 'Durango'], ['Guanajuato', 'Guanajuato'],
  ['León', 'Guanajuato'], ['San Miguel de Allende', 'Guanajuato'], ['Acapulco', 'Guerrero'],
  ['Ixtapa, Zihuatanejo', 'Guerrero'], ['Pachuca', 'Hidalgo'], ['Guadalajara', 'Jalisco'],
  ['Puerto Vallarta', 'Jalisco'], ['San Juan de los Lagos', 'Jalisco'], ['Chalma', 'México'],
  ['Ixtapan de la Sal', 'México'], ['Morelia', 'Michoacán'], ['Cuernavaca', 'Morelos'],
  ['Nuevo Vallarta', 'Nayarit'], ['Monterrey', 'Nuevo León'], ['Huatulco', 'Oaxaca'],
  ['Oaxaca', 'Oaxaca'], ['Puebla', 'Puebla'], ['Querétaro', 'Querétaro'], ['Cancún', 'Quintana Roo'],
  ['Cozumel', 'Quintana Roo'], ['Riviera Maya', 'Quintana Roo'], ['San Luis Potosí', 'San Luis Potosí'],
  ['Mazatlán', 'Sinaloa'], ['Hermosillo', 'Sonora'], ['Villahermosa', 'Tabasco'],
  ['Tampico, Madero', 'Tamaulipas'], ['Tlaxcala', 'Tlaxcala'], ['Tlacotalpan', 'Veracruz'],
  ['Veracruz, Boca del Río', 'Veracruz'], ['Xalapa', 'Veracruz'], ['Mérida', 'Yucatán'], ['Zacatecas', 'Zacatecas'],
];
const actual = DESTINATION_STATES.flatMap(state => citiesByState(state).map(city => [city, state]));
assert.equal(actual.length, 44);
assert.equal(DESTINATION_STATES.length, 32);
assert.deepEqual(actual, expected, 'Cada destino conserva su entidad y orden SECTUR');
assert.deepEqual(DESTINATION_STATES, Object.keys(DESTINATIONS_BY_STATE));
const keys = actual.map(([city, state]) => JSON.stringify([normalizeDestination(state), normalizeDestination(city)]));
assert.equal(new Set(keys).size, 44, 'Sin pares duplicados');
for (const [city, state] of actual) {
  assert.equal(city, city.trim()); assert.equal(state, state.trim());
  assert.ok(city.length && state.length);
}
assert.deepEqual(citiesByState('Nayarit'), ['Nuevo Vallarta']);
assert.deepEqual(citiesByState('Quintana Roo'), ['Cancún', 'Cozumel', 'Riviera Maya']);
assert.equal(normalizeDestination('  NUEVO VALLARTA  '), normalizeDestination('Nuevo Vallarta'));
assert.equal(normalizeDestination(' ME\u0301RIDA '), normalizeDestination('Mérida'));
assert.notEqual(normalizeDestination('México'), normalizeDestination('Mexico'), 'No elimina tildes');
assert.equal(normalizeDestination('  '), '');
assert.equal(normalizeDestination('Tampico, Madero'), 'tampico, madero');
if (process.argv.includes('--print')) actual.forEach(([city, state], index) => console.log(`${index + 1}. ${city} | ${state}`));
console.log('OK catálogo SECTUR: 44 destinos, 32 entidades, pares correctos, sin duplicados, helpers y normalización.');
