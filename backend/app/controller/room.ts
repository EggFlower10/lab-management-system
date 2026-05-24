import BaseController from './base';

export default class RoomController extends BaseController {
  public async index() {
    const { ctx, app } = this;
    const { name, code, buildingId, floor, type, status } = ctx.query;

    const where: any = {};
    if (name) where.name = name;
    if (code) where.code = code;
    if (buildingId) where.building_id = parseInt(buildingId as string);
    if (floor) where.floor = parseInt(floor as string);
    if (type) where.type = type;
    if (status) where.status = parseInt(status as string);

    const total = await app.mysql.count('ven_room', where);
    const list = await app.mysql.select('ven_room', {
      where,
      orders: [['floor', 'ASC'], ['created_at', 'DESC']],
      limit: this.pageSize,
      offset: this.offset,
    });

    this.pageResult(list, total);
  }

  public async show() {
    const { ctx, app } = this;
    const id = ctx.params.id;

    const room = await app.mysql.get('ven_room', { id });
    if (!room) {
      this.notFound('房间不存在');
      return;
    }

    this.success(room);
  }

  public async create() {
    const { ctx, app } = this;
    const { name, code, buildingId, floor, area, capacity, type, equipment, description, status } = ctx.request.body;

    const existRoom = await app.mysql.get('ven_room', { code });
    if (existRoom) {
      this.error('房间编码已存在', 400);
      return;
    }

    const result = await app.mysql.insert('ven_room', {
      name,
      code,
      building_id: buildingId,
      floor,
      area,
      capacity,
      type,
      equipment: equipment ? JSON.stringify(equipment) : null,
      description,
      status: status ?? 1,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await this.log(`创建房间: ${name}`);
    this.success({ id: result.insertId }, '创建成功');
  }

  public async update() {
    const { ctx, app } = this;
    const id = ctx.params.id;
    const { name, code, buildingId, floor, area, capacity, type, equipment, description, status } = ctx.request.body;

    const room = await app.mysql.get('ven_room', { id });
    if (!room) {
      this.notFound('房间不存在');
      return;
    }

    await app.mysql.update('ven_room', {
      id,
      name,
      code,
      building_id: buildingId,
      floor,
      area,
      capacity,
      type,
      equipment: equipment ? JSON.stringify(equipment) : null,
      description,
      status,
      updated_at: new Date(),
    });

    await this.log(`更新房间: ${name || room.name}`);
    this.success(null, '更新成功');
  }

  public async destroy() {
    const { ctx, app } = this;
    const id = ctx.params.id;

    const room = await app.mysql.get('ven_room', { id });
    if (!room) {
      this.notFound('房间不存在');
      return;
    }

    await app.mysql.delete('ven_room', { id });

    await this.log(`删除房间: ${room.name}`);
    this.success(null, '删除成功');
  }

  public async all() {
    const { ctx, app } = this;
    const { buildingId } = ctx.query;

    const where: any = { status: 1 };
    if (buildingId) where.building_id = parseInt(buildingId as string);

    const list = await app.mysql.select('ven_room', {
      where,
      orders: [['floor', 'ASC'], ['created_at', 'DESC']],
    });
    this.success(list);
  }
}
