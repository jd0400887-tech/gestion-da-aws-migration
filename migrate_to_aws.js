import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Client } = pg;

// Configuración profesional para conectar con AWS RDS
const config = {
  user: 'oranje_admin',
  password: 'OranjeApp2026!',
  host: 'oranjeapp-db-v3.clmhftlvtald.us-east-1.rds.amazonaws.com',
  database: 'oranjeapp_db',
  port: 5432,
  ssl: {
    rejectUnauthorized: false // AWS RDS usa certificados SSL propios
  }
};

async function migrate() {
  const client = new Client(config);
  
  try {
    console.info('🚀 Conectando a AWS RDS PostgreSQL...');
    await client.connect();
    console.info('✅ Conexión establecida con éxito.');

    // Leer el archivo SQL
    const sqlPath = path.resolve('setup_rds_database.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.info('📝 Ejecutando esquema maestro en la nube...');
    await client.query(sql);
    console.info('🎉 ¡Esquema ejecutado correctamente!');

    // Verificar las tablas creadas
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.info('\n📂 Tablas creadas en AWS:');
    res.rows.forEach(row => console.info(` - ${row.table_name}`));

  } catch (err) {
    console.error('❌ Error durante la migración:', err.message);
  } finally {
    await client.end();
    console.info('\n🏁 Proceso de migración finalizado.');
  }
}

migrate();
