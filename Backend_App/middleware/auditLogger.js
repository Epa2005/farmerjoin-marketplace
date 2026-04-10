const fs = require('fs');
const path = require('path');

// Ensure audit logs directory exists
const auditDir = path.join(__dirname, '../logs');
if (!fs.existsSync(auditDir)) {
    fs.mkdirSync(auditDir, { recursive: true });
}

// Security audit logger
const auditLogger = (action, details = {}) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        action,
        ...details
    };
    
    const logFile = path.join(auditDir, `audit-${new Date().toISOString().split('T')[0]}.log`);
    const logLine = JSON.stringify(logEntry) + '\n';
    
    fs.appendFile(logFile, logLine, (err) => {
        if (err) {
            console.error('Failed to write audit log:', err);
        }
    });
    
    // Also log to console for development
    if (process.env.NODE_ENV !== 'production') {
        console.log(`[AUDIT] ${action}:`, details);
    }
};

// Authentication events
const logAuthEvent = (event, email, ip, success = true, reason = '') => {
    auditLogger('AUTHENTICATION', {
        event,
        email,
        ip,
        success,
        reason,
        timestamp: new Date().toISOString()
    });
};

// Data access events
const logDataAccess = (resource, userId, action, details = {}) => {
    auditLogger('DATA_ACCESS', {
        resource,
        userId,
        action,
        details,
        timestamp: new Date().toISOString()
    });
};

// Security violations
const logSecurityViolation = (type, details, ip) => {
    auditLogger('SECURITY_VIOLATION', {
        violationType: type,
        details,
        ip,
        timestamp: new Date().toISOString()
    });
};

// Data modification events
const logDataModification = (resource, userId, action, recordId, changes = {}) => {
    auditLogger('DATA_MODIFICATION', {
        resource,
        userId,
        action,
        recordId,
        changes,
        timestamp: new Date().toISOString()
    });
};

// Middleware to automatically log requests
const requestLogger = (req, res, next) => {
    const startTime = Date.now();
    
    // Log request start
    const requestId = Math.random().toString(36).substr(2, 9);
    req.requestId = requestId;
    
    auditLogger('REQUEST_START', {
        requestId,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
    });
    
    // Log response
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        
        auditLogger('REQUEST_END', {
            requestId,
            statusCode: res.statusCode,
            duration,
            timestamp: new Date().toISOString()
        });
        
        // Log security-relevant events
        if (res.statusCode >= 400) {
            logSecurityViolation('HTTP_ERROR', {
                statusCode: res.statusCode,
                method: req.method,
                url: req.originalUrl
            }, req.ip || req.connection.remoteAddress);
        }
    });
    
    next();
};

// Clean old log files (keep last 30 days)
const cleanOldLogs = () => {
    const files = fs.readdirSync(auditDir);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    files.forEach(file => {
        if (file.startsWith('audit-') && file.endsWith('.log')) {
            const filePath = path.join(auditDir, file);
            const fileDate = new Date(file.substring(6, file.length - 4));
            
            if (fileDate < thirtyDaysAgo) {
                fs.unlink(filePath, (err) => {
                    if (err) {
                        console.error('Failed to delete old log file:', err);
                    } else {
                        console.log('Deleted old audit log:', file);
                    }
                });
            }
        }
    });
};

// Clean logs daily
setInterval(cleanOldLogs, 24 * 60 * 60 * 1000);

module.exports = {
    auditLogger,
    logAuthEvent,
    logDataAccess,
    logSecurityViolation,
    logDataModification,
    requestLogger,
    cleanOldLogs
};
