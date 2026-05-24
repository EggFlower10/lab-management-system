-- =====================================================
-- 高校实验室信息管理系统 - 完整数据库导出
-- 生成时间: 2026-05-22
-- =====================================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS `lab_management` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `lab_management`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- 系统基础表
-- =====================================================

-- 用户表
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

-- 角色表
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

-- 菜单表
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

-- 权限表
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

-- 机构表
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

-- 部门表
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

-- 用户角色关联表
CREATE TABLE `sys_user_role` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `role_id` int(11) NOT NULL COMMENT '角色ID',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_role` (`user_id`, `role_id`),
  KEY `idx_role_id` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户角色关联表';

-- 角色菜单关联表
CREATE TABLE `sys_role_menu` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `role_id` int(11) NOT NULL COMMENT '角色ID',
  `menu_id` int(11) NOT NULL COMMENT '菜单ID',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_menu` (`role_id`, `menu_id`),
  KEY `idx_menu_id` (`menu_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色菜单关联表';

-- 角色权限关联表
CREATE TABLE `sys_role_permission` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `role_id` int(11) NOT NULL COMMENT '角色ID',
  `permission_id` int(11) NOT NULL COMMENT '权限ID',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_permission` (`role_id`, `permission_id`),
  KEY `idx_permission_id` (`permission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色权限关联表';

-- 操作日志表
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

-- 系统配置表
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

-- =====================================================
-- 教学信息表
-- =====================================================

-- 课程表
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

-- 学期表
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

-- 校历表
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

-- 专业表
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

-- 班级表
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

-- 教学任务表
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

-- 节次表
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

-- =====================================================
-- 场馆信息表
-- =====================================================

-- 校区表
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

-- 楼宇表
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

-- 房间表
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

-- 楼层平面图表
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

-- =====================================================
-- 实验教学表
-- =====================================================

-- 实验教学任务表
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

-- 实验项目库表
CREATE TABLE `edu_experiment_project` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '项目ID',
  `course_code` varchar(50) DEFAULT NULL COMMENT '课程编号',
  `project_name` varchar(200) NOT NULL COMMENT '项目名称',
  `experiment_hours` int(11) DEFAULT NULL COMMENT '实验学时',
  `experiment_type` varchar(50) DEFAULT NULL COMMENT '实验类型',
  `experiment_requirement` varchar(50) DEFAULT NULL COMMENT '实验要求',
  `description` varchar(500) DEFAULT NULL COMMENT '说明',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='实验项目库表';

-- =====================================================
-- 实验室排课预约模块表
-- =====================================================

-- 实验室排课表
CREATE TABLE `lab_scheduling` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '排课ID',
  `scheduling_code` VARCHAR(50) DEFAULT NULL COMMENT '排课编号',
  `semester_id` INT(11) NOT NULL COMMENT '学期ID',
  `source_type` VARCHAR(20) NOT NULL COMMENT '排课来源',
  `source_id` INT(11) DEFAULT NULL COMMENT '来源记录ID',
  `course_id` INT(11) DEFAULT NULL COMMENT '课程ID',
  `course_name` VARCHAR(200) DEFAULT NULL COMMENT '课程名称',
  `course_category` VARCHAR(50) DEFAULT NULL COMMENT '课程类别',
  `major_id` INT(11) DEFAULT NULL COMMENT '专业ID',
  `major_name` VARCHAR(200) DEFAULT NULL COMMENT '专业名称',
  `class_id` INT(11) DEFAULT NULL COMMENT '班级ID',
  `class_name` VARCHAR(200) DEFAULT NULL COMMENT '班级名称',
  `student_count` INT(11) DEFAULT 0 COMMENT '学生人数',
  `building_id` INT(11) DEFAULT NULL COMMENT '楼宇ID',
  `building_name` VARCHAR(100) DEFAULT NULL COMMENT '楼宇名称',
  `room_id` INT(11) DEFAULT NULL COMMENT '房间ID',
  `room_name` VARCHAR(100) DEFAULT NULL COMMENT '房间名称',
  `room_number` VARCHAR(50) DEFAULT NULL COMMENT '房间号',
  `teacher_id` INT(11) DEFAULT NULL COMMENT '教师ID',
  `teacher_name` VARCHAR(100) DEFAULT NULL COMMENT '教师名称',
  `teacher_title` VARCHAR(50) DEFAULT NULL COMMENT '教师职称',
  `technician_id` INT(11) DEFAULT NULL COMMENT '实验技术人员ID',
  `technician_name` VARCHAR(100) DEFAULT NULL COMMENT '实验技术人员名称',
  `week_no` INT(11) NOT NULL COMMENT '教学周',
  `week_day` INT(11) NOT NULL COMMENT '星期(1-7)',
  `time_slot_start` VARCHAR(20) NOT NULL COMMENT '开始节次',
  `time_slot_end` VARCHAR(20) DEFAULT NULL COMMENT '结束节次',
  `week_type` VARCHAR(20) DEFAULT 'all' COMMENT '周类型',
  `project_name` VARCHAR(200) DEFAULT NULL COMMENT '项目名称',
  `project_category` VARCHAR(50) DEFAULT NULL COMMENT '项目类别',
  `applicant_id` INT(11) DEFAULT NULL COMMENT '申请人ID',
  `applicant_name` VARCHAR(100) DEFAULT NULL COMMENT '申请人名称',
  `applicant_phone` VARCHAR(20) DEFAULT NULL COMMENT '申请人电话',
  `project_leader` VARCHAR(100) DEFAULT NULL COMMENT '项目负责人',
  `project_leader_phone` VARCHAR(20) DEFAULT NULL COMMENT '项目负责人电话',
  `expected_duration` DECIMAL(5,2) DEFAULT NULL COMMENT '预计使用时长(小时)',
  `remarks` TEXT DEFAULT NULL COMMENT '备注',
  `status` INT(11) DEFAULT 1 COMMENT '状态',
  `approval_status` VARCHAR(20) DEFAULT 'approved' COMMENT '审批状态',
  `approval_comment` TEXT DEFAULT NULL COMMENT '审批意见',
  `approved_by` INT(11) DEFAULT NULL COMMENT '审批人ID',
  `approved_by_name` VARCHAR(100) DEFAULT NULL COMMENT '审批人名称',
  `approved_at` DATETIME DEFAULT NULL COMMENT '审批时间',
  `created_by` INT(11) DEFAULT NULL COMMENT '创建人ID',
  `created_by_name` VARCHAR(100) DEFAULT NULL COMMENT '创建人名称',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at` DATETIME DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  KEY `idx_semester` (`semester_id`),
  KEY `idx_week` (`week_no`),
  KEY `idx_weekday` (`week_day`),
  KEY `idx_building` (`building_id`),
  KEY `idx_room` (`room_id`),
  KEY `idx_teacher` (`teacher_id`),
  KEY `idx_class` (`class_id`),
  KEY `idx_source` (`source_type`, `source_id`),
  KEY `idx_status` (`status`),
  KEY `idx_approval` (`approval_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='实验室排课表';

-- 预约申请表
CREATE TABLE `lab_reservation` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '预约ID',
  `reservation_code` VARCHAR(50) DEFAULT NULL COMMENT '预约编号',
  `semester_id` INT(11) NOT NULL COMMENT '学期ID',
  `building_id` INT(11) NOT NULL COMMENT '楼宇ID',
  `building_name` VARCHAR(100) NOT NULL COMMENT '楼宇名称',
  `room_id` INT(11) NOT NULL COMMENT '房间ID',
  `room_name` VARCHAR(100) NOT NULL COMMENT '房间名称',
  `room_number` VARCHAR(50) NOT NULL COMMENT '房间号',
  `use_date` DATE NOT NULL COMMENT '使用日期',
  `week_no` INT(11) NOT NULL COMMENT '教学周',
  `week_day` INT(11) NOT NULL COMMENT '星期(1-7)',
  `time_slot` VARCHAR(50) NOT NULL COMMENT '节次',
  `week_type` VARCHAR(20) DEFAULT 'all' COMMENT '周类型',
  `project_name` VARCHAR(200) NOT NULL COMMENT '开展项目名称',
  `project_category` VARCHAR(50) NOT NULL COMMENT '项目类别',
  `applicant_id` INT(11) NOT NULL COMMENT '申请人ID',
  `applicant_name` VARCHAR(100) NOT NULL COMMENT '申请人名称',
  `applicant_phone` VARCHAR(20) NOT NULL COMMENT '申请人联系电话',
  `project_leader` VARCHAR(100) NOT NULL COMMENT '项目负责人',
  `project_leader_phone` VARCHAR(20) NOT NULL COMMENT '项目负责人联系电话',
  `member_grade` VARCHAR(50) DEFAULT NULL COMMENT '参与成员-年级',
  `member_class` VARCHAR(200) DEFAULT NULL COMMENT '参与成员-班级',
  `member_count` INT(11) DEFAULT 0 COMMENT '参与成员-人数',
  `expected_duration` DECIMAL(5,2) DEFAULT NULL COMMENT '预计使用时长(小时)',
  `remarks` TEXT DEFAULT NULL COMMENT '备注',
  `approval_status` VARCHAR(20) DEFAULT 'pending' COMMENT '审批状态',
  `approval_comment` TEXT DEFAULT NULL COMMENT '审批意见',
  `approved_by` INT(11) DEFAULT NULL COMMENT '审批人ID',
  `approved_by_name` VARCHAR(100) DEFAULT NULL COMMENT '审批人名称',
  `approved_at` DATETIME DEFAULT NULL COMMENT '审批时间',
  `scheduling_id` INT(11) DEFAULT NULL COMMENT '关联的排课ID',
  `is_cancelled` INT(11) DEFAULT 0 COMMENT '是否已取消',
  `cancelled_by` INT(11) DEFAULT NULL COMMENT '取消操作人ID',
  `cancelled_by_name` VARCHAR(100) DEFAULT NULL COMMENT '取消操作人名称',
  `cancelled_at` DATETIME DEFAULT NULL COMMENT '取消时间',
  `cancel_reason` TEXT DEFAULT NULL COMMENT '取消原因',
  `created_by` INT(11) DEFAULT NULL COMMENT '创建人ID',
  `created_by_name` VARCHAR(100) DEFAULT NULL COMMENT '创建人名称',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at` DATETIME DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  KEY `idx_semester` (`semester_id`),
  KEY `idx_date` (`use_date`),
  KEY `idx_room` (`room_id`),
  KEY `idx_applicant` (`applicant_id`),
  KEY `idx_approval` (`approval_status`),
  KEY `idx_cancelled` (`is_cancelled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='实验室预约申请表';

-- 授课申请表
CREATE TABLE `lab_teaching_request` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '申请ID',
  `request_code` VARCHAR(50) DEFAULT NULL COMMENT '申请编号',
  `semester_id` INT(11) NOT NULL COMMENT '学期ID',
  `teaching_task_id` INT(11) DEFAULT NULL COMMENT '关联的教学任务ID',
  `course_id` INT(11) DEFAULT NULL COMMENT '课程ID',
  `course_name` VARCHAR(200) NOT NULL COMMENT '上课课程',
  `major_id` INT(11) DEFAULT NULL COMMENT '专业ID',
  `major_name` VARCHAR(200) DEFAULT NULL COMMENT '专业名称',
  `grade` VARCHAR(50) DEFAULT NULL COMMENT '年级',
  `class_id` INT(11) DEFAULT NULL COMMENT '班级ID',
  `class_name` VARCHAR(200) DEFAULT NULL COMMENT '班级名称',
  `week_no` INT(11) NOT NULL COMMENT '上课周次',
  `week_day` INT(11) NOT NULL COMMENT '星期(1-7)',
  `time_slot` VARCHAR(50) NOT NULL COMMENT '节次',
  `week_type` VARCHAR(20) DEFAULT 'all' COMMENT '周类型',
  `expected_building_id` INT(11) DEFAULT NULL COMMENT '期望楼宇ID',
  `expected_building_name` VARCHAR(100) DEFAULT NULL COMMENT '期望楼宇名称',
  `expected_room_id` INT(11) DEFAULT NULL COMMENT '期望房间ID',
  `expected_room_name` VARCHAR(100) DEFAULT NULL COMMENT '期望实验室名称',
  `applicant_id` INT(11) NOT NULL COMMENT '申请人ID(教师)',
  `applicant_name` VARCHAR(100) NOT NULL COMMENT '申请人名称',
  `remarks` TEXT DEFAULT NULL COMMENT '备注',
  `approval_status` VARCHAR(20) DEFAULT 'pending' COMMENT '审批状态',
  `approval_comment` TEXT DEFAULT NULL COMMENT '审批意见',
  `approved_by` INT(11) DEFAULT NULL COMMENT '审批人ID',
  `approved_by_name` VARCHAR(100) DEFAULT NULL COMMENT '审批人名称',
  `approved_at` DATETIME DEFAULT NULL COMMENT '审批时间',
  `assigned_building_id` INT(11) DEFAULT NULL COMMENT '分配的楼宇ID',
  `assigned_building_name` VARCHAR(100) DEFAULT NULL COMMENT '分配的楼宇名称',
  `assigned_room_id` INT(11) DEFAULT NULL COMMENT '分配的房间ID',
  `assigned_room_name` VARCHAR(100) DEFAULT NULL COMMENT '分配的房间名称',
  `assigned_room_number` VARCHAR(50) DEFAULT NULL COMMENT '分配的房间号',
  `scheduling_id` INT(11) DEFAULT NULL COMMENT '关联的排课ID',
  `created_by` INT(11) DEFAULT NULL COMMENT '创建人ID',
  `created_by_name` VARCHAR(100) DEFAULT NULL COMMENT '创建人名称',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at` DATETIME DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  KEY `idx_semester` (`semester_id`),
  KEY `idx_applicant` (`applicant_id`),
  KEY `idx_approval` (`approval_status`),
  KEY `idx_task` (`teaching_task_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='实验室授课申请表';

-- 使用登记表
CREATE TABLE `lab_usage_registration` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '登记ID',
  `registration_code` VARCHAR(50) DEFAULT NULL COMMENT '登记编号',
  `semester_id` INT(11) NOT NULL COMMENT '学期ID',
  `scheduling_id` INT(11) DEFAULT NULL COMMENT '关联的排课ID',
  `reservation_id` INT(11) DEFAULT NULL COMMENT '关联的预约ID',
  `source_type` VARCHAR(20) DEFAULT NULL COMMENT '来源类型',
  `building_id` INT(11) NOT NULL COMMENT '楼宇ID',
  `building_name` VARCHAR(100) NOT NULL COMMENT '楼宇名称',
  `room_id` INT(11) NOT NULL COMMENT '房间ID',
  `room_name` VARCHAR(100) NOT NULL COMMENT '房间名称',
  `room_number` VARCHAR(50) NOT NULL COMMENT '房间号',
  `use_date` DATE NOT NULL COMMENT '使用日期',
  `week_no` INT(11) NOT NULL COMMENT '教学周',
  `course_name` VARCHAR(200) DEFAULT NULL COMMENT '课程名称/项目名称',
  `experiment_project_id` INT(11) DEFAULT NULL COMMENT '实验项目ID',
  `experiment_project_name` VARCHAR(200) DEFAULT NULL COMMENT '实验项目名称',
  `experiment_type` VARCHAR(50) DEFAULT NULL COMMENT '实验项目类型',
  `class_id` INT(11) DEFAULT NULL COMMENT '班级ID',
  `class_name` VARCHAR(200) DEFAULT NULL COMMENT '班级名称',
  `teacher_id` INT(11) DEFAULT NULL COMMENT '教师ID',
  `teacher_name` VARCHAR(100) DEFAULT NULL COMMENT '教师名称',
  `planned_hours` DECIMAL(5,2) DEFAULT NULL COMMENT '计划学时',
  `actual_duration` DECIMAL(5,2) NOT NULL COMMENT '实际使用时长(小时)',
  `expected_students` INT(11) DEFAULT 0 COMMENT '应到人数',
  `actual_students` INT(11) NOT NULL COMMENT '实到人数',
  `attendance_record` TEXT DEFAULT NULL COMMENT '学生考勤记录',
  `teaching_record` TEXT DEFAULT NULL COMMENT '教学情况记录',
  `equipment_record` TEXT DEFAULT NULL COMMENT '仪器设备情况记录',
  `registration_status` VARCHAR(20) DEFAULT 'registered' COMMENT '登记状态',
  `reminder_count` INT(11) DEFAULT 0 COMMENT '提醒次数',
  `last_reminder_at` DATETIME DEFAULT NULL COMMENT '最后提醒时间',
  `reporter_id` INT(11) NOT NULL COMMENT '填报人ID',
  `reporter_name` VARCHAR(100) NOT NULL COMMENT '填报人名称',
  `report_department` VARCHAR(200) DEFAULT NULL COMMENT '所在部门',
  `report_time` DATETIME DEFAULT NULL COMMENT '填报时间',
  `created_by` INT(11) DEFAULT NULL COMMENT '创建人ID',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at` DATETIME DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  KEY `idx_semester` (`semester_id`),
  KEY `idx_date` (`use_date`),
  KEY `idx_room` (`room_id`),
  KEY `idx_teacher` (`teacher_id`),
  KEY `idx_class` (`class_id`),
  KEY `idx_status` (`registration_status`),
  KEY `idx_scheduling` (`scheduling_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='实验室使用登记表';

-- 冲突检测日志表
CREATE TABLE `lab_collision_log` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `collision_type` VARCHAR(50) NOT NULL COMMENT '冲突类型',
  `collision_level` VARCHAR(20) NOT NULL COMMENT '冲突级别',
  `scheduling_id_1` INT(11) NOT NULL COMMENT '冲突排课ID1',
  `scheduling_id_2` INT(11) DEFAULT NULL COMMENT '冲突排课ID2',
  `semester_id` INT(11) NOT NULL COMMENT '学期ID',
  `week_no` INT(11) NOT NULL COMMENT '教学周',
  `week_day` INT(11) NOT NULL COMMENT '星期',
  `time_slot` VARCHAR(50) NOT NULL COMMENT '节次',
  `conflict_details` TEXT DEFAULT NULL COMMENT '冲突详情',
  `is_forced` INT(11) DEFAULT 0 COMMENT '是否强制排课',
  `forced_by` INT(11) DEFAULT NULL COMMENT '强制操作人ID',
  `forced_by_name` VARCHAR(100) DEFAULT NULL COMMENT '强制操作人名称',
  `forced_at` DATETIME DEFAULT NULL COMMENT '强制操作时间',
  `remarks` TEXT DEFAULT NULL COMMENT '备注',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_type` (`collision_type`),
  KEY `idx_level` (`collision_level`),
  KEY `idx_semester` (`semester_id`),
  KEY `idx_date` (`week_no`, `week_day`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='实验室冲突检测日志表';

-- 消息通知表
CREATE TABLE `lab_notification` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '通知ID',
  `notification_code` VARCHAR(50) DEFAULT NULL COMMENT '通知编号',
  `user_id` INT(11) NOT NULL COMMENT '接收人ID',
  `user_name` VARCHAR(100) NOT NULL COMMENT '接收人名称',
  `notification_type` VARCHAR(50) NOT NULL COMMENT '通知类型',
  `title` VARCHAR(200) NOT NULL COMMENT '通知标题',
  `content` TEXT NOT NULL COMMENT '通知内容',
  `related_type` VARCHAR(50) DEFAULT NULL COMMENT '关联类型',
  `related_id` INT(11) DEFAULT NULL COMMENT '关联记录ID',
  `is_read` INT(11) DEFAULT 0 COMMENT '是否已读',
  `read_at` DATETIME DEFAULT NULL COMMENT '阅读时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_read` (`is_read`),
  KEY `idx_type` (`notification_type`),
  KEY `idx_related` (`related_type`, `related_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='实验室消息通知表';

-- 使用统计表
CREATE TABLE `lab_usage_statistics` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '统计ID',
  `semester_id` INT(11) NOT NULL COMMENT '学期ID',
  `statistics_type` VARCHAR(50) NOT NULL COMMENT '统计类型',
  `dimension_type` VARCHAR(50) NOT NULL COMMENT '维度类型',
  `dimension_id` INT(11) DEFAULT NULL COMMENT '维度ID',
  `dimension_name` VARCHAR(200) DEFAULT NULL COMMENT '维度名称',
  `statistics_date` DATE DEFAULT NULL COMMENT '统计日期',
  `week_no` INT(11) DEFAULT NULL COMMENT '教学周',
  `scheduled_count` INT(11) DEFAULT 0 COMMENT '排课次数',
  `scheduled_hours` DECIMAL(10,2) DEFAULT 0 COMMENT '排课课时数',
  `reserved_count` INT(11) DEFAULT 0 COMMENT '预约次数',
  `reserved_hours` DECIMAL(10,2) DEFAULT 0 COMMENT '预约课时数',
  `total_hours` DECIMAL(10,2) DEFAULT 0 COMMENT '总课时数',
  `total_students` INT(11) DEFAULT 0 COMMENT '使用人次',
  `registration_count` INT(11) DEFAULT 0 COMMENT '已登记次数',
  `registration_rate` DECIMAL(5,2) DEFAULT 0 COMMENT '登记完成率(%)',
  `usage_rate` DECIMAL(5,2) DEFAULT 0 COMMENT '使用率(%)',
  `available_hours` DECIMAL(10,2) DEFAULT 0 COMMENT '可用课时数',
  `start_date` DATE DEFAULT NULL COMMENT '统计开始日期',
  `end_date` DATE DEFAULT NULL COMMENT '统计结束日期',
  `calculated_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '计算时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_unique` (`semester_id`, `statistics_type`, `dimension_type`, `dimension_id`, `statistics_date`),
  KEY `idx_semester` (`semester_id`),
  KEY `idx_dimension` (`dimension_type`, `dimension_id`),
  KEY `idx_date` (`statistics_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='实验室使用统计表';

-- =====================================================
-- 初始化数据
-- =====================================================

-- 用户数据
INSERT INTO `sys_user` (`username`, `password`, `real_name`, `phone`, `email`, `status`) VALUES
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '管理员', '13800138000', 'admin@example.com', 1),
('user1', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '用户1', '13800138001', 'user1@example.com', 1),
('teacher1', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '李老师', '13800138002', 'teacher1@example.com', 1),
('teacher2', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '王老师', '13800138003', 'teacher2@example.com', 1);

-- 角色数据
INSERT INTO `sys_role` (`name`, `code`, `description`, `status`) VALUES
('管理员', 'admin', '系统管理员，拥有所有权限', 1),
('教师', 'teacher', '教师角色', 1),
('学生', 'student', '学生角色', 1);

-- 用户角色关联
INSERT INTO `sys_user_role` (`user_id`, `role_id`) VALUES (1, 1), (2, 3), (3, 2), (4, 2);

-- 菜单数据
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
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8), (1, 9),
(1, 10), (1, 11), (1, 12), (1, 13), (1, 14), (1, 15), (1, 16), (1, 17),
(1, 18), (1, 19), (1, 20), (1, 21), (1, 22), (1, 23), (1, 24), (1, 25),
(1, 26), (1, 27), (1, 28), (1, 29), (1, 30), (1, 31), (1, 32), (1, 33),
(1, 34), (1, 35);

-- 机构数据
INSERT INTO `sys_organization` (`name`, `code`, `parent_id`, `sort`, `description`, `status`) VALUES
('学校', 'school', 0, 1, '学校总部', 1),
('计算机学院', 'cs', 1, 1, '计算机学院', 1),
('电子信息学院', 'ee', 1, 2, '电子信息学院', 1);

-- 部门数据
INSERT INTO `sys_department` (`name`, `code`, `org_id`, `parent_id`, `sort`, `description`, `status`) VALUES
('教务处', 'jiaowu', 1, 0, 1, '教学管理部门', 1),
('计算机系', 'computer', 2, 0, 1, '计算机系', 1),
('软件工程系', 'software', 2, 0, 2, '软件工程系', 1),
('电子工程系', 'electronic', 3, 0, 1, '电子工程系', 1);

-- 权限数据
INSERT INTO `sys_permission` (`name`, `code`, `path`, `method`, `description`, `status`) VALUES
('用户管理', 'user:manage', '/api/v1/users', 'GET', '用户管理权限', 1),
('角色管理', 'role:manage', '/api/v1/roles', 'GET', '角色管理权限', 1),
('菜单管理', 'menu:manage', '/api/v1/menus', 'GET', '菜单管理权限', 1),
('排课管理', 'scheduling:manage', '/api/v1/scheduling', 'GET', '排课管理权限', 1),
('预约管理', 'reservation:manage', '/api/v1/reservations', 'GET', '预约管理权限', 1);

-- 系统配置数据
INSERT INTO `sys_config` (`config_key`, `config_value`, `group_name`, `description`, `status`) VALUES
('system_name', '高校实验室信息管理系统', 'system', '系统名称', 1),
('version', '1.0.0', 'system', '系统版本', 1);

-- 课程数据
INSERT INTO `edu_course` (`name`, `code`, `type`, `credit`, `hours`, `description`, `status`) VALUES
('高等数学', 'MA001', '公共课', 4.0, 64, '高等数学课程', 1),
('大学物理', 'PH001', '公共课', 3.0, 48, '大学物理课程', 1),
('程序设计', 'CS001', '专业课', 4.0, 64, '程序设计课程', 1),
('数据结构与算法', 'CS002', '专业课', 4.0, 64, '数据结构与算法课程', 1),
('操作系统', 'CS003', '专业课', 4.0, 64, '操作系统课程', 1),
('计算机网络', 'CS004', '专业课', 3.0, 48, '计算机网络课程', 1),
('数据库原理', 'CS005', '专业课', 3.0, 48, '数据库原理课程', 1);

-- 学期数据
INSERT INTO `edu_semester` (`name`, `code`, `start_date`, `end_date`, `status`) VALUES
('2025-2026学年第一学期', '2025-1', '2025-09-01', '2025-12-31', 1),
('2025-2026学年第二学期', '2026-2', '2026-02-20', '2026-06-30', 0),
('2024-2025学年第一学期', '2024-1', '2024-09-01', '2024-12-31', 0),
('2024-2025学年第二学期', '2024-2', '2024-02-20', '2024-06-30', 0);

-- 校历数据
INSERT INTO `edu_calendar` (`semester_id`, `date`, `week`, `week_day`, `type`, `description`) VALUES
(1, '2025-09-01', 1, 1, 'start', '学期开始'),
(1, '2025-09-02', 1, 2, 'normal', ''),
(1, '2025-09-03', 1, 3, 'normal', ''),
(1, '2025-09-04', 1, 4, 'normal', ''),
(1, '2025-09-05', 1, 5, 'normal', ''),
(1, '2025-09-06', 1, 6, 'normal', ''),
(1, '2025-09-07', 1, 7, 'normal', '');

-- 专业数据
INSERT INTO `edu_major` (`name`, `code`, `org_id`, `degree`, `duration`, `description`, `status`) VALUES
('计算机科学与技术', 'CS', 2, '工学', 4, '计算机科学与技术专业', 1),
('软件工程', 'SE', 2, '工学', 4, '软件工程专业', 1),
('电子信息工程', 'EE', 3, '工学', 4, '电子信息工程专业', 1),
('通信工程', 'CE', 3, '工学', 4, '通信工程专业', 1);

-- 班级数据
INSERT INTO `edu_class` (`name`, `code`, `major_id`, `grade`, `student_count`, `head_teacher`, `status`) VALUES
('计算机2023-1班', 'CS2023-1', 1, '2023', 45, '张老师', 1),
('计算机2023-2班', 'CS2023-2', 1, '2023', 40, '李老师', 1),
('软件工程2023-1班', 'SE2023-1', 2, '2023', 42, '王老师', 1),
('软件工程2023-2班', 'SE2023-2', 2, '2023', 38, '赵老师', 1),
('电子信息2023-1班', 'EE2023-1', 3, '2023', 40, '刘老师', 1);

-- 教学任务数据
INSERT INTO `edu_teaching_task` (`semester_id`, `course_id`, `class_id`, `teacher_id`, `weekly_hours`, `total_hours`, `classroom`, `status`) VALUES
(1, 1, 1, 3, 4, 64, '101教室', 1),
(1, 3, 1, 3, 4, 64, 'A101实验室', 1),
(1, 4, 2, 4, 4, 64, 'A102实验室', 1),
(1, 5, 1, 4, 4, 64, 'A101实验室', 1),
(1, 6, 3, 3, 3, 48, 'B201实验室', 1);

-- 节次数据
INSERT INTO `edu_time_slot` (`name`, `start_time`, `end_time`, `sort`, `type`, `status`) VALUES
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
INSERT INTO `ven_campus` (`name`, `code`, `address`, `description`, `status`) VALUES
('主校区', 'main', '北京市海淀区学院路30号', '主校区', 1),
('分校区', 'branch', '北京市昌平区回龙观', '分校区', 1);

-- 楼宇数据
INSERT INTO `ven_building` (`name`, `code`, `campus_id`, `floors`, `type`, `description`, `status`) VALUES
('第一教学楼', 'TEACH-01', 1, 6, '教学', '第一教学楼', 1),
('实验楼A', 'LAB-A', 1, 5, '实验', '实验楼A', 1),
('实验楼B', 'LAB-B', 1, 4, '实验', '实验楼B', 1),
('第二教学楼', 'TEACH-02', 1, 5, '教学', '第二教学楼', 1);

-- 房间数据
INSERT INTO `ven_room` (`name`, `code`, `building_id`, `floor`, `area`, `capacity`, `type`, `description`, `status`) VALUES
('101教室', 'ROOM-101', 1, 1, 80.00, 50, '教室', '101教室', 1),
('102教室', 'ROOM-102', 1, 1, 80.00, 50, '教室', '102教室', 1),
('A101实验室', 'LAB-A101', 2, 1, 120.00, 30, '实验室', 'A101实验室', 1),
('A102实验室', 'LAB-A102', 2, 1, 120.00, 30, '实验室', 'A102实验室', 1),
('A201实验室', 'LAB-A201', 2, 2, 150.00, 40, '实验室', 'A201实验室', 1),
('A202实验室', 'LAB-A202', 2, 2, 150.00, 40, '实验室', 'A202实验室', 1),
('B101实验室', 'LAB-B101', 3, 1, 100.00, 25, '实验室', 'B101实验室', 1),
('B201实验室', 'LAB-B201', 3, 2, 120.00, 30, '实验室', 'B201实验室', 1);

-- 楼层平面图数据
INSERT INTO `ven_floor_plan` (`building_id`, `floor`, `image_url`, `description`) VALUES
(1, 1, 'https://example.com/floor1.jpg', '第一教学楼一层平面图'),
(2, 1, 'https://example.com/lab-a1.jpg', '实验楼A一层平面图'),
(2, 2, 'https://example.com/lab-a2.jpg', '实验楼A二层平面图'),
(3, 1, 'https://example.com/lab-b1.jpg', '实验楼B一层平面图'),
(3, 2, 'https://example.com/lab-b2.jpg', '实验楼B二层平面图');

-- 实验教学任务数据
INSERT INTO `edu_experiment_task` (`semester_id`, `major_id`, `class_id`, `student_count`, `student_level`, `course_name`, `course_category`, `is_independent`, `experiment_total_hours`, `experiment_current_hours`, `practice_total_hours`, `practice_current_hours`, `training_total_hours`, `training_current_hours`, `org_id`, `dept_id`, `teacher_name`, `teacher_title`, `technician_name`, `technician_title`, `textbook_name`, `guidebook_name`, `status`) VALUES
(1, 1, 1, 45, '本科', '计算机网络实验', '专业必修课', 1, 64, 32, 32, 16, 48, 24, 2, 2, '王老师', '副教授', '李工程师', '工程师', '计算机网络原理', '计算机网络实验指导书', 1),
(1, 1, 2, 40, '本科', '数据结构实验', '专业必修课', 1, 48, 24, 24, 12, 36, 18, 2, 2, '张老师', '教授', '赵工程师', '高级工程师', '数据结构与算法', '数据结构实验指导书', 1),
(1, 2, 3, 42, '本科', '软件工程实验', '专业必修课', 1, 48, 24, 24, 12, 36, 18, 2, 3, '刘老师', '讲师', '孙工程师', '工程师', '软件工程导论', '软件工程实验指导书', 1);

-- 实验项目数据
INSERT INTO `edu_experiment_project` (`course_code`, `project_name`, `experiment_hours`, `experiment_type`, `experiment_requirement`, `description`, `status`) VALUES
('CS002', '线性表实验', 2, '基础', '必做', '线性表的基本操作实验', 1),
('CS002', '树与二叉树实验', 2, '综合', '必做', '树与二叉树的遍历与操作实验', 1),
('CS003', '进程管理实验', 2, '综合', '必做', '操作系统进程管理实验', 1),
('CS004', '网络协议分析实验', 2, '设计', '必做', '网络协议分析与实现实验', 1),
('CS005', '数据库设计实验', 2, '设计', '必做', '数据库设计与实现实验', 1);

-- 排课数据
INSERT INTO `lab_scheduling` (`scheduling_code`, `semester_id`, `source_type`, `course_name`, `major_name`, `class_name`, `student_count`, `building_name`, `room_name`, `room_number`, `teacher_name`, `week_no`, `week_day`, `time_slot_start`, `status`, `approval_status`) VALUES
('SCH001', 1, 'CentralScheduling', '数据结构与算法', '计算机科学与技术', '计算机2023-1班', 45, '实验楼A', 'A101实验室', 'A101', '李老师', 3, 1, '1-2', 1, 'approved'),
('SCH002', 1, 'CentralScheduling', '数据结构与算法', '计算机科学与技术', '计算机2023-1班', 45, '实验楼A', 'A101实验室', 'A101', '李老师', 3, 1, '3-4', 1, 'approved'),
('SCH003', 1, 'CentralScheduling', '操作系统', '计算机科学与技术', '计算机2023-2班', 40, '实验楼A', 'A102实验室', 'A102', '王老师', 3, 2, '5-6', 1, 'approved'),
('SCH004', 1, 'CentralScheduling', '计算机网络', '软件工程', '软件工程2023-1班', 42, '实验楼B', 'B201实验室', 'B201', '李老师', 4, 3, '1-2', 1, 'approved'),
('SCH005', 1, 'Reservation', '智能算法研究', NULL, NULL, 10, '实验楼B', 'B101实验室', 'B101', '张老师', 4, 2, '5-6', 1, 'approved');

-- 预约数据
INSERT INTO `lab_reservation` (`reservation_code`, `semester_id`, `building_id`, `building_name`, `room_id`, `room_name`, `room_number`, `use_date`, `week_no`, `week_day`, `time_slot`, `project_name`, `project_category`, `applicant_id`, `applicant_name`, `applicant_phone`, `project_leader`, `project_leader_phone`, `member_count`, `approval_status`) VALUES
('RES001', 1, 2, '实验楼A', 3, 'A101实验室', 'A101', '2025-09-17', 3, 3, '5-6', '智能算法研究', '学生科研项目', 1, '管理员', '13800138000', '张三', '13800138001', 10, 'approved'),
('RES002', 1, 3, '实验楼B', 8, 'B201实验室', 'B201', '2025-09-20', 4, 6, '7-8', '毕业设计实验', '毕业设计论文', 3, '李老师', '13800138002', '李老师', '13800138002', 5, 'pending');

-- 授课申请数据
INSERT INTO `lab_teaching_request` (`request_code`, `semester_id`, `course_name`, `major_name`, `grade`, `class_name`, `week_no`, `week_day`, `time_slot`, `applicant_id`, `applicant_name`, `approval_status`) VALUES
('REQ001', 1, '计算机网络', '计算机科学与技术', '2023', '计算机2023-1班', 6, 1, '1-2', 4, '王老师', 'approved'),
('REQ002', 1, '数据库原理', '软件工程', '2023', '软件工程2023-1班', 7, 2, '3-4', 3, '李老师', 'pending');

-- 使用登记数据
INSERT INTO `lab_usage_registration` (`registration_code`, `semester_id`, `scheduling_id`, `building_name`, `room_name`, `room_number`, `use_date`, `week_no`, `course_name`, `class_name`, `teacher_name`, `actual_duration`, `expected_students`, `actual_students`, `registration_status`, `reporter_id`, `reporter_name`, `report_time`) VALUES
('REG001', 1, 1, '实验楼A', 'A101实验室', 'A101', '2025-09-15', 3, '数据结构与算法', '计算机2023-1班', '李老师', 2.0, 45, 43, 'registered', 3, '李老师', '2025-09-15 12:00:00'),
('REG002', 1, 2, '实验楼A', 'A101实验室', 'A101', '2025-09-15', 3, '数据结构与算法', '计算机2023-1班', '李老师', 2.0, 45, 44, 'registered', 3, '李老师', '2025-09-15 12:00:00');

SET FOREIGN_KEY_CHECKS = 1;