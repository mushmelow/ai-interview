"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const { query } = require('../connection');
class User {
    constructor(data) {
        this.id = data.id;
        this.email = data.email;
        this.passwordHash = data.password_hash;
        this.role = data.role || 'candidate';
        this.firstName = data.first_name;
        this.lastName = data.last_name;
        this.createdAt = data.created_at;
        this.updatedAt = data.updated_at;
        this.isActive = data.is_active;
    }
    static async create(userData) {
        const { email, passwordHash, role = 'candidate', firstName, lastName } = userData;
        const queryText = `
            INSERT INTO users (email, password_hash, role, first_name, last_name, created_at, updated_at, is_active)
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), true)
            RETURNING *
        `;
        const values = [email, passwordHash, role, firstName, lastName];
        try {
            const result = await query(queryText, values);
            return new User(result.rows[0]);
        }
        catch (error) {
            throw new Error(`Failed to create user: ${error.message}`);
        }
    }
    static async findById(id) {
        const queryText = 'SELECT * FROM users WHERE id = $1 AND is_active = true';
        try {
            const result = await query(queryText, [id]);
            return result.rows.length > 0 ? new User(result.rows[0]) : null;
        }
        catch (error) {
            throw new Error(`Failed to find user by ID: ${error.message}`);
        }
    }
    static async findByEmail(email) {
        const queryText = 'SELECT * FROM users WHERE email = $1 AND is_active = true';
        try {
            const result = await query(queryText, [email]);
            return result.rows.length > 0 ? new User(result.rows[0]) : null;
        }
        catch (error) {
            throw new Error(`Failed to find user by email: ${error.message}`);
        }
    }
    static async update(userId, updateData) {
        const allowedFields = ['email', 'first_name', 'last_name', 'role', 'password_hash'];
        const updates = [];
        const values = [];
        let paramCount = 1;
        for (const [key, value] of Object.entries(updateData)) {
            if (allowedFields.includes(key) && value !== undefined) {
                updates.push(`${key} = $${paramCount}`);
                values.push(value);
                paramCount++;
            }
        }
        if (updates.length === 0) {
            throw new Error('No valid fields to update');
        }
        updates.push(`updated_at = NOW()`);
        values.push(userId);
        const queryText = `
            UPDATE users 
            SET ${updates.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
        `;
        try {
            const result = await query(queryText, values);
            if (result.rows.length > 0) {
                return new User(result.rows[0]);
            }
            throw new Error('User not found');
        }
        catch (error) {
            throw new Error(`Failed to update user: ${error.message}`);
        }
    }
    async delete() {
        const queryText = 'UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1';
        try {
            await query(queryText, [this.id]);
            this.isActive = false;
            return true;
        }
        catch (error) {
            throw new Error(`Failed to delete user: ${error.message}`);
        }
    }
    static async findAll(limit = 50, offset = 0) {
        const queryText = `
            SELECT * FROM users 
            WHERE is_active = true 
            ORDER BY created_at DESC 
            LIMIT $1 OFFSET $2
        `;
        try {
            const result = await query(queryText, [limit, offset]);
            return result.rows.map((row) => new User(row));
        }
        catch (error) {
            throw new Error(`Failed to fetch users: ${error.message}`);
        }
    }
}
exports.User = User;
exports.default = User;
//# sourceMappingURL=User.js.map