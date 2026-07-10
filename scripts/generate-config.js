const fs = require('fs');
const path = require('path');

const config = {
  SUPABASE_URL: process.env.BIANTI_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.BIANTI_SUPABASE_ANON_KEY || '',
  WHATSAPP: process.env.BIANTI_WHATSAPP || ''
};

if (/service_role/i.test(config.SUPABASE_ANON_KEY)) {
  throw new Error('BIANTI_SUPABASE_ANON_KEY no puede ser service_role. Usar anon/publishable key.');
}

const outDir = path.join(process.cwd(), 'assets', 'js');
const outFile = path.join(outDir, 'config.js');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, `window.BIANTI_CONFIG = ${JSON.stringify(config, null, 2)};\n`);

const missing = Object.entries(config).filter(([, value]) => !value).map(([key]) => key);
if (missing.length) {
  console.warn(`BIANTI config generada con valores faltantes: ${missing.join(', ')}`);
} else {
  console.log('BIANTI config generada correctamente.');
}
