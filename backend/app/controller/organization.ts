import BaseController from './base';

export default class OrganizationController extends BaseController {
  public async index() {
    const { ctx, app } = this;
    const { name, code, status } = ctx.query;

    const where: any = {};
    if (name) where.name = name;
    if (code) where.code = code;
    if (status) where.status = parseInt(status as string);

    const list = await app.mysql.select('sys_organization', {
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

    const org = await app.mysql.get('sys_organization', { id });
    if (!org) {
      this.notFound('机构不存在');
      return;
    }

    this.success(org);
  }

  public async create() {
    const { ctx, app } = this;
    const { name, code, parentId, sort, description, status } = ctx.request.body;

    const existOrg = await app.mysql.get('sys_organization', { code });
    if (existOrg) {
      this.error('机构编码已存在', 400);
      return;
    }

    const result = await app.mysql.insert('sys_organization', {
      name,
      code,
      parent_id: parentId || 0,
      sort: sort || 0,
      description,
      status: status ?? 1,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await this.log(`创建机构: ${name}`);
    this.success({ id: result.insertId }, '创建成功');
  }

  public async update() {
    const { ctx, app } = this;
    const id = ctx.params.id;
    const { name, code, parentId, sort, description, status } = ctx.request.body;

    const org = await app.mysql.get('sys_organization', { id });
    if (!org) {
      this.notFound('机构不存在');
      return;
    }

    if (parentId === id) {
      this.error('父级机构不能是自己', 400);
      return;
    }

    await app.mysql.update('sys_organization', {
      id,
      name,
      code,
      parent_id: parentId || 0,
      sort,
      description,
      status,
      updated_at: new Date(),
    });

    await this.log(`更新机构: ${name || org.name}`);
    this.success(null, '更新成功');
  }

  public async destroy() {
    const { ctx, app } = this;
    const id = ctx.params.id;

    const org = await app.mysql.get('sys_organization', { id });
    if (!org) {
      this.notFound('机构不存在');
      return;
    }

    const childCount = await app.mysql.count('sys_organization', { parent_id: id });
    if (childCount > 0) {
      this.error('存在子机构，不能删除', 400);
      return;
    }

    await app.mysql.delete('sys_organization', { id });

    await this.log(`删除机构: ${org.name}`);
    this.success(null, '删除成功');
  }
}
