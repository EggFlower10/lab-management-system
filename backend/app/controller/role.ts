import BaseController from './base';

export default class RoleController extends BaseController {
  public async index() {
    const { ctx, app } = this;
    const { name, code, status } = ctx.query;

    const where: any = {};
    if (name) where.name = name;
    if (code) where.code = code;
    if (status) where.status = parseInt(status as string);

    const total = await app.mysql.count('sys_role', where);
    const list = await app.mysql.select('sys_role', {
      where,
      orders: [['created_at', 'DESC']],
      limit: this.pageSize,
      offset: this.offset,
    });

    for (const role of list) {
      const menus = await ctx.service.menu.getRoleMenus(role.id);
      const permissions = await ctx.service.permission.getRolePermissions(role.id);
      (role as any).menus = menus;
      (role as any).permissions = permissions;
    }

    this.pageResult(list, total);
  }

  public async show() {
    const { ctx, app } = this;
    const id = ctx.params.id;

    const role = await app.mysql.get('sys_role', { id });
    if (!role) {
      this.notFound('角色不存在');
      return;
    }

    const menus = await ctx.service.menu.getRoleMenus(role.id);
    const permissions = await ctx.service.permission.getRolePermissions(role.id);
    (role as any).menus = menus;
    (role as any).permissions = permissions;

    this.success(role);
  }

  public async create() {
    const { ctx, app } = this;
    const { name, code, description, status, menuIds, permissionIds } = ctx.request.body;

    const existRole = await app.mysql.get('sys_role', { code });
    if (existRole) {
      this.error('角色编码已存在', 400);
      return;
    }

    const result = await app.mysql.insert('sys_role', {
      name,
      code,
      description,
      status: status ?? 1,
      created_at: new Date(),
      updated_at: new Date(),
    });

    if (menuIds && menuIds.length > 0) {
      await ctx.service.role.assignMenus(result.insertId, menuIds);
    }

    if (permissionIds && permissionIds.length > 0) {
      await ctx.service.role.assignPermissions(result.insertId, permissionIds);
    }

    await this.log(`创建角色: ${name}`);
    this.success({ id: result.insertId }, '创建成功');
  }

  public async update() {
    const { ctx, app } = this;
    const id = ctx.params.id;
    const { name, code, description, status, menuIds, permissionIds } = ctx.request.body;

    const role = await app.mysql.get('sys_role', { id });
    if (!role) {
      this.notFound('角色不存在');
      return;
    }

    if (code && code !== role.code) {
      const existRole = await app.mysql.get('sys_role', { code });
      if (existRole) {
        this.error('角色编码已存在', 400);
        return;
      }
    }

    await app.mysql.update('sys_role', {
      id,
      name,
      code,
      description,
      status,
      updated_at: new Date(),
    });

    if (menuIds) {
      await ctx.service.role.assignMenus(id, menuIds);
    }

    if (permissionIds) {
      await ctx.service.role.assignPermissions(id, permissionIds);
    }

    await this.log(`更新角色: ${name || role.name}`);
    this.success(null, '更新成功');
  }

  public async destroy() {
    const { ctx, app } = this;
    const id = ctx.params.id;

    const role = await app.mysql.get('sys_role', { id });
    if (!role) {
      this.notFound('角色不存在');
      return;
    }

    if (role.code === 'admin') {
      this.error('不能删除超级管理员角色', 400);
      return;
    }

    const userCount = await app.mysql.count('sys_user_role', { role_id: id });
    if (userCount > 0) {
      this.error('该角色下存在用户，不能删除', 400);
      return;
    }

    await app.mysql.delete('sys_role', { id });
    await app.mysql.delete('sys_role_menu', { role_id: id });
    await app.mysql.delete('sys_role_permission', { role_id: id });

    await this.log(`删除角色: ${role.name}`);
    this.success(null, '删除成功');
  }

  public async all() {
    const { app } = this;
    const list = await app.mysql.select('sys_role', {
      where: { status: 1 },
      orders: [['created_at', 'DESC']],
    });
    this.success(list);
  }
}
