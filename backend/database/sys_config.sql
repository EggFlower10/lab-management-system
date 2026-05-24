DROP TABLE IF EXISTS sys_config;
CREATE TABLE sys_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    configKey VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    configValue TEXT,
    `group` VARCHAR(50) DEFAULT 'system',
    description TEXT,
    sortOrder INT DEFAULT 0,
    status TINYINT(1) DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO sys_config (configKey, name, configValue, `group`, description, sortOrder) VALUES
('SystemName', 'System Name', 'Lab Management System', 'system', 'System display name', 1),
('SystemVersion', 'Version', 'v1.0', 'system', 'System version', 2),
('DefaultPageSize', 'Page Size', '10', 'system', 'Default page size', 3),
('PasswordLength', 'Min Password Length', '6', 'security', 'Minimum password length', 1),
('MaxPasswordLength', 'Max Password Length', '20', 'security', 'Maximum password length', 2),
('LoginFailureCount', 'Max Login Failures', '5', 'security', 'Max login failure count', 3),
('PasswordExpireDays', 'Password Expire Days', '90', 'security', 'Password expire days', 4),
('SessionTimeout', 'Session Timeout', '30', 'security', 'Session timeout in minutes', 5),
('EnableRegister', 'Enable Register', 'false', 'system', 'Allow user registration', 4),
('LogRetentionDays', 'Log Retention Days', '30', 'system', 'Log retention days', 5),
('FileUploadMaxSize', 'Max File Size', '10', 'system', 'Max file upload size in MB', 6);
