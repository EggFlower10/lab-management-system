import BaseController from './base';

export default class MajorController extends BaseController {
  public async index() {
    const { ctx, app } = this;
    const { name, code, orgId, status } = ctx.query;

    const where: any = {};
    if (name) where.name = name;
    if (code) where.code = code;
    if (orgId) where.org_id = parseInt(orgId as string);
    if (status) where.status = parseInt(status as string);

    const total = await app.mysql.count('edu_major', where);
    const list = await app.mysql.select('edu_major', {
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

    const major = await app.mysql.get('edu_major', { id });
    if (!major) {
      this.notFound('专业不存在');
      return;
    }

    this.success(major);
  }

  public async create() {
    const { ctx, app } = this;
    const { name, code, orgId, degree, duration, description, status } = ctx.request.body;

    const existMajor = await app.mysql.get('edu_major', { code });
    if (existMajor) {
      this.error('专业编码已存在', 400);
      return;
    }

    const result = await app.mysql.insert('edu_major', {
      name,
      code,
      org_id: orgId,
      degree,
      duration,
      description,
      status: status ?? 1,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await this.log(`创建专业: ${name}`);
    this.success({ id: result.insertId }, '创建成功');
  }

  public async update() {
    const { ctx, app } = this;
    const id = ctx.params.id;
    const { name, code, orgId, degree, duration, description, status } = ctx.request.body;

    const major = await app.mysql.get('edu_major', { id });
    if (!major) {
      this.notFound('专业不存在');
      return;
    }

    await app.mysql.update('edu_major', {
      id,
      name,
      code,
      org_id: orgId,
      degree,
      duration,
      description,
      status,
      updated_at: new Date(),
    });

    await this.log(`更新专业: ${name || major.name}`);
    this.success(null, '更新成功');
  }

  public async destroy() {
    const { ctx, app } = this;
    const id = ctx.params.id;

    const major = await app.mysql.get('edu_major', { id });
    if (!major) {
      this.notFound('专业不存在');
      return;
    }

    const classCount = await app.mysql.count('edu_class', { major_id: id });
    if (classCount > 0) {
      this.error('该专业下存在班级，不能删除', 400);
      return;
    }

    await app.mysql.delete('edu_major', { id });

    await this.log(`删除专业: ${major.name}`);
    this.success(null, '删除成功');
  }

  public async all() {
    const { app } = this;
    const list = await app.mysql.select('edu_major', {
      where: { status: 1 },
      orders: [['created_at', 'DESC']],
    });
    this.success(list);
  }
}
