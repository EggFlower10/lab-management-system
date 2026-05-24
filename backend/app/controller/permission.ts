import BaseController from './base';

export default class PermissionController extends BaseController {
  public async index() {
    const { ctx, app } = this;
    const { name, code, status } = ctx.query;

    const where: any = {};
    if (name) where.name = name;
    if (code) where.code = code;
    if (status) where.status = parseInt(status as string);

    const total = await app.mysql.count('sys_permission', where);
    const list = await app.mysql.select('sys_permission', {
      where,
      orders: [['created_at', 'DESC']],
      limit: this.pageSize,
      offset: this.offset,
    });

    this.pageResult(list, total);
  }

  public async show() {
    const { ctx, app } = this;
    const id = ctx.params.id;

    const permission = await app.mysql.get('sys_permission', { id });
    if (!permission) {
      this.notFound('权限不存在');
      return;
    }

    this.success(permission);
  }

  public async create() {
    const { ctx, app } = this;
    const { name, code, path, method, description, status } = ctx.request.body;

    const existPermission = await app.mysql.get('sys_permission', { code });
    if (existPermission) {
      this.error('权限编码已存在', 400);
      return;
    }

    const result = await app.mysql.insert('sys_permission', {
      name,
      code,
      path,
      method: method || 'GET',
      description,
      status: status ?? 1,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await this.log(`创建权限: ${name}`);
    this.success({ id: result.insertId }, '创建成功');
  }

  public async update() {
    const { ctx, app } = this;
    const id = ctx.params.id;
    const { name, code, path, method, description, status } = ctx.request.body;

    const permission = await app.mysql.get('sys_permission', { id });
    if (!permission) {
      this.notFound('权限不存在');
      return;
    }

    if (code && code !== permission.code) {
      const existPermission = await app.mysql.get('sys_permission', { code });
      if (existPermission) {
        this.error('权限编码已存在', 400);
        return;
      }
    }

    await app.mysql.update('sys_permission', {
      id,
      name,
      code,
      path,
      method,
      description,
      status,
      updated_at: new Date(),
    });

    await this.log(`更新权限: ${name || permission.name}`);
    this.success(null, '更新成功');
  }

  public async destroy() {
    const { ctx, app } = this;
    const id = ctx.params.id;

    const permission = await app.mysql.get('sys_permission', { id });
    if (!permission) {
      this.notFound('权限不存在');
      return;
    }

    await app.mysql.delete('sys_permission', { id });
    await app.mysql.delete('sys_role_permission', { permission_id: id });

    await this.log(`删除权限: ${permission.name}`);
    this.success(null, '删除成功');
  }

  public async all() {
    const { app } = this;
    const list = await app.mysql.select('sys_permission', {
      where: { status: 1 },
      orders: [['created_at', 'DESC']],
    });
    this.success(list);
  }
}
