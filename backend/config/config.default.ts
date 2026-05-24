import { EggAppConfig, PowerPartial } from 'egg';

export default () => {
  const config: PowerPartial<EggAppConfig> = {
    keys: 'lab-management-system-secret-keys-2024',

    security: {
      csrf: {
        enable: false,
      },
    },

    cors: {
      origin: '*',
      allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH,OPTIONS',
      credentials: true,
    },

    jwt: {
      secret: 'lab-management-jwt-secret-key-2024',
      expiresIn: '24h',
    },

    mysql: {
      client: {
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: 'root',
        database: 'lab_management',
      },
      app: true,
      agent: false,
    },

    validate: {
      convert: true,
      widelyUndefined: true,
    },

    cluster: {
      listen: {
        port: 7001,
        hostname: '127.0.0.1',
      },
    },

    bodyParser: {
      jsonLimit: '10mb',
      formLimit: '10mb',
    },
  };

  return config;
};
