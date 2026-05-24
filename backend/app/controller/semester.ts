import BaseController from './base';

export default class SemesterController extends BaseController {
  public async index() {
    const { ctx, app } = this;
    const { name, code, status } = ctx.query;

    const where: any = {};
    if (name) where.name = name;
    if (code) where.code = code;
    if (status) where.status = parseInt(status as string);

    const total = await app.mysql.count('edu_semester', where);
    const list = await app.mysql.select('edu_semester', {
      where,
      orders: [['start_date', 'DESC']],
      limit: this.pageSize,
      offset: this.offset,
    });

    this.pageResult(list, total);
  }

  public async show() {
    const { ctx, app } = this;
    const id = ctx.params.id;

    const semester = await app.mysql.get('edu_semester', { id });
    if (!semester) {
      this.notFound('学期不存在');
      return;
    }

    this.success(semester);
  }

  public async create() {
    const { ctx, app } = this;
    const { name, code, startDate, endDate, status } = ctx.request.body;

    const existSemester = await app.mysql.get('edu_semester', { code });
    if (existSemester) {
      this.error('学期编码已存在', 400);
      return;
    }

    const result = await app.mysql.insert('edu_semester', {
      name,
      code,
      start_date: startDate,
      end_date: endDate,
      status: status ?? 1,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await this.log(`创建学期: ${name}`);
    this.success({ id: result.insertId }, '创建成功');
  }

  public async update() {
    const { ctx, app } = this;
    const id = ctx.params.id;
    const { name, code, startDate, endDate, status } = ctx.request.body;

    const semester = await app.mysql.get('edu_semester', { id });
    if (!semester) {
      this.notFound('学期不存在');
      return;
    }

    await app.mysql.update('edu_semester', {
      id,
      name,
      code,
      start_date: startDate,
      end_date: endDate,
      status,
      updated_at: new Date(),
    });

    await this.log(`更新学期: ${name || semester.name}`);
    this.success(null, '更新成功');
  }

  public async destroy() {
    const { ctx, app } = this;
    const id = ctx.params.id;

    const semester = await app.mysql.get('edu_semester', { id });
    if (!semester) {
      this.notFound('学期不存在');
      return;
    }

    await app.mysql.delete('edu_semester', { id });

    await this.log(`删除学期: ${semester.name}`);
    this.success(null, '删除成功');
  }

  public async current() {
    const { app } = this;
    const now = new Date();
    const semester = await app.mysql.get('edu_semester', {
      status: 1,
    });

    if (semester && new Date(semester.start_date) <= now && new Date(semester.end_date) >= now) {
      this.success(semester);
    } else {
      const latest = await app.mysql.select('edu_semester', {
        where: { status: 1 },
        orders: [['start_date', 'DESC']],
        limit: 1,
      });
      this.success(latest[0] || null);
    }
  }
}
