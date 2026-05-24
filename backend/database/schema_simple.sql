DROP TABLE IF EXISTS Edu_TeachingTaskTeacher;
DROP TABLE IF EXISTS Edu_TeachingTask;
DROP TABLE IF EXISTS Edu_Class;
DROP TABLE IF EXISTS Edu_Course;
DROP TABLE IF EXISTS Edu_Major;
DROP TABLE IF EXISTS Edu_Semester;
DROP TABLE IF EXISTS Ven_Room;
DROP TABLE IF EXISTS Ven_Building;
DROP TABLE IF EXISTS Sys_Department;
DROP TABLE IF EXISTS Sys_Institution;
DROP TABLE IF EXISTS Sys_User;

CREATE TABLE Sys_Institution (
    InstitutionID INT AUTO_INCREMENT PRIMARY KEY,
    InstitutionCode VARCHAR(50) NOT NULL UNIQUE,
    InstitutionName VARCHAR(100) NOT NULL,
    ParentID INT DEFAULT NULL,
    InstitutionType VARCHAR(20),
    Level INT DEFAULT 1,
    FullPath TEXT,
    Status TINYINT(1) DEFAULT 1,
    SortOrder INT DEFAULT 0,
    Description TEXT,
    CreateTime DATETIME DEFAULT CURRENT_TIMESTAMP,
    CreateUserID INT,
    UpdateTime DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UpdateUserID INT,
    INDEX idx_parent (ParentID),
    INDEX idx_status (Status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Sys_Department (
    DepartmentID INT AUTO_INCREMENT PRIMARY KEY,
    DepartmentCode VARCHAR(50) NOT NULL UNIQUE,
    DepartmentName VARCHAR(100) NOT NULL,
    InstitutionID INT,
    ParentID INT DEFAULT 0,
    DepartmentType VARCHAR(20),
    Level INT DEFAULT 1,
    FullPath TEXT,
    ManagerID INT,
    Status TINYINT(1) DEFAULT 1,
    SortOrder INT DEFAULT 0,
    CreateTime DATETIME DEFAULT CURRENT_TIMESTAMP,
    CreateUserID INT,
    UpdateTime DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UpdateUserID INT,
    INDEX idx_institution (InstitutionID),
    INDEX idx_parent (ParentID),
    INDEX idx_status (Status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Sys_User (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    UserName VARCHAR(50) NOT NULL UNIQUE,
    Password VARCHAR(100) NOT NULL,
    RealName VARCHAR(50),
    EmployeeNo VARCHAR(20),
    IDCard VARCHAR(18),
    Gender TINYINT(1),
    Mobile VARCHAR(20),
    Email VARCHAR(100),
    MainInstitutionID INT,
    MainDepartmentID INT,
    UserType VARCHAR(20),
    Status TINYINT(1) DEFAULT 1,
    Avatar VARCHAR(255),
    LastLoginTime DATETIME,
    LastLoginIP VARCHAR(50),
    PasswordUpdateTime DATETIME,
    LoginFailCount INT DEFAULT 0,
    CreateTime DATETIME DEFAULT CURRENT_TIMESTAMP,
    CreateUserID INT,
    UpdateTime DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UpdateUserID INT,
    INDEX idx_institution (MainInstitutionID),
    INDEX idx_department (MainDepartmentID),
    INDEX idx_status (Status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Edu_Major (
    MajorID INT AUTO_INCREMENT PRIMARY KEY,
    MajorCode VARCHAR(50) NOT NULL UNIQUE,
    MajorName VARCHAR(100) NOT NULL,
    MajorNameEn VARCHAR(100),
    DepartmentID INT,
    DegreeLevel VARCHAR(20),
    Duration INT,
    DegreeName VARCHAR(50),
    SortOrder INT DEFAULT 0,
    Status TINYINT(1) DEFAULT 1,
    Description TEXT,
    CreateTime DATETIME DEFAULT CURRENT_TIMESTAMP,
    CreateUserID INT,
    UpdateTime DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UpdateUserID INT,
    INDEX idx_department (DepartmentID),
    INDEX idx_status (Status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Edu_Semester (
    SemesterID INT AUTO_INCREMENT PRIMARY KEY,
    SemesterCode VARCHAR(50) NOT NULL UNIQUE,
    SemesterName VARCHAR(100) NOT NULL,
    SchoolYear VARCHAR(20),
    SemesterNo INT,
    StartDate DATETIME,
    EndDate DATETIME,
    TotalWeeks INT,
    IsActive TINYINT(1) DEFAULT 0,
    SortOrder INT DEFAULT 0,
    Status TINYINT(1) DEFAULT 1,
    Description TEXT,
    CreateTime DATETIME DEFAULT CURRENT_TIMESTAMP,
    CreateUserID INT,
    UpdateTime DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UpdateUserID INT,
    INDEX idx_is_active (IsActive),
    INDEX idx_status (Status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Edu_Course (
    CourseID INT AUTO_INCREMENT PRIMARY KEY,
    CourseCode VARCHAR(50) NOT NULL UNIQUE,
    CourseName VARCHAR(100) NOT NULL,
    CourseNameEn VARCHAR(100),
    CourseNature VARCHAR(20),
    Credits DECIMAL(3,1),
    TotalHours INT,
    LectureHours INT,
    PracticeHours INT,
    LabHours INT,
    OnlineHours INT,
    OpenSemesters VARCHAR(50),
    SortOrder INT DEFAULT 0,
    Status TINYINT(1) DEFAULT 1,
    Description TEXT,
    CreateTime DATETIME DEFAULT CURRENT_TIMESTAMP,
    CreateUserID INT,
    UpdateTime DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UpdateUserID INT,
    INDEX idx_status (Status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Edu_Class (
    ClassID INT AUTO_INCREMENT PRIMARY KEY,
    ClassCode VARCHAR(50) NOT NULL UNIQUE,
    DepartmentID INT,
    MajorID INT,
    GradeName VARCHAR(20),
    ClassName VARCHAR(100) NOT NULL,
    MonitorID INT,
    HeadTeacherID INT,
    StudentCount INT DEFAULT 0,
    SortOrder INT DEFAULT 0,
    Status TINYINT(1) DEFAULT 1,
    Description TEXT,
    CreateTime DATETIME DEFAULT CURRENT_TIMESTAMP,
    CreateUserID INT,
    UpdateTime DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UpdateUserID INT,
    INDEX idx_department (DepartmentID),
    INDEX idx_major (MajorID),
    INDEX idx_status (Status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Edu_TeachingTask (
    TaskID INT AUTO_INCREMENT PRIMARY KEY,
    TaskCode VARCHAR(50) NOT NULL UNIQUE,
    SemesterID INT,
    CourseID INT,
    ClassID INT,
    WeeklyHours INT,
    StartWeek INT,
    EndWeek INT,
    ExamMode VARCHAR(20),
    SortOrder INT DEFAULT 0,
    Status TINYINT(1) DEFAULT 1,
    Description TEXT,
    CreateTime DATETIME DEFAULT CURRENT_TIMESTAMP,
    CreateUserID INT,
    UpdateTime DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UpdateUserID INT,
    INDEX idx_semester (SemesterID),
    INDEX idx_course (CourseID),
    INDEX idx_class (ClassID),
    INDEX idx_status (Status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Edu_TeachingTaskTeacher (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    TaskID INT,
    TeacherID INT,
    TeacherRole VARCHAR(20),
    CreateTime DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_task (TaskID),
    INDEX idx_teacher (TeacherID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Ven_Building (
    BuildingID INT AUTO_INCREMENT PRIMARY KEY,
    BuildingCode VARCHAR(50) NOT NULL UNIQUE,
    BuildingName VARCHAR(100) NOT NULL,
    BuildingNameEn VARCHAR(100),
    Address TEXT,
    TotalFloors INT,
    Area DECIMAL(10,2),
    BuildYear INT,
    UseType VARCHAR(20),
    SortOrder INT DEFAULT 0,
    Status TINYINT(1) DEFAULT 1,
    Description TEXT,
    CreateTime DATETIME DEFAULT CURRENT_TIMESTAMP,
    CreateUserID INT,
    UpdateTime DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UpdateUserID INT,
    INDEX idx_status (Status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Ven_Room (
    RoomID INT AUTO_INCREMENT PRIMARY KEY,
    RoomCode VARCHAR(50) NOT NULL UNIQUE,
    RoomName VARCHAR(100) NOT NULL,
    BuildingID INT,
    FloorNo INT,
    RoomNumber VARCHAR(20),
    SeatCount INT,
    Area DECIMAL(10,2),
    RoomType VARCHAR(20),
    Photo TEXT,
    Description TEXT,
    IsAvailable TINYINT(1) DEFAULT 1,
    SortOrder INT DEFAULT 0,
    Status TINYINT(1) DEFAULT 1,
    CreateTime DATETIME DEFAULT CURRENT_TIMESTAMP,
    CreateUserID INT,
    UpdateTime DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UpdateUserID INT,
    INDEX idx_building (BuildingID),
    INDEX idx_is_available (IsAvailable),
    INDEX idx_status (Status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
