const { pool } = require('../connection');

class Consent {
    constructor(data) {
        this.id = data.id;
        this.userId = data.user_id;
        this.ipAddress = data.ip_address;
        this.consents = data.consents;
        this.version = data.version;
        this.timestamp = data.timestamp;
        this.createdAt = data.created_at;
    }

    // Create a new consent record
    static async create(consentData) {
        const { userId, ipAddress, consents, version = '1.0' } = consentData;
        const query = `
      INSERT INTO consents (user_id, ip_address, consents, version, timestamp, created_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *
    `;
        const values = [userId, ipAddress, JSON.stringify(consents), version];

        try {
            const result = await pool.query(query, values);
            const consent = new Consent(result.rows[0]);
            consent.consents = JSON.parse(consent.consents);
            return consent;
        } catch (error) {
            throw new Error(`Failed to create consent: ${error.message}`);
        }
    }

    // Find latest consent by user ID
    static async findByUserId(userId) {
        const query = `
      SELECT * FROM consents 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 1
    `;
        try {
            const result = await pool.query(query, [userId]);
            if (result.rows.length > 0) {
                const consent = new Consent(result.rows[0]);
                consent.consents = JSON.parse(consent.consents);
                return consent;
            }
            return null;
        } catch (error) {
            throw new Error(`Failed to find consent by user ID: ${error.message}`);
        }
    }

    // Find all consents by user ID (audit trail)
    static async findAllByUserId(userId) {
        const query = `
      SELECT * FROM consents 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `;
        try {
            const result = await pool.query(query, [userId]);
            return result.rows.map(row => {
                const consent = new Consent(row);
                consent.consents = JSON.parse(consent.consents);
                return consent;
            });
        } catch (error) {
            throw new Error(`Failed to find consents by user ID: ${error.message}`);
        }
    }

    // Delete all consents for a user (withdraw consent)
    static async deleteByUserId(userId) {
        const query = 'DELETE FROM consents WHERE user_id = $1';
        try {
            const result = await pool.query(query, [userId]);
            return result.rowCount > 0;
        } catch (error) {
            throw new Error(`Failed to delete consents: ${error.message}`);
        }
    }

    // Get consent by ID
    static async findById(id) {
        const query = 'SELECT * FROM consents WHERE id = $1';
        try {
            const result = await pool.query(query, [id]);
            if (result.rows.length > 0) {
                const consent = new Consent(result.rows[0]);
                consent.consents = JSON.parse(consent.consents);
                return consent;
            }
            return null;
        } catch (error) {
            throw new Error(`Failed to find consent by ID: ${error.message}`);
        }
    }

    // Get all consents (for admin)
    static async findAll(limit = 50, offset = 0) {
        const query = `
      SELECT * FROM consents 
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `;
        try {
            const result = await pool.query(query, [limit, offset]);
            return result.rows.map(row => {
                const consent = new Consent(row);
                consent.consents = JSON.parse(consent.consents);
                return consent;
            });
        } catch (error) {
            throw new Error(`Failed to fetch consents: ${error.message}`);
        }
    }

    // Check if user has given all required consents
    static async hasValidConsent(userId) {
        const consent = await this.findByUserId(userId);
        if (!consent) return false;

        const requiredConsents = ['videoRecording', 'audioRecording', 'aiAnalysis', 'dataRetention', 'dataUsage'];
        return requiredConsents.every(key => consent.consents[key] === true);
    }
}

module.exports = Consent;






