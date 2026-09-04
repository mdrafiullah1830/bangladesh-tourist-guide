const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/lib/data/bangladesh.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const context = { exports: {} };
vm.runInNewContext(compiled, context);
const data = context.exports.bangladeshDestinations.map(place => ({
  slug: place.slug, name: place.name, category: place.category,
  latitude: place.latitude, longitude: place.longitude,
  tags: place.tags.join(' '), description: place.shortDesc,
  daily_cost: place.estimatedCost, provenance: 'existing repository; costs unverified estimates'
}));
fs.mkdirSync(path.join(root, 'data'), { recursive: true });
fs.writeFileSync(path.join(root, 'data/places.json'), JSON.stringify(data, null, 2) + '\n');
console.log(`Exported ${data.length} existing destinations`);
