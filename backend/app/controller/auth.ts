import { Controller } from 'egg';
import * as bcrypt from 'bcryptjs';

export default class AuthController extends Controller {
  public async login() {
    const { ctx, app } = this;
    const { username, password } = ctx.request.body;

    if (!username || !password) {
      ctx.helper.error(ctx, '用户名和密码不能为空', 400);
      return;
    }

    const user = await app.mysql.get('sys_user', { username, status: 1 });
    if (!user) {
      ctx.helper.error(ctx, '用户名或密码错误', 400);
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      ctx.helper.error(ctx, '用户名或密码错误', 400);
      return;
    }

    const token = app.jwt.sign(
      {
        id: user.id,
        username: user.username,
        realName: user.real_name,
      },
      app.config.jwt.secret,
      { expiresIn: app.config.jwt.expiresIn }
    );

    await app.mysql.update('sys_user', {
      id: user.id,
      last_login_time: new Date(),
      last_login_ip: ctx.ip,
    });

    await ctx.service.log.create({
      userId: user.id,
      username: user.username,
      operation: '登录',
      method: 'POST',
      path: '/api/v1/auth/login',
      ip: ctx.ip,
      status: 1,
    });

    ctx.helper.success(ctx, {
      token,
      userInfo: {
        id: user.id,
        username: user.username,
        realName: user.real_name,
        avatar: user.avatar,
        phone: user.phone,
        email: user.email,
      },
    }, '登录成功');
  }

  public async logout() {
    const { ctx } = this;
    const user = ctx.state.user;

    if (user) {
      await ctx.service.log.create({
        userId: user.id,
        username: user.username,
        operation: '退出登录',
        method: 'POST',
        path: '/api/v1/auth/logout',
        ip: ctx.ip,
        status: 1,
      });
    }

    ctx.helper.success(ctx, null, '退出成功');
  }

  public async info() {
    const { ctx, app } = this;
    const user = ctx.state.user;

    if (!user) {
      ctx.helper.unauthorized(ctx, '用户信息获取失败');
      return;
    }

    const userInfo = await app.mysql.get('sys_user', { id: user.id });
    if (!userInfo) {
      ctx.helper.notFound(ctx, '用户不存在');
      return;
    }

    const roles = await ctx.service.role.getUserRoles(user.id);
    const permissions = await ctx.service.permission.getUserPermissions(user.id);
    const menus = await ctx.service.menu.getUserMenus(user.id);

    ctx.helper.success(ctx, {
      id: userInfo.id,
      username: userInfo.username,
      realName: userInfo.real_name,
      avatar: userInfo.avatar,
      phone: userInfo.phone,
      email: userInfo.email,
      roles,
      permissions,
      menus,
    });
  }

  public async updatePassword() {
    const { ctx, app } = this;
    const user = ctx.state.user;
    const { oldPassword, newPassword, confirmPassword } = ctx.request.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      ctx.helper.error(ctx, '请填写完整信息', 400);
      return;
    }

    if (newPassword !== confirmPassword) {
      ctx.helper.error(ctx, '两次密码输入不一致', 400);
      return;
    }

    const userInfo = await app.mysql.get('sys_user', { id: user.id });
    if (!userInfo) {
      ctx.helper.notFound(ctx, '用户不存在');
      return;
    }

    const isMatch = await bcrypt.compare(oldPassword, userInfo.password);
    if (!isMatch) {
      ctx.helper.error(ctx, '原密码错误', 400);
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await app.mysql.update('sys_user', {
      id: user.id,
      password: hashedPassword,
      updated_at: new Date(),
    });

    await ctx.service.log.create({
      userId: user.id,
      username: user.username,
      operation: '修改密码',
      method: 'PUT',
      path: '/api/v1/auth/password',
      ip: ctx.ip,
      status: 1,
    });

    ctx.helper.success(ctx, null, '密码修改成功');
  }
}
