import { Context, Application } from 'egg';

export default function authMiddleware(options: any, app: Application) {
  return async (ctx: Context, next: any) => {
    const whiteList = [
      '/api/v1/auth/login',
      '/api/v1/auth/logout',
    ];

    if (whiteList.some(path => ctx.path.startsWith(path))) {
      await next();
      return;
    }

    const token = ctx.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      ctx.status = 401;
      ctx.body = {
        code: 401,
        message: '未登录或登录已过期',
        data: null,
      };
      return;
    }

    try {
      const decoded = app.jwt.verify(token, app.config.jwt.secret);
      ctx.state.user = decoded;
      await next();
    } catch (error) {
      ctx.status = 401;
      ctx.body = {
        code: 401,
        message: 'Token无效或已过期',
        data: null,
      };
    }
  };
}
