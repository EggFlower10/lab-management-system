import BaseController from './base';

export default class TeachingTaskController extends BaseController {
  public async index() {
    const { ctx, app } = this;
    const { semesterId, courseId, classId, teacherId, status } = ctx.query;

    const where: any = {};
    if (semesterId) where.semester_id = parseInt(semesterId as string);
    if (courseId) where.course_id = parseInt(courseId as string);
    if (classId) where.class_id = parseInt(classId as string);
    if (teacherId) where.teacher_id = parseInt(teacherId as string);
    if (status) where.status = parseInt(status as string);

    const total = await app.mysql.count('edu_teaching_task', where);
    const list = await app.mysql.select('edu_teaching_task', {
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

    const task = await app.mysql.get('edu_teaching_task', { id });
    if (!task) {
      this.notFound('教学任务不存在');
      return;
    }

    this.success(task);
  }

  public async create() {
    const { ctx, app } = this;
    const { semesterId, courseId, classId, teacherId, weeklyHours, totalHours, classroom, status } = ctx.request.body;

    const result = await app.mysql.insert('edu_teaching_task', {
      semester_id: semesterId,
      course_id: courseId,
      class_id: classId,
      teacher_id: teacherId,
      weekly_hours: weeklyHours,
      total_hours: totalHours,
      classroom,
      status: status ?? 1,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await this.log(`创建教学任务`);
    this.success({ id: result.insertId }, '创建成功');
  }

  public async update() {
    const { ctx, app } = this;
    const id = ctx.params.id;
    const { semesterId, courseId, classId, teacherId, weeklyHours, totalHours, classroom, status } = ctx.request.body;

    const task = await app.mysql.get('edu_teaching_task', { id });
    if (!task) {
      this.notFound('教学任务不存在');
      return;
    }

    await app.mysql.update('edu_teaching_task', {
      id,
      semester_id: semesterId,
      course_id: courseId,
      class_id: classId,
      teacher_id: teacherId,
      weekly_hours: weeklyHours,
      total_hours: totalHours,
      classroom,
      status,
      updated_at: new Date(),
    });

    await this.log(`更新教学任务`);
    this.success(null, '更新成功');
  }

  public async destroy() {
    const { ctx, app } = this;
    const id = ctx.params.id;

    const task = await app.mysql.get('edu_teaching_task', { id });
    if (!task) {
      this.notFound('教学任务不存在');
      return;
    }

    await app.mysql.delete('edu_teaching_task', { id });

    await this.log(`删除教学任务`);
    this.success(null, '删除成功');
  }
}
