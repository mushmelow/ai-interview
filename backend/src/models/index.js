// User Model
class User {
    constructor(data) {
        this.id = data.id;
        this.email = data.email;
        this.name = data.name;
        this.role = data.role || 'candidate';
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    toJSON() {
        return {
            id: this.id,
            email: this.email,
            name: this.name,
            role: this.role,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }

    // Remove sensitive data for public responses
    toPublicJSON() {
        return {
            id: this.id,
            name: this.name,
            role: this.role,
        };
    }
}

// Consent Model
class Consent {
    constructor(data) {
        this.id = data.id;
        this.userId = data.userId;
        this.consents = data.consents;
        this.ipAddress = data.ipAddress;
        this.userAgent = data.userAgent;
        this.timestamp = data.timestamp;
        this.version = data.version || '1.0';
        this.language = data.language || 'en';
        this.withdrawn = data.withdrawn || false;
        this.withdrawnAt = data.withdrawnAt;
    }

    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            consents: this.consents,
            timestamp: this.timestamp,
            version: this.version,
            language: this.language,
            withdrawn: this.withdrawn,
            withdrawnAt: this.withdrawnAt,
        };
    }

    // For audit trail (without sensitive data)
    toAuditJSON() {
        return {
            id: this.id,
            timestamp: this.timestamp,
            version: this.version,
            withdrawn: this.withdrawn,
            withdrawnAt: this.withdrawnAt,
            ipAddress: this.ipAddress ? this.ipAddress.replace(/(\d+\.\d+\.\d+)\.\d+/, '$1.xxx') : null,
        };
    }

    // Check if consent is valid
    isValid() {
        if (this.withdrawn) return false;

        const consentDate = new Date(this.timestamp);
        const now = new Date();
        const daysDiff = (now - consentDate) / (1000 * 60 * 60 * 24);

        // Consent is valid for 1 year (365 days)
        return daysDiff < 365;
    }
}

// Interview Model
class Interview {
    constructor(data) {
        this.id = data.id;
        this.userId = data.userId;
        this.position = data.position;
        this.consentId = data.consentId;
        this.status = data.status || 'created';
        this.createdAt = data.createdAt;
        this.startedAt = data.startedAt;
        this.completedAt = data.completedAt;
        this.metadata = data.metadata || {};
        this.analysis = data.analysis || {
            transcript: null,
            sentiment: null,
            confidence: null,
            emotions: null,
            voiceAnalysis: null,
            overallScore: null,
        };
        this.deleted = data.deleted || false;
        this.deletedAt = data.deletedAt;
    }

    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            position: this.position,
            consentId: this.consentId,
            status: this.status,
            createdAt: this.createdAt,
            startedAt: this.startedAt,
            completedAt: this.completedAt,
            metadata: this.metadata,
            analysis: this.analysis,
        };
    }

    // For list views (without sensitive data)
    toListJSON() {
        return {
            id: this.id,
            position: this.position,
            status: this.status,
            createdAt: this.createdAt,
            completedAt: this.completedAt,
            overallScore: this.analysis?.overallScore,
        };
    }

    // Check if interview can be started
    canStart() {
        return this.status === 'created' && !this.deleted;
    }

    // Check if interview can be completed
    canComplete() {
        return this.status === 'in_progress' && !this.deleted;
    }
}

module.exports = {
    User,
    Consent,
    Interview,
};




