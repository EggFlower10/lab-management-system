const {
  AlignmentType,
  BorderStyle,
  Document,
  HeightRule,
  HeadingLevel,
  Packer,
  PageBreak,
  Paragraph,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlignTable,
  VerticalMergeType,
  WidthType,
} = require('docx');
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const xmlJs = require('xml-js');

class ExportController {
  constructor(pool) {
    this.pool = pool;
  }

  async exportTaskOverview() {
    const rows = await this.queryFirstSuccess([
      {
        sql: `
          SELECT
            et.id AS TaskID,
            s.SemesterName AS SemesterName,
            m.MajorName AS MajorName,
            c.ClassName AS ClassName,
            et.student_count AS StudentCount,
            et.student_level AS StudentLevel,
            et.course_name AS CourseName,
            et.course_category AS CourseCategory,
            et.is_independent AS IsIndependent,
            et.experiment_total_hours AS ExperimentTotalHours,
            et.experiment_current_hours AS ExperimentCurrentHours,
            et.practice_total_hours AS PracticeTotalHours,
            et.practice_current_hours AS PracticeCurrentHours,
            et.training_total_hours AS TrainingTotalHours,
            et.training_current_hours AS TrainingCurrentHours,
            o.name AS OrgName,
            d.DepartmentName AS DeptName,
            et.teacher_name AS TeacherName,
            et.teacher_title AS TeacherTitle,
            et.technician_name AS TechnicianName,
            et.technician_title AS TechnicianTitle,
            et.textbook_name AS TextbookName,
            et.guidebook_name AS GuidebookName,
            et.status AS Status
          FROM edu_experiment_task et
          LEFT JOIN edu_semester s ON et.semester_id = s.SemesterID
          LEFT JOIN edu_major m ON et.major_id = m.MajorID
          LEFT JOIN edu_class c ON et.class_id = c.ClassID
          LEFT JOIN sys_organization o ON et.org_id = o.id
          LEFT JOIN sys_department d ON et.dept_id = d.DepartmentID
          ORDER BY et.id DESC
        `,
      },
      {
        sql: `
          SELECT
            et.id AS TaskID,
            s.name AS SemesterName,
            m.name AS MajorName,
            c.name AS ClassName,
            et.student_count AS StudentCount,
            et.student_level AS StudentLevel,
            et.course_name AS CourseName,
            et.course_category AS CourseCategory,
            et.is_independent AS IsIndependent,
            et.experiment_total_hours AS ExperimentTotalHours,
            et.experiment_current_hours AS ExperimentCurrentHours,
            et.practice_total_hours AS PracticeTotalHours,
            et.practice_current_hours AS PracticeCurrentHours,
            et.training_total_hours AS TrainingTotalHours,
            et.training_current_hours AS TrainingCurrentHours,
            o.name AS OrgName,
            d.name AS DeptName,
            et.teacher_name AS TeacherName,
            et.teacher_title AS TeacherTitle,
            et.technician_name AS TechnicianName,
            et.technician_title AS TechnicianTitle,
            et.textbook_name AS TextbookName,
            et.guidebook_name AS GuidebookName,
            et.status AS Status
          FROM edu_experiment_task et
          LEFT JOIN edu_semester s ON et.semester_id = s.id
          LEFT JOIN edu_major m ON et.major_id = m.id
          LEFT JOIN edu_class c ON et.class_id = c.id
          LEFT JOIN sys_organization o ON et.org_id = o.id
          LEFT JOIN sys_department d ON et.dept_id = d.id
          ORDER BY et.id DESC
        `,
      },
      {
        sql: `
          SELECT
            et.id AS TaskID,
            s.SemesterName AS SemesterName,
            m.MajorName AS MajorName,
            c.ClassName AS ClassName,
            et.student_count AS StudentCount,
            et.student_level AS StudentLevel,
            et.course_name AS CourseName,
            et.course_category AS CourseCategory,
            et.is_independent AS IsIndependent,
            et.experiment_total_hours AS ExperimentTotalHours,
            et.experiment_current_hours AS ExperimentCurrentHours,
            et.practice_total_hours AS PracticeTotalHours,
            et.practice_current_hours AS PracticeCurrentHours,
            et.training_total_hours AS TrainingTotalHours,
            et.training_current_hours AS TrainingCurrentHours,
            o.InstitutionName AS OrgName,
            d.DepartmentName AS DeptName,
            et.teacher_name AS TeacherName,
            et.teacher_title AS TeacherTitle,
            et.technician_name AS TechnicianName,
            et.technician_title AS TechnicianTitle,
            et.textbook_name AS TextbookName,
            et.guidebook_name AS GuidebookName,
            et.status AS Status
          FROM edu_experiment_task et
          LEFT JOIN edu_semester s ON et.semester_id = s.SemesterID
          LEFT JOIN edu_major m ON et.major_id = m.MajorID
          LEFT JOIN edu_class c ON et.class_id = c.ClassID
          LEFT JOIN sys_institution o ON et.org_id = o.InstitutionID
          LEFT JOIN sys_department d ON et.dept_id = d.DepartmentID
          ORDER BY et.id DESC
        `,
      },
      {
        sql: `
          SELECT
            et.id AS TaskID,
            et.semester_id AS SemesterName,
            et.major_id AS MajorName,
            et.class_id AS ClassName,
            et.student_count AS StudentCount,
            et.student_level AS StudentLevel,
            et.course_name AS CourseName,
            et.course_category AS CourseCategory,
            et.is_independent AS IsIndependent,
            et.experiment_total_hours AS ExperimentTotalHours,
            et.experiment_current_hours AS ExperimentCurrentHours,
            et.practice_total_hours AS PracticeTotalHours,
            et.practice_current_hours AS PracticeCurrentHours,
            et.training_total_hours AS TrainingTotalHours,
            et.training_current_hours AS TrainingCurrentHours,
            et.org_id AS OrgName,
            et.dept_id AS DeptName,
            et.teacher_name AS TeacherName,
            et.teacher_title AS TeacherTitle,
            et.technician_name AS TechnicianName,
            et.technician_title AS TechnicianTitle,
            et.textbook_name AS TextbookName,
            et.guidebook_name AS GuidebookName,
            et.status AS Status
          FROM edu_experiment_task et
          ORDER BY et.id DESC
        `,
      },
    ]);

    return this.buildTableDocument('实验教学任务一览表', [
      { key: 'TaskID', title: 'ID', width: 6 },
      { key: 'SemesterName', title: '学期', width: 10 },
      { key: 'MajorName', title: '专业', width: 10 },
      { key: 'ClassName', title: '班级', width: 10 },
      { key: 'StudentCount', title: '人数', width: 6 },
      { key: 'StudentLevel', title: '层次', width: 8 },
      { key: 'CourseName', title: '课程名称', width: 14 },
      { key: 'CourseCategory', title: '课程类别', width: 10 },
      { key: 'IsIndependent', title: '独立设课', width: 8, format: (value) => this.formatBoolean(value) },
      { key: 'ExperimentCurrentHours', title: '实验学时', width: 8 },
      { key: 'PracticeCurrentHours', title: '实践学时', width: 8 },
      { key: 'TrainingCurrentHours', title: '实训学时', width: 8 },
      { key: 'TeacherName', title: '授课教师', width: 8 },
      { key: 'TeacherTitle', title: '教师职称', width: 8 },
      { key: 'TechnicianName', title: '技术人员', width: 8 },
      { key: 'TechnicianTitle', title: '技术职称', width: 8 },
      { key: 'OrgName', title: '开课机构', width: 10 },
      { key: 'DeptName', title: '开课部门', width: 10 },
      { key: 'TextbookName', title: '教材名称', width: 12 },
      { key: 'GuidebookName', title: '指导书名称', width: 12 },
      { key: 'Status', title: '状态', width: 6, format: (value) => this.formatStatus(value) },
    ], rows);
  }

  async exportProjectLibrary() {
    const [rows] = await this.pool.query(`
      SELECT
        id,
        course_code,
        project_name,
        experiment_hours,
        experiment_type,
        experiment_requirement,
        description,
        status
      FROM edu_experiment_project
      ORDER BY id DESC
    `);

    return this.buildTableDocument('实验项目库', [
      { key: 'id', title: 'ID', width: 8 },
      { key: 'course_code', title: '课程编号', width: 12 },
      { key: 'project_name', title: '实验项目名称', width: 20 },
      { key: 'experiment_hours', title: '实验学时', width: 10 },
      { key: 'experiment_type', title: '实验类别', width: 12 },
      { key: 'experiment_requirement', title: '实验要求', width: 12 },
      { key: 'description', title: '说明', width: 20 },
      { key: 'status', title: '状态', width: 6, format: (value) => this.formatStatus(value) },
    ], rows);
  }

  async exportTeachingPlan(payload = {}) {
    const taskIds = this.normalizeTaskIds(payload);
    const tasks = await this.queryTeachingPlanTasks(taskIds);

    if (tasks.length === 0) {
      throw new Error('未找到可导出的实验教学授课计划数据');
    }

    const offers = await this.queryTeachingPlanOffers(taskIds.length > 0 ? taskIds : tasks.map((item) => item.id));
    return this.buildTeachingPlanFromTemplate(tasks, offers);
  }

  async exportProjectStatistics() {
    const rows = await this.queryFirstSuccess([
      {
        sql: `
          SELECT
            et.id AS task_id,
            m.MajorName AS MajorName,
            c.ClassName AS ClassName,
            et.course_name AS course_name,
            et.teacher_name AS teacher_name,
            COUNT(eo.id) AS planned_count,
            SUM(CASE WHEN eo.is_offered = 1 THEN 1 ELSE 0 END) AS actual_count,
            SUM(CASE WHEN eo.is_offered = 0 THEN 1 ELSE 0 END) AS not_offered_count,
            COALESCE(SUM(ep.experiment_hours), 0) AS total_hours,
            GROUP_CONCAT(CASE WHEN eo.is_offered = 0 THEN ep.project_name END SEPARATOR '; ') AS not_offered_projects
          FROM edu_experiment_task et
          LEFT JOIN edu_major m ON et.major_id = m.MajorID
          LEFT JOIN edu_class c ON et.class_id = c.ClassID
          LEFT JOIN edu_experiment_project_offer eo ON et.id = eo.task_id
          LEFT JOIN edu_experiment_project ep ON eo.project_id = ep.id
          GROUP BY et.id, m.MajorName, c.ClassName, et.course_name, et.teacher_name
          ORDER BY et.id DESC
        `,
      },
      {
        sql: `
          SELECT
            et.id AS task_id,
            m.name AS MajorName,
            c.name AS ClassName,
            et.course_name AS course_name,
            et.teacher_name AS teacher_name,
            COUNT(eo.id) AS planned_count,
            SUM(CASE WHEN eo.is_offered = 1 THEN 1 ELSE 0 END) AS actual_count,
            SUM(CASE WHEN eo.is_offered = 0 THEN 1 ELSE 0 END) AS not_offered_count,
            COALESCE(SUM(ep.experiment_hours), 0) AS total_hours,
            GROUP_CONCAT(CASE WHEN eo.is_offered = 0 THEN ep.project_name END SEPARATOR '; ') AS not_offered_projects
          FROM edu_experiment_task et
          LEFT JOIN edu_major m ON et.major_id = m.id
          LEFT JOIN edu_class c ON et.class_id = c.id
          LEFT JOIN edu_experiment_project_offer eo ON et.id = eo.task_id
          LEFT JOIN edu_experiment_project ep ON eo.project_id = ep.id
          GROUP BY et.id, m.name, c.name, et.course_name, et.teacher_name
          ORDER BY et.id DESC
        `,
      },
      {
        sql: `
          SELECT
            et.id AS task_id,
            et.major_id AS MajorName,
            et.class_id AS ClassName,
            et.course_name AS course_name,
            et.teacher_name AS teacher_name,
            COUNT(eo.id) AS planned_count,
            SUM(CASE WHEN eo.is_offered = 1 THEN 1 ELSE 0 END) AS actual_count,
            SUM(CASE WHEN eo.is_offered = 0 THEN 1 ELSE 0 END) AS not_offered_count,
            COALESCE(SUM(ep.experiment_hours), 0) AS total_hours,
            GROUP_CONCAT(CASE WHEN eo.is_offered = 0 THEN ep.project_name END SEPARATOR '; ') AS not_offered_projects
          FROM edu_experiment_task et
          LEFT JOIN edu_experiment_project_offer eo ON et.id = eo.task_id
          LEFT JOIN edu_experiment_project ep ON eo.project_id = ep.id
          GROUP BY et.id, et.major_id, et.class_id, et.course_name, et.teacher_name
          ORDER BY et.id DESC
        `,
      },
    ]);

    return this.buildTableDocument('实验项目统计表', [
      { key: 'task_id', title: '任务ID', width: 8 },
      { key: 'MajorName', title: '专业', width: 10 },
      { key: 'ClassName', title: '班级', width: 10 },
      { key: 'course_name', title: '课程名称', width: 16 },
      { key: 'teacher_name', title: '授课教师', width: 10 },
      { key: 'planned_count', title: '计划开设数', width: 9 },
      { key: 'actual_count', title: '实际开出数', width: 9 },
      { key: 'not_offered_count', title: '未开出数', width: 8 },
      { key: 'total_hours', title: '总实验学时', width: 9 },
      { key: 'not_offered_projects', title: '未开出项目', width: 21 },
    ], rows);
  }

  async exportQualityAnalysis() {
    const [rows] = await this.pool.query(`
      SELECT
        eq.id,
        et.course_name AS TaskCourseName,
        eq.organization,
        eq.course_name,
        eq.experiment_hours,
        eq.is_independent,
        eq.teacher_name,
        eq.teacher_title,
        eq.technician_name,
        eq.technician_title,
        eq.class_name,
        eq.class_student_count,
        eq.planned_project_count,
        eq.actual_project_count,
        eq.not_offered_projects,
        eq.not_offered_reasons,
        eq.assessment_method,
        eq.assessment_count,
        eq.assessment_time,
        eq.status
      FROM edu_experiment_quality eq
      LEFT JOIN edu_experiment_task et ON eq.task_id = et.id
      ORDER BY eq.id DESC
    `);

    return this.buildTableDocument('实验课程教学质量分析', [
      { key: 'id', title: 'ID', width: 6 },
      { key: 'TaskCourseName', title: '教学任务', width: 14 },
      { key: 'organization', title: '机构', width: 10 },
      { key: 'course_name', title: '课程名称', width: 14 },
      { key: 'experiment_hours', title: '实验学时', width: 8 },
      { key: 'is_independent', title: '独立设课', width: 8, format: (value) => this.formatBoolean(value) },
      { key: 'teacher_name', title: '主讲教师', width: 8 },
      { key: 'teacher_title', title: '职称', width: 8 },
      { key: 'technician_name', title: '实验技术人员', width: 10 },
      { key: 'technician_title', title: '职称', width: 8 },
      { key: 'class_name', title: '授课班级', width: 10 },
      { key: 'class_student_count', title: '班级人数', width: 8 },
      { key: 'planned_project_count', title: '计划开设', width: 8 },
      { key: 'actual_project_count', title: '实际开出', width: 8 },
      { key: 'not_offered_projects', title: '未开出项目', width: 14 },
      { key: 'not_offered_reasons', title: '未开出原因', width: 14 },
      { key: 'assessment_method', title: '考核方式', width: 8 },
      { key: 'assessment_count', title: '考核人数', width: 8 },
      { key: 'assessment_time', title: '考核时间', width: 12, format: (value) => this.formatDateTime(value) },
      { key: 'status', title: '状态', width: 6, format: (value) => this.formatStatus(value) },
    ], rows);
  }

  async exportTrainingPlan() {
    const [rows] = await this.pool.query(`
      SELECT
        id,
        course_code,
        organization_mode,
        training_location,
        training_purpose,
        teaching_content,
        training_method,
        assessment_method,
        quality_measures,
        center_opinion,
        department_opinion,
        status
      FROM edu_training_plan
      ORDER BY id DESC
    `);

    return this.buildTableDocument('实训教学计划', [
      { key: 'id', title: 'ID', width: 6 },
      { key: 'course_code', title: '课程编号', width: 10 },
      { key: 'organization_mode', title: '组织方式', width: 10 },
      { key: 'training_location', title: '实训地点', width: 12 },
      { key: 'training_purpose', title: '实训目的和要求', width: 16 },
      { key: 'teaching_content', title: '教学内容及进度', width: 18 },
      { key: 'training_method', title: '实训方式', width: 14 },
      { key: 'assessment_method', title: '考核方式', width: 10 },
      { key: 'quality_measures', title: '质量保障措施', width: 14 },
      { key: 'center_opinion', title: '实验中心意见', width: 14 },
      { key: 'department_opinion', title: '院系意见', width: 14 },
      { key: 'status', title: '状态', width: 6, format: (value) => this.formatStatus(value) },
    ], rows);
  }

  async queryFirstSuccess(candidates) {
    let lastError;

    for (const candidate of candidates) {
      try {
        const [rows] = await this.pool.query(candidate.sql, candidate.params || []);
        return rows;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError;
  }

  buildTableDocument(title, columns, rows) {
    const tableRows = [
      new TableRow({
        tableHeader: true,
        children: columns.map((column) => this.createHeaderCell(column)),
      }),
      ...(rows.length > 0
        ? rows.map((row) => new TableRow({
          children: columns.map((column) => this.createBodyCell(this.getCellText(row, column), column)),
        }))
        : [
          new TableRow({
            children: [
              new TableCell({
                columnSpan: columns.length,
                children: [this.createParagraph('暂无数据', AlignmentType.CENTER)],
              }),
            ],
          }),
        ]),
    ];

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              text: title,
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { after: 240 },
            }),
            new Paragraph({
              text: `导出时间：${this.formatDateTime(new Date())}`,
              alignment: AlignmentType.RIGHT,
              spacing: { after: 160 },
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: tableRows,
            }),
          ],
        },
      ],
    });

    return Packer.toBuffer(doc);
  }

  async queryTeachingPlanTasks(taskIds) {
    const filter = taskIds.length > 0 ? `WHERE et.id IN (${taskIds.map(() => '?').join(', ')})` : '';
    const params = taskIds.length > 0 ? taskIds : [];

    return this.queryFirstSuccess([
      {
        sql: `
          SELECT
            et.id,
            et.course_name,
            et.teacher_name,
            et.teacher_title,
            et.technician_name,
            et.technician_title,
            et.student_count,
            et.student_level,
            et.course_category,
            et.experiment_total_hours,
            et.experiment_current_hours,
            et.practice_total_hours,
            et.practice_current_hours,
            et.training_total_hours,
            et.training_current_hours,
            et.textbook_name,
            et.guidebook_name,
            s.SemesterName,
            s.SchoolYear,
            s.SemesterNo,
            m.MajorName,
            c.ClassName,
            d.DepartmentName,
            o.InstitutionName
          FROM edu_experiment_task et
          LEFT JOIN edu_semester s ON et.semester_id = s.SemesterID
          LEFT JOIN edu_major m ON et.major_id = m.MajorID
          LEFT JOIN edu_class c ON et.class_id = c.ClassID
          LEFT JOIN sys_department d ON et.dept_id = d.DepartmentID
          LEFT JOIN sys_institution o ON et.org_id = o.InstitutionID
          ${filter}
          ORDER BY et.id ASC
        `,
        params,
      },
      {
        sql: `
          SELECT
            et.id,
            et.course_name,
            et.teacher_name,
            et.teacher_title,
            et.technician_name,
            et.technician_title,
            et.student_count,
            et.student_level,
            et.course_category,
            et.experiment_total_hours,
            et.experiment_current_hours,
            et.practice_total_hours,
            et.practice_current_hours,
            et.training_total_hours,
            et.training_current_hours,
            et.textbook_name,
            et.guidebook_name,
            s.SemesterName,
            s.SchoolYear,
            s.SemesterNo,
            m.MajorName,
            c.ClassName,
            d.DepartmentName,
            o.name AS InstitutionName
          FROM edu_experiment_task et
          LEFT JOIN edu_semester s ON et.semester_id = s.SemesterID
          LEFT JOIN edu_major m ON et.major_id = m.MajorID
          LEFT JOIN edu_class c ON et.class_id = c.ClassID
          LEFT JOIN sys_department d ON et.dept_id = d.DepartmentID
          LEFT JOIN sys_organization o ON et.org_id = o.id
          ${filter}
          ORDER BY et.id ASC
        `,
        params,
      },
      {
        sql: `
          SELECT
            et.*,
            '' AS SemesterName,
            '' AS SchoolYear,
            '' AS SemesterNo,
            '' AS MajorName,
            '' AS ClassName,
            '' AS DepartmentName,
            '' AS InstitutionName
          FROM edu_experiment_task et
          ${filter}
          ORDER BY et.id ASC
        `,
        params,
      },
    ]);
  }

  async queryTeachingPlanOffers(taskIds) {
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return [];
    }

    const params = taskIds;
    const whereClause = `WHERE eo.task_id IN (${taskIds.map(() => '?').join(', ')})`;

    return this.queryFirstSuccess([
      {
        sql: `
          SELECT
            eo.id,
            eo.task_id,
            eo.week_no,
            eo.week_day,
            eo.time_slot,
            eo.group_count,
            eo.students_per_group,
            eo.cycle_count,
            eo.experiment_requirement,
            eo.building_name,
            eo.room_number,
            eo.is_offered,
            eo.not_offered_reason,
            ep.project_name,
            ep.experiment_hours,
            ep.experiment_type
          FROM edu_experiment_project_offer eo
          LEFT JOIN edu_experiment_project ep ON eo.project_id = ep.id
          ${whereClause}
          ORDER BY eo.task_id ASC, eo.id ASC
        `,
        params,
      },
      {
        sql: `
          SELECT
            eo.*,
            '' AS project_name,
            '' AS experiment_hours,
            '' AS experiment_type
          FROM edu_experiment_project_offer eo
          ${whereClause}
          ORDER BY eo.task_id ASC, eo.id ASC
        `,
        params,
      },
    ]);
  }

  async buildTeachingPlanFromTemplate(tasks, offers) {
    const templatePath = path.join(__dirname, '..', 'teaching-plan-template.docx');
    const templateBuffer = fs.readFileSync(templatePath);
    const zip = await JSZip.loadAsync(templateBuffer);
    const xml = await zip.file('word/document.xml').async('string');
    const doc = xmlJs.xml2js(xml, { compact: false });
    const body = this.findFirstElement(doc, 'w:body');

    if (!body || !Array.isArray(body.elements)) {
      throw new Error('授课计划模板结构无效');
    }

    const templateBlocks = body.elements.filter((item) => item.name !== 'w:sectPr');
    const sectPr = body.elements.find((item) => item.name === 'w:sectPr');
    const offerMap = new Map();

    offers.forEach((offer) => {
      if (!offerMap.has(offer.task_id)) {
        offerMap.set(offer.task_id, []);
      }
      offerMap.get(offer.task_id).push(offer);
    });

    const newBodyElements = [];
    tasks.forEach((task, index) => {
      const blockClones = this.deepClone(templateBlocks);
      this.fillTeachingPlanTemplate(blockClones, task, offerMap.get(task.id) || []);

      if (index > 0) {
        const pageBreakParagraph = this.createTemplatePageBreakParagraph();
        if (pageBreakParagraph) {
          newBodyElements.push(pageBreakParagraph);
        }
      }

      newBodyElements.push(...blockClones);
    });

    if (sectPr) {
      newBodyElements.push(this.deepClone(sectPr));
    }

    body.elements = newBodyElements;
    zip.file('word/document.xml', xmlJs.js2xml(doc, { compact: false }));
    return zip.generateAsync({ type: 'nodebuffer' });
  }

  fillTeachingPlanTemplate(blocks, task, offers) {
    const paragraphs = blocks.filter((item) => item.name === 'w:p');
    const table = blocks.find((item) => item.name === 'w:tbl');
    const rows = table ? table.elements.filter((item) => item.name === 'w:tr') : [];
    const detailRows = offers.length > 0 ? offers : [];

    if (paragraphs[1]) {
      this.setParagraphText(paragraphs[1], this.buildSemesterHeading(task));
    }

    if (paragraphs[5]) {
      this.setParagraphText(paragraphs[5], '任课教师本人签名：                                            年    月     日');
    }

    if (paragraphs[7]) {
      this.setParagraphText(paragraphs[7], '主管领导审核签字（加盖公章）：                      年    月     日');
    }

    if (rows.length < 22) {
      throw new Error('授课计划模板表格行数不足');
    }

    this.setTableCellText(rows[0], 1, task.course_name);
    this.setTableCellText(rows[0], 3, task.textbook_name);
    this.setTableCellText(rows[0], 5, task.guidebook_name);

    this.setTableCellText(rows[1], 1, task.MajorName);
    this.setTableCellText(rows[1], 3, task.ClassName);
    this.setTableCellText(rows[1], 5, this.normalizeValue(task.student_count));
    this.setTableCellText(rows[2], 6, this.isUndergraduate(task.student_level) ? '√' : '');
    this.setTableCellText(rows[2], 7, !this.isUndergraduate(task.student_level) && this.normalizeValue(task.student_level) ? '√' : '');

    this.appendTableCellText(rows[3], 1, `  选项：${this.mapCourseCategory(task.course_category)}`);
    this.setTableCellText(rows[3], 3, '');

    this.setTableCellText(rows[4], 1, this.getTeachingPlanCourseTotalHours(task));
    this.setTableCellText(rows[4], 3, this.normalizeValue(task.experiment_total_hours));
    this.setTableCellText(rows[4], 5, task.SemesterName || this.buildSemesterText(task));
    this.setTableCellText(rows[4], 7, this.normalizeValue(task.experiment_current_hours));
    this.setTableCellText(rows[4], 9, this.normalizeValue(offers.length));

    this.setTableCellText(rows[5], 1, this.joinTeacherInfo(task.teacher_name, task.teacher_title));
    this.setTableCellText(rows[5], 3, this.joinTeacherInfo(task.technician_name, task.technician_title));

    const templateDetailRow = rows[8];
    const templateRowIndex = 8;
    const requiredRowCount = Math.max(detailRows.length, 14);

    for (let i = rows.length - 1; i >= templateRowIndex + 1; i -= 1) {
      const row = rows[i];
      if (row.name === 'w:tr' && this.isTeachingPlanDetailRow(row)) {
        rows.splice(i, 1);
      }
    }

    const insertedRows = [];
    for (let i = 0; i < requiredRowCount; i += 1) {
      const rowClone = this.deepClone(templateDetailRow);
      const offer = detailRows[i] || {};
      this.fillTeachingPlanDetailRow(rowClone, offer);
      insertedRows.push(rowClone);
    }

    const tableRowElements = table.elements.filter((item) => item.name === 'w:tr');
    const prefixCount = table.elements.findIndex((item) => item === templateDetailRow);
    const tableElements = [...table.elements];
    tableElements.splice(prefixCount, tableRowElements.length - templateRowIndex, ...insertedRows);
    table.elements = tableElements;
  }

  fillTeachingPlanDetailRow(row, offer) {
    const weekday = offer.week_day || offer.time_slot
      ? `${this.formatWeekDay(offer.week_day)}${offer.time_slot ? ` ${offer.time_slot}` : ''
        }`.trim()
      : '';
    const location = [offer.building_name, offer.room_number].filter(Boolean).join(' ');
    const requirement = this.normalizeValue(offer.experiment_requirement);

    this.setTableCellText(row, 0, offer.week_no);
    this.setTableCellText(row, 1, weekday);
    this.setTableCellText(row, 2, offer.project_name);
    this.setTableCellText(row, 3, offer.experiment_hours);
    this.setTableCellText(row, 4, offer.experiment_type);
    this.setTableCellText(row, 5, offer.group_count);
    this.setTableCellText(row, 6, offer.students_per_group);
    this.setTableCellText(row, 7, offer.cycle_count);
    this.setTableCellText(row, 8, requirement === '必做' ? '必做√  选做' : requirement === '选做' ? '必做  选做√' : '');
    this.setTableCellText(row, 9, location);
  }

  isTeachingPlanDetailRow(row) {
    const cells = this.getRowCells(row);
    if (cells.length !== 10) {
      return false;
    }

    const cellTexts = cells.map((cell) => this.getElementText(cell).replace(/\s+/g, '').trim());
    return !cellTexts.some((text) => text);
  }

  buildSemesterHeading(task) {
    const department = task.DepartmentName || task.InstitutionName || '';
    const schoolYear = task.SchoolYear || '';
    const semesterNo = task.SemesterNo ? `${task.SemesterNo} ` : '';
    return `院系（中心）${department} ${schoolYear}学年第${semesterNo} 学期`;
  }

  buildSemesterText(task) {
    return task.SemesterNo ? `第${task.SemesterNo} 学期` : '';
  }

  getRowCells(row) {
    return (row.elements || []).filter((item) => item.name === 'w:tc');
  }

  setTableCellText(row, cellIndex, text) {
    const cell = this.getRowCells(row)[cellIndex];
    if (!cell) {
      return;
    }

    this.replaceCellParagraphText(cell, text);
  }

  appendTableCellText(row, cellIndex, suffix) {
    const cell = this.getRowCells(row)[cellIndex];
    if (!cell) {
      return;
    }

    const currentText = this.getElementText(cell);
    this.replaceCellParagraphText(cell, `${currentText}${suffix} `);
  }

  replaceCellParagraphText(cell, text) {
    const paragraphs = (cell.elements || []).filter((item) => item.name === 'w:p');
    if (paragraphs.length === 0) {
      return;
    }

    const lines = String(text || '').split(/\r\n/);
    paragraphs.forEach((paragraph, index) => {
      this.setParagraphText(paragraph, lines[index] || '', { preserveStyle: true });
    });
    for (let i = lines.length; i < paragraphs.length; i += 1) {
      this.setParagraphText(paragraphs[i], '', { preserveStyle: true });
    }
  }

  setParagraphText(paragraph, text, options = {}) {
    const runs = (paragraph.elements || []).filter((item) => item.name === 'w:r');
    if (runs.length === 0) {
      paragraph.elements = paragraph.elements || [];
      paragraph.elements.push(this.createRunWithText(String(text || '')));
      return;
    }

    const targetRun = runs[runs.length - 1];
    this.setRunText(targetRun, String(text || ''));

    runs.slice(0, -1).forEach((run) => {
      this.setRunText(run, '');
    });

    if (!options.preserveStyle) {
      return;
    }
  }

  setRunText(run, text) {
    run.elements = run.elements || [];
    let textElement = run.elements.find((item) => item.name === 'w:t');

    if (!textElement) {
      textElement = {
        type: 'element',
        name: 'w:t',
        elements: [],
      };
      run.elements.push(textElement);
    }

    textElement.attributes = text.includes(' ') ? { ...(textElement.attributes || {}), 'xml:space': 'preserve' } : textElement.attributes;
    textElement.elements = text ? [{ type: 'text', text }] : [];

    run.elements = run.elements.filter((item) => item.name !== 'w:br');
  }

  createRunWithText(text) {
    return {
      type: 'element',
      name: 'w:r',
      elements: [
        {
          type: 'element',
          name: 'w:t',
          attributes: text.includes(' ') ? { 'xml:space': 'preserve' } : undefined,
          elements: text ? [{ type: 'text', text }] : [],
        },
      ].filter(Boolean),
    };
  }

  getElementText(node) {
    if (!node) {
      return '';
    }
    if (node.type === 'text') {
      return node.text || '';
    }
    return (node.elements || []).map((item) => this.getElementText(item)).join('');
  }

  createTemplatePageBreakParagraph() {
    return {
      type: 'element',
      name: 'w:p',
      elements: [
        {
          type: 'element',
          name: 'w:r',
          elements: [
            {
              type: 'element',
              name: 'w:br',
              attributes: {
                'w:type': 'page',
              },
            },
          ],
        },
      ],
    };
  }

  findFirstElement(node, name) {
    if (!node) {
      return null;
    }
    if (Array.isArray(node)) {
      for (const item of node) {
        const result = this.findFirstElement(item, name);
        if (result) {
          return result;
        }
      }
      return null;
    }
    if (node.name === name) {
      return node;
    }
    return this.findFirstElement(node.elements || [], name);
  }

  deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  buildTeachingPlanDocument(tasks, offers) {
    const offerMap = new Map();

    offers.forEach((offer) => {
      if (!offerMap.has(offer.task_id)) {
        offerMap.set(offer.task_id, []);
      }
      offerMap.get(offer.task_id).push(offer);
    });

    const children = [];

    tasks.forEach((task, index) => {
      if (index > 0) {
        children.push(new Paragraph({ children: [new PageBreak()] }));
      }

      children.push(...this.createTeachingPlanSection(task, offerMap.get(task.id) || []));
    });

    const doc = new Document({
      sections: [
        {
          children,
        },
      ],
    });

    return Packer.toBuffer(doc);
  }

  createTeachingPlanSection(task, offers) {
    const columnWidths = [900, 1100, 1400, 1400, 900, 1100, 1400, 1400, 900, 900, 1300, 1300];
    const rows = [];
    const detailRows = offers.length >= 14
      ? offers
      : [...offers, ...Array.from({ length: 14 - offers.length }, () => ({}))];
    const schoolYearText = task.SchoolYear ? `${task.SchoolYear} ` : '';
    const semesterText = task.SemesterNo ? `第${task.SemesterNo} 学期` : (task.SemesterName || '');
    const departmentText = task.DepartmentName || task.InstitutionName || '';

    rows.push(this.createPlanRow([
      this.createPlanCell('课程名称', columnWidths, 0, 1, { bold: true, align: AlignmentType.CENTER }),
      this.createPlanCell(task.course_name, columnWidths, 1, 3),
      this.createPlanCell('教材名称', columnWidths, 4, 1, { bold: true, align: AlignmentType.CENTER }),
      this.createPlanCell(task.textbook_name, columnWidths, 5, 3),
      this.createPlanCell('实验指导书名称', columnWidths, 8, 1, { bold: true, align: AlignmentType.CENTER }),
      this.createPlanCell(task.guidebook_name, columnWidths, 9, 3),
    ], 520));

    rows.push(this.createPlanRow([
      this.createPlanCell('面向专业', columnWidths, 0, 1, { bold: true, align: AlignmentType.CENTER, verticalMerge: VerticalMergeType.RESTART }),
      this.createPlanCell(task.MajorName, columnWidths, 1, 3, { verticalMerge: VerticalMergeType.RESTART }),
      this.createPlanCell('实验班级', columnWidths, 4, 1, { bold: true, align: AlignmentType.CENTER, verticalMerge: VerticalMergeType.RESTART }),
      this.createPlanCell(task.ClassName, columnWidths, 5, 3, { verticalMerge: VerticalMergeType.RESTART }),
      this.createPlanCell('学生人数', columnWidths, 8, 1, { bold: true, align: AlignmentType.CENTER, verticalMerge: VerticalMergeType.RESTART }),
      this.createPlanCell(this.normalizeValue(task.student_count), columnWidths, 9, 1, { align: AlignmentType.CENTER, verticalMerge: VerticalMergeType.RESTART }),
      this.createPlanCell('学生层次', columnWidths, 10, 2, { bold: true, align: AlignmentType.CENTER }),
    ], 420));

    rows.push(this.createPlanRow([
      this.createPlanCell('', columnWidths, 0, 1, { verticalMerge: VerticalMergeType.CONTINUE }),
      this.createPlanCell('', columnWidths, 1, 3, { verticalMerge: VerticalMergeType.CONTINUE }),
      this.createPlanCell('', columnWidths, 4, 1, { verticalMerge: VerticalMergeType.CONTINUE }),
      this.createPlanCell('', columnWidths, 5, 3, { verticalMerge: VerticalMergeType.CONTINUE }),
      this.createPlanCell('', columnWidths, 8, 1, { verticalMerge: VerticalMergeType.CONTINUE }),
      this.createPlanCell('', columnWidths, 9, 1, { verticalMerge: VerticalMergeType.CONTINUE }),
      this.createPlanCell(this.isUndergraduate(task.student_level) ? '√' : '', columnWidths, 10, 1, { align: AlignmentType.CENTER }),
      this.createPlanCell(!this.isUndergraduate(task.student_level) && this.normalizeValue(task.student_level) ? '√' : '', columnWidths, 11, 1, { align: AlignmentType.CENTER }),
    ], 420));

    rows.push(this.createPlanRow([
      this.createPlanCell('课程类别', columnWidths, 0, 1, { bold: true, align: AlignmentType.CENTER }),
      this.createPlanCell(`A.公共必修课  B.专业基础必修课  C.专业必修课  D.专业选修课    选项：${this.mapCourseCategory(task.course_category)} `, columnWidths, 1, 8),
      this.createPlanCell('考核方式', columnWidths, 9, 1, { bold: true, align: AlignmentType.CENTER }),
      this.createPlanCell('', columnWidths, 10, 2),
    ], 460));

    rows.push(this.createPlanRow([
      this.createPlanCell(`课程总学时\n${this.getTeachingPlanCourseTotalHours(task)} `, columnWidths, 0, 2, { bold: true, align: AlignmentType.CENTER }),
      this.createPlanCell(`实验总学时\n${this.normalizeValue(task.experiment_total_hours)} `, columnWidths, 2, 2, { bold: true, align: AlignmentType.CENTER }),
      this.createPlanCell(`在哪几个学期授课\n${task.SemesterName || semesterText} `, columnWidths, 4, 3, { bold: true, align: AlignmentType.CENTER }),
      this.createPlanCell(`本学期实验学时\n${this.normalizeValue(task.experiment_current_hours)} `, columnWidths, 7, 3, { bold: true, align: AlignmentType.CENTER }),
      this.createPlanCell(`本学期实验个数\n${this.normalizeValue(offers.length)} `, columnWidths, 10, 2, { bold: true, align: AlignmentType.CENTER }),
    ], 700));

    rows.push(this.createPlanRow([
      this.createPlanCell('实验指导教师姓名及职称', columnWidths, 0, 2, { bold: true, align: AlignmentType.CENTER }),
      this.createPlanCell(this.joinTeacherInfo(task.teacher_name, task.teacher_title), columnWidths, 2, 4),
      this.createPlanCell('实验技术人员姓名及职称', columnWidths, 6, 2, { bold: true, align: AlignmentType.CENTER }),
      this.createPlanCell(this.joinTeacherInfo(task.technician_name, task.technician_title), columnWidths, 8, 4),
    ], 520));

    rows.push(this.createPlanRow([
      this.createPlanCell('周次', columnWidths, 0, 1, { bold: true, align: AlignmentType.CENTER, verticalMerge: VerticalMergeType.RESTART }),
      this.createPlanCell('星期\n节', columnWidths, 1, 1, { bold: true, align: AlignmentType.CENTER, verticalMerge: VerticalMergeType.RESTART }),
      this.createPlanCell('实验项目名称', columnWidths, 2, 2, { bold: true, align: AlignmentType.CENTER, verticalMerge: VerticalMergeType.RESTART }),
      this.createPlanCell('实验学时', columnWidths, 4, 1, { bold: true, align: AlignmentType.CENTER, verticalMerge: VerticalMergeType.RESTART }),
      this.createPlanCell('实验类别', columnWidths, 5, 1, { bold: true, align: AlignmentType.CENTER, verticalMerge: VerticalMergeType.RESTART }),
      this.createPlanCell('同时实验组数', columnWidths, 6, 1, { bold: true, align: AlignmentType.CENTER, verticalMerge: VerticalMergeType.RESTART }),
      this.createPlanCell('每组人数', columnWidths, 7, 1, { bold: true, align: AlignmentType.CENTER, verticalMerge: VerticalMergeType.RESTART }),
      this.createPlanCell('循环次数', columnWidths, 8, 1, { bold: true, align: AlignmentType.CENTER, verticalMerge: VerticalMergeType.RESTART }),
      this.createPlanCell('实验要求', columnWidths, 9, 2, { bold: true, align: AlignmentType.CENTER }),
      this.createPlanCell('实验地点', columnWidths, 11, 1, { bold: true, align: AlignmentType.CENTER, verticalMerge: VerticalMergeType.RESTART }),
    ], 460));

    rows.push(this.createPlanRow([
      this.createPlanCell('', columnWidths, 0, 1, { verticalMerge: VerticalMergeType.CONTINUE }),
      this.createPlanCell('', columnWidths, 1, 1, { verticalMerge: VerticalMergeType.CONTINUE }),
      this.createPlanCell('', columnWidths, 2, 2, { verticalMerge: VerticalMergeType.CONTINUE }),
      this.createPlanCell('', columnWidths, 4, 1, { verticalMerge: VerticalMergeType.CONTINUE }),
      this.createPlanCell('', columnWidths, 5, 1, { verticalMerge: VerticalMergeType.CONTINUE }),
      this.createPlanCell('', columnWidths, 6, 1, { verticalMerge: VerticalMergeType.CONTINUE }),
      this.createPlanCell('', columnWidths, 7, 1, { verticalMerge: VerticalMergeType.CONTINUE }),
      this.createPlanCell('', columnWidths, 8, 1, { verticalMerge: VerticalMergeType.CONTINUE }),
      this.createPlanCell('必做', columnWidths, 9, 1, { bold: true, align: AlignmentType.CENTER }),
      this.createPlanCell('选做', columnWidths, 10, 1, { bold: true, align: AlignmentType.CENTER }),
      this.createPlanCell('', columnWidths, 11, 1, { verticalMerge: VerticalMergeType.CONTINUE }),
    ], 360));

    detailRows.forEach((offer) => {
      const requirement = this.normalizeValue(offer.experiment_requirement);
      const weekdayAndSlot = offer.week_day || offer.time_slot
        ? `${this.formatWeekDay(offer.week_day)}${offer.time_slot ? ` ${offer.time_slot}` : ''} `.trim()
        : '';
      const location = [offer.building_name, offer.room_number].filter(Boolean).join(' ');

      rows.push(this.createPlanRow([
        this.createPlanCell(offer.week_no, columnWidths, 0, 1, { align: AlignmentType.CENTER }),
        this.createPlanCell(weekdayAndSlot, columnWidths, 1, 1, { align: AlignmentType.CENTER }),
        this.createPlanCell(offer.project_name, columnWidths, 2, 2),
        this.createPlanCell(offer.experiment_hours, columnWidths, 4, 1, { align: AlignmentType.CENTER }),
        this.createPlanCell(offer.experiment_type, columnWidths, 5, 1, { align: AlignmentType.CENTER }),
        this.createPlanCell(offer.group_count, columnWidths, 6, 1, { align: AlignmentType.CENTER }),
        this.createPlanCell(offer.students_per_group, columnWidths, 7, 1, { align: AlignmentType.CENTER }),
        this.createPlanCell(offer.cycle_count, columnWidths, 8, 1, { align: AlignmentType.CENTER }),
        this.createPlanCell(requirement === '必做' ? '√' : '', columnWidths, 9, 1, { align: AlignmentType.CENTER }),
        this.createPlanCell(requirement === '选做' ? '√' : '', columnWidths, 10, 1, { align: AlignmentType.CENTER }),
        this.createPlanCell(location, columnWidths, 11, 1, { align: AlignmentType.CENTER }),
      ], 420));
    });

    return [
      new Paragraph({
        text: '附件2：',
        spacing: { after: 120 },
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: `院系（中心）：${departmentText}    ${schoolYearText}学年 ${semesterText} `,
            font: '宋体',
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 180 },
        children: [
          new TextRun({
            text: '实验教学授课计划表',
            bold: true,
            size: 32,
            font: '宋体',
          }),
        ],
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        columnWidths,
        rows,
      }),
    ];
  }

  createPlanRow(children, height = 420) {
    return new TableRow({
      height: {
        value: height,
        rule: HeightRule.ATLEAST,
      },
      children,
    });
  }

  createPlanCell(text, columnWidths, startIndex, columnSpan = 1, options = {}) {
    const width = columnWidths.slice(startIndex, startIndex + columnSpan).reduce((sum, item) => sum + item, 0);

    return new TableCell({
      columnSpan,
      verticalMerge: options.verticalMerge,
      verticalAlign: VerticalAlignTable.CENTER,
      width: { size: width, type: WidthType.DXA },
      borders: this.getPlanCellBorders(),
      margins: {
        top: 60,
        bottom: 60,
        left: 80,
        right: 80,
      },
      children: this.createPlanParagraphs(text, options.align || AlignmentType.LEFT, Boolean(options.bold)),
    });
  }

  createPlanParagraphs(text, alignment = AlignmentType.LEFT, bold = false) {
    const lines = String(text || '').split(/\r\n/);
    return lines.map((line) => new Paragraph({
      alignment,
      spacing: {
        before: 0,
        after: 0,
        line: 276,
      },
      children: [
        new TextRun({
          text: line === '' ? ' ' : String(line),
          bold,
          font: '宋体',
        }),
      ],
    }));
  }

  getPlanCellBorders() {
    return {
      top: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
      left: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
      right: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
    };
  }

  normalizeTaskIds(payload = {}) {
    const values = [];
    const pushValue = (value) => {
      const numeric = Number(value);
      if (Number.isInteger(numeric) && numeric > 0 && !values.includes(numeric)) {
        values.push(numeric);
      }
    };

    if (payload.taskId != null) {
      pushValue(payload.taskId);
    }

    if (Array.isArray(payload.taskIds)) {
      payload.taskIds.forEach(pushValue);
    }

    return values;
  }

  createHeaderCell(column) {
    return new TableCell({
      width: { size: column.width || 10, type: WidthType.PERCENTAGE },
      borders: this.getCellBorders(),
      shading: { fill: 'E6E6E6' },
      children: [this.createParagraph(column.title, AlignmentType.CENTER, true)],
    });
  }

  createBodyCell(text, column) {
    return new TableCell({
      width: { size: column.width || 10, type: WidthType.PERCENTAGE },
      borders: this.getCellBorders(),
      children: this.createCellParagraphs(text),
    });
  }

  createCellParagraphs(text) {
    const content = String(text || '').split(/\r\n/);
    return content.map((line) => this.createParagraph(line || ' '));
  }

  createParagraph(text, alignment = AlignmentType.LEFT, bold = false) {
    return new Paragraph({
      alignment,
      children: [
        new TextRun({
          text: text == null || text === '' ? ' ' : String(text),
          bold,
        }),
      ],
    });
  }

  getCellText(row, column) {
    const rawValue = row[column.key];
    if (typeof column.format === 'function') {
      return column.format(rawValue, row);
    }
    return this.normalizeValue(rawValue);
  }

  normalizeValue(value) {
    if (value == null) {
      return '';
    }
    if (value instanceof Date) {
      return this.formatDateTime(value);
    }
    return String(value);
  }

  getCellBorders() {
    return {
      top: { style: BorderStyle.SINGLE, size: 1, color: '666666' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: '666666' },
      left: { style: BorderStyle.SINGLE, size: 1, color: '666666' },
      right: { style: BorderStyle.SINGLE, size: 1, color: '666666' },
    };
  }

  formatBoolean(value) {
    return Number(value) === 1 ? '是' : '否';
  }

  formatStatus(value) {
    return Number(value) === 1 ? '正常' : '禁用';
  }

  formatWeekDay(value) {
    const map = {
      1: '周一',
      2: '周二',
      3: '周三',
      4: '周四',
      5: '周五',
      6: '周六',
      7: '周日',
      '1': '周一',
      '2': '周二',
      '3': '周三',
      '4': '周四',
      '5': '周五',
      '6': '周六',
      '7': '周日',
    };

    return map[value] || this.normalizeValue(value);
  }

  formatDateTime(value) {
    if (!value) {
      return '';
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year} -${month} -${day} ${hours}:${minutes}:${seconds} `;
  }

  isUndergraduate(studentLevel) {
    return String(studentLevel || '').includes('本科');
  }

  mapCourseCategory(category) {
    const text = String(category || '');

    if (text.includes('公共必修')) {
      return 'A';
    }
    if (text.includes('专业基础必修')) {
      return 'B';
    }
    if (text.includes('专业必修')) {
      return 'C';
    }
    if (text.includes('专业选修')) {
      return 'D';
    }

    return text;
  }

  getTeachingPlanCourseTotalHours(task) {
    const total = Number(task.experiment_total_hours || 0)
      + Number(task.practice_total_hours || 0)
      + Number(task.training_total_hours || 0);

    return total > 0 ? String(total) : '';
  }

  joinTeacherInfo(name, title) {
    return [name, title].filter(Boolean).join(' ');
  }
}

module.exports = ExportController;
