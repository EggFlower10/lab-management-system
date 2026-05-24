import BaseController from './base';

export default class BuildingController extends BaseController {
  public async index() {
    const { ctx, app } = this;
    const { name, code, campusId, status } = ctx.query;

    const where: any = {};
    if (name) where.name = name;
    if (code) where.code = code;
    if (campusId) where.campus_id = parseInt(campusId as string);
    if (status) where.status = parseInt(status as string);

    const total = await app.mysql.count('ven_building', where);
    const list = await app.mysql.select('ven_building', {
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

    const building = await app.mysql.get('ven_building', { id });
    if (!building) {
      this.notFound('楼宇不存在');
      return;
    }

    this.success(building);
  }

  public async create() {
    const { ctx, app } = this;
    const { name, code, campusId, floors, type, description, status } = ctx.request.body;

    const existBuilding = await app.mysql.get('ven_building', { code });
    if (existBuilding) {
      this.error('楼宇编码已存在', 400);
      return;
    }

    const result = await app.mysql.insert('ven_building', {
      name,
      code,
      campus_id: campusId,
      floors,
      type,
      description,
      status: status ?? 1,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await this.log(`创建楼宇: ${name}`);
    this.success({ id: result.insertId }, '创建成功');
  }

  public async update() {
    const { ctx, app } = this;
    const id = ctx.params.id;
    const { name, code, campusId, floors, type, description, status } = ctx.request.body;

    const building = await app.mysql.get('ven_building', { id });
    if (!building) {
      this.notFound('楼宇不存在');
      return;
    }

    await app.mysql.update('ven_building', {
      id,
      name,
      code,
      campus_id: campusId,
      floors,
      type,
      description,
      status,
      updated_at: new Date(),
    });

    await this.log(`更新楼宇: ${name || building.name}`);
    this.success(null, '更新成功');
  }

  public async destroy() {
    const { ctx, app } = this;
    const id = ctx.params.id;

    const building = await app.mysql.get('ven_building', { id });
    if (!building) {
      this.notFound('楼宇不存在');
      return;
    }

    const roomCount = await app.mysql.count('ven_room', { building_id: id });
    if (roomCount > 0) {
      this.error('该楼宇下存在房间，不能删除', 400);
      return;
    }

    await app.mysql.delete('ven_building', { id });

    await this.log(`删除楼宇: ${building.name}`);
    this.success(null, '删除成功');
  }

  public async all() {
    const { ctx, app } = this;
    const { campusId } = ctx.query;

    const where: any = { status: 1 };
    if (campusId) where.campus_id = parseInt(campusId as string);

    const list = await app.mysql.select('ven_building', {
      where,
      orders: [['created_at', 'DESC']],
    });
    this.success(list);
  }
}
