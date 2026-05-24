import BaseController from './base';

export default class MenuController extends BaseController {
  public async index() {
    const { ctx, app } = this;
    const { name, status } = ctx.query;

    const where: any = {};
    if (name) where.name = name;
    if (status) where.status = parseInt(status as string);

    const list = await app.mysql.select('sys_menu', {
      where,
      orders: [['sort', 'ASC'], ['created_at', 'DESC']],
    });

    const tree = this.buildTree(list);
    this.success(tree);
  }

  private buildTree(list: any[], parentId: number = 0): any[] {
    return list
      .filter(item => item.parent_id === parentId)
      .map(item => ({
        ...item,
        children: this.buildTree(list, item.id),
      }));
  }

  public async show() {
    const { ctx, app } = this;
    const id = ctx.params.id;

    const menu = await app.mysql.get('sys_menu', { id });
    if (!menu) {
      this.notFound('菜单不存在');
      return;
    }

    this.success(menu);
  }

  public async create() {
    const { ctx, app } = this;
    const { name, path, component, icon, parentId, sort, type, visible, status } = ctx.request.body;

    const result = await app.mysql.insert('sys_menu', {
      name,
      path,
      component,
      icon,
      parent_id: parentId || 0,
      sort: sort || 0,
      type: type || 'menu',
      visible: visible ?? 1,
      status: status ?? 1,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await this.log(`创建菜单: ${name}`);
    this.success({ id: result.insertId }, '创建成功');
  }

  public async update() {
    const { ctx, app } = this;
    const id = ctx.params.id;
    const { name, path, component, icon, parentId, sort, type, visible, status } = ctx.request.body;

    const menu = await app.mysql.get('sys_menu', { id });
    if (!menu) {
      this.notFound('菜单不存在');
      return;
    }

    if (parentId === id) {
      this.error('父级菜单不能是自己', 400);
      return;
    }

    await app.mysql.update('sys_menu', {
      id,
      name,
      path,
      component,
      icon,
      parent_id: parentId || 0,
      sort,
      type,
      visible,
      status,
      updated_at: new Date(),
    });

    await this.log(`更新菜单: ${name || menu.name}`);
    this.success(null, '更新成功');
  }

  public async destroy() {
    const { ctx, app } = this;
    const id = ctx.params.id;

    const menu = await app.mysql.get('sys_menu', { id });
    if (!menu) {
      this.notFound('菜单不存在');
      return;
    }

    const childCount = await app.mysql.count('sys_menu', { parent_id: id });
    if (childCount > 0) {
      this.error('存在子菜单，不能删除', 400);
      return;
    }

    await app.mysql.delete('sys_menu', { id });
    await app.mysql.delete('sys_role_menu', { menu_id: id });

    await this.log(`删除菜单: ${menu.name}`);
    this.success(null, '删除成功');
  }

  public async userMenus() {
    const { ctx } = this;
    const user = ctx.state.user;

    if (!user) {
      this.notFound('用户信息获取失败');
      return;
    }

    const menus = await ctx.service.menu.getUserMenus(user.id);
    const tree = this.buildTree(menus);
    this.success(tree);
  }
}
