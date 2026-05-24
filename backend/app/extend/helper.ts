import { Context } from 'egg';

export default {
  success(ctx: Context, data: any = null, message: string = '操作成功') {
    ctx.status = 200;
    ctx.body = {
      code: 200,
      message,
      data,
      timestamp: Date.now(),
    };
  },

  error(ctx: Context, message: string = '操作失败', code: number = 500, data: any = null) {
    ctx.status = code >= 400 && code < 500 ? code : 200;
    ctx.body = {
      code,
      message,
      data,
      timestamp: Date.now(),
    };
  },

  page(ctx: Context, list: any[], total: number, page: number, pageSize: number) {
    ctx.status = 200;
    ctx.body = {
      code: 200,
      message: '查询成功',
      data: {
        list,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
      timestamp: Date.now(),
    };
  },

  notFound(ctx: Context, message: string = '资源不存在') {
    ctx.status = 404;
    ctx.body = {
      code: 404,
      message,
      data: null,
      timestamp: Date.now(),
    };
  },

  unauthorized(ctx: Context, message: string = '未授权') {
    ctx.status = 401;
    ctx.body = {
      code: 401,
      message,
      data: null,
      timestamp: Date.now(),
    };
  },

  forbidden(ctx: Context, message: string = '禁止访问') {
    ctx.status = 403;
    ctx.body = {
      code: 403,
      message,
      data: null,
      timestamp: Date.now(),
    };
  },
};
