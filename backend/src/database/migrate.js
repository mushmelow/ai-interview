const fs = require('fs');
const path = require('path');
const { pool, testConnection } = require('./connection');

class DatabaseMigrator {
    constructor() {
        this.migrationsPath = path.join(__dirname, 'migrations');
    }

    async runMigrations() {
        try {
            console.log('🔄 Starting database migrations...');

            // Test database connection first
            const connected = await testConnection();
            if (!connected) {
                throw new Error('Database connection failed');
            }

            // Create migrations table if it doesn't exist
            await this.createMigrationsTable();

            // Get list of migration files
            const migrationFiles = this.getMigrationFiles();
            const appliedMigrations = await this.getAppliedMigrations();

            // Run pending migrations
            for (const file of migrationFiles) {
                if (!appliedMigrations.includes(file)) {
                    await this.runMigration(file);
                }
            }

            console.log('✅ Database migrations completed successfully');
        } catch (error) {
            console.error('❌ Migration failed:', error.message);
            throw error;
        }
    }

    async createMigrationsTable() {
        const query = `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
        await pool.query(query);
    }

    getMigrationFiles() {
        if (!fs.existsSync(this.migrationsPath)) {
            return [];
        }

        return fs.readdirSync(this.migrationsPath)
            .filter(file => file.endsWith('.sql'))
            .sort();
    }

    async getAppliedMigrations() {
        const query = 'SELECT filename FROM migrations ORDER BY applied_at';
        const result = await pool.query(query);
        return result.rows.map(row => row.filename);
    }

    async runMigration(filename) {
        const filePath = path.join(this.migrationsPath, filename);
        const sql = fs.readFileSync(filePath, 'utf8');

        console.log(`📝 Running migration: ${filename}`);

        try {
            // Start transaction
            await pool.query('BEGIN');

            // Execute migration SQL
            await pool.query(sql);

            // Record migration as applied
            await pool.query(
                'INSERT INTO migrations (filename) VALUES ($1)',
                [filename]
            );

            // Commit transaction
            await pool.query('COMMIT');

            console.log(`✅ Migration ${filename} applied successfully`);
        } catch (error) {
            // Rollback transaction on error
            await pool.query('ROLLBACK');
            throw new Error(`Migration ${filename} failed: ${error.message}`);
        }
    }

    async rollbackMigration(filename) {
        console.log(`🔄 Rolling back migration: ${filename}`);

        try {
            await pool.query('BEGIN');

            // Remove migration record
            await pool.query('DELETE FROM migrations WHERE filename = $1', [filename]);

            await pool.query('COMMIT');
            console.log(`✅ Migration ${filename} rolled back successfully`);
        } catch (error) {
            await pool.query('ROLLBACK');
            throw new Error(`Rollback of ${filename} failed: ${error.message}`);
        }
    }

    async getMigrationStatus() {
        const appliedMigrations = await this.getAppliedMigrations();
        const allMigrations = this.getMigrationFiles();

        console.log('\n📊 Migration Status:');
        console.log('==================');

        for (const migration of allMigrations) {
            const status = appliedMigrations.includes(migration) ? '✅ Applied' : '⏳ Pending';
            console.log(`${status} - ${migration}`);
        }

        console.log(`\nTotal: ${appliedMigrations.length}/${allMigrations.length} migrations applied`);
    }
}

// CLI interface
if (require.main === module) {
    const migrator = new DatabaseMigrator();
    const command = process.argv[2];

    switch (command) {
        case 'migrate':
            migrator.runMigrations()
                .then(() => process.exit(0))
                .catch(() => process.exit(1));
            break;

        case 'status':
            migrator.getMigrationStatus()
                .then(() => process.exit(0))
                .catch(() => process.exit(1));
            break;

        case 'rollback':
            const filename = process.argv[3];
            if (!filename) {
                console.error('❌ Please specify migration filename to rollback');
                process.exit(1);
            }
            migrator.rollbackMigration(filename)
                .then(() => process.exit(0))
                .catch(() => process.exit(1));
            break;

        default:
            console.log('Usage: node migrate.js [migrate|status|rollback] [filename]');
            process.exit(1);
    }
}

module.exports = DatabaseMigrator;






