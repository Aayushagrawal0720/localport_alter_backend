const { Pool } = require('pg');

var pool = new Pool({
    user: 'postgres',
    host: '172.26.1.5',
    database: 'localport_alter',
    password: 'admin',
    port: 5432,
});

module.exports = pool;
