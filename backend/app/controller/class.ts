import BaseController from './base';

export default class ClassController extends BaseController {
  public async index() {
    const { ctx, app } = this;
    const { name, code, majorId, grade, status } = ctx.query;

    const where: any = {};
    if (name) where.name = name;
    if (code) where.code = code;
    if (majorId) where.major_id = parseInt(majorId as string);
    if (grade) where.grade = grade;
    if (status) where.status = parseInt(status as string);

    const total = await app.mysql.count('edu_class', where);
    const list = await app.mysql.select('edu_class', {
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

    const classInfo = await app.mysql.get('edu_class', { id });
    if (!classInfo) {
      this.notFound('班级不存在');
      return;
    }

    this.success(classInfo);
  }

  public async create() {
    const { ctx, app } = this;
    const { name, code, majorId, grade, studentCount, headTeacher, status } = ctx.request.body;

    const existClass = await app.mysql.get('edu_class', { code });
    if (existClass) {
      this.error('班级编码已存在', 400);
      return;
    }

    const result = await app.mysql.insert('edu_class', {
      name,
      code,
      major_id: majorId,
      grade,
      student_count: studentCount || 0,
      head_teacher: headTeacher,
      status: status ?? 1,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await this.log(`创建班级: ${name}`);
    this.success({ id: result.insertId }, '创建成功');
  }

  public async update() {
    const { ctx, app } = this;
    const id = ctx.params.id;
    const { name, code, majorId, grade, studentCount, headTeacher, status } = ctx.request.body;

    const classInfo = await app.mysql.get('edu_class', { id });
    if (!classInfo) {
      this.notFound('班级不存在');
      return;
    }

    await app.mysql.update('edu_class', {
      id,
      name,
      code,
      major_id: majorId,
      grade,
      student_count: studentCount,
      head_teacher: headTeacher,
      status,
      updated_at: new Date(),
    });

    await this.log(`更新班级: ${name || classInfo.name}`);
    this.success(null, '更新成功');
  }

  public async destroy() {
    const { ctx, app } = this;
    const id = ctx.params.id;

    const classInfo = await app.mysql.get('edu_class', { id });
    if (!classInfo) {
      this.notFound('班级不存在');
      return;
    }

    await app.mysql.delete('edu_class', { id });

    await this.log(`删除班级: ${classInfo.name}`);
    this.success(null, '删除成功');
  }

  public async all() {
    const { app } = this;
    const list = await app.mysql.select('edu_class', {
      where: { status: 1 },
      orders: [['created_at', 'DESC']],
    });
    this.success(list);
  }
}
