const { pool } = require('../connection');

class Interview {
    constructor(data) {
        this.id = data.id;
        this.userId = data.user_id;
        this.status = data.status;
        this.config = data.config;
        this.results = data.results;
        this.startedAt = data.started_at;
        this.completedAt = data.completed_at;
        this.createdAt = data.created_at;
        this.updatedAt = data.updated_at;
    }

    // Create a new interview
    static async create(interviewData) {
        const { userId, config = {} } = interviewData;
        const query = `
      INSERT INTO interviews (user_id, status, config, results, created_at, updated_at)
      VALUES ($1, 'pending', $2, $3, NOW(), NOW())
      RETURNING *
    `;
        const values = [userId, JSON.stringify(config), JSON.stringify({})];

        try {
            const result = await pool.query(query, values);
            const interview = new Interview(result.rows[0]);
            interview.config = JSON.parse(interview.config);
            interview.results = JSON.parse(interview.results);
            return interview;
        } catch (error) {
            throw new Error(`Failed to create interview: ${error.message}`);
        }
    }

    // Find interview by ID
    static async findById(id) {
        const query = 'SELECT * FROM interviews WHERE id = $1';
        try {
            const result = await pool.query(query, [id]);
            if (result.rows.length > 0) {
                const interview = new Interview(result.rows[0]);
                interview.config = JSON.parse(interview.config);
                interview.results = JSON.parse(interview.results);
                return interview;
            }
            return null;
        } catch (error) {
            throw new Error(`Failed to find interview by ID: ${error.message}`);
        }
    }

    // Find interviews by user ID
    static async findByUserId(userId, limit = 50, offset = 0) {
        const query = `
      SELECT * FROM interviews 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;
        try {
            const result = await pool.query(query, [userId, limit, offset]);
            return result.rows.map(row => {
                const interview = new Interview(row);
                interview.config = JSON.parse(interview.config);
                interview.results = JSON.parse(interview.results);
                return interview;
            });
        } catch (error) {
            throw new Error(`Failed to find interviews by user ID: ${error.message}`);
        }
    }

    // Update interview status
    async updateStatus(newStatus) {
        const query = `
      UPDATE interviews 
      SET status = $1, updated_at = NOW()
      ${newStatus === 'started' ? ', started_at = NOW()' : ''}
      ${newStatus === 'completed' ? ', completed_at = NOW()' : ''}
      WHERE id = $2
      RETURNING *
    `;

        try {
            const result = await pool.query(query, [newStatus, this.id]);
            if (result.rows.length > 0) {
                Object.assign(this, new Interview(result.rows[0]));
                this.config = JSON.parse(this.config);
                this.results = JSON.parse(this.results);
                return this;
            }
            throw new Error('Interview not found');
        } catch (error) {
            throw new Error(`Failed to update interview status: ${error.message}`);
        }
    }

    // Update interview results
    async updateResults(newResults) {
        const query = `
      UPDATE interviews 
      SET results = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

        try {
            const result = await pool.query(query, [JSON.stringify(newResults), this.id]);
            if (result.rows.length > 0) {
                Object.assign(this, new Interview(result.rows[0]));
                this.config = JSON.parse(this.config);
                this.results = JSON.parse(this.results);
                return this;
            }
            throw new Error('Interview not found');
        } catch (error) {
            throw new Error(`Failed to update interview results: ${error.message}`);
        }
    }

    // Get all interviews (for admin)
    static async findAll(limit = 50, offset = 0) {
        const query = `
      SELECT * FROM interviews 
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `;
        try {
            const result = await pool.query(query, [limit, offset]);
            return result.rows.map(row => {
                const interview = new Interview(row);
                interview.config = JSON.parse(interview.config);
                interview.results = JSON.parse(interview.results);
                return interview;
            });
        } catch (error) {
            throw new Error(`Failed to fetch interviews: ${error.message}`);
        }
    }

    // Get interview statistics
    static async getStatistics() {
        const query = `
      SELECT 
        status,
        COUNT(*) as count,
        AVG(EXTRACT(EPOCH FROM (completed_at - started_at))/60) as avg_duration_minutes
      FROM interviews 
      WHERE status IN ('completed', 'cancelled')
      GROUP BY status
    `;

        try {
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            throw new Error(`Failed to get interview statistics: ${error.message}`);
        }
    }

    // Delete interview
    async delete() {
        const query = 'DELETE FROM interviews WHERE id = $1';
        try {
            const result = await pool.query(query, [this.id]);
            return result.rowCount > 0;
        } catch (error) {
            throw new Error(`Failed to delete interview: ${error.message}`);
        }
    }
}

module.exports = Interview;






