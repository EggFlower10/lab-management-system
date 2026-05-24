import BaseController from './base';

export default class CampusController extends BaseController {
  public async index() {
    const { ctx, app } = this;
    const { name, code, status } = ctx.query;

    const where: any = {};
    if (name) where.name = name;
    if (code) where.code = code;
    if (status) where.status = parseInt(status as string);

    const total = await app.mysql.count('ven_campus', where);
    const list = await app.mysql.select('ven_campus', {
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

    const campus = await app.mysql.get('ven_campus', { id });
    if (!campus) {
      this.notFound('校区不存在');
      return;
    }

    this.success(campus);
  }

  public async create() {
    const { ctx, app } = this;
    const { name, code, address, description, status } = ctx.request.body;

    const existCampus = await app.mysql.get('ven_campus', { code });
    if (existCampus) {
      this.error('校区编码已存在', 400);
      return;
    }

    const result = await app.mysql.insert('ven_campus', {
      name,
      code,
      address,
      description,
      status: status ?? 1,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await this.log(`创建校区: ${name}`);
    this.success({ id: result.insertId }, '创建成功');
  }

  public async update() {
    const { ctx, app } = this;
    const id = ctx.params.id;
    const { name, code, address, description, status } = ctx.request.body;

    const campus = await app.mysql.get('ven_campus', { id });
    if (!campus) {
      this.notFound('校区不存在');
      return;
    }

    await app.mysql.update('ven_campus', {
      id,
      name,
      code,
      address,
      description,
      status,
      updated_at: new Date(),
    });

    await this.log(`更新校区: ${name || campus.name}`);
    this.success(null, '更新成功');
  }

  public async destroy() {
    const { ctx, app } = this;
    const id = ctx.params.id;

    const campus = await app.mysql.get('ven_campus', { id });
    if (!campus) {
      this.notFound('校区不存在');
      return;
    }

    const buildingCount = await app.mysql.count('ven_building', { campus_id: id });
    if (buildingCount > 0) {
      this.error('该校区下存在楼宇，不能删除', 400);
      return;
    }

    await app.mysql.delete('ven_campus', { id });

    await this.log(`删除校区: ${campus.name}`);
    this.success(null, '删除成功');
  }

  public async all() {
    const { app } = this;
    const list = await app.mysql.select('ven_campus', {
      where: { status: 1 },
      orders: [['created_at', 'DESC']],
    });
    this.success(list);
  }
}
