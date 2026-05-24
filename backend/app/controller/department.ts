import BaseController from './base';

export default class DepartmentController extends BaseController {
  public async index() {
    const { ctx, app } = this;
    const { name, code, orgId, status } = ctx.query;

    const where: any = {};
    if (name) where.name = name;
    if (code) where.code = code;
    if (orgId) where.org_id = parseInt(orgId as string);
    if (status) where.status = parseInt(status as string);

    const list = await app.mysql.select('sys_department', {
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

    const dept = await app.mysql.get('sys_department', { id });
    if (!dept) {
      this.notFound('部门不存在');
      return;
    }

    this.success(dept);
  }

  public async create() {
    const { ctx, app } = this;
    const { name, code, orgId, parentId, sort, description, status } = ctx.request.body;

    const existDept = await app.mysql.get('sys_department', { code });
    if (existDept) {
      this.error('部门编码已存在', 400);
      return;
    }

    const result = await app.mysql.insert('sys_department', {
      name,
      code,
      org_id: orgId,
      parent_id: parentId || 0,
      sort: sort || 0,
      description,
      status: status ?? 1,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await this.log(`创建部门: ${name}`);
    this.success({ id: result.insertId }, '创建成功');
  }

  public async update() {
    const { ctx, app } = this;
    const id = ctx.params.id;
    const { name, code, orgId, parentId, sort, description, status } = ctx.request.body;

    const dept = await app.mysql.get('sys_department', { id });
    if (!dept) {
      this.notFound('部门不存在');
      return;
    }

    if (parentId === id) {
      this.error('父级部门不能是自己', 400);
      return;
    }

    await app.mysql.update('sys_department', {
      id,
      name,
      code,
      org_id: orgId,
      parent_id: parentId || 0,
      sort,
      description,
      status,
      updated_at: new Date(),
    });

    await this.log(`更新部门: ${name || dept.name}`);
    this.success(null, '更新成功');
  }

  public async destroy() {
    const { ctx, app } = this;
    const id = ctx.params.id;

    const dept = await app.mysql.get('sys_department', { id });
    if (!dept) {
      this.notFound('部门不存在');
      return;
    }

    const childCount = await app.mysql.count('sys_department', { parent_id: id });
    if (childCount > 0) {
      this.error('存在子部门，不能删除', 400);
      return;
    }

    const userCount = await app.mysql.count('sys_user', { dept_id: id });
    if (userCount > 0) {
      this.error('该部门下存在用户，不能删除', 400);
      return;
    }

    await app.mysql.delete('sys_department', { id });

    await this.log(`删除部门: ${dept.name}`);
    this.success(null, '删除成功');
  }
}
