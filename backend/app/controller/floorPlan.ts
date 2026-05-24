import BaseController from './base';

export default class FloorPlanController extends BaseController {
  public async index() {
    const { ctx, app } = this;
    const { buildingId, floor } = ctx.query;

    const where: any = {};
    if (buildingId) where.building_id = parseInt(buildingId as string);
    if (floor) where.floor = parseInt(floor as string);

    const total = await app.mysql.count('ven_floor_plan', where);
    const list = await app.mysql.select('ven_floor_plan', {
      where,
      orders: [['floor', 'ASC']],
      limit: this.pageSize,
      offset: this.offset,
    });

    this.pageResult(list, total);
  }

  public async show() {
    const { ctx, app } = this;
    const id = ctx.params.id;

    const plan = await app.mysql.get('ven_floor_plan', { id });
    if (!plan) {
      this.notFound('平面图不存在');
      return;
    }

    this.success(plan);
  }

  public async create() {
    const { ctx, app } = this;
    const { buildingId, floor, imageUrl, description } = ctx.request.body;

    const existPlan = await app.mysql.get('ven_floor_plan', { building_id: buildingId, floor });
    if (existPlan) {
      this.error('该楼层平面图已存在', 400);
      return;
    }

    const result = await app.mysql.insert('ven_floor_plan', {
      building_id: buildingId,
      floor,
      image_url: imageUrl,
      description,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await this.log(`创建楼层平面图: ${floor}层`);
    this.success({ id: result.insertId }, '创建成功');
  }

  public async update() {
    const { ctx, app } = this;
    const id = ctx.params.id;
    const { buildingId, floor, imageUrl, description } = ctx.request.body;

    const plan = await app.mysql.get('ven_floor_plan', { id });
    if (!plan) {
      this.notFound('平面图不存在');
      return;
    }

    await app.mysql.update('ven_floor_plan', {
      id,
      building_id: buildingId,
      floor,
      image_url: imageUrl,
      description,
      updated_at: new Date(),
    });

    await this.log(`更新楼层平面图: ${floor || plan.floor}层`);
    this.success(null, '更新成功');
  }

  public async destroy() {
    const { ctx, app } = this;
    const id = ctx.params.id;

    const plan = await app.mysql.get('ven_floor_plan', { id });
    if (!plan) {
      this.notFound('平面图不存在');
      return;
    }

    await app.mysql.delete('ven_floor_plan', { id });

    await this.log(`删除楼层平面图: ${plan.floor}层`);
    this.success(null, '删除成功');
  }

  public async getByBuilding() {
    const { ctx, app } = this;
    const buildingId = ctx.params.buildingId;

    const list = await app.mysql.select('ven_floor_plan', {
      where: { building_id: buildingId },
      orders: [['floor', 'ASC']],
    });

    this.success(list);
  }
}
