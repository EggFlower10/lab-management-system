import BaseController from './base';

export default class CalendarController extends BaseController {
  public async index() {
    const { ctx, app } = this;
    const { semesterId, startDate, endDate } = ctx.query;

    const where: any = {};
    if (semesterId) where.semester_id = parseInt(semesterId as string);

    let sql = 'SELECT * FROM edu_calendar WHERE 1=1';
    const params: any[] = [];

    if (where.semester_id) {
      sql += ' AND semester_id = ?';
      params.push(where.semester_id);
    }
    if (startDate) {
      sql += ' AND date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND date <= ?';
      params.push(endDate);
    }

    sql += ' ORDER BY date ASC';

    const list = await app.mysql.query(sql, params);
    this.success(list);
  }

  public async show() {
    const { ctx, app } = this;
    const id = ctx.params.id;

    const calendar = await app.mysql.get('edu_calendar', { id });
    if (!calendar) {
      this.notFound('日历不存在');
      return;
    }

    this.success(calendar);
  }

  public async create() {
    const { ctx, app } = this;
    const { semesterId, date, week, weekDay, type, description } = ctx.request.body;

    const existCalendar = await app.mysql.get('edu_calendar', { semester_id: semesterId, date });
    if (existCalendar) {
      this.error('该日期已存在', 400);
      return;
    }

    const result = await app.mysql.insert('edu_calendar', {
      semester_id: semesterId,
      date,
      week,
      week_day: weekDay,
      type: type || 'normal',
      description,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await this.log(`创建校历: ${date}`);
    this.success({ id: result.insertId }, '创建成功');
  }

  public async update() {
    const { ctx, app } = this;
    const id = ctx.params.id;
    const { semesterId, date, week, weekDay, type, description } = ctx.request.body;

    const calendar = await app.mysql.get('edu_calendar', { id });
    if (!calendar) {
      this.notFound('日历不存在');
      return;
    }

    await app.mysql.update('edu_calendar', {
      id,
      semester_id: semesterId,
      date,
      week,
      week_day: weekDay,
      type,
      description,
      updated_at: new Date(),
    });

    await this.log(`更新校历: ${date || calendar.date}`);
    this.success(null, '更新成功');
  }

  public async destroy() {
    const { ctx, app } = this;
    const id = ctx.params.id;

    const calendar = await app.mysql.get('edu_calendar', { id });
    if (!calendar) {
      this.notFound('日历不存在');
      return;
    }

    await app.mysql.delete('edu_calendar', { id });

    await this.log(`删除校历: ${calendar.date}`);
    this.success(null, '删除成功');
  }

  public async generate() {
    const { ctx, app } = this;
    const { semesterId, startDate, endDate, totalWeeks } = ctx.request.body;

    const semester = await app.mysql.get('edu_semester', { id: semesterId });
    if (!semester) {
      this.notFound('学期不存在');
      return;
    }

    await app.mysql.delete('edu_calendar', { semester_id: semesterId });

    const start = new Date(startDate);
    const end = new Date(endDate);
    const records: any[] = [];

    let currentDate = new Date(start);
    let week = 1;
    let dayCount = 0;

    while (currentDate <= end) {
      const weekDay = currentDate.getDay();
      records.push({
        semester_id: semesterId,
        date: currentDate.toISOString().split('T')[0],
        week,
        week_day: weekDay === 0 ? 7 : weekDay,
        type: 'normal',
        created_at: new Date(),
        updated_at: new Date(),
      });

      dayCount++;
      if (dayCount % 7 === 0) {
        week++;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (records.length > 0) {
      await app.mysql.insert('edu_calendar', records);
    }

    await this.log(`生成校历: ${semester.name}`);
    this.success({ total: records.length }, '生成成功');
  }
}
