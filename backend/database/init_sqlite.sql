-- =====================================================
-- 高校实验室信息管理系统 - SQLite 初始化脚本
-- 生成时间: 2026-05-22
-- =====================================================

-- =====================================================
-- 系统基础表
-- =====================================================

-- 用户表
CREATE TABLE IF NOT EXISTS sys_user (
  UserID INTEGER PRIMARY KEY AUTOINCREMENT,
  UserName VARCHAR(50) NOT NULL,
  Password VARCHAR(255) NOT NULL,
  RealName VARCHAR(50),
  Avatar VARCHAR(255),
  Mobile VARCHAR(20),
  Email VARCHAR(100),
  MainDepartmentID INTEGER,
  Status INTEGER DEFAULT 1,
  LastLoginTime TIMESTAMP,
  LastLoginIP VARCHAR(50),
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_sys_user_username ON sys_user(UserName);
CREATE INDEX IF NOT EXISTS idx_sys_user_dept_id ON sys_user(MainDepartmentID);

-- 角色表
CREATE TABLE IF NOT EXISTS sys_role (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(50) NOT NULL,
  code VARCHAR(50) NOT NULL,
  description VARCHAR(255),
  status INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_sys_role_code ON sys_role(code);

-- 菜单表
CREATE TABLE IF NOT EXISTS sys_menu (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(50) NOT NULL,
  path VARCHAR(255),
  component VARCHAR(255),
  icon VARCHAR(100),
  parent_id INTEGER DEFAULT 0,
  sort INTEGER DEFAULT 0,
  type VARCHAR(20) DEFAULT 'menu',
  visible INTEGER DEFAULT 1,
  status INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sys_menu_parent_id ON sys_menu(parent_id);

-- 权限表
CREATE TABLE IF NOT EXISTS sys_permission (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(50) NOT NULL,
  code VARCHAR(100) NOT NULL,
  type VARCHAR(20) DEFAULT 'menu',
  path VARCHAR(255),
  method VARCHAR(10) DEFAULT 'GET',
  description VARCHAR(255),
  parent_id INTEGER DEFAULT 0,
  sort INTEGER DEFAULT 0,
  status INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_sys_permission_code ON sys_permission(code);
CREATE INDEX IF NOT EXISTS idx_sys_permission_parent_id ON sys_permission(parent_id);

-- 机构表
CREATE TABLE IF NOT EXISTS sys_organization (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL,
  parent_id INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  description VARCHAR(255),
  status INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_sys_organization_code ON sys_organization(code);
CREATE INDEX IF NOT EXISTS idx_sys_organization_parent_id ON sys_organization(parent_id);

-- 机构表（用于机构管理API）
CREATE TABLE IF NOT EXISTS sys_institution (
  InstitutionID INTEGER PRIMARY KEY AUTOINCREMENT,
  InstitutionCode VARCHAR(50) NOT NULL,
  InstitutionName VARCHAR(100) NOT NULL,
  ParentID INTEGER DEFAULT 0,
  InstitutionType VARCHAR(50),
  Level INTEGER DEFAULT 1,
  FullPath VARCHAR(500),
  Status INTEGER DEFAULT 1,
  SortOrder INTEGER DEFAULT 0,
  Description VARCHAR(500),
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_sys_institution_code ON sys_institution(InstitutionCode);
CREATE INDEX IF NOT EXISTS idx_sys_institution_parent_id ON sys_institution(ParentID);

-- 部门表
CREATE TABLE IF NOT EXISTS Sys_Department (
  DepartmentID INTEGER PRIMARY KEY AUTOINCREMENT,
  DepartmentCode VARCHAR(50) NOT NULL,
  DepartmentName VARCHAR(100) NOT NULL,
  InstitutionID INTEGER,
  ParentID INTEGER DEFAULT 0,
  DepartmentType VARCHAR(50),
  Level INTEGER DEFAULT 1,
  FullPath VARCHAR(500),
  ManagerID INTEGER,
  Status INTEGER DEFAULT 1,
  SortOrder INTEGER DEFAULT 0,
  Description VARCHAR(500),
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_sys_department_code ON Sys_Department(DepartmentCode);
CREATE INDEX IF NOT EXISTS idx_sys_department_institution_id ON Sys_Department(InstitutionID);
CREATE INDEX IF NOT EXISTS idx_sys_department_parent_id ON Sys_Department(ParentID);

-- 用户角色关联表
CREATE TABLE IF NOT EXISTS sys_user_role (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_sys_user_role ON sys_user_role(user_id, role_id);
CREATE INDEX IF NOT EXISTS idx_sys_user_role_role_id ON sys_user_role(role_id);

-- 角色菜单关联表
CREATE TABLE IF NOT EXISTS sys_role_menu (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER NOT NULL,
  menu_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_sys_role_menu ON sys_role_menu(role_id, menu_id);
CREATE INDEX IF NOT EXISTS idx_sys_role_menu_menu_id ON sys_role_menu(menu_id);

-- 角色权限关联表
CREATE TABLE IF NOT EXISTS sys_role_permission (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER NOT NULL,
  permission_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_sys_role_permission ON sys_role_permission(role_id, permission_id);
CREATE INDEX IF NOT EXISTS idx_sys_role_permission_permission_id ON sys_role_permission(permission_id);

-- 操作日志表
CREATE TABLE IF NOT EXISTS sys_operation_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  username VARCHAR(50),
  operation VARCHAR(100),
  method VARCHAR(10),
  path VARCHAR(255),
  ip VARCHAR(50),
  params TEXT,
  result TEXT,
  status INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sys_operation_log_user_id ON sys_operation_log(user_id);
CREATE INDEX IF NOT EXISTS idx_sys_operation_log_created_at ON sys_operation_log(created_at);

-- 系统配置表
CREATE TABLE IF NOT EXISTS sys_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  configKey VARCHAR(100) NOT NULL,
  configValue TEXT,
  name VARCHAR(100),
  `group` VARCHAR(50) DEFAULT 'system',
  description VARCHAR(255),
  sortOrder INTEGER DEFAULT 0,
  status INTEGER DEFAULT 1,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_sys_config_config_key ON sys_config(configKey);

-- =====================================================
-- 教学信息表
-- =====================================================

-- 课程表
CREATE TABLE IF NOT EXISTS Edu_Course (
  CourseID INTEGER PRIMARY KEY AUTOINCREMENT,
  CourseName VARCHAR(100) NOT NULL,
  CourseCode VARCHAR(50) NOT NULL,
  CourseType VARCHAR(50),
  Credit REAL,
  Hours INTEGER,
  SortOrder INTEGER DEFAULT 0,
  Description VARCHAR(500),
  Status INTEGER DEFAULT 1,
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_edu_course_code ON Edu_Course(CourseCode);

-- 学期表
CREATE TABLE IF NOT EXISTS Edu_Semester (
  SemesterID INTEGER PRIMARY KEY AUTOINCREMENT,
  SemesterCode VARCHAR(50) NOT NULL,
  SemesterName VARCHAR(100) NOT NULL,
  SchoolYear VARCHAR(20),
  SemesterNo INTEGER,
  StartDate DATETIME,
  EndDate DATETIME,
  TotalWeeks INTEGER,
  IsActive INTEGER DEFAULT 0,
  Status INTEGER DEFAULT 1,
  SortOrder INTEGER DEFAULT 0,
  Description VARCHAR(500),
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_edu_semester_code ON Edu_Semester(SemesterCode);

-- 校历表
CREATE TABLE IF NOT EXISTS edu_calendar (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  semester_id INTEGER NOT NULL,
  date DATE NOT NULL,
  week INTEGER,
  week_day INTEGER,
  type VARCHAR(20) DEFAULT 'normal',
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_edu_calendar_semester_date ON edu_calendar(semester_id, date);
CREATE INDEX IF NOT EXISTS idx_edu_calendar_semester_id ON edu_calendar(semester_id);

-- 专业表
CREATE TABLE IF NOT EXISTS Edu_Major (
  MajorID INTEGER PRIMARY KEY AUTOINCREMENT,
  MajorCode VARCHAR(50) NOT NULL,
  MajorName VARCHAR(100) NOT NULL,
  MajorNameEn VARCHAR(100),
  DepartmentID INTEGER,
  DegreeLevel VARCHAR(50),
  Duration INTEGER DEFAULT 4,
  DegreeName VARCHAR(50),
  Status INTEGER DEFAULT 1,
  SortOrder INTEGER DEFAULT 0,
  Description VARCHAR(500),
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_edu_major_code ON Edu_Major(MajorCode);
CREATE INDEX IF NOT EXISTS idx_edu_major_department_id ON Edu_Major(DepartmentID);

-- 班级表
CREATE TABLE IF NOT EXISTS Edu_Class (
  ClassID INTEGER PRIMARY KEY AUTOINCREMENT,
  ClassCode VARCHAR(50) NOT NULL,
  DepartmentID INTEGER,
  MajorID INTEGER,
  GradeName VARCHAR(20),
  ClassName VARCHAR(100) NOT NULL,
  MonitorID INTEGER,
  HeadTeacherID INTEGER,
  StudentCount INTEGER DEFAULT 0,
  Status INTEGER DEFAULT 1,
  SortOrder INTEGER DEFAULT 0,
  Description VARCHAR(500),
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_edu_class_code ON Edu_Class(ClassCode);
CREATE INDEX IF NOT EXISTS idx_edu_class_major_id ON Edu_Class(MajorID);
CREATE INDEX IF NOT EXISTS idx_edu_class_department_id ON Edu_Class(DepartmentID);

-- 教学任务表
CREATE TABLE IF NOT EXISTS edu_teaching_task (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  semester_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  class_id INTEGER NOT NULL,
  teacher_id INTEGER,
  weekly_hours INTEGER,
  total_hours INTEGER,
  classroom VARCHAR(100),
  status INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_edu_teaching_task_semester_id ON edu_teaching_task(semester_id);
CREATE INDEX IF NOT EXISTS idx_edu_teaching_task_course_id ON edu_teaching_task(course_id);
CREATE INDEX IF NOT EXISTS idx_edu_teaching_task_class_id ON edu_teaching_task(class_id);
CREATE INDEX IF NOT EXISTS idx_edu_teaching_task_teacher_id ON edu_teaching_task(teacher_id);

-- 节次表
CREATE TABLE IF NOT EXISTS edu_time_slot (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(50) NOT NULL,
  start_time TEXT,
  end_time TEXT,
  sort INTEGER DEFAULT 0,
  type VARCHAR(20) DEFAULT 'morning',
  status INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 场馆信息表
-- =====================================================

-- 校区表
CREATE TABLE IF NOT EXISTS ven_campus (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  address VARCHAR(255),
  contact_person VARCHAR(50),
  contact_phone VARCHAR(20),
  description VARCHAR(500),
  status INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_ven_campus_code ON ven_campus(code);

-- 楼宇表
CREATE TABLE IF NOT EXISTS Ven_Building (
  BuildingID INTEGER PRIMARY KEY AUTOINCREMENT,
  BuildingCode VARCHAR(50) NOT NULL,
  BuildingName VARCHAR(100) NOT NULL,
  BuildingNameEn VARCHAR(100),
  CampusID INTEGER DEFAULT 1,
  Address VARCHAR(255),
  TotalFloors INTEGER,
  Area REAL,
  BuildYear INTEGER,
  UseType VARCHAR(50),
  SortOrder INTEGER DEFAULT 0,
  Description VARCHAR(500),
  Status INTEGER DEFAULT 1,
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_ven_building_code ON Ven_Building(BuildingCode);
CREATE INDEX IF NOT EXISTS idx_ven_building_campus_id ON Ven_Building(CampusID);

-- 房间表
CREATE TABLE IF NOT EXISTS Ven_Room (
  RoomID INTEGER PRIMARY KEY AUTOINCREMENT,
  RoomName VARCHAR(100) NOT NULL,
  RoomCode VARCHAR(50) NOT NULL,
  BuildingID INTEGER NOT NULL,
  Floor INTEGER,
  Area REAL,
  Capacity INTEGER,
  RoomType VARCHAR(50),
  Equipment TEXT,
  SortOrder INTEGER DEFAULT 0,
  Description VARCHAR(500),
  Status INTEGER DEFAULT 1,
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_ven_room_code ON Ven_Room(RoomCode);
CREATE INDEX IF NOT EXISTS idx_ven_room_building_id ON Ven_Room(BuildingID);

-- 楼层平面图表
CREATE TABLE IF NOT EXISTS ven_floor_plan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  building_id INTEGER NOT NULL,
  floor INTEGER NOT NULL,
  image_url VARCHAR(255),
  description VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_ven_floor_plan_building_floor ON ven_floor_plan(building_id, floor);
CREATE INDEX IF NOT EXISTS idx_ven_floor_plan_building_id ON ven_floor_plan(building_id);

-- =====================================================
-- 实验教学表
-- =====================================================

-- 实验教学任务表
CREATE TABLE IF NOT EXISTS edu_experiment_task (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  semester_id INTEGER NOT NULL,
  major_id INTEGER,
  class_id INTEGER,
  student_count INTEGER DEFAULT 0,
  student_level VARCHAR(20),
  course_name VARCHAR(100) NOT NULL,
  course_category VARCHAR(50),
  is_independent INTEGER DEFAULT 0,
  experiment_total_hours INTEGER DEFAULT 0,
  experiment_current_hours INTEGER DEFAULT 0,
  practice_total_hours INTEGER DEFAULT 0,
  practice_current_hours INTEGER DEFAULT 0,
  training_total_hours INTEGER DEFAULT 0,
  training_current_hours INTEGER DEFAULT 0,
  org_id INTEGER,
  dept_id INTEGER,
  teacher_name VARCHAR(50),
  teacher_title VARCHAR(50),
  technician_name VARCHAR(50),
  technician_title VARCHAR(50),
  textbook_name VARCHAR(200),
  guidebook_name VARCHAR(200),
  status INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_edu_experiment_task_semester_id ON edu_experiment_task(semester_id);
CREATE INDEX IF NOT EXISTS idx_edu_experiment_task_major_id ON edu_experiment_task(major_id);
CREATE INDEX IF NOT EXISTS idx_edu_experiment_task_class_id ON edu_experiment_task(class_id);

-- 实验项目库表
CREATE TABLE IF NOT EXISTS edu_experiment_project (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_code VARCHAR(50),
  project_name VARCHAR(200) NOT NULL,
  experiment_hours INTEGER,
  experiment_type VARCHAR(50),
  experiment_requirement VARCHAR(50),
  description VARCHAR(500),
  status INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 实训教学计划表
CREATE TABLE IF NOT EXISTS edu_training_plan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_code VARCHAR(50),
  organization_mode VARCHAR(100),
  training_location VARCHAR(200),
  training_purpose TEXT,
  teaching_content TEXT,
  training_method VARCHAR(200),
  assessment_method VARCHAR(200),
  quality_measures TEXT,
  center_opinion TEXT,
  department_opinion TEXT,
  status INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 实验项目开设表
CREATE TABLE IF NOT EXISTS edu_experiment_project_offer (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER,
  project_id INTEGER,
  week_no INTEGER,
  week_day INTEGER,
  time_slot VARCHAR(20),
  group_count INTEGER DEFAULT 1,
  students_per_group INTEGER DEFAULT 1,
  cycle_count INTEGER DEFAULT 1,
  experiment_requirement TEXT,
  building_name VARCHAR(100),
  room_number VARCHAR(50),
  is_offered INTEGER DEFAULT 1,
  not_offered_reason TEXT,
  status INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_edu_experiment_project_offer_task_id ON edu_experiment_project_offer(task_id);
CREATE INDEX IF NOT EXISTS idx_edu_experiment_project_offer_project_id ON edu_experiment_project_offer(project_id);

-- 实验教学质量表
CREATE TABLE IF NOT EXISTS edu_experiment_quality (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER,
  organization VARCHAR(100),
  course_name VARCHAR(200),
  experiment_hours INTEGER,
  is_independent INTEGER DEFAULT 0,
  teacher_name VARCHAR(50),
  teacher_title VARCHAR(50),
  technician_name VARCHAR(50),
  technician_title VARCHAR(50),
  class_name VARCHAR(200),
  class_student_count INTEGER,
  planned_project_count INTEGER,
  actual_project_count INTEGER,
  not_offered_projects TEXT,
  not_offered_reasons TEXT,
  assessment_method VARCHAR(100),
  assessment_count INTEGER,
  assessment_time DATETIME,
  status INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_edu_experiment_quality_task_id ON edu_experiment_quality(task_id);

-- =====================================================
-- 实验室排课预约模块表
-- =====================================================

-- 实验室排课表
CREATE TABLE IF NOT EXISTS lab_scheduling (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scheduling_code VARCHAR(50),
  semester_id INTEGER NOT NULL,
  source_type VARCHAR(20) NOT NULL,
  source_id INTEGER,
  course_id INTEGER,
  course_name VARCHAR(200),
  course_category VARCHAR(50),
  major_id INTEGER,
  major_name VARCHAR(200),
  class_id INTEGER,
  class_name VARCHAR(200),
  student_count INTEGER DEFAULT 0,
  building_id INTEGER,
  building_name VARCHAR(100),
  room_id INTEGER,
  room_name VARCHAR(100),
  room_number VARCHAR(50),
  teacher_id INTEGER,
  teacher_name VARCHAR(100),
  teacher_title VARCHAR(50),
  technician_id INTEGER,
  technician_name VARCHAR(100),
  week_no INTEGER NOT NULL,
  week_day INTEGER NOT NULL,
  time_slot_start VARCHAR(20) NOT NULL,
  time_slot_end VARCHAR(20),
  week_type VARCHAR(20) DEFAULT 'all',
  project_name VARCHAR(200),
  project_category VARCHAR(50),
  applicant_id INTEGER,
  applicant_name VARCHAR(100),
  applicant_phone VARCHAR(20),
  project_leader VARCHAR(100),
  project_leader_phone VARCHAR(20),
  expected_duration REAL,
  remarks TEXT,
  status INTEGER DEFAULT 1,
  approval_status VARCHAR(20) DEFAULT 'approved',
  approval_comment TEXT,
  approved_by INTEGER,
  approved_by_name VARCHAR(100),
  approved_at TIMESTAMP,
  created_by INTEGER,
  created_by_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_lab_scheduling_semester_id ON lab_scheduling(semester_id);
CREATE INDEX IF NOT EXISTS idx_lab_scheduling_week_no ON lab_scheduling(week_no);
CREATE INDEX IF NOT EXISTS idx_lab_scheduling_week_day ON lab_scheduling(week_day);
CREATE INDEX IF NOT EXISTS idx_lab_scheduling_building_id ON lab_scheduling(building_id);
CREATE INDEX IF NOT EXISTS idx_lab_scheduling_room_id ON lab_scheduling(room_id);
CREATE INDEX IF NOT EXISTS idx_lab_scheduling_teacher_id ON lab_scheduling(teacher_id);
CREATE INDEX IF NOT EXISTS idx_lab_scheduling_class_id ON lab_scheduling(class_id);
CREATE INDEX IF NOT EXISTS idx_lab_scheduling_source_type ON lab_scheduling(source_type);
CREATE INDEX IF NOT EXISTS idx_lab_scheduling_status ON lab_scheduling(status);
CREATE INDEX IF NOT EXISTS idx_lab_scheduling_approval_status ON lab_scheduling(approval_status);

-- 预约申请表
CREATE TABLE IF NOT EXISTS lab_reservation (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reservation_code VARCHAR(50),
  semester_id INTEGER NOT NULL,
  building_id INTEGER NOT NULL,
  building_name VARCHAR(100) NOT NULL,
  room_id INTEGER NOT NULL,
  room_name VARCHAR(100) NOT NULL,
  room_number VARCHAR(50) NOT NULL,
  use_date DATE NOT NULL,
  week_no INTEGER NOT NULL,
  week_day INTEGER NOT NULL,
  time_slot VARCHAR(50) NOT NULL,
  week_type VARCHAR(20) DEFAULT 'all',
  project_name VARCHAR(200) NOT NULL,
  project_category VARCHAR(50) NOT NULL,
  applicant_id INTEGER NOT NULL,
  applicant_name VARCHAR(100) NOT NULL,
  applicant_phone VARCHAR(20) NOT NULL,
  project_leader VARCHAR(100) NOT NULL,
  project_leader_phone VARCHAR(20) NOT NULL,
  member_grade VARCHAR(50),
  member_class VARCHAR(200),
  member_count INTEGER DEFAULT 0,
  expected_duration REAL,
  remarks TEXT,
  approval_status VARCHAR(20) DEFAULT 'pending',
  approval_comment TEXT,
  approved_by INTEGER,
  approved_by_name VARCHAR(100),
  approved_at TIMESTAMP,
  scheduling_id INTEGER,
  is_cancelled INTEGER DEFAULT 0,
  cancelled_by INTEGER,
  cancelled_by_name VARCHAR(100),
  cancelled_at TIMESTAMP,
  cancel_reason TEXT,
  created_by INTEGER,
  created_by_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_lab_reservation_semester_id ON lab_reservation(semester_id);
CREATE INDEX IF NOT EXISTS idx_lab_reservation_use_date ON lab_reservation(use_date);
CREATE INDEX IF NOT EXISTS idx_lab_reservation_room_id ON lab_reservation(room_id);
CREATE INDEX IF NOT EXISTS idx_lab_reservation_applicant_id ON lab_reservation(applicant_id);
CREATE INDEX IF NOT EXISTS idx_lab_reservation_approval_status ON lab_reservation(approval_status);
CREATE INDEX IF NOT EXISTS idx_lab_reservation_is_cancelled ON lab_reservation(is_cancelled);

-- 授课申请表
CREATE TABLE IF NOT EXISTS lab_teaching_request (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_code VARCHAR(50),
  semester_id INTEGER NOT NULL,
  teaching_task_id INTEGER,
  course_id INTEGER,
  course_name VARCHAR(200) NOT NULL,
  major_id INTEGER,
  major_name VARCHAR(200),
  grade VARCHAR(50),
  class_id INTEGER,
  class_name VARCHAR(200),
  week_no INTEGER NOT NULL,
  week_day INTEGER NOT NULL,
  time_slot VARCHAR(50) NOT NULL,
  week_type VARCHAR(20) DEFAULT 'all',
  expected_building_id INTEGER,
  expected_building_name VARCHAR(100),
  expected_room_id INTEGER,
  expected_room_name VARCHAR(100),
  applicant_id INTEGER NOT NULL,
  applicant_name VARCHAR(100) NOT NULL,
  remarks TEXT,
  approval_status VARCHAR(20) DEFAULT 'pending',
  approval_comment TEXT,
  approved_by INTEGER,
  approved_by_name VARCHAR(100),
  approved_at TIMESTAMP,
  assigned_building_id INTEGER,
  assigned_building_name VARCHAR(100),
  assigned_room_id INTEGER,
  assigned_room_name VARCHAR(100),
  assigned_room_number VARCHAR(50),
  scheduling_id INTEGER,
  created_by INTEGER,
  created_by_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_lab_teaching_request_semester_id ON lab_teaching_request(semester_id);
CREATE INDEX IF NOT EXISTS idx_lab_teaching_request_applicant_id ON lab_teaching_request(applicant_id);
CREATE INDEX IF NOT EXISTS idx_lab_teaching_request_approval_status ON lab_teaching_request(approval_status);
CREATE INDEX IF NOT EXISTS idx_lab_teaching_request_teaching_task_id ON lab_teaching_request(teaching_task_id);

-- 使用登记表
CREATE TABLE IF NOT EXISTS lab_usage_registration (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  registration_code VARCHAR(50),
  semester_id INTEGER NOT NULL,
  scheduling_id INTEGER,
  reservation_id INTEGER,
  source_type VARCHAR(20),
  building_id INTEGER,
  building_name VARCHAR(100),
  room_id INTEGER,
  room_name VARCHAR(100),
  room_number VARCHAR(50),
  use_date DATE NOT NULL,
  week_no INTEGER NOT NULL,
  course_name VARCHAR(200),
  experiment_project_id INTEGER,
  experiment_project_name VARCHAR(200),
  experiment_type VARCHAR(50),
  class_id INTEGER,
  class_name VARCHAR(200),
  teacher_id INTEGER,
  teacher_name VARCHAR(100),
  planned_hours REAL,
  actual_duration REAL NOT NULL,
  expected_students INTEGER DEFAULT 0,
  actual_students INTEGER NOT NULL,
  attendance_record TEXT,
  teaching_record TEXT,
  equipment_record TEXT,
  registration_status VARCHAR(20) DEFAULT 'registered',
  reminder_count INTEGER DEFAULT 0,
  last_reminder_at TIMESTAMP,
  reporter_id INTEGER NOT NULL,
  reporter_name VARCHAR(100) NOT NULL,
  report_department VARCHAR(200),
  report_time TIMESTAMP,
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_lab_usage_registration_semester_id ON lab_usage_registration(semester_id);
CREATE INDEX IF NOT EXISTS idx_lab_usage_registration_use_date ON lab_usage_registration(use_date);
CREATE INDEX IF NOT EXISTS idx_lab_usage_registration_room_id ON lab_usage_registration(room_id);
CREATE INDEX IF NOT EXISTS idx_lab_usage_registration_teacher_id ON lab_usage_registration(teacher_id);
CREATE INDEX IF NOT EXISTS idx_lab_usage_registration_class_id ON lab_usage_registration(class_id);
CREATE INDEX IF NOT EXISTS idx_lab_usage_registration_registration_status ON lab_usage_registration(registration_status);
CREATE INDEX IF NOT EXISTS idx_lab_usage_registration_scheduling_id ON lab_usage_registration(scheduling_id);

-- 冲突检测日志表
CREATE TABLE IF NOT EXISTS lab_collision_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  collision_type VARCHAR(50) NOT NULL,
  collision_level VARCHAR(20) NOT NULL,
  scheduling_id_1 INTEGER NOT NULL,
  scheduling_id_2 INTEGER,
  semester_id INTEGER NOT NULL,
  week_no INTEGER NOT NULL,
  week_day INTEGER NOT NULL,
  time_slot VARCHAR(50) NOT NULL,
  conflict_details TEXT,
  is_forced INTEGER DEFAULT 0,
  forced_by INTEGER,
  forced_by_name VARCHAR(100),
  forced_at TIMESTAMP,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_lab_collision_log_collision_type ON lab_collision_log(collision_type);
CREATE INDEX IF NOT EXISTS idx_lab_collision_log_collision_level ON lab_collision_log(collision_level);
CREATE INDEX IF NOT EXISTS idx_lab_collision_log_semester_id ON lab_collision_log(semester_id);

-- 消息通知表
CREATE TABLE IF NOT EXISTS lab_notification (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  notification_code VARCHAR(50),
  user_id INTEGER NOT NULL,
  user_name VARCHAR(100) NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  related_type VARCHAR(50),
  related_id INTEGER,
  is_read INTEGER DEFAULT 0,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_lab_notification_user_id ON lab_notification(user_id);
CREATE INDEX IF NOT EXISTS idx_lab_notification_is_read ON lab_notification(is_read);
CREATE INDEX IF NOT EXISTS idx_lab_notification_notification_type ON lab_notification(notification_type);
CREATE INDEX IF NOT EXISTS idx_lab_notification_related_type ON lab_notification(related_type, related_id);

-- 使用统计表
CREATE TABLE IF NOT EXISTS lab_usage_statistics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  semester_id INTEGER NOT NULL,
  statistics_type VARCHAR(50) NOT NULL,
  dimension_type VARCHAR(50) NOT NULL,
  dimension_id INTEGER,
  dimension_name VARCHAR(200),
  statistics_date DATE,
  week_no INTEGER,
  scheduled_count INTEGER DEFAULT 0,
  scheduled_hours REAL DEFAULT 0,
  reserved_count INTEGER DEFAULT 0,
  reserved_hours REAL DEFAULT 0,
  total_hours REAL DEFAULT 0,
  total_students INTEGER DEFAULT 0,
  registration_count INTEGER DEFAULT 0,
  registration_rate REAL DEFAULT 0,
  usage_rate REAL DEFAULT 0,
  available_hours REAL DEFAULT 0,
  start_date DATE,
  end_date DATE,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_lab_usage_statistics_semester_id ON lab_usage_statistics(semester_id);
CREATE INDEX IF NOT EXISTS idx_lab_usage_statistics_dimension_type ON lab_usage_statistics(dimension_type, dimension_id);
CREATE INDEX IF NOT EXISTS idx_lab_usage_statistics_statistics_date ON lab_usage_statistics(statistics_date);

-- =====================================================
-- 初始化数据
-- =====================================================

-- 用户数据
INSERT INTO sys_user (UserName, Password, RealName, Mobile, Email, Status) VALUES
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '管理员', '13800138000', 'admin@example.com', 1),
('user1', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '用户1', '13800138001', 'user1@example.com', 1),
('teacher1', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '李老师', '13800138002', 'teacher1@example.com', 1),
('teacher2', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '王老师', '13800138003', 'teacher2@example.com', 1);

-- 角色数据
INSERT INTO sys_role (name, code, description, status) VALUES
('管理员', 'admin', '系统管理员，拥有所有权限', 1),
('教师', 'teacher', '教师角色', 1),
('学生', 'student', '学生角色', 1);

-- 用户角色关联
INSERT INTO sys_user_role (user_id, role_id) VALUES (1, 1), (2, 3), (3, 2), (4, 2);

-- 菜单数据
INSERT INTO sys_menu (name, path, component, icon, parent_id, sort, type, visible, status) VALUES
('系统管理', '/system', 'Layout', 'Setting', 0, 1, 'menu', 1, 1),
('用户管理', '/system/user', 'system/user/index', 'User', 1, 1, 'menu', 1, 1),
('角色管理', '/system/role', 'system/role/index', 'UserFilled', 1, 2, 'menu', 1, 1),
('菜单管理', '/system/menu', 'system/menu/index', 'Menu', 1, 3, 'menu', 1, 1),
('权限管理', '/system/permission', 'system/permission/index', 'Lock', 1, 4, 'menu', 1, 1),
('机构管理', '/system/organization', 'system/organization/index', 'OfficeBuilding', 1, 5, 'menu', 1, 1),
('部门管理', '/system/department', 'system/department/index', 'Grid', 1, 6, 'menu', 1, 1),
('操作日志', '/system/log', 'system/log/index', 'Document', 1, 7, 'menu', 1, 1),
('系统配置', '/system/config', 'system/config/index', 'Tools', 1, 8, 'menu', 1, 1),
('教学信息管理', '/teaching', 'Layout', 'Reading', 0, 2, 'menu', 1, 1),
('课程管理', '/teaching/course', 'teaching/course/index', 'Notebook', 10, 1, 'menu', 1, 1),
('学期管理', '/teaching/semester', 'teaching/semester/index', 'Calendar', 10, 2, 'menu', 1, 1),
('校历查看', '/teaching/calendar', 'teaching/calendar/index', 'Date', 10, 3, 'menu', 1, 1),
('专业管理', '/teaching/major', 'teaching/major/index', 'Collection', 10, 4, 'menu', 1, 1),
('班级管理', '/teaching/class', 'teaching/class/index', 'School', 10, 5, 'menu', 1, 1),
('教学任务', '/teaching/task', 'teaching/task/index', 'Tickets', 10, 6, 'menu', 1, 1),
('实验教学任务', '/teaching/experiment-task', 'teaching/experiment-task/index', 'FlaskConical', 10, 7, 'menu', 1, 1),
('节次管理', '/teaching/time-slot', 'teaching/time-slot/index', 'Clock', 10, 8, 'menu', 1, 1),
('场馆信息管理', '/venue', 'Layout', 'Location', 0, 3, 'menu', 1, 1),
('校区管理', '/venue/campus', 'venue/campus/index', 'MapLocation', 19, 1, 'menu', 1, 1),
('楼宇管理', '/venue/building', 'venue/building/index', 'House', 19, 2, 'menu', 1, 1),
('房间管理', '/venue/room', 'venue/room/index', 'HomeFilled', 19, 3, 'menu', 1, 1),
('楼层平面图', '/venue/floor-plan', 'venue/floor-plan/index', 'Picture', 19, 4, 'menu', 1, 1),
('实验室排课预约', '/scheduling', 'Layout', 'Calendar', 0, 4, 'menu', 1, 1),
('排课检索', '/scheduling', 'scheduling/index', 'Search', 24, 1, 'menu', 1, 1),
('集中排课', '/scheduling/central', 'scheduling/central', 'Plus', 24, 2, 'menu', 1, 1),
('预约申请', '/scheduling/reservation', 'scheduling/reservation', 'CalendarCheck', 24, 3, 'menu', 1, 1),
('授课申请', '/scheduling/teaching-request', 'scheduling/teaching-request', 'MessageSquare', 24, 4, 'menu', 1, 1),
('使用登记', '/scheduling/usage-registration', 'scheduling/usage-registration', 'FileText', 24, 5, 'menu', 1, 1),
('数据统计', '/scheduling/statistics', 'scheduling/statistics', 'BarChart3', 24, 6, 'menu', 1, 1),
('实验教学', '/experiment', 'Layout', 'FlaskConical', 0, 5, 'menu', 1, 1),
('实验任务', '/experiment/task', 'experiment/task/index', 'Tasks', 31, 1, 'menu', 1, 1),
('项目库', '/experiment/project', 'experiment/project/index', 'Package', 31, 2, 'menu', 1, 1),
('授课计划', '/experiment/plan', 'experiment/plan/index', 'ClipboardList', 31, 3, 'menu', 1, 1),
('质量分析', '/experiment/quality', 'experiment/quality/index', 'TrendingUp', 31, 4, 'menu', 1, 1),
('实训计划', '/experiment/training', 'experiment/training/index', 'Briefcase', 31, 5, 'menu', 1, 1);

-- 角色菜单关联
INSERT INTO sys_role_menu (role_id, menu_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8), (1, 9),
(1, 10), (1, 11), (1, 12), (1, 13), (1, 14), (1, 15), (1, 16), (1, 17),
(1, 18), (1, 19), (1, 20), (1, 21), (1, 22), (1, 23), (1, 24), (1, 25),
(1, 26), (1, 27), (1, 28), (1, 29), (1, 30), (1, 31), (1, 32), (1, 33),
(1, 34), (1, 35);

-- 机构数据
INSERT INTO sys_organization (name, code, parent_id, sort_order, description, status) VALUES
('学校', 'school', 0, 1, '学校总部', 1),
('计算机学院', 'cs', 1, 1, '计算机学院', 1),
('电子信息学院', 'ee', 1, 2, '电子信息学院', 1);

-- 机构数据（sys_institution表）
INSERT INTO sys_institution (InstitutionCode, InstitutionName, ParentID, Level, FullPath, SortOrder, Description, Status) VALUES
('school', '学校', 0, 1, '/学校', 1, '学校总部', 1),
('cs', '计算机学院', 1, 2, '/学校/计算机学院', 2, '计算机学院', 1),
('ee', '电子信息学院', 1, 2, '/学校/电子信息学院', 3, '电子信息学院', 1);

-- 部门数据
INSERT INTO Sys_Department (DepartmentCode, DepartmentName, InstitutionID, ParentID, Level, FullPath, SortOrder, Description, Status) VALUES
('jiaowu', '教务处', 1, 0, 1, '/学校/教务处', 1, '教学管理部门', 1),
('computer', '计算机系', 2, 0, 1, '/学校/计算机学院/计算机系', 2, '计算机系', 1),
('software', '软件工程系', 2, 0, 1, '/学校/计算机学院/软件工程系', 3, '软件工程系', 1),
('electronic', '电子工程系', 3, 0, 1, '/学校/电子信息学院/电子工程系', 4, '电子工程系', 1);

-- 权限数据
INSERT INTO sys_permission (name, code, type, path, method, description, parent_id, sort, status) VALUES
('用户管理', 'user:manage', 'menu', '/api/v1/users', 'GET', '用户管理权限', 0, 1, 1),
('用户列表', 'user:list', 'button', '/api/v1/users', 'GET', '用户列表权限', 1, 1, 1),
('用户新增', 'user:add', 'button', '/api/v1/users', 'POST', '用户新增权限', 1, 2, 1),
('用户编辑', 'user:edit', 'button', '/api/v1/users', 'PUT', '用户编辑权限', 1, 3, 1),
('用户删除', 'user:delete', 'button', '/api/v1/users', 'DELETE', '用户删除权限', 1, 4, 1),
('角色管理', 'role:manage', 'menu', '/api/v1/roles', 'GET', '角色管理权限', 0, 2, 1),
('角色列表', 'role:list', 'button', '/api/v1/roles', 'GET', '角色列表权限', 6, 1, 1),
('角色新增', 'role:add', 'button', '/api/v1/roles', 'POST', '角色新增权限', 6, 2, 1),
('角色编辑', 'role:edit', 'button', '/api/v1/roles', 'PUT', '角色编辑权限', 6, 3, 1),
('角色删除', 'role:delete', 'button', '/api/v1/roles', 'DELETE', '角色删除权限', 6, 4, 1),
('菜单管理', 'menu:manage', 'menu', '/api/v1/menus', 'GET', '菜单管理权限', 0, 3, 1),
('排课管理', 'scheduling:manage', 'menu', '/api/v1/scheduling', 'GET', '排课管理权限', 0, 4, 1),
('预约管理', 'reservation:manage', 'menu', '/api/v1/reservations', 'GET', '预约管理权限', 0, 5, 1);

-- 系统配置数据
INSERT INTO sys_config (configKey, name, configValue, `group`, description, sortOrder, status) VALUES
('system_name', '系统名称', '高校实验室信息管理系统', 'system', '系统名称', 1, 1),
('version', '系统版本', '1.0.0', 'system', '系统版本', 2, 1);

-- 课程数据
INSERT INTO Edu_Course (CourseName, CourseCode, CourseType, Credit, Hours, SortOrder, Description, Status) VALUES
('高等数学', 'MA001', '公共课', 4.0, 64, 1, '高等数学课程', 1),
('大学物理', 'PH001', '公共课', 3.0, 48, 2, '大学物理课程', 1),
('程序设计', 'CS001', '专业课', 4.0, 64, 3, '程序设计课程', 1),
('数据结构与算法', 'CS002', '专业课', 4.0, 64, 4, '数据结构与算法课程', 1),
('操作系统', 'CS003', '专业课', 4.0, 64, 5, '操作系统课程', 1),
('计算机网络', 'CS004', '专业课', 3.0, 48, 6, '计算机网络课程', 1),
('数据库原理', 'CS005', '专业课', 3.0, 48, 7, '数据库原理课程', 1);

-- 学期数据
INSERT INTO Edu_Semester (SemesterCode, SemesterName, SchoolYear, SemesterNo, StartDate, EndDate, TotalWeeks, IsActive, SortOrder, Status) VALUES
('2025-1', '2025-2026学年第一学期', '2025-2026', 1, '2025-09-01 00:00:00', '2025-12-31 23:59:59', 18, 1, 1, 1),
('2026-2', '2025-2026学年第二学期', '2025-2026', 2, '2026-02-20 00:00:00', '2026-06-30 23:59:59', 18, 0, 2, 0),
('2024-1', '2024-2025学年第一学期', '2024-2025', 1, '2024-09-01 00:00:00', '2024-12-31 23:59:59', 18, 0, 3, 0),
('2024-2', '2024-2025学年第二学期', '2024-2025', 2, '2024-02-20 00:00:00', '2024-06-30 23:59:59', 18, 0, 4, 0);

-- 校历数据
INSERT INTO edu_calendar (semester_id, date, week, week_day, type, description) VALUES
(1, '2025-09-01', 1, 1, 'start', '学期开始'),
(1, '2025-09-02', 1, 2, 'normal', ''),
(1, '2025-09-03', 1, 3, 'normal', ''),
(1, '2025-09-04', 1, 4, 'normal', ''),
(1, '2025-09-05', 1, 5, 'normal', ''),
(1, '2025-09-06', 1, 6, 'normal', ''),
(1, '2025-09-07', 1, 7, 'normal', '');

-- 专业数据
INSERT INTO Edu_Major (MajorCode, MajorName, MajorNameEn, DepartmentID, DegreeLevel, Duration, DegreeName, Status, SortOrder, Description) VALUES
('CS', '计算机科学与技术', 'Computer Science', 2, 'Bachelor', 4, '工学学士', 1, 1, '计算机科学与技术专业'),
('SE', '软件工程', 'Software Engineering', 2, 'Bachelor', 4, '工学学士', 1, 2, '软件工程专业'),
('EE', '电子信息工程', 'Electronic Engineering', 3, 'Bachelor', 4, '工学学士', 1, 3, '电子信息工程专业'),
('CE', '通信工程', 'Communication Engineering', 3, 'Bachelor', 4, '工学学士', 1, 4, '通信工程专业');

-- 班级数据
INSERT INTO Edu_Class (ClassCode, DepartmentID, MajorID, GradeName, ClassName, StudentCount, Status, SortOrder) VALUES
('CS2023-1', 2, 1, '2023', '计算机2023-1班', 45, 1, 1),
('CS2023-2', 2, 1, '2023', '计算机2023-2班', 40, 1, 2),
('SE2023-1', 2, 2, '2023', '软件工程2023-1班', 42, 1, 3),
('SE2023-2', 2, 2, '2023', '软件工程2023-2班', 38, 1, 4),
('EE2023-1', 3, 3, '2023', '电子信息2023-1班', 40, 1, 5);

-- 教学任务数据
INSERT INTO edu_teaching_task (semester_id, course_id, class_id, teacher_id, weekly_hours, total_hours, classroom, status) VALUES
(1, 1, 1, 3, 4, 64, '101教室', 1),
(1, 3, 1, 3, 4, 64, 'A101实验室', 1),
(1, 4, 2, 4, 4, 64, 'A102实验室', 1),
(1, 5, 1, 4, 4, 64, 'A101实验室', 1),
(1, 6, 3, 3, 3, 48, 'B201实验室', 1);

-- 节次数据
INSERT INTO edu_time_slot (name, start_time, end_time, sort, type, status) VALUES
('第一节', '08:00:00', '08:45:00', 1, 'morning', 1),
('第二节', '08:55:00', '09:40:00', 2, 'morning', 1),
('第三节', '10:00:00', '10:45:00', 3, 'morning', 1),
('第四节', '10:55:00', '11:40:00', 4, 'morning', 1),
('第五节', '14:00:00', '14:45:00', 5, 'afternoon', 1),
('第六节', '14:55:00', '15:40:00', 6, 'afternoon', 1),
('第七节', '16:00:00', '16:45:00', 7, 'afternoon', 1),
('第八节', '16:55:00', '17:40:00', 8, 'afternoon', 1),
('第九节', '19:00:00', '19:45:00', 9, 'evening', 1),
('第十节', '19:55:00', '20:40:00', 10, 'evening', 1);

-- 校区数据
INSERT INTO ven_campus (code, name, address, description, status) VALUES
('main', '主校区', '北京市海淀区学院路30号', '主校区', 1),
('branch', '分校区', '北京市昌平区回龙观', '分校区', 1);

-- 楼宇数据
INSERT INTO Ven_Building (BuildingCode, BuildingName, CampusID, TotalFloors, UseType, SortOrder, Description, Status) VALUES
('TEACH-01', '第一教学楼', 1, 6, '教学', 1, '第一教学楼', 1),
('LAB-A', '实验楼A', 1, 5, '实验', 2, '实验楼A', 1),
('LAB-B', '实验楼B', 1, 4, '实验', 3, '实验楼B', 1),
('TEACH-02', '第二教学楼', 1, 5, '教学', 4, '第二教学楼', 1);

-- 房间数据
INSERT INTO Ven_Room (RoomName, RoomCode, BuildingID, Floor, Area, Capacity, RoomType, SortOrder, Description, Status) VALUES
('101教室', 'ROOM-101', 1, 1, 80.00, 50, '教室', 1, '101教室', 1),
('102教室', 'ROOM-102', 1, 1, 80.00, 50, '教室', 2, '102教室', 1),
('A101实验室', 'LAB-A101', 2, 1, 120.00, 30, '实验室', 3, 'A101实验室', 1),
('A102实验室', 'LAB-A102', 2, 1, 120.00, 30, '实验室', 4, 'A102实验室', 1),
('A201实验室', 'LAB-A201', 2, 2, 150.00, 40, '实验室', 5, 'A201实验室', 1),
('A202实验室', 'LAB-A202', 2, 2, 150.00, 40, '实验室', 6, 'A202实验室', 1),
('B101实验室', 'LAB-B101', 3, 1, 100.00, 25, '实验室', 7, 'B101实验室', 1),
('B201实验室', 'LAB-B201', 3, 2, 120.00, 30, '实验室', 8, 'B201实验室', 1);

-- 楼层平面图数据
INSERT INTO ven_floor_plan (building_id, floor, image_url, description) VALUES
(1, 1, 'https://example.com/floor1.jpg', '第一教学楼一层平面图'),
(2, 1, 'https://example.com/lab-a1.jpg', '实验楼A一层平面图'),
(2, 2, 'https://example.com/lab-a2.jpg', '实验楼A二层平面图'),
(3, 1, 'https://example.com/lab-b1.jpg', '实验楼B一层平面图'),
(3, 2, 'https://example.com/lab-b2.jpg', '实验楼B二层平面图');

-- 实验教学任务数据
INSERT INTO edu_experiment_task (semester_id, major_id, class_id, student_count, student_level, course_name, course_category, is_independent, experiment_total_hours, experiment_current_hours, practice_total_hours, practice_current_hours, training_total_hours, training_current_hours, org_id, dept_id, teacher_name, teacher_title, technician_name, technician_title, textbook_name, guidebook_name, status) VALUES
(1, 1, 1, 45, '本科', '计算机网络实验', '专业必修课', 1, 64, 32, 32, 16, 48, 24, 2, 2, '王老师', '副教授', '李工程师', '工程师', '计算机网络原理', '计算机网络实验指导书', 1),
(1, 1, 2, 40, '本科', '数据结构实验', '专业必修课', 1, 48, 24, 24, 12, 36, 18, 2, 2, '张老师', '教授', '赵工程师', '高级工程师', '数据结构与算法', '数据结构实验指导书', 1),
(1, 2, 3, 42, '本科', '软件工程实验', '专业必修课', 1, 48, 24, 24, 12, 36, 18, 2, 3, '刘老师', '讲师', '孙工程师', '工程师', '软件工程导论', '软件工程实验指导书', 1);

-- 实验项目数据
INSERT INTO edu_experiment_project (course_code, project_name, experiment_hours, experiment_type, experiment_requirement, description, status) VALUES
('CS002', '线性表实验', 2, '基础', '必做', '线性表的基本操作实验', 1),
('CS002', '树与二叉树实验', 2, '综合', '必做', '树与二叉树的遍历与操作实验', 1),
('CS003', '进程管理实验', 2, '综合', '必做', '操作系统进程管理实验', 1),
('CS004', '网络协议分析实验', 2, '设计', '必做', '网络协议分析与实现实验', 1),
('CS005', '数据库设计实验', 2, '设计', '必做', '数据库设计与实现实验', 1);

-- 排课数据
INSERT INTO lab_scheduling (scheduling_code, semester_id, source_type, course_name, major_name, class_name, student_count, building_name, room_name, room_number, teacher_name, week_no, week_day, time_slot_start, status, approval_status) VALUES
('SCH001', 1, 'CentralScheduling', '数据结构与算法', '计算机科学与技术', '计算机2023-1班', 45, '实验楼A', 'A101实验室', 'A101', '李老师', 1, 1, '1-2', 1, 'approved'),
('SCH002', 1, 'CentralScheduling', '数据结构与算法', '计算机科学与技术', '计算机2023-1班', 45, '实验楼A', 'A101实验室', 'A101', '李老师', 1, 1, '3-4', 1, 'approved'),
('SCH003', 1, 'CentralScheduling', '操作系统', '计算机科学与技术', '计算机2023-2班', 40, '实验楼A', 'A102实验室', 'A102', '王老师', 1, 2, '5-6', 1, 'approved'),
('SCH004', 1, 'CentralScheduling', '计算机网络', '软件工程', '软件工程2023-1班', 42, '实验楼B', 'B201实验室', 'B201', '李老师', 2, 3, '1-2', 1, 'approved'),
('SCH005', 1, 'CentralScheduling', '数据库原理', '计算机科学与技术', '计算机2023-2班', 45, '实验楼B', 'B101实验室', 'B101', '王老师', 2, 2, '5-6', 1, 'approved'),
('SCH006', 1, 'CentralScheduling', '数据库原理', '计算机科学与技术', '计算机2023-1班', 45, '实验楼A', 'A101实验室', 'A101', '王老师', 3, 1, '1-2', 1, 'approved'),
('SCH007', 1, 'CentralScheduling', '数据库原理', '计算机科学与技术', '计算机2023-1班', 45, '实验楼A', 'A101实验室', 'A101', '王老师', 3, 1, '3-4', 1, 'approved'),
('SCH008', 1, 'CentralScheduling', '软件工程', '软件工程', '软件工程2023-2班', 40, '实验楼B', 'B101实验室', 'B101', '张老师', 4, 2, '5-6', 1, 'approved'),
('SCH009', 1, 'CentralScheduling', '人工智能', '人工智能', '人工智能2023-1班', 35, '实验楼A', 'A201实验室', 'A201', '刘老师', 5, 3, '1-2', 1, 'approved'),
('SCH010', 1, 'CentralScheduling', '机器学习', '人工智能', '人工智能2023-1班', 35, '实验楼A', 'A201实验室', 'A201', '刘老师', 5, 3, '3-4', 1, 'approved'),
('SCH011', 1, 'CentralScheduling', '计算机组成原理', '计算机科学与技术', '计算机2023-2班', 40, '实验楼B', 'B201实验室', 'B201', '赵老师', 6, 4, '5-6', 1, 'approved'),
('SCH012', 1, 'CentralScheduling', '编译原理', '计算机科学与技术', '计算机2023-1班', 45, '实验楼A', 'A102实验室', 'A102', '孙老师', 7, 5, '1-2', 1, 'approved');

-- 预约数据
INSERT INTO lab_reservation (reservation_code, semester_id, building_id, building_name, room_id, room_name, room_number, use_date, week_no, week_day, time_slot, project_name, project_category, applicant_id, applicant_name, applicant_phone, project_leader, project_leader_phone, member_count, approval_status) VALUES
('RES001', 1, 2, '实验楼A', 3, 'A101实验室', 'A101', '2025-09-17', 3, 3, '5-6', '智能算法研究', '学生科研项目', 1, '管理员', '13800138000', '张三', '13800138001', 10, 'approved'),
('RES002', 1, 3, '实验楼B', 8, 'B201实验室', 'B201', '2025-09-20', 4, 6, '7-8', '毕业设计实验', '毕业设计论文', 3, '李老师', '13800138002', '李老师', '13800138002', 5, 'pending');

-- 预约对应的排课记录
INSERT INTO lab_scheduling (scheduling_code, semester_id, source_type, source_id, course_name, class_name, teacher_name, building_id, building_name, room_id, room_name, room_number, week_no, week_day, time_slot_start, time_slot_end, student_count, status) VALUES
('RV001', 1, 'Reservation', 1, '智能算法研究', '-', '张三', 2, '实验楼A', 3, 'A101实验室', 'A101', 3, 3, '5-6', '5-6', 10, 1),
('RV002', 1, 'Reservation', 2, '毕业设计实验', '-', '李老师', 3, '实验楼B', 8, 'B201实验室', 'B201', 4, 6, '7-8', '7-8', 5, 1);

-- 授课申请数据
INSERT INTO lab_teaching_request (request_code, semester_id, course_name, major_name, grade, class_name, week_no, week_day, time_slot, applicant_id, applicant_name, approval_status) VALUES
('REQ001', 1, '计算机网络', '计算机科学与技术', '2023', '计算机2023-1班', 6, 1, '1-2', 4, '王老师', 'approved'),
('REQ002', 1, '数据库原理', '软件工程', '2023', '软件工程2023-1班', 7, 2, '3-4', 3, '李老师', 'pending');

-- 使用登记数据
INSERT INTO lab_usage_registration (registration_code, semester_id, scheduling_id, building_id, building_name, room_id, room_name, room_number, use_date, week_no, course_name, class_name, teacher_name, actual_duration, expected_students, actual_students, registration_status, reporter_id, reporter_name, report_time) VALUES
('REG001', 1, 1, 2, '实验楼A', 3, 'A101实验室', 'A101', '2025-09-15', 3, '数据结构与算法', '计算机2023-1班', '李老师', 2.0, 45, 43, 'registered', 3, '李老师', '2025-09-15 12:00:00'),
('REG002', 1, 2, 2, '实验楼A', 3, 'A101实验室', 'A101', '2025-09-15', 3, '数据结构与算法', '计算机2023-1班', '李老师', 2.0, 45, 44, 'registered', 3, '李老师', '2025-09-15 12:00:00');

-- =====================================================
-- 设备管理表
-- =====================================================

-- 设备分类表
CREATE TABLE IF NOT EXISTS equ_category (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  sort_order INTEGER DEFAULT 0,
  status INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_equ_category_code ON equ_category(code);
CREATE INDEX IF NOT EXISTS idx_equ_category_status ON equ_category(status);

-- 设备表
CREATE TABLE IF NOT EXISTS equ_equipment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_code VARCHAR(100) NOT NULL,
  name VARCHAR(200) NOT NULL,
  model VARCHAR(100),
  category_id INTEGER,
  unit VARCHAR(20),
  purchase_date DATE,
  brand VARCHAR(100),
  serial_number VARCHAR(100),
  specification TEXT,
  price DECIMAL(10,2),
  funding_source VARCHAR(100),
  use_years INTEGER,
  supplier VARCHAR(100),
  warranty_period VARCHAR(50),
  location VARCHAR(200),
  responsible_user_id INTEGER,
  status VARCHAR(50) DEFAULT 'available',
  department_id INTEGER,
  is_important INTEGER DEFAULT 0,
  tags VARCHAR(500),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_equ_equipment_code ON equ_equipment(asset_code);
CREATE INDEX IF NOT EXISTS idx_equ_equipment_category ON equ_equipment(category_id);
CREATE INDEX IF NOT EXISTS idx_equ_equipment_status ON equ_equipment(status);
CREATE INDEX IF NOT EXISTS idx_equ_equipment_department ON equ_equipment(department_id);

-- 设备附件表
CREATE TABLE IF NOT EXISTS equ_equipment_attachment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  equipment_id INTEGER NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_type VARCHAR(50),
  file_size INTEGER,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_equ_attachment_equipment ON equ_equipment_attachment(equipment_id);

-- 设备借还记录表
CREATE TABLE IF NOT EXISTS equ_borrow_record (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  borrow_code VARCHAR(100) NOT NULL,
  equipment_id INTEGER NOT NULL,
  equipment_name VARCHAR(200),
  asset_code VARCHAR(100),
  applicant_id INTEGER NOT NULL,
  applicant_name VARCHAR(100) NOT NULL,
  applicant_phone VARCHAR(20),
  borrow_date TIMESTAMP NOT NULL,
  expect_return_date TIMESTAMP NOT NULL,
  actual_return_date TIMESTAMP,
  use_place VARCHAR(200),
  purpose TEXT,
  quantity INTEGER DEFAULT 1,
  status VARCHAR(50) DEFAULT 'pending',
  approval_user_id INTEGER,
  approval_user_name VARCHAR(100),
  approval_time TIMESTAMP,
  approval_comment VARCHAR(500),
  is_supervised INTEGER DEFAULT 0,
  supervisor_id INTEGER,
  supervisor_name VARCHAR(100),
  receive_user_id INTEGER,
  receive_user_name VARCHAR(100),
  receive_time TIMESTAMP,
  check_status VARCHAR(50) DEFAULT 'normal',
  receive_remark VARCHAR(500),
  return_user_id INTEGER,
  return_user_name VARCHAR(100),
  return_condition VARCHAR(500),
  return_status VARCHAR(50),
  remark TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_equ_borrow_code ON equ_borrow_record(borrow_code);
CREATE INDEX IF NOT EXISTS idx_equ_borrow_equipment ON equ_borrow_record(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equ_borrow_applicant ON equ_borrow_record(applicant_id);
CREATE INDEX IF NOT EXISTS idx_equ_borrow_status ON equ_borrow_record(status);

-- 设备维修记录表
CREATE TABLE IF NOT EXISTS equ_repair_record (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  equipment_id INTEGER NOT NULL,
  equipment_name VARCHAR(200),
  asset_code VARCHAR(100),
  fault_description TEXT,
  report_user_id INTEGER,
  report_user_name VARCHAR(100),
  report_time TIMESTAMP,
  repair_type VARCHAR(50),
  repair_content TEXT,
  repair_user_id INTEGER,
  repair_user_name VARCHAR(100),
  repair_start_time TIMESTAMP,
  repair_end_time TIMESTAMP,
  repair_cost DECIMAL(10,2),
  repair_status VARCHAR(50) DEFAULT 'pending',
  remark TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_equ_repair_equipment ON equ_repair_record(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equ_repair_status ON equ_repair_record(repair_status);

-- 设备操作日志表
CREATE TABLE IF NOT EXISTS equ_operation_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  equipment_id INTEGER,
  equipment_name VARCHAR(200),
  operation_type VARCHAR(50) NOT NULL,
  operation_content TEXT,
  operator_id INTEGER,
  operator_name VARCHAR(100),
  operator_ip VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_equ_log_equipment ON equ_operation_log(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equ_log_operator ON equ_operation_log(operator_id);
CREATE INDEX IF NOT EXISTS idx_equ_log_time ON equ_operation_log(created_at);

-- =====================================================
-- 设备管理初始数据
-- =====================================================

-- 设备分类数据
INSERT INTO equ_category (code, name, description, sort_order, status) VALUES
('ELEC', '电子设备', '电脑、打印机、投影仪等电子设备', 1, 1),
('MECH', '机械设备', '实验机械、仪器仪表等', 2, 1),
('TOOL', '工具器材', '各种实验工具、器材', 3, 1),
('CHEM', '化学器材', '化学实验仪器、试剂等', 4, 1),
('BIO', '生物器材', '生物实验设备、显微镜等', 5, 1),
('COMP', '计算机设备', '电脑、服务器、网络设备', 6, 1);

-- 设备数据
INSERT INTO equ_equipment (asset_code, name, model, category_id, unit, purchase_date, brand, serial_number, specification, price, funding_source, use_years, supplier, warranty_period, location, responsible_user_id, status, department_id, is_important, tags, description) VALUES
('EQU001', '联想台式电脑', 'ThinkCentre M730t', 6, '台', '2024-01-15', '联想', 'SN20240115001', 'i5-12400/16G/512G SSD', 5999.00, '教学经费', 5, '联想科技', '3年', '实验楼A-A101-01', 3, 'available', 2, 0, '电脑,教学用', '教学用台式电脑'),
('EQU002', '戴尔投影仪', 'S340', 1, '台', '2024-02-20', '戴尔', 'SN20240220001', '3500流明/1080P', 4599.00, '教学经费', 5, '戴尔中国', '2年', '实验楼A-A101-02', 3, 'available', 2, 0, '投影仪,多媒体', '多媒体教学投影仪'),
('EQU003', '惠普打印机', 'LaserJet Pro M404dn', 1, '台', '2024-03-10', '惠普', 'SN20240310001', '黑白激光打印/双面', 1999.00, '办公经费', 3, '惠普中国', '1年', '实验楼A-A102-01', 4, 'available', 2, 0, '打印机,办公用', '办公用激光打印机'),
('EQU004', '电子显微镜', 'DM2500', 5, '台', '2024-01-01', '徕卡', 'SN20240101001', '光学显微镜/电子目镜', 25000.00, '科研经费', 8, '徕卡中国', '5年', '实验楼B-B101-01', 3, 'available', 2, 1, '显微镜,科研用', '科研用电子显微镜'),
('EQU005', '示波器', 'DS1102Z-E', 2, '台', '2024-02-01', '普源', 'SN20240201001', '100MHz/双通道', 3899.00, '教学经费', 5, '普源精电', '3年', '实验楼A-A201-01', 4, 'available', 2, 0, '示波器,电子实验', '电子实验用示波器'),
('EQU006', '服务器', 'PowerEdge R750', 6, '台', '2023-12-01', '戴尔', 'SN20231201001', '2*Gold 6342/128G/2T*4', 45000.00, '科研经费', 6, '戴尔中国', '3年', '实验楼B-B201-01', 3, 'available', 2, 1, '服务器,科研用', '科研用机架服务器'),
('EQU007', '笔记本电脑', 'ThinkPad X1 Carbon', 6, '台', '2024-04-01', '联想', 'SN20240401001', 'i7-1360P/16G/1TB SSD', 11999.00, '科研经费', 4, '联想科技', '2年', '实验楼B-B102-01', 4, 'borrowed', 2, 0, '笔记本,移动办公', '科研用笔记本电脑'),
('EQU008', '恒温干燥箱', 'DHG-9070A', 2, '台', '2023-11-01', '精宏', 'SN20231101001', '温度范围10-200℃', 2899.00, '教学经费', 5, '精宏仪器', '3年', '实验楼A-A301-01', 3, 'maintenance', 2, 0, '干燥箱,化学实验', '化学实验用干燥箱'),
('EQU009', 'PH计', 'PHS-3E', 5, '台', '2024-03-01', '雷磁', 'SN20240301001', 'PH范围0-14', 999.00, '教学经费', 3, '雷磁仪器', '1年', '实验楼B-B301-01', 4, 'available', 2, 0, 'PH计,化学实验', '化学实验PH计'),
('EQU010', '万用表', 'FLUKE-15B+', 2, '台', '2024-01-20', '福禄克', 'SN20240120001', '数字万用表', 499.00, '教学经费', 3, '福禄克中国', '2年', '实验楼A-A201-02', 4, 'available', 2, 0, '万用表,电子实验', '电子实验用万用表');

-- 设备借还记录数据
INSERT INTO equ_borrow_record (borrow_code, equipment_id, equipment_name, asset_code, applicant_id, applicant_name, applicant_phone, borrow_date, expect_return_date, use_place, purpose, quantity, status, approval_user_id, approval_user_name, approval_time, approval_comment, receive_user_id, receive_user_name, receive_time, remark) VALUES
('BRW001', 7, '笔记本电脑', 'EQU007', 2, '张老师', '13800138003', '2024-09-15 09:00:00', '2024-09-20 17:00:00', '校外会议室', '学术报告使用', 1, 'borrowed', 1, '管理员', '2024-09-15 08:30:00', '同意借出', 1, '管理员', '2024-09-15 09:00:00', '用于学术报告'),
('BRW002', 2, '戴尔投影仪', 'EQU002', 5, '用户1', '13800138004', '2024-09-16 08:00:00', '2024-09-16 18:00:00', '多功能厅', '开学典礼使用', 1, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '等待审批');

-- 设备维修记录数据
INSERT INTO equ_repair_record (equipment_id, equipment_name, asset_code, fault_description, report_user_id, report_user_name, report_time, repair_type, repair_status, remark) VALUES
(8, '恒温干燥箱', 'EQU008', '温控器失灵，温度不能准确控制', 4, '王老师', '2024-09-10 10:00:00', 'normal', 'maintenance', '等待维修');

-- 设备操作日志数据
INSERT INTO equ_operation_log (equipment_id, equipment_name, operation_type, operation_content, operator_id, operator_name, operator_ip) VALUES
(1, '联想台式电脑', 'create', '新增设备', 1, '管理员', '127.0.0.1'),
(2, '戴尔投影仪', 'create', '新增设备', 1, '管理员', '127.0.0.1'),
(3, '惠普打印机', 'create', '新增设备', 1, '管理员', '127.0.0.1'),
(4, '电子显微镜', 'create', '新增设备', 1, '管理员', '127.0.0.1'),
(5, '示波器', 'create', '新增设备', 1, '管理员', '127.0.0.1'),
(6, '服务器', 'create', '新增设备', 1, '管理员', '127.0.0.1'),
(7, '笔记本电脑', 'create', '新增设备', 1, '管理员', '127.0.0.1'),
(8, '恒温干燥箱', 'create', '新增设备', 1, '管理员', '127.0.0.1'),
(9, 'PH计', 'create', '新增设备', 1, '管理员', '127.0.0.1'),
(10, '万用表', 'create', '新增设备', 1, '管理员', '127.0.0.1'),
(7, '笔记本电脑', 'borrow', '设备借出', 1, '管理员', '127.0.0.1'),
(8, '恒温干燥箱', 'maintenance', '设备送修', 4, '王老师', '127.0.0.1');

-- 实验项目开出数据
INSERT INTO edu_experiment_project_offer (task_id, project_id, week_no, week_day, time_slot, group_count, students_per_group, cycle_count, experiment_requirement, building_name, room_number, is_offered, status) VALUES
(1, 1, '1-8', 1, '1-2节', 5, 9, 1, '必做', '实验楼A', 'A101', 1, 1),
(1, 2, '1-8', 1, '3-4节', 5, 9, 1, '必做', '实验楼A', 'A101', 1, 1),
(1, 3, '9-16', 3, '1-2节', 5, 9, 1, '必做', '实验楼A', 'A102', 1, 1),
(2, 1, '1-8', 2, '5-6节', 4, 10, 1, '必做', '实验楼A', 'A102', 1, 1),
(2, 2, '9-16', 4, '5-6节', 4, 10, 1, '必做', '实验楼A', 'A201', 1, 1),
(3, 3, '1-8', 3, '7-8节', 4, 10, 1, '必做', '实验楼B', 'B101', 1, 1),
(3, 4, '9-16', 5, '7-8节', 4, 11, 1, '选做', '实验楼B', 'B201', 1, 1);

-- 实验课程教学质量数据
INSERT INTO edu_experiment_quality (task_id, organization, course_name, experiment_hours, is_independent, teacher_name, teacher_title, technician_name, technician_title, class_name, class_student_count, planned_project_count, actual_project_count, not_offered_projects, not_offered_reasons, assessment_method, assessment_count, assessment_time, status) VALUES
(1, '计算机学院', '计算机网络实验', 64, 1, '王老师', '副教授', '李工程师', '工程师', '计算机2023-1班', 45, 8, 8, '', '', '综合', 45, '2025-12-20 09:00:00', 1),
(2, '计算机学院', '数据结构实验', 48, 1, '张老师', '教授', '赵工程师', '高级工程师', '计算机2023-2班', 40, 6, 6, '', '', '综合', 40, '2025-12-21 09:00:00', 1),
(3, '计算机学院', '软件工程实验', 48, 1, '刘老师', '讲师', '孙工程师', '工程师', '软件工程2023-1班', 42, 6, 5, '软件测试实验', '设备维护中', '报告', 42, '2025-12-22 09:00:00', 1);

-- 实训教学计划数据
INSERT INTO edu_training_plan (course_code, organization_mode, training_location, training_purpose, teaching_content, training_method, assessment_method, quality_measures, center_opinion, department_opinion, status) VALUES
('CS301', '校内集中', '实验楼A', '掌握Web开发技能，具备独立开发网站的能力', '第一周：HTML/CSS基础；第二周：JavaScript核心；第三周：Vue.js框架；第四周：Node.js后端开发；第五周：项目实战', '项目驱动教学，分组协作开发', '综合', '1. 定期检查进度；2. 代码评审；3. 项目答辩', '同意开设', '同意开设', 1),
('CS302', '校内集中', '实验楼B', '掌握移动应用开发技能', '第一周：React Native基础；第二周：组件开发；第三周：API对接；第四周：项目实战', '理论+实践结合', '项目答辩', '1. 每日签到；2. 周汇报；3. 最终答辩', '同意开设', '同意开设', 1),
('SE301', '校外集中', '软件园实训基地', '企业级软件开发实践', '第一周：需求分析；第二周：架构设计；第三周：编码实现；第四周：测试部署', '企业导师指导', '综合', '1. 企业考核；2. 项目验收；3. 实习报告', '同意开设', '同意开设', 1),
('EE301', '校内集中', '实验楼B', '电子电路设计与实践', '第一周：电路原理复习；第二周：PCB设计；第三周：焊接调试；第四周：项目展示', '理论+实践', '实操', '1. 过程考核；2. 作品展示；3. 答辩', '同意开设', '同意开设', 1);