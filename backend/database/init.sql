CREATE DATABASE IF NOT EXISTS `lab_management` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `lab_management`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE `sys_user` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` varchar(50) NOT NULL COMMENT '用户名',
  `password` varchar(255) NOT NULL COMMENT '密码',
  `real_name` varchar(50) DEFAULT NULL COMMENT '真实姓名',
  `avatar` varchar(255) DEFAULT NULL COMMENT '头像',
  `phone` varchar(20) DEFAULT NULL COMMENT '手机号',
  `email` varchar(100) DEFAULT NULL COMMENT '邮箱',
  `dept_id` int(11) DEFAULT NULL COMMENT '部门ID',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态：0禁用 1启用',
  `last_login_time` datetime DEFAULT NULL COMMENT '最后登录时间',
  `last_login_ip` varchar(50) DEFAULT NULL COMMENT '最后登录IP',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  KEY `idx_dept_id` (`dept_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

CREATE TABLE `sys_role` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '角色ID',
  `name` varchar(50) NOT NULL COMMENT '角色名称',
  `code` varchar(50) NOT NULL COMMENT '角色编码',
  `description` varchar(255) DEFAULT NULL COMMENT '描述',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态：0禁用 1启用',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表';

CREATE TABLE `sys_menu` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '菜单ID',
  `name` varchar(50) NOT NULL COMMENT '菜单名称',
  `path` varchar(255) DEFAULT NULL COMMENT '路由路径',
  `component` varchar(255) DEFAULT NULL COMMENT '组件路径',
  `icon` varchar(100) DEFAULT NULL COMMENT '图标',
  `parent_id` int(11) DEFAULT 0 COMMENT '父级ID',
  `sort` int(11) DEFAULT 0 COMMENT '排序',
  `type` varchar(20) DEFAULT 'menu' COMMENT '类型：menu菜单 button按钮',
  `visible` tinyint(1) DEFAULT 1 COMMENT '是否可见：0隐藏 1显示',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态：0禁用 1启用',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='菜单表';

CREATE TABLE `sys_permission` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '权限ID',
  `name` varchar(50) NOT NULL COMMENT '权限名称',
  `code` varchar(100) NOT NULL COMMENT '权限编码',
  `path` varchar(255) DEFAULT NULL COMMENT '接口路径',
  `method` varchar(10) DEFAULT 'GET' COMMENT '请求方法',
  `description` varchar(255) DEFAULT NULL COMMENT '描述',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态：0禁用 1启用',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='权限表';

CREATE TABLE `sys_organization` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '机构ID',
  `name` varchar(100) NOT NULL COMMENT '机构名称',
  `code` varchar(50) NOT NULL COMMENT '机构编码',
  `parent_id` int(11) DEFAULT 0 COMMENT '父级ID',
  `sort` int(11) DEFAULT 0 COMMENT '排序',
  `description` varchar(255) DEFAULT NULL COMMENT '描述',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态：0禁用 1启用',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`),
  KEY `idx_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='机构表';

CREATE TABLE `sys_department` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '部门ID',
  `name` varchar(100) NOT NULL COMMENT '部门名称',
  `code` varchar(50) NOT NULL COMMENT '部门编码',
  `org_id` int(11) DEFAULT NULL COMMENT '所属机构ID',
  `parent_id` int(11) DEFAULT 0 COMMENT '父级ID',
  `sort` int(11) DEFAULT 0 COMMENT '排序',
  `description` varchar(255) DEFAULT NULL COMMENT '描述',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态：0禁用 1启用',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`),
  KEY `idx_org_id` (`org_id`),
  KEY `idx_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='部门表';

CREATE TABLE `sys_user_role` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `role_id` int(11) NOT NULL COMMENT '角色ID',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_role` (`user_id`, `role_id`),
  KEY `idx_role_id` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户角色关联表';

CREATE TABLE `sys_role_menu` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `role_id` int(11) NOT NULL COMMENT '角色ID',
  `menu_id` int(11) NOT NULL COMMENT '菜单ID',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_menu` (`role_id`, `menu_id`),
  KEY `idx_menu_id` (`menu_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色菜单关联表';

CREATE TABLE `sys_role_permission` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `role_id` int(11) NOT NULL COMMENT '角色ID',
  `permission_id` int(11) NOT NULL COMMENT '权限ID',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_permission` (`role_id`, `permission_id`),
  KEY `idx_permission_id` (`permission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色权限关联表';

CREATE TABLE `sys_operation_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `user_id` int(11) DEFAULT NULL COMMENT '用户ID',
  `username` varchar(50) DEFAULT NULL COMMENT '用户名',
  `operation` varchar(100) DEFAULT NULL COMMENT '操作描述',
  `method` varchar(10) DEFAULT NULL COMMENT '请求方法',
  `path` varchar(255) DEFAULT NULL COMMENT '请求路径',
  `ip` varchar(50) DEFAULT NULL COMMENT 'IP地址',
  `params` text COMMENT '请求参数',
  `result` text COMMENT '返回结果',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态：0失败 1成功',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志表';

CREATE TABLE `sys_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '配置ID',
  `config_key` varchar(100) NOT NULL COMMENT '配置键',
  `config_value` text COMMENT '配置值',
  `group_name` varchar(50) DEFAULT NULL COMMENT '分组名称',
  `description` varchar(255) DEFAULT NULL COMMENT '描述',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态：0禁用 1启用',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统配置表';

CREATE TABLE `edu_course` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '课程ID',
  `name` varchar(100) NOT NULL COMMENT '课程名称',
  `code` varchar(50) NOT NULL COMMENT '课程编码',
  `type` varchar(50) DEFAULT NULL COMMENT '课程类型',
  `credit` decimal(3,1) DEFAULT NULL COMMENT '学分',
  `hours` int(11) DEFAULT NULL COMMENT '学时',
  `description` varchar(500) DEFAULT NULL COMMENT '描述',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态：0禁用 1启用',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='课程表';

CREATE TABLE `edu_semester` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '学期ID',
  `name` varchar(100) NOT NULL COMMENT '学期名称',
  `code` varchar(50) NOT NULL COMMENT '学期编码',
  `start_date` date DEFAULT NULL COMMENT '开始日期',
  `end_date` date DEFAULT NULL COMMENT '结束日期',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态：0禁用 1启用',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学期表';

CREATE TABLE `edu_calendar` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '日历ID',
  `semester_id` int(11) NOT NULL COMMENT '学期ID',
  `date` date NOT NULL COMMENT '日期',
  `week` int(11) DEFAULT NULL COMMENT '周次',
  `week_day` int(11) DEFAULT NULL COMMENT '星期几：1-7',
  `type` varchar(20) DEFAULT 'normal' COMMENT '类型：normal正常 holiday假期 exam考试',
  `description` varchar(255) DEFAULT NULL COMMENT '描述',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_semester_date` (`semester_id`, `date`),
  KEY `idx_semester_id` (`semester_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='校历表';

CREATE TABLE `edu_major` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '专业ID',
  `name` varchar(100) NOT NULL COMMENT '专业名称',
  `code` varchar(50) NOT NULL COMMENT '专业编码',
  `org_id` int(11) DEFAULT NULL COMMENT '所属机构ID',
  `degree` varchar(50) DEFAULT NULL COMMENT '学位类型',
  `duration` int(11) DEFAULT NULL COMMENT '学制（年）',
  `description` varchar(500) DEFAULT NULL COMMENT '描述',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态：0禁用 1启用',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`),
  KEY `idx_org_id` (`org_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='专业表';

CREATE TABLE `edu_class` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '班级ID',
  `name` varchar(100) NOT NULL COMMENT '班级名称',
  `code` varchar(50) NOT NULL COMMENT '班级编码',
  `major_id` int(11) DEFAULT NULL COMMENT '所属专业ID',
  `grade` varchar(20) DEFAULT NULL COMMENT '年级',
  `student_count` int(11) DEFAULT 0 COMMENT '学生人数',
  `head_teacher` varchar(50) DEFAULT NULL COMMENT '班主任',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态：0禁用 1启用',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`),
  KEY `idx_major_id` (`major_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='班级表';

CREATE TABLE `edu_teaching_task` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '教学任务ID',
  `semester_id` int(11) NOT NULL COMMENT '学期ID',
  `course_id` int(11) NOT NULL COMMENT '课程ID',
  `class_id` int(11) NOT NULL COMMENT '班级ID',
  `teacher_id` int(11) DEFAULT NULL COMMENT '教师ID',
  `weekly_hours` int(11) DEFAULT NULL COMMENT '周学时',
  `total_hours` int(11) DEFAULT NULL COMMENT '总学时',
  `classroom` varchar(100) DEFAULT NULL COMMENT '教室',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态：0禁用 1启用',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_semester_id` (`semester_id`),
  KEY `idx_course_id` (`course_id`),
  KEY `idx_class_id` (`class_id`),
  KEY `idx_teacher_id` (`teacher_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='教学任务表';

CREATE TABLE `edu_time_slot` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '节次ID',
  `name` varchar(50) NOT NULL COMMENT '节次名称',
  `start_time` time DEFAULT NULL COMMENT '开始时间',
  `end_time` time DEFAULT NULL COMMENT '结束时间',
  `sort` int(11) DEFAULT 0 COMMENT '排序',
  `type` varchar(20) DEFAULT 'morning' COMMENT '类型：morning上午 afternoon下午 evening晚上',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态：0禁用 1启用',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='节次表';

CREATE TABLE `ven_campus` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '校区ID',
  `name` varchar(100) NOT NULL COMMENT '校区名称',
  `code` varchar(50) NOT NULL COMMENT '校区编码',
  `address` varchar(255) DEFAULT NULL COMMENT '地址',
  `description` varchar(500) DEFAULT NULL COMMENT '描述',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态：0禁用 1启用',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='校区表';

CREATE TABLE `ven_building` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '楼宇ID',
  `name` varchar(100) NOT NULL COMMENT '楼宇名称',
  `code` varchar(50) NOT NULL COMMENT '楼宇编码',
  `campus_id` int(11) NOT NULL COMMENT '所属校区ID',
  `floors` int(11) DEFAULT NULL COMMENT '楼层数',
  `type` varchar(50) DEFAULT NULL COMMENT '楼宇类型',
  `description` varchar(500) DEFAULT NULL COMMENT '描述',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态：0禁用 1启用',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`),
  KEY `idx_campus_id` (`campus_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='楼宇表';

CREATE TABLE `ven_room` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '房间ID',
  `name` varchar(100) NOT NULL COMMENT '房间名称',
  `code` varchar(50) NOT NULL COMMENT '房间编码',
  `building_id` int(11) NOT NULL COMMENT '所属楼宇ID',
  `floor` int(11) DEFAULT NULL COMMENT '楼层',
  `area` decimal(10,2) DEFAULT NULL COMMENT '面积',
  `capacity` int(11) DEFAULT NULL COMMENT '容量',
  `type` varchar(50) DEFAULT NULL COMMENT '房间类型',
  `equipment` text COMMENT '设备信息JSON',
  `description` varchar(500) DEFAULT NULL COMMENT '描述',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态：0禁用 1启用',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`),
  KEY `idx_building_id` (`building_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='房间表';

CREATE TABLE `ven_floor_plan` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '平面图ID',
  `building_id` int(11) NOT NULL COMMENT '所属楼宇ID',
  `floor` int(11) NOT NULL COMMENT '楼层',
  `image_url` varchar(255) DEFAULT NULL COMMENT '图片URL',
  `description` varchar(500) DEFAULT NULL COMMENT '描述',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_building_floor` (`building_id`, `floor`),
  KEY `idx_building_id` (`building_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='楼层平面图表';

CREATE TABLE `edu_experiment_task` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '实验教学任务ID',
  `semester_id` int(11) NOT NULL COMMENT '学期ID',
  `major_id` int(11) DEFAULT NULL COMMENT '专业ID',
  `class_id` int(11) DEFAULT NULL COMMENT '班级ID',
  `student_count` int(11) DEFAULT 0 COMMENT '学生人数',
  `student_level` varchar(20) DEFAULT NULL COMMENT '学生层次：专科、本科、研究生',
  `course_name` varchar(100) NOT NULL COMMENT '课程名称',
  `course_category` varchar(50) DEFAULT NULL COMMENT '课程类别：公共必修课、专业基础必修课、专业必修课、专业选修课',
  `is_independent` tinyint(1) DEFAULT 0 COMMENT '是否独立设课：0否 1是',
  `experiment_total_hours` int(11) DEFAULT 0 COMMENT '实验总学时',
  `experiment_current_hours` int(11) DEFAULT 0 COMMENT '本学期实验学时',
  `practice_total_hours` int(11) DEFAULT 0 COMMENT '实践总学时',
  `practice_current_hours` int(11) DEFAULT 0 COMMENT '本学期实践学时',
  `training_total_hours` int(11) DEFAULT 0 COMMENT '实训总学时',
  `training_current_hours` int(11) DEFAULT 0 COMMENT '本学期实训学时',
  `org_id` int(11) DEFAULT NULL COMMENT '开课机构ID',
  `dept_id` int(11) DEFAULT NULL COMMENT '开课部门ID',
  `teacher_name` varchar(50) DEFAULT NULL COMMENT '授课教师',
  `teacher_title` varchar(50) DEFAULT NULL COMMENT '教师职称',
  `technician_name` varchar(50) DEFAULT NULL COMMENT '技术人员（指导老师）',
  `technician_title` varchar(50) DEFAULT NULL COMMENT '技术人员职称',
  `textbook_name` varchar(200) DEFAULT NULL COMMENT '教材名称',
  `guidebook_name` varchar(200) DEFAULT NULL COMMENT '实验指导书名称',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态：0禁用 1启用',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_semester_id` (`semester_id`),
  KEY `idx_major_id` (`major_id`),
  KEY `idx_class_id` (`class_id`),
  KEY `idx_org_id` (`org_id`),
  KEY `idx_dept_id` (`dept_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='实验教学任务表';

INSERT INTO `sys_user` (`username`, `password`, `real_name`, `phone`, `email`, `status`) VALUES
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '管理员', '13800138000', 'admin@example.com', 1),
('user1', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '用户1', '13800138001', 'user1@example.com', 1);

INSERT INTO `sys_role` (`name`, `code`, `description`, `status`) VALUES
('管理员', 'admin', '系统管理员，拥有所有权限', 1),
('教师', 'teacher', '教师角色', 1),
('学生', 'student', '学生角色', 1);

INSERT INTO `sys_user_role` (`user_id`, `role_id`) VALUES (1, 1), (2, 3);

INSERT INTO `sys_menu` (`name`, `path`, `component`, `icon`, `parent_id`, `sort`, `type`, `visible`, `status`) VALUES
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
('校区管理', '/venue/campus', 'venue/campus/index', 'MapLocation', 18, 1, 'menu', 1, 1),
('楼宇管理', '/venue/building', 'venue/building/index', 'House', 18, 2, 'menu', 1, 1),
('房间管理', '/venue/room', 'venue/room/index', 'HomeFilled', 18, 3, 'menu', 1, 1),
('楼层平面图', '/venue/floor-plan', 'venue/floor-plan/index', 'Picture', 18, 4, 'menu', 1, 1);

INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8), (1, 9),
(1, 10), (1, 11), (1, 12), (1, 13), (1, 14), (1, 15), (1, 16), (1, 17),
(1, 18), (1, 19), (1, 20), (1, 21), (1, 22), (1, 23);

-- 机构数据
INSERT INTO `sys_organization` (`name`, `code`, `parent_id`, `sort`, `description`, `status`) VALUES
('学校', 'school', 0, 1, '学校总部', 1),
('计算机学院', 'cs', 1, 1, '计算机学院', 1);

-- 部门数据
INSERT INTO `sys_department` (`name`, `code`, `org_id`, `parent_id`, `sort`, `description`, `status`) VALUES
('教务处', 'jiaowu', 1, 0, 1, '教学管理部门', 1),
('计算机系', 'computer', 2, 0, 1, '计算机系', 1);

-- 权限数据
INSERT INTO `sys_permission` (`name`, `code`, `path`, `method`, `description`, `status`) VALUES
('用户管理', 'user:manage', '/api/v1/users', 'GET', '用户管理权限', 1),
('角色管理', 'role:manage', '/api/v1/roles', 'GET', '角色管理权限', 1);

-- 系统配置数据
INSERT INTO `sys_config` (`config_key`, `config_value`, `group_name`, `description`, `status`) VALUES
('system_name', '高校实验室信息管理系统', 'system', '系统名称', 1),
('version', '1.0.0', 'system', '系统版本', 1);

-- 操作日志数据
INSERT INTO `sys_operation_log` (`user_id`, `username`, `operation`, `method`, `path`, `ip`, `status`, `created_at`) VALUES
(1, 'admin', '登录', 'POST', '/api/v1/login', '127.0.0.1', 1, '2026-04-10 10:00:00');

-- 课程数据
INSERT INTO `edu_course` (`name`, `code`, `type`, `credit`, `hours`, `description`, `status`) VALUES
('高等数学', 'MA001', '公共课', 4.0, 64, '高等数学课程', 1),
('大学物理', 'PH001', '公共课', 3.0, 48, '大学物理课程', 1),
('程序设计', 'CS001', '专业课', 4.0, 64, '程序设计课程', 1);

-- 学期数据
INSERT INTO `edu_semester` (`name`, `code`, `start_date`, `end_date`, `status`) VALUES
('2025-2026学年第一学期', '2025-1', '2025-09-01', '2025-12-31', 1),
('2025-2026学年第二学期', '2026-2', '2026-02-20', '2026-06-30', 0);

-- 校历数据
INSERT INTO `edu_calendar` (`semester_id`, `date`, `week`, `week_day`, `type`, `description`) VALUES
(1, '2025-09-01', 1, 1, 'start', '学期开始');

-- 专业数据
INSERT INTO `edu_major` (`name`, `code`, `org_id`, `degree`, `duration`, `description`, `status`) VALUES
('计算机科学与技术', 'CS', 2, '工学', 4, '计算机科学与技术专业', 1),
('电子信息工程', 'EE', 2, '工学', 4, '电子信息工程专业', 1),
('机械工程', 'ME', 1, '工学', 4, '机械工程专业', 1);

-- 班级数据
INSERT INTO `edu_class` (`name`, `code`, `major_id`, `grade`, `student_count`, `head_teacher`, `status`) VALUES
('计算机2023-1班', 'CS2023-1', 1, '2023', 45, '张老师', 1),
('电子2023-1班', 'EE2023-1', 2, '2023', 40, '李老师', 1);

-- 教学任务数据
INSERT INTO `edu_teaching_task` (`semester_id`, `course_id`, `class_id`, `teacher_id`, `weekly_hours`, `total_hours`, `classroom`, `status`) VALUES
(1, 1, 1, 2, 4, 64, '101教室', 1);

INSERT INTO `edu_time_slot` (`name`, `start_time`, `end_time`, `sort`, `type`, `status`) VALUES
('第1-2节', '08:00:00', '09:40:00', 1, 'morning', 1),
('第3-4节', '10:00:00', '11:40:00', 2, 'morning', 1),
('第5-6节', '14:00:00', '15:40:00', 3, 'afternoon', 1),
('第7-8节', '16:00:00', '17:40:00', 4, 'afternoon', 1),
('第9-10节', '19:00:00', '20:40:00', 5, 'evening', 1);

-- 校区数据
INSERT INTO `ven_campus` (`name`, `code`, `address`, `description`, `status`) VALUES
('主校区', 'main', '北京市海淀区学院路30号', '主校区', 1),
('分校区', 'branch', '北京市昌平区回龙观', '分校区', 1);

-- 楼宇数据
INSERT INTO `ven_building` (`name`, `code`, `campus_id`, `floors`, `type`, `description`, `status`) VALUES
('第一教学楼', 'TEACH-01', 1, 6, '教学', '第一教学楼', 1),
('实验楼', 'LAB-01', 1, 5, '实验', '实验楼', 1);

-- 房间数据
INSERT INTO `ven_room` (`name`, `code`, `building_id`, `floor`, `area`, `capacity`, `type`, `description`, `status`) VALUES
('101教室', 'ROOM-101', 1, 1, 80.00, 50, '教室', '101教室', 1),
('201实验室', 'ROOM-201', 2, 2, 120.00, 30, '实验室', '201实验室', 1);

-- 楼层平面图数据
INSERT INTO `ven_floor_plan` (`building_id`, `floor`, `image_url`, `description`) VALUES
(1, 1, 'https://example.com/floor1.jpg', '一层平面图');

-- 实验教学任务数据
INSERT INTO `edu_experiment_task` (`semester_id`, `major_id`, `class_id`, `student_count`, `student_level`, `course_name`, `course_category`, `is_independent`, `experiment_total_hours`, `experiment_current_hours`, `practice_total_hours`, `practice_current_hours`, `training_total_hours`, `training_current_hours`, `org_id`, `dept_id`, `teacher_name`, `teacher_title`, `technician_name`, `technician_title`, `textbook_name`, `guidebook_name`, `status`) VALUES
(1, 1, 1, 45, '本科', '计算机网络实验', '专业必修课', 1, 64, 32, 32, 16, 48, 24, 2, 2, '王老师', '副教授', '李工程师', '工程师', '计算机网络原理', '计算机网络实验指导书', 1),
(1, 1, 1, 45, '本科', '数据库系统实验', '专业必修课', 1, 48, 24, 24, 12, 36, 18, 2, 2, '张老师', '教授', '赵工程师', '高级工程师', '数据库系统概论', '数据库实验指导书', 1),
(1, 2, 2, 40, '本科', '电子电路实验', '专业基础必修课', 1, 48, 24, 24, 12, 36, 18, 2, 2, '刘老师', '讲师', '孙工程师', '工程师', '模拟电子技术', '电子电路实验指导书', 1);

SET FOREIGN_KEY_CHECKS = 1;
