import BaseController from './base';

export default class CourseController extends BaseController {
  public async index() {
    const { ctx, app } = this;
    const { CourseName, CourseCode, CourseNature, Status } = ctx.query;

    const where: any = {};
    if (CourseName) where.CourseName = CourseName;
    if (CourseCode) where.CourseCode = CourseCode;
    if (CourseNature) where.CourseNature = CourseNature;
    if (Status !== undefined && Status !== '') where.Status = parseInt(Status as string);

    const total = await app.mysql.count('Edu_Course', where);
    const list = await app.mysql.select('Edu_Course', {
      where,
      orders: [['CreatedAt', 'DESC']],
      limit: this.pageSize,
      offset: this.offset,
    });

    this.pageResult(list, total);
  }

  public async show() {
    const { ctx, app } = this;
    const id = ctx.params.id;

    const course = await app.mysql.get('Edu_Course', { CourseID: id });
    if (!course) {
      this.notFound('课程不存在');
      return;
    }

    this.success(course);
  }

  public async create() {
    const { ctx, app } = this;
    const { 
      CourseCode, CourseName, CourseNameEn, CourseNature, CourseType, 
      Credits, TotalHours, LectureHours, PracticeHours, LabHours, OnlineHours,
      OpenSemesters, SortOrder, Description, Status 
    } = ctx.request.body;

    const existCourse = await app.mysql.get('Edu_Course', { CourseCode });
    if (existCourse) {
      this.error('课程编码已存在', 400);
      return;
    }

    const result = await app.mysql.insert('Edu_Course', {
      CourseCode,
      CourseName,
      CourseNameEn: CourseNameEn || '',
      CourseNature: CourseNature || 'Compulsory',
      CourseType: CourseType || '',
      Credits: Credits || 0,
      TotalHours: TotalHours || 0,
      LectureHours: LectureHours || 0,
      PracticeHours: PracticeHours || 0,
      LabHours: LabHours || 0,
      OnlineHours: OnlineHours || 0,
      OpenSemesters: OpenSemesters || '',
      SortOrder: SortOrder || 0,
      Description: Description || '',
      Status: Status ?? 1,
      CreatedAt: new Date(),
      UpdatedAt: new Date(),
    });

    await this.log(`创建课程: ${CourseName}`);
    this.success({ CourseID: result.insertId }, '创建成功');
  }

  public async update() {
    const { ctx, app } = this;
    const id = ctx.params.id;
    const { 
      CourseCode, CourseName, CourseNameEn, CourseNature, CourseType, 
      Credits, TotalHours, LectureHours, PracticeHours, LabHours, OnlineHours,
      OpenSemesters, SortOrder, Description, Status 
    } = ctx.request.body;

    const course = await app.mysql.get('Edu_Course', { CourseID: id });
    if (!course) {
      this.notFound('课程不存在');
      return;
    }

    if (CourseCode && CourseCode !== course.CourseCode) {
      const existCourse = await app.mysql.get('Edu_Course', { CourseCode });
      if (existCourse) {
        this.error('课程编码已存在', 400);
        return;
      }
    }

    await app.mysql.update('Edu_Course', {
      CourseID: id,
      CourseCode,
      CourseName,
      CourseNameEn: CourseNameEn || '',
      CourseNature: CourseNature || 'Compulsory',
      CourseType: CourseType || '',
      Credits: Credits || 0,
      TotalHours: TotalHours || 0,
      LectureHours: LectureHours || 0,
      PracticeHours: PracticeHours || 0,
      LabHours: LabHours || 0,
      OnlineHours: OnlineHours || 0,
      OpenSemesters: OpenSemesters || '',
      SortOrder: SortOrder || 0,
      Description: Description || '',
      Status: Status ?? 1,
      UpdatedAt: new Date(),
    });

    await this.log(`更新课程: ${CourseName || course.CourseName}`);
    this.success(null, '更新成功');
  }

  public async destroy() {
    const { ctx, app } = this;
    const id = ctx.params.id;

    const course = await app.mysql.get('Edu_Course', { CourseID: id });
    if (!course) {
      this.notFound('课程不存在');
      return;
    }

    await app.mysql.delete('Edu_Course', { CourseID: id });

    await this.log(`删除课程: ${course.CourseName}`);
    this.success(null, '删除成功');
  }

  public async all() {
    const { app } = this;
    const list = await app.mysql.select('Edu_Course', {
      where: { Status: 1 },
      orders: [['CreatedAt', 'DESC']],
    });
    this.success(list);
  }
}