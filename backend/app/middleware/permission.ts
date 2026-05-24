import { Context, Application } from 'egg';

export default function permissionMiddleware(options: any, app: Application) {
  return async (ctx: Context, next: any) => {
    const whiteList = [
      '/api/v1/auth/login',
      '/api/v1/auth/logout',
      '/api/v1/auth/info',
      '/api/v1/auth/password',
    ];

    if (whiteList.some(path => ctx.path.startsWith(path))) {
      await next();
      return;
    }

    const user = ctx.state.user;
    if (!user) {
      ctx.status = 401;
      ctx.body = {
        code: 401,
        message: '用户信息获取失败',
        data: null,
      };
      return;
    }

    if (user.username === 'admin') {
      await next();
      return;
    }

    const method = ctx.method.toLowerCase();
    const path = ctx.path;

    try {
      const permissions = await ctx.service.permission.getUserPermissions(user.id);
      const hasPermission = permissions.some((p: any) => {
        if (p.path === path && p.method === method) {
          return true;
        }
        const regex = new RegExp('^' + p.path.replace(/:[^/]+/g, '[^/]+') + '$');
        return regex.test(path) && p.method === method;
      });

      if (!hasPermission) {
        ctx.status = 403;
        ctx.body = {
          code: 403,
          message: '没有操作权限',
          data: null,
        };
        return;
      }

      await next();
    } catch (error) {
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '权限验证失败',
        data: null,
      };
    }
  };
}
