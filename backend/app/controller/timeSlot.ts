import BaseController from './base';

export default class TimeSlotController extends BaseController {
  public async index() {
    const { ctx, app } = this;
    const { name, status } = ctx.query;

    const where: any = {};
    if (name) where.name = name;
    if (status) where.status = parseInt(status as string);

    const total = await app.mysql.count('edu_time_slot', where);
    const list = await app.mysql.select('edu_time_slot', {
      where,
      orders: [['sort', 'ASC'], ['start_time', 'ASC']],
      limit: this.pageSize,
      offset: this.offset,
    });

    this.pageResult(list, total);
  }

  public async show() {
    const { ctx, app } = this;
    const id = ctx.params.id;

    const slot = await app.mysql.get('edu_time_slot', { id });
    if (!slot) {
      this.notFound('节次不存在');
      return;
    }

    this.success(slot);
  }

  public async create() {
    const { ctx, app } = this;
    const { name, startTime, endTime, sort, type, status } = ctx.request.body;

    const result = await app.mysql.insert('edu_time_slot', {
      name,
      start_time: startTime,
      end_time: endTime,
      sort: sort || 0,
      type: type || 'morning',
      status: status ?? 1,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await this.log(`创建节次: ${name}`);
    this.success({ id: result.insertId }, '创建成功');
  }

  public async update() {
    const { ctx, app } = this;
    const id = ctx.params.id;
    const { name, startTime, endTime, sort, type, status } = ctx.request.body;

    const slot = await app.mysql.get('edu_time_slot', { id });
    if (!slot) {
      this.notFound('节次不存在');
      return;
    }

    await app.mysql.update('edu_time_slot', {
      id,
      name,
      start_time: startTime,
      end_time: endTime,
      sort,
      type,
      status,
      updated_at: new Date(),
    });

    await this.log(`更新节次: ${name || slot.name}`);
    this.success(null, '更新成功');
  }

  public async destroy() {
    const { ctx, app } = this;
    const id = ctx.params.id;

    const slot = await app.mysql.get('edu_time_slot', { id });
    if (!slot) {
      this.notFound('节次不存在');
      return;
    }

    await app.mysql.delete('edu_time_slot', { id });

    await this.log(`删除节次: ${slot.name}`);
    this.success(null, '删除成功');
  }

  public async all() {
    const { app } = this;
    const list = await app.mysql.select('edu_time_slot', {
      where: { status: 1 },
      orders: [['sort', 'ASC'], ['start_time', 'ASC']],
    });
    this.success(list);
  }
}
