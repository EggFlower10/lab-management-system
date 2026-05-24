import BaseController from './base';
import * as bcrypt from 'bcryptjs';

export default class UserController extends BaseController {
  public async index() {
    const { ctx, app } = this;
    const { username, realName, status, deptId } = ctx.query;

    const where: any = {};
    if (username) where.username = username;
    if (realName) where.real_name = realName;
    if (status) where.status = parseInt(status as string);
    if (deptId) where.dept_id = parseInt(deptId as string);

    const total = await app.mysql.count('sys_user', where);
    const list = await app.mysql.select('sys_user', {
      where,
      orders: [['created_at', 'DESC']],
      limit: this.pageSize,
      offset: this.offset,
    });

    for (const user of list) {
      delete user.password;
      const roles = await ctx.service.role.getUserRoles(user.id);
      (user as any).roles = roles;
    }

    this.pageResult(list, total);
  }

  public async show() {
    const { ctx, app } = this;
    const id = ctx.params.id;

    const user = await app.mysql.get('sys_user', { id });
    if (!user) {
      this.notFound('用户不存在');
      return;
    }

    delete user.password;
    const roles = await ctx.service.role.getUserRoles(user.id);
    (user as any).roles = roles;

    this.success(user);
  }

  public async create() {
    const { ctx, app } = this;
    const { username, password, realName, phone, email, avatar, status, deptId, roleIds } = ctx.request.body;

    const existUser = await app.mysql.get('sys_user', { username });
    if (existUser) {
      this.error('用户名已存在', 400);
      return;
    }

    const hashedPassword = await bcrypt.hash(password || '123456', 10);
    const result = await app.mysql.insert('sys_user', {
      username,
      password: hashedPassword,
      real_name: realName,
      phone,
      email,
      avatar,
      status: status ?? 1,
      dept_id: deptId,
      created_at: new Date(),
      updated_at: new Date(),
    });

    if (roleIds && roleIds.length > 0) {
      await ctx.service.user.assignRoles(result.insertId, roleIds);
    }

    await this.log(`创建用户: ${username}`);
    this.success({ id: result.insertId }, '创建成功');
  }

  public async update() {
    const { ctx, app } = this;
    const id = ctx.params.id;
    const { realName, phone, email, avatar, status, deptId, roleIds } = ctx.request.body;

    const user = await app.mysql.get('sys_user', { id });
    if (!user) {
      this.notFound('用户不存在');
      return;
    }

    await app.mysql.update('sys_user', {
      id,
      real_name: realName,
      phone,
      email,
      avatar,
      status,
      dept_id: deptId,
      updated_at: new Date(),
    });

    if (roleIds) {
      await ctx.service.user.assignRoles(id, roleIds);
    }

    await this.log(`更新用户: ${user.username}`);
    this.success(null, '更新成功');
  }

  public async destroy() {
    const { ctx, app } = this;
    const id = ctx.params.id;

    const user = await app.mysql.get('sys_user', { id });
    if (!user) {
      this.notFound('用户不存在');
      return;
    }

    if (user.username === 'admin') {
      this.error('不能删除超级管理员', 400);
      return;
    }

    await app.mysql.delete('sys_user', { id });
    await app.mysql.delete('sys_user_role', { user_id: id });

    await this.log(`删除用户: ${user.username}`);
    this.success(null, '删除成功');
  }

  public async resetPassword() {
    const { ctx, app } = this;
    const id = ctx.params.id;

    const user = await app.mysql.get('sys_user', { id });
    if (!user) {
      this.notFound('用户不存在');
      return;
    }

    const hashedPassword = await bcrypt.hash('123456', 10);
    await app.mysql.update('sys_user', {
      id,
      password: hashedPassword,
      updated_at: new Date(),
    });

    await this.log(`重置用户密码: ${user.username}`);
    this.success(null, '密码已重置为: 123456');
  }
}
