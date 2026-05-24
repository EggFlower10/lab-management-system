-- =====================================================
-- 实验室排课预约模块数据库表结构
-- =====================================================

-- 1. 实验室排课表（统一存储集中排课、预约、授课申请）
CREATE TABLE IF NOT EXISTS `lab_scheduling` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '排课ID',
  `scheduling_code` VARCHAR(50) DEFAULT NULL COMMENT '排课编号',
  `semester_id` INT(11) NOT NULL COMMENT '学期ID',
  `source_type` VARCHAR(20) NOT NULL COMMENT '排课来源: CentralScheduling-集中排课, Reservation-预约申请, TeachingRequest-授课申请',
  `source_id` INT(11) DEFAULT NULL COMMENT '来源记录ID（预约ID或授课申请ID）',
  
  -- 课程信息
  `course_id` INT(11) DEFAULT NULL COMMENT '课程ID',
  `course_name` VARCHAR(200) DEFAULT NULL COMMENT '课程名称',
  `course_category` VARCHAR(50) DEFAULT NULL COMMENT '课程类别',
  
  -- 专业班级信息
  `major_id` INT(11) DEFAULT NULL COMMENT '专业ID',
  `major_name` VARCHAR(200) DEFAULT NULL COMMENT '专业名称',
  `class_id` INT(11) DEFAULT NULL COMMENT '班级ID',
  `class_name` VARCHAR(200) DEFAULT NULL COMMENT '班级名称',
  `student_count` INT(11) DEFAULT 0 COMMENT '学生人数',
  
  -- 场地信息
  `building_id` INT(11) DEFAULT NULL COMMENT '楼宇ID',
  `building_name` VARCHAR(100) DEFAULT NULL COMMENT '楼宇名称',
  `room_id` INT(11) DEFAULT NULL COMMENT '房间ID',
  `room_name` VARCHAR(100) DEFAULT NULL COMMENT '房间名称',
  `room_number` VARCHAR(50) DEFAULT NULL COMMENT '房间号',
  
  -- 人员信息
  `teacher_id` INT(11) DEFAULT NULL COMMENT '教师ID',
  `teacher_name` VARCHAR(100) DEFAULT NULL COMMENT '教师名称',
  `teacher_title` VARCHAR(50) DEFAULT NULL COMMENT '教师职称',
  `technician_id` INT(11) DEFAULT NULL COMMENT '实验技术人员ID',
  `technician_name` VARCHAR(100) DEFAULT NULL COMMENT '实验技术人员名称',
  
  -- 时间信息
  `week_no` INT(11) NOT NULL COMMENT '教学周',
  `week_day` INT(11) NOT NULL COMMENT '星期(1-7)',
  `time_slot_start` VARCHAR(20) NOT NULL COMMENT '开始节次(如: 1-2)',
  `time_slot_end` VARCHAR(20) DEFAULT NULL COMMENT '结束节次',
  `week_type` VARCHAR(20) DEFAULT 'all' COMMENT '周类型: all-全部, odd-单周, even-双周',
  
  -- 项目信息（预约/授课申请时使用）
  `project_name` VARCHAR(200) DEFAULT NULL COMMENT '项目名称',
  `project_category` VARCHAR(50) DEFAULT NULL COMMENT '项目类别',
  `applicant_id` INT(11) DEFAULT NULL COMMENT '申请人ID',
  `applicant_name` VARCHAR(100) DEFAULT NULL COMMENT '申请人名称',
  `applicant_phone` VARCHAR(20) DEFAULT NULL COMMENT '申请人电话',
  `project_leader` VARCHAR(100) DEFAULT NULL COMMENT '项目负责人',
  `project_leader_phone` VARCHAR(20) DEFAULT NULL COMMENT '项目负责人电话',
  `expected_duration` DECIMAL(5,2) DEFAULT NULL COMMENT '预计使用时长(小时)',
  `remarks` TEXT DEFAULT NULL COMMENT '备注',
  
  -- 状态信息
  `status` INT(11) DEFAULT 1 COMMENT '状态: 1-正常, 0-已取消',
  `approval_status` VARCHAR(20) DEFAULT 'approved' COMMENT '审批状态: pending-待审批, approved-已通过, rejected-已驳回',
  `approval_comment` TEXT DEFAULT NULL COMMENT '审批意见',
  `approved_by` INT(11) DEFAULT NULL COMMENT '审批人ID',
  `approved_by_name` VARCHAR(100) DEFAULT NULL COMMENT '审批人名称',
  `approved_at` DATETIME DEFAULT NULL COMMENT '审批时间',
  
  -- 系统字段
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

-- 2. 预约申请表
CREATE TABLE IF NOT EXISTS `lab_reservation` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '预约ID',
  `reservation_code` VARCHAR(50) DEFAULT NULL COMMENT '预约编号',
  `semester_id` INT(11) NOT NULL COMMENT '学期ID',
  
  -- 场地信息
  `building_id` INT(11) NOT NULL COMMENT '楼宇ID',
  `building_name` VARCHAR(100) NOT NULL COMMENT '楼宇名称',
  `room_id` INT(11) NOT NULL COMMENT '房间ID',
  `room_name` VARCHAR(100) NOT NULL COMMENT '房间名称',
  `room_number` VARCHAR(50) NOT NULL COMMENT '房间号',
  
  -- 预约时间
  `use_date` DATE NOT NULL COMMENT '使用日期',
  `week_no` INT(11) NOT NULL COMMENT '教学周',
  `week_day` INT(11) NOT NULL COMMENT '星期(1-7)',
  `time_slot` VARCHAR(50) NOT NULL COMMENT '节次(如: 1-2)',
  `week_type` VARCHAR(20) DEFAULT 'all' COMMENT '周类型: all-全部, odd-单周, even-双周',
  
  -- 项目信息
  `project_name` VARCHAR(200) NOT NULL COMMENT '开展项目名称',
  `project_category` VARCHAR(50) NOT NULL COMMENT '项目类别',
  
  -- 申请人信息
  `applicant_id` INT(11) NOT NULL COMMENT '申请人ID',
  `applicant_name` VARCHAR(100) NOT NULL COMMENT '申请人名称',
  `applicant_phone` VARCHAR(20) NOT NULL COMMENT '申请人联系电话',
  `project_leader` VARCHAR(100) NOT NULL COMMENT '项目负责人',
  `project_leader_phone` VARCHAR(20) NOT NULL COMMENT '项目负责人联系电话',
  
  -- 参与成员信息
  `member_grade` VARCHAR(50) DEFAULT NULL COMMENT '参与成员-年级',
  `member_class` VARCHAR(200) DEFAULT NULL COMMENT '参与成员-班级',
  `member_count` INT(11) DEFAULT 0 COMMENT '参与成员-人数',
  
  -- 使用信息
  `expected_duration` DECIMAL(5,2) DEFAULT NULL COMMENT '预计使用时长(小时)',
  `remarks` TEXT DEFAULT NULL COMMENT '备注',
  
  -- 审批信息
  `approval_status` VARCHAR(20) DEFAULT 'pending' COMMENT '审批状态: pending-待审批, approved-已通过, rejected-已驳回',
  `approval_comment` TEXT DEFAULT NULL COMMENT '审批意见',
  `approved_by` INT(11) DEFAULT NULL COMMENT '审批人ID',
  `approved_by_name` VARCHAR(100) DEFAULT NULL COMMENT '审批人名称',
  `approved_at` DATETIME DEFAULT NULL COMMENT '审批时间',
  
  -- 关联排课
  `scheduling_id` INT(11) DEFAULT NULL COMMENT '关联的排课ID',
  
  -- 取消信息
  `is_cancelled` INT(11) DEFAULT 0 COMMENT '是否已取消: 0-否, 1-是',
  `cancelled_by` INT(11) DEFAULT NULL COMMENT '取消操作人ID',
  `cancelled_by_name` VARCHAR(100) DEFAULT NULL COMMENT '取消操作人名称',
  `cancelled_at` DATETIME DEFAULT NULL COMMENT '取消时间',
  `cancel_reason` TEXT DEFAULT NULL COMMENT '取消原因',
  
  -- 系统字段
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

-- 3. 授课申请表
CREATE TABLE IF NOT EXISTS `lab_teaching_request` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '申请ID',
  `request_code` VARCHAR(50) DEFAULT NULL COMMENT '申请编号',
  `semester_id` INT(11) NOT NULL COMMENT '学期ID',
  
  -- 教学任务信息
  `teaching_task_id` INT(11) DEFAULT NULL COMMENT '关联的教学任务ID',
  `course_id` INT(11) DEFAULT NULL COMMENT '课程ID',
  `course_name` VARCHAR(200) NOT NULL COMMENT '上课课程',
  
  -- 专业班级信息
  `major_id` INT(11) DEFAULT NULL COMMENT '专业ID',
  `major_name` VARCHAR(200) DEFAULT NULL COMMENT '专业名称',
  `grade` VARCHAR(50) DEFAULT NULL COMMENT '年级',
  `class_id` INT(11) DEFAULT NULL COMMENT '班级ID',
  `class_name` VARCHAR(200) DEFAULT NULL COMMENT '班级名称',
  
  -- 申请时间信息
  `week_no` INT(11) NOT NULL COMMENT '上课周次',
  `week_day` INT(11) NOT NULL COMMENT '星期(1-7)',
  `time_slot` VARCHAR(50) NOT NULL COMMENT '节次',
  `week_type` VARCHAR(20) DEFAULT 'all' COMMENT '周类型',
  
  -- 期望实验室
  `expected_building_id` INT(11) DEFAULT NULL COMMENT '期望楼宇ID',
  `expected_building_name` VARCHAR(100) DEFAULT NULL COMMENT '期望楼宇名称',
  `expected_room_id` INT(11) DEFAULT NULL COMMENT '期望房间ID',
  `expected_room_name` VARCHAR(100) DEFAULT NULL COMMENT '期望实验室名称',
  
  -- 申请人信息
  `applicant_id` INT(11) NOT NULL COMMENT '申请人ID(教师)',
  `applicant_name` VARCHAR(100) NOT NULL COMMENT '申请人名称',
  `remarks` TEXT DEFAULT NULL COMMENT '备注',
  
  -- 审批信息
  `approval_status` VARCHAR(20) DEFAULT 'pending' COMMENT '审批状态: pending-待审批, approved-已通过, rejected-已驳回',
  `approval_comment` TEXT DEFAULT NULL COMMENT '审批意见',
  `approved_by` INT(11) DEFAULT NULL COMMENT '审批人ID',
  `approved_by_name` VARCHAR(100) DEFAULT NULL COMMENT '审批人名称',
  `approved_at` DATETIME DEFAULT NULL COMMENT '审批时间',
  
  -- 分配信息（审批通过后由管理员填写）
  `assigned_building_id` INT(11) DEFAULT NULL COMMENT '分配的楼宇ID',
  `assigned_building_name` VARCHAR(100) DEFAULT NULL COMMENT '分配的楼宇名称',
  `assigned_room_id` INT(11) DEFAULT NULL COMMENT '分配的房间ID',
  `assigned_room_name` VARCHAR(100) DEFAULT NULL COMMENT '分配的房间名称',
  `assigned_room_number` VARCHAR(50) DEFAULT NULL COMMENT '分配的房间号',
  
  -- 关联排课
  `scheduling_id` INT(11) DEFAULT NULL COMMENT '关联的排课ID',
  
  -- 系统字段
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

-- 4. 使用登记表
CREATE TABLE IF NOT EXISTS `lab_usage_registration` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '登记ID',
  `registration_code` VARCHAR(50) DEFAULT NULL COMMENT '登记编号',
  `semester_id` INT(11) NOT NULL COMMENT '学期ID',
  
  -- 关联的排课/预约信息
  `scheduling_id` INT(11) DEFAULT NULL COMMENT '关联的排课ID',
  `reservation_id` INT(11) DEFAULT NULL COMMENT '关联的预约ID',
  `source_type` VARCHAR(20) DEFAULT NULL COMMENT '来源类型: CentralScheduling, Reservation, TeachingRequest',
  
  -- 场地信息
  `building_id` INT(11) NOT NULL COMMENT '楼宇ID',
  `building_name` VARCHAR(100) NOT NULL COMMENT '楼宇名称',
  `room_id` INT(11) NOT NULL COMMENT '房间ID',
  `room_name` VARCHAR(100) NOT NULL COMMENT '房间名称',
  `room_number` VARCHAR(50) NOT NULL COMMENT '房间号',
  
  -- 使用时间
  `use_date` DATE NOT NULL COMMENT '使用日期',
  `week_no` INT(11) NOT NULL COMMENT '教学周',
  
  -- 课程/项目信息
  `course_name` VARCHAR(200) DEFAULT NULL COMMENT '课程名称/项目名称',
  `experiment_project_id` INT(11) DEFAULT NULL COMMENT '实验项目ID',
  `experiment_project_name` VARCHAR(200) DEFAULT NULL COMMENT '实验项目名称',
  `experiment_type` VARCHAR(50) DEFAULT NULL COMMENT '实验项目类型: 基础/综合/设计/其他',
  
  -- 班级信息
  `class_id` INT(11) DEFAULT NULL COMMENT '班级ID',
  `class_name` VARCHAR(200) DEFAULT NULL COMMENT '班级名称',
  
  -- 教师信息
  `teacher_id` INT(11) DEFAULT NULL COMMENT '教师ID',
  `teacher_name` VARCHAR(100) DEFAULT NULL COMMENT '教师名称',
  
  -- 学时信息
  `planned_hours` DECIMAL(5,2) DEFAULT NULL COMMENT '计划学时',
  `actual_duration` DECIMAL(5,2) NOT NULL COMMENT '实际使用时长(小时)',
  
  -- 考勤信息
  `expected_students` INT(11) DEFAULT 0 COMMENT '应到人数',
  `actual_students` INT(11) NOT NULL COMMENT '实到人数',
  `attendance_record` TEXT DEFAULT NULL COMMENT '学生考勤记录',
  
  -- 使用情况记录
  `teaching_record` TEXT DEFAULT NULL COMMENT '教学情况记录',
  `equipment_record` TEXT DEFAULT NULL COMMENT '仪器设备情况记录',
  
  -- 登记状态
  `registration_status` VARCHAR(20) DEFAULT 'registered' COMMENT '登记状态: pending-待登记, registered-已登记, overdue-逾期未登记',
  `reminder_count` INT(11) DEFAULT 0 COMMENT '提醒次数',
  `last_reminder_at` DATETIME DEFAULT NULL COMMENT '最后提醒时间',
  
  -- 填报人信息
  `reporter_id` INT(11) NOT NULL COMMENT '填报人ID',
  `reporter_name` VARCHAR(100) NOT NULL COMMENT '填报人名称',
  `report_department` VARCHAR(200) DEFAULT NULL COMMENT '所在部门',
  `report_time` DATETIME DEFAULT NULL COMMENT '填报时间',
  
  -- 系统字段
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

-- 5. 实验室冲突检测日志表
CREATE TABLE IF NOT EXISTS `lab_collision_log` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `collision_type` VARCHAR(50) NOT NULL COMMENT '冲突类型: room-实验室冲突, teacher-教师冲突, class-班级冲突',
  `collision_level` VARCHAR(20) NOT NULL COMMENT '冲突级别: hard-硬冲突(禁止), soft-软冲突(警告)',
  `scheduling_id_1` INT(11) NOT NULL COMMENT '冲突排课ID1',
  `scheduling_id_2` INT(11) DEFAULT NULL COMMENT '冲突排课ID2',
  `semester_id` INT(11) NOT NULL COMMENT '学期ID',
  `week_no` INT(11) NOT NULL COMMENT '教学周',
  `week_day` INT(11) NOT NULL COMMENT '星期',
  `time_slot` VARCHAR(50) NOT NULL COMMENT '节次',
  `conflict_details` TEXT DEFAULT NULL COMMENT '冲突详情',
  `is_forced` INT(11) DEFAULT 0 COMMENT '是否强制排课: 0-否, 1-是',
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

-- 6. 消息通知表
CREATE TABLE IF NOT EXISTS `lab_notification` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '通知ID',
  `notification_code` VARCHAR(50) DEFAULT NULL COMMENT '通知编号',
  `user_id` INT(11) NOT NULL COMMENT '接收人ID',
  `user_name` VARCHAR(100) NOT NULL COMMENT '接收人名称',
  
  -- 通知类型和内容
  `notification_type` VARCHAR(50) NOT NULL COMMENT '通知类型: reservation_submit-预约提交, reservation_approved-预约通过, reservation_rejected-预约驳回, reservation_cancelled-预约取消, teaching_request_submit-授课申请提交, teaching_request_approved-授课申请通过, teaching_request_rejected-授课申请驳回, usage_reminder-使用登记提醒, overdue_reminder-逾期提醒',
  `title` VARCHAR(200) NOT NULL COMMENT '通知标题',
  `content` TEXT NOT NULL COMMENT '通知内容',
  
  -- 关联信息
  `related_type` VARCHAR(50) DEFAULT NULL COMMENT '关联类型: reservation-预约, teaching_request-授课申请, scheduling-排课, registration-使用登记',
  `related_id` INT(11) DEFAULT NULL COMMENT '关联记录ID',
  
  -- 阅读状态
  `is_read` INT(11) DEFAULT 0 COMMENT '是否已读: 0-否, 1-是',
  `read_at` DATETIME DEFAULT NULL COMMENT '阅读时间',
  
  -- 系统字段
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_read` (`is_read`),
  KEY `idx_type` (`notification_type`),
  KEY `idx_related` (`related_type`, `related_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='实验室消息通知表';

-- 7. 实验室使用统计表（预计算统计结果，提高查询效率）
CREATE TABLE IF NOT EXISTS `lab_usage_statistics` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '统计ID',
  `semester_id` INT(11) NOT NULL COMMENT '学期ID',
  `statistics_type` VARCHAR(50) NOT NULL COMMENT '统计类型: daily-每日, weekly-每周, monthly-每月, custom-自定义',
  
  -- 统计维度
  `dimension_type` VARCHAR(50) NOT NULL COMMENT '维度类型: building-楼宇, room-房间, major-专业, class-班级, grade-年级, course-课程, project_category-项目类别',
  `dimension_id` INT(11) DEFAULT NULL COMMENT '维度ID',
  `dimension_name` VARCHAR(200) DEFAULT NULL COMMENT '维度名称',
  
  -- 统计时间
  `statistics_date` DATE DEFAULT NULL COMMENT '统计日期',
  `week_no` INT(11) DEFAULT NULL COMMENT '教学周',
  
  -- 统计数据
  `scheduled_count` INT(11) DEFAULT 0 COMMENT '排课次数',
  `scheduled_hours` DECIMAL(10,2) DEFAULT 0 COMMENT '排课课时数',
  `reserved_count` INT(11) DEFAULT 0 COMMENT '预约次数',
  `reserved_hours` DECIMAL(10,2) DEFAULT 0 COMMENT '预约课时数',
  `total_hours` DECIMAL(10,2) DEFAULT 0 COMMENT '总课时数',
  `total_students` INT(11) DEFAULT 0 COMMENT '使用人次',
  
  -- 使用登记统计
  `registration_count` INT(11) DEFAULT 0 COMMENT '已登记次数',
  `registration_rate` DECIMAL(5,2) DEFAULT 0 COMMENT '登记完成率(%)',
  
  -- 计算指标
  `usage_rate` DECIMAL(5,2) DEFAULT 0 COMMENT '使用率(%)',
  `available_hours` DECIMAL(10,2) DEFAULT 0 COMMENT '可用课时数',
  
  -- 统计时间范围
  `start_date` DATE DEFAULT NULL COMMENT '统计开始日期',
  `end_date` DATE DEFAULT NULL COMMENT '统计结束日期',
  
  -- 系统字段
  `calculated_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '计算时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_unique` (`semester_id`, `statistics_type`, `dimension_type`, `dimension_id`, `statistics_date`),
  KEY `idx_semester` (`semester_id`),
  KEY `idx_dimension` (`dimension_type`, `dimension_id`),
  KEY `idx_date` (`statistics_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='实验室使用统计表';

-- 初始化数据
INSERT INTO `lab_scheduling` (`scheduling_code`, `semester_id`, `source_type`, `course_name`, `major_name`, `class_name`, `student_count`, `building_name`, `room_name`, `room_number`, `teacher_name`, `week_no`, `week_day`, `time_slot_start`, `status`, `approval_status`) VALUES
('SCH001', 1, 'CentralScheduling', '数据结构与算法', '计算机科学与技术', '计算机21级1班', 40, '实验楼A', 'A101实验室', 'A101', '李老师', 3, 1, '1-2', 1, 'approved'),
('SCH002', 1, 'CentralScheduling', '操作系统', '计算机科学与技术', '计算机21级2班', 38, '实验楼A', 'A102实验室', 'A102', '王老师', 3, 1, '3-4', 1, 'approved'),
('SCH003', 1, 'Reservation', '学生科研项目', NULL, NULL, 10, '实验楼B', 'B201实验室', 'B201', '张老师', 4, 2, '5-6', 1, 'approved');

INSERT INTO `lab_reservation` (`reservation_code`, `semester_id`, `building_id`, `building_name`, `room_id`, `room_name`, `room_number`, `use_date`, `week_no`, `week_day`, `time_slot`, `project_name`, `project_category`, `applicant_id`, `applicant_name`, `applicant_phone`, `project_leader`, `project_leader_phone`, `member_count`, `approval_status`) VALUES
('RES001', 1, 2, '实验楼B', 3, 'B201实验室', 'B201', '2024-03-12', 4, 2, '5-6', '智能算法研究', '学生科研项目', 1, '管理员', '13800138000', '张三', '13800138001', 10, 'approved'),
('RES002', 1, 1, '实验楼A', 1, 'A101实验室', 'A101', '2024-03-15', 5, 3, '7-8', '毕业设计实验', '毕业设计论文', 2, '李老师', '13800138002', '李老师', '13800138002', 5, 'pending');

INSERT INTO `lab_teaching_request` (`request_code`, `semester_id`, `course_name`, `major_name`, `grade`, `class_name`, `week_no`, `week_day`, `time_slot`, `applicant_id`, `applicant_name`, `approval_status`) VALUES
('REQ001', 1, '计算机网络', '计算机科学与技术', '2021', '计算机21级1班', 6, 1, '1-2', 1, '管理员', 'pending'),
('REQ002', 1, '数据库原理', '软件工程', '2021', '软件21级1班', 7, 2, '3-4', 2, '李老师', 'approved');

INSERT INTO `lab_usage_registration` (`registration_code`, `semester_id`, `scheduling_id`, `building_name`, `room_name`, `room_number`, `use_date`, `week_no`, `course_name`, `class_name`, `teacher_name`, `actual_duration`, `expected_students`, `actual_students`, `registration_status`, `reporter_id`, `reporter_name`, `report_time`) VALUES
('REG001', 1, 1, '实验楼A', 'A101实验室', 'A101', '2024-03-04', 3, '数据结构与算法', '计算机21级1班', '李老师', 2.0, 40, 39, 'registered', 1, '李老师', '2024-03-04 12:00:00'),
('REG002', 1, 2, '实验楼A', 'A102实验室', 'A102', '2024-03-04', 3, '操作系统', '计算机21级2班', '王老师', 2.0, 38, 38, 'registered', 2, '王老师', '2024-03-04 12:00:00');
