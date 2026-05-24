-- 机构数据
INSERT INTO sys_organization (name, code, parent_id, sort, description, status) VALUES
('北京科技大学', 'USTB', 0, 1, '主机构', 1),
('计算机学院', 'CS', 1, 1, '计算机科学与技术学院', 1),
('机械工程学院', 'ME', 1, 2, '机械工程学院', 1),
('经济管理学院', 'EM', 1, 3, '经济管理学院', 1);

-- 部门数据
INSERT INTO sys_department (name, code, organization_id, sort, status) VALUES
('软件工程系', 'SE', 2, 1, 1),
('网络工程系', 'NE', 2, 2, 1),
('人工智能系', 'AI', 2, 3, 1),
('机械设计系', 'MD', 3, 1, 1),
('工业工程系', 'IE', 3, 2, 1);

-- 学期数据
INSERT INTO edu_semester (semester_name, start_date, end_date, status, is_current) VALUES
('2024-2025学年第一学期', '2024-09-01', '2025-01-15', 1, 0),
('2024-2025学年第二学期', '2025-02-24', '2025-06-30', 1, 1),
('2025-2026学年第一学期', '2025-09-01', '2026-01-15', 1, 0);

-- 专业数据
INSERT INTO edu_major (name, code, department, description, status) VALUES
('软件工程', 'SE001', '软件工程系', '软件工程专业', 1),
('网络工程', 'NE001', '网络工程系', '网络工程专业', 1),
('人工智能', 'AI001', '人工智能系', '人工智能专业', 1),
('机械设计制造及其自动化', 'MD001', '机械设计系', '机械设计专业', 1),
('工业工程', 'IE001', '工业工程系', '工业工程专业', 1);

-- 楼宇数据
INSERT INTO ven_building (name, code, campus_id, floors, description, status) VALUES
('图书馆', 'LIB', 1, 6, '学校图书馆', 1),
('教学楼A', 'TEACH-A', 1, 5, 'A教学楼', 1),
('教学楼B', 'TEACH-B', 1, 5, 'B教学楼', 1),
('实验楼', 'LAB', 1, 4, '综合实验楼', 1),
('行政楼', 'ADMIN', 1, 4, '行政办公楼', 1),
('体育馆', 'GYM', 1, 3, '体育馆', 1);

-- 房间数据
INSERT INTO ven_room (code, name, building_id, floor, room_type, capacity, description, status) VALUES
('LIB-101', '第一阅览室', 1, 1, 'reading', 100, '一楼第一阅览室', 1),
('LIB-201', '第二阅览室', 1, 2, 'reading', 120, '二楼第二阅览室', 1),
('LIB-301', '电子阅览室', 1, 3, 'computer', 50, '三楼电子阅览室', 1),
('TEACH-A-101', 'A101教室', 2, 1, 'classroom', 60, 'A楼101教室', 1),
('TEACH-A-102', 'A102教室', 2, 1, 'classroom', 60, 'A楼102教室', 1),
('TEACH-A-201', 'A201教室', 2, 2, 'classroom', 80, 'A楼201教室', 1),
('TEACH-B-101', 'B101教室', 3, 1, 'classroom', 60, 'B楼101教室', 1),
('TEACH-B-301', 'B301教室', 3, 3, 'classroom', 100, 'B楼301大教室', 1),
('LAB-101', '物理实验室', 4, 1, 'lab', 30, '一楼物理实验室', 1),
('LAB-201', '计算机实验室', 4, 2, 'lab', 40, '二楼计算机实验室', 1),
('LAB-301', '电子实验室', 4, 3, 'lab', 35, '三楼电子实验室', 1),
('ADMIN-101', '校长办公室', 5, 1, 'office', 1, '校长办公室', 1),
('ADMIN-201', '教务处', 5, 2, 'office', 8, '教务处办公室', 1),
('GYM-101', '篮球馆', 6, 1, 'gym', 500, '一楼篮球馆', 1),
('GYM-201', '羽毛球馆', 6, 2, 'gym', 50, '二楼羽毛球馆', 1);

-- 权限数据
INSERT INTO sys_permission (name, code, type, path, method, sort, status, parent_id) VALUES
('系统管理', 'sys:manage', 'menu', '/system', 'GET', 1, 1, 0),
('用户管理', 'sys:user:list', 'menu', '/api/v1/users', 'GET', 1, 1, 1),
('角色管理', 'sys:role:list', 'menu', '/api/v1/roles', 'GET', 2, 1, 1),
('菜单管理', 'sys:menu:list', 'menu', '/api/v1/menus', 'GET', 3, 1, 1),
('权限管理', 'sys:permission:list', 'menu', '/api/v1/permissions', 'GET', 4, 1, 1),
('机构管理', 'sys:org:list', 'menu', '/api/v1/organizations', 'GET', 5, 1, 1),
('部门管理', 'sys:dept:list', 'menu', '/api/v1/departments', 'GET', 6, 1, 1),
('教学管理', 'edu:manage', 'menu', '/teaching', 'GET', 2, 1, 0),
('课程管理', 'edu:course:list', 'menu', '/api/v1/courses', 'GET', 1, 1, 8),
('学期管理', 'edu:semester:list', 'menu', '/api/v1/semesters', 'GET', 2, 1, 8),
('专业管理', 'edu:major:list', 'menu', '/api/v1/majors', 'GET', 3, 1, 8),
('班级管理', 'edu:class:list', 'menu', '/api/v1/classes', 'GET', 4, 1, 8),
('教学任务', 'edu:task:list', 'menu', '/api/v1/tasks', 'GET', 5, 1, 8),
('场馆管理', 'ven:manage', 'menu', '/venue', 'GET', 3, 1, 0),
('校区管理', 'ven:campus:list', 'menu', '/api/v1/campuses', 'GET', 1, 1, 14),
('楼宇管理', 'ven:building:list', 'menu', '/api/v1/buildings', 'GET', 2, 1, 14),
('房间管理', 'ven:room:list', 'menu', '/api/v1/rooms', 'GET', 3, 1, 14);
