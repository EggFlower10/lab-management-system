-- 删除旧表
DROP TABLE IF EXISTS Edu_Course;
DROP TABLE IF EXISTS Edu_Class;
DROP TABLE IF EXISTS Edu_Major;
DROP TABLE IF EXISTS Edu_Semester;
DROP TABLE IF EXISTS Edu_TeachingTask;
DROP TABLE IF EXISTS Edu_TeachingTaskTeacher;
DROP TABLE IF EXISTS Ven_Room;
DROP TABLE IF EXISTS Ven_Building;
DROP TABLE IF EXISTS Sys_Department;
DROP TABLE IF EXISTS Sys_Institution;
DROP TABLE IF EXISTS Sys_User;

-- 创建 Sys_Institution 表
CREATE TABLE Sys_Institution (
    InstitutionID INT AUTO_INCREMENT PRIMARY KEY COMMENT '机构ID，主键，自动增长',
    InstitutionCode VARCHAR(50) NOT NULL UNIQUE COMMENT '机构编码，唯一标识',
    InstitutionName VARCHAR(100) NOT NULL COMMENT '机构名称',
    ParentID INT DEFAULT NULL COMMENT '上级机构ID，NULL表示顶级机构',
    InstitutionType VARCHAR(20) COMMENT '机构类型University/College/Department/Center',
    Level INT DEFAULT 1 COMMENT '机构层级，从1开始',
    FullPath TEXT COMMENT '机构全路径，如：1/2/5',
    Status TINYINT(1) DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
    SortOrder INT DEFAULT 0 COMMENT '排序编号',
    Description TEXT COMMENT '描述',
    CreateTime DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    CreateUserID INT COMMENT '创建者',
    UpdateTime DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
    UpdateUserID INT COMMENT '修改者',
    INDEX idx_parent (ParentID),
    INDEX idx_status (Status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='机构表';

-- 创建 Sys_Department 表
CREATE TABLE Sys_Department (
    DepartmentID INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键，部门唯一标识',
    DepartmentCode VARCHAR(50) NOT NULL UNIQUE COMMENT '部门编码',
    DepartmentName VARCHAR(100) NOT NULL COMMENT '部门名称',
    InstitutionID INT COMMENT '所属机构ID',
    ParentID INT DEFAULT 0 COMMENT '父部门ID（用于层级结构）',
    DepartmentType VARCHAR(20) COMMENT '部门类型',
    Level INT DEFAULT 1 COMMENT '层级深度',
    FullPath TEXT COMMENT '完整路径（用于树形结构）',
    ManagerID INT COMMENT '部门负责人ID',
    Status TINYINT(1) DEFAULT 1 COMMENT '状态',
    SortOrder INT DEFAULT 0 COMMENT '排序序号',
    CreateTime DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    CreateUserID INT COMMENT '创建人ID',
    UpdateTime DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UpdateUserID INT COMMENT '更新人ID',
    INDEX idx_institution (InstitutionID),
    INDEX idx_parent (ParentID),
    INDEX idx_status (Status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='部门表';

-- 创建 Sys_User 表
CREATE TABLE Sys_User (
    UserID INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键，用户唯一标识',
    UserName VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    Password VARCHAR(100) NOT NULL COMMENT '密码',
    RealName VARCHAR(50) COMMENT '真实姓名',
    EmployeeNo VARCHAR(20) COMMENT '工号',
    IDCard VARCHAR(18) COMMENT '身份证号',
    Gender TINYINT(1) COMMENT '性别',
    Mobile VARCHAR(20) COMMENT '手机号',
    Email VARCHAR(100) COMMENT '邮箱',
    MainInstitutionID INT COMMENT '主机构ID',
    MainDepartmentID INT COMMENT '主部门ID',
    UserType VARCHAR(20) COMMENT '用户类型',
    Status TINYINT(1) DEFAULT 1 COMMENT '状态',
    Avatar VARCHAR(255) COMMENT '头像',
    LastLoginTime DATETIME COMMENT '最后登录时间',
    LastLoginIP VARCHAR(50) COMMENT '最后登录IP',
    PasswordUpdateTime DATETIME COMMENT '密码更新时间',
    LoginFailCount INT DEFAULT 0 COMMENT '登录失败次数',
    CreateTime DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    CreateUserID INT COMMENT '创建人ID',
    UpdateTime DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UpdateUserID INT COMMENT '更新人ID',
    INDEX idx_institution (MainInstitutionID),
    INDEX idx_department (MainDepartmentID),
    INDEX idx_status (Status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 创建 Edu_Major 表
CREATE TABLE Edu_Major (
    MajorID INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键，专业唯一标识',
    MajorCode VARCHAR(50) NOT NULL UNIQUE COMMENT '专业编码',
    MajorName VARCHAR(100) NOT NULL COMMENT '专业名称（中文）',
    MajorNameEn VARCHAR(100) COMMENT '专业名称（英文）',
    DepartmentID INT COMMENT '所属院系ID',
    DegreeLevel VARCHAR(20) COMMENT '学历层次',
    Duration INT COMMENT '学制年限（年）',
    DegreeName VARCHAR(50) COMMENT '学位名称',
    SortOrder INT DEFAULT 0 COMMENT '排序序号',
    Status TINYINT(1) DEFAULT 1 COMMENT '状态',
    Description TEXT COMMENT '描述',
    CreateTime DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    CreateUserID INT COMMENT '创建人ID',
    UpdateTime DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UpdateUserID INT COMMENT '更新人ID',
    INDEX idx_department (DepartmentID),
    INDEX idx_status (Status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='专业表';

-- 创建 Edu_Semester 表
CREATE TABLE Edu_Semester (
    SemesterID INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键，学期唯一标识',
    SemesterCode VARCHAR(50) NOT NULL UNIQUE COMMENT '学期编码',
    SemesterName VARCHAR(100) NOT NULL COMMENT '学期名称',
    SchoolYear VARCHAR(20) COMMENT '学年',
    SemesterNo INT COMMENT '学期序号',
    StartDate DATETIME COMMENT '开始日期',
    EndDate DATETIME COMMENT '结束日期',
    TotalWeeks INT COMMENT '总周数',
    IsActive TINYINT(1) DEFAULT 0 COMMENT '是否当前学期',
    SortOrder INT DEFAULT 0 COMMENT '排序序号',
    Status TINYINT(1) DEFAULT 1 COMMENT '状态',
    Description TEXT COMMENT '描述',
    CreateTime DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    CreateUserID INT COMMENT '创建人ID',
    UpdateTime DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UpdateUserID INT COMMENT '更新人ID',
    INDEX idx_is_active (IsActive),
    INDEX idx_status (Status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学期表';

-- 创建 Edu_Course 表
CREATE TABLE Edu_Course (
    CourseID INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键，自增',
    CourseCode VARCHAR(50) NOT NULL UNIQUE COMMENT '课程编码（如CS101）',
    CourseName VARCHAR(100) NOT NULL COMMENT '课程中文名',
    CourseNameEn VARCHAR(100) COMMENT '课程英文名',
    CourseNature VARCHAR(20) COMMENT '课程性质（必修/选修/公选）',
    Credits DECIMAL(3,1) COMMENT '学分',
    TotalHours INT COMMENT '总学时',
    LectureHours INT COMMENT '讲授学时',
    PracticeHours INT COMMENT '实践学时',
    LabHours INT COMMENT '实验学时',
    OnlineHours INT COMMENT '线上学时',
    OpenSemesters VARCHAR(50) COMMENT '开设学期（如"1,2"）',
    SortOrder INT DEFAULT 0 COMMENT '排序号',
    Status TINYINT(1) DEFAULT 1 COMMENT '状态（0禁用/1正常）',
    Description TEXT COMMENT '课程描述',
    CreateTime DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    CreateUserID INT COMMENT '创建人ID',
    UpdateTime DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UpdateUserID INT COMMENT '更新人ID',
    INDEX idx_status (Status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='课程表';

-- 创建 Edu_Class 表
CREATE TABLE Edu_Class (
    ClassID INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键，班级唯一标识',
    ClassCode VARCHAR(50) NOT NULL UNIQUE COMMENT '班级编码',
    DepartmentID INT COMMENT '所属院系ID',
    MajorID INT COMMENT '所属专业ID',
    GradeName VARCHAR(20) COMMENT '年级名称',
    ClassName VARCHAR(100) NOT NULL COMMENT '班级名称',
    MonitorID INT COMMENT '班长ID',
    HeadTeacherID INT COMMENT '班主任ID',
    StudentCount INT DEFAULT 0 COMMENT '学生人数',
    SortOrder INT DEFAULT 0 COMMENT '排序序号',
    Status TINYINT(1) DEFAULT 1 COMMENT '状态',
    Description TEXT COMMENT '描述',
    CreateTime DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    CreateUserID INT COMMENT '创建人ID',
    UpdateTime DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UpdateUserID INT COMMENT '更新人ID',
    INDEX idx_department (DepartmentID),
    INDEX idx_major (MajorID),
    INDEX idx_status (Status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='班级表';

-- 创建 Edu_TeachingTask 表
CREATE TABLE Edu_TeachingTask (
    TaskID INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键，教学任务唯一标识',
    TaskCode VARCHAR(50) NOT NULL UNIQUE COMMENT '教学任务编码',
    SemesterID INT COMMENT '所属学期ID',
    CourseID INT COMMENT '课程ID',
    ClassID INT COMMENT '班级ID',
    WeeklyHours INT COMMENT '周课时',
    StartWeek INT COMMENT '开始周次',
    EndWeek INT COMMENT '结束周次',
    ExamMode VARCHAR(20) COMMENT '考核方式',
    SortOrder INT DEFAULT 0 COMMENT '排序序号',
    Status TINYINT(1) DEFAULT 1 COMMENT '状态',
    Description TEXT COMMENT '描述',
    CreateTime DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    CreateUserID INT COMMENT '创建人ID',
    UpdateTime DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UpdateUserID INT COMMENT '更新人ID',
    INDEX idx_semester (SemesterID),
    INDEX idx_course (CourseID),
    INDEX idx_class (ClassID),
    INDEX idx_status (Status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='教学任务表';

-- 创建 Edu_TeachingTaskTeacher 表
CREATE TABLE Edu_TeachingTaskTeacher (
    ID INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键，任务教师关联唯一标识',
    TaskID INT COMMENT '教学任务ID',
    TeacherID INT COMMENT '教师ID',
    TeacherRole VARCHAR(20) COMMENT '教师角色（如主讲、助教等）',
    CreateTime DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_task (TaskID),
    INDEX idx_teacher (TeacherID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='教学任务教师关联表';

-- 创建 Ven_Building 表
CREATE TABLE Ven_Building (
    BuildingID INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键，楼宇唯一标识',
    BuildingCode VARCHAR(50) NOT NULL UNIQUE COMMENT '楼宇编码',
    BuildingName VARCHAR(100) NOT NULL COMMENT '楼宇名称',
    BuildingNameEn VARCHAR(100) COMMENT '楼宇名称（英文）',
    Address TEXT COMMENT '地址',
    TotalFloors INT COMMENT '总层数',
    Area DECIMAL(10,2) COMMENT '建筑面积',
    BuildYear INT COMMENT '建造年份',
    UseType VARCHAR(20) COMMENT '用途类型',
    SortOrder INT DEFAULT 0 COMMENT '排序序号',
    Status TINYINT(1) DEFAULT 1 COMMENT '状态',
    Description TEXT COMMENT '描述',
    CreateTime DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    CreateUserID INT COMMENT '创建人ID',
    UpdateTime DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UpdateUserID INT COMMENT '更新人ID',
    INDEX idx_status (Status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='楼宇表';

-- 创建 Ven_Room 表
CREATE TABLE Ven_Room (
    RoomID INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键，场地唯一标识',
    RoomCode VARCHAR(50) NOT NULL UNIQUE COMMENT '场地编码',
    RoomName VARCHAR(100) NOT NULL COMMENT '场地名称',
    BuildingID INT COMMENT '所属楼宇ID',
    FloorNo INT COMMENT '楼层号',
    RoomNumber VARCHAR(20) COMMENT '房间号',
    SeatCount INT COMMENT '座位数量',
    Area DECIMAL(10,2) COMMENT '面积',
    RoomType VARCHAR(20) COMMENT '场地类型',
    Photo TEXT COMMENT '照片',
    Description TEXT COMMENT '描述',
    IsAvailable TINYINT(1) DEFAULT 1 COMMENT '是否可用',
    SortOrder INT DEFAULT 0 COMMENT '排序序号',
    Status TINYINT(1) DEFAULT 1 COMMENT '状态',
    CreateTime DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    CreateUserID INT COMMENT '创建人ID',
    UpdateTime DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UpdateUserID INT COMMENT '更新人ID',
    INDEX idx_building (BuildingID),
    INDEX idx_is_available (IsAvailable),
    INDEX idx_status (Status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='场地表';
