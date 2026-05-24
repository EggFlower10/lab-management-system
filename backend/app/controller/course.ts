import BaseController from './base';

export default class CourseController extends BaseController {
  public async index() {
    const { ctx, app } = this;
    const { name, code, type, status } = ctx.query;

    const where: any = {};
    if (name) where.name = name;
    if (code) where.code = code;
    if (type) where.type = type;
    if (status) where.status = parseInt(status as string);

    const total = await app.mysql.count('edu_course', where);
    const list = await app.mysql.select('edu_course', {
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

    const course = await app.mysql.get('edu_course', { id });
    if (!course) {
      this.notFound('课程不存在');
      return;
    }

    this.success(course);
  }

  public async create() {
    const { ctx, app } = this;
    const { name, code, type, credit, hours, description, status } = ctx.request.body;

    const existCourse = await app.mysql.get('edu_course', { code });
    if (existCourse) {
      this.error('课程编码已存在', 400);
      return;
    }

    const result = await app.mysql.insert('edu_course', {
      name,
      code,
      type,
      credit,
      hours,
      description,
      status: status ?? 1,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await this.log(`创建课程: ${name}`);
    this.success({ id: result.insertId }, '创建成功');
  }

  public async update() {
    const { ctx, app } = this;
    const id = ctx.params.id;
    const { name, code, type, credit, hours, description, status } = ctx.request.body;

    const course = await app.mysql.get('edu_course', { id });
    if (!course) {
      this.notFound('课程不存在');
      return;
    }

    await app.mysql.update('edu_course', {
      id,
      name,
      code,
      type,
      credit,
      hours,
      description,
      status,
      updated_at: new Date(),
    });

    await this.log(`更新课程: ${name || course.name}`);
    this.success(null, '更新成功');
  }

  public async destroy() {
    const { ctx, app } = this;
    const id = ctx.params.id;

    const course = await app.mysql.get('edu_course', { id });
    if (!course) {
      this.notFound('课程不存在');
      return;
    }

    await app.mysql.delete('edu_course', { id });

    await this.log(`删除课程: ${course.name}`);
    this.success(null, '删除成功');
  }

  public async all() {
    const { app } = this;
    const list = await app.mysql.select('edu_course', {
      where: { status: 1 },
      orders: [['created_at', 'DESC']],
    });
    this.success(list);
  }
}
