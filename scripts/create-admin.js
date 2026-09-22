// scripts/create-admin.js
const bcrypt = require('bcryptjs');

async function main() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    console.error('❌ FALLO: DATABASE_URL no está definida');
    console.error('   Verifica: node --env-file=.env scripts/create-admin.js');
    process.exit(1);
  }

  console.log('🔗 Conectando a Neon...');

  const { neon } = require('@neondatabase/serverless');
  const sql = neon(url);

  const email = 'admin@portalcasas.com';
  const password = 'Admin123!';
  const hashedPassword = await bcrypt.hash(password, 10);

  console.log('👤 Creando usuario ADMIN...');

  const query = `
    INSERT INTO "User" ("email", "name", "passwordHash", "role", "createdAt")
    VALUES ($1, $2, $3, 'ADMIN', NOW())
    ON CONFLICT ("email") DO UPDATE SET "role" = 'ADMIN'
    RETURNING "id";
  `;

  const result = await sql(query, [email, 'Administrador', hashedPassword]);

  console.log('✅ ¡Usuario ADMIN creado con éxito!');
  console.log(`📧 Email: ${email}`);
  console.log(`🔑 Contraseña temporal: ${password}`);
  console.log(`🆔 ID: ${result[0]?.id}`);
  console.log('\n🚀 Ahora puedes probar login en /es/admin/login');
}

main().catch(console.error);
