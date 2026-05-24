-- 创建初始用户
INSERT INTO Sys_User (UserName, Password, RealName, EmployeeNo, Gender, Mobile, Email, MainInstitutionID, MainDepartmentID, UserType, Status) VALUES
('admin', '123456', '系统管理员', 'A001', 1, '13800138000', 'admin@example.com', 1, 1, 'admin', 1),
('teacher01', '123456', '张老师', 'T001', 1, '13800138001', 'zhang@example.com', 1, 1, 'teacher', 1),
('teacher02', '123456', '李老师', 'T002', 2, '13800138002', 'li@example.com', 1, 1, 'teacher', 1);

-- 创建机构
INSERT INTO Sys_Institution (InstitutionCode, InstitutionName, ParentID, InstitutionType, Level, FullPath, Status, SortOrder, Description) VALUES
('USTB', 'University of Science and Technology', 0, 'University', 1, '1', 1, 1, 'Main University'),
('CS', 'School of Computer Science', 1, 'College', 2, '1/2', 1, 1, 'Computer Science School'),
('ME', 'School of Mechanical Engineering', 1, 'College', 2, '1/3', 1, 2, 'Mechanical Engineering School'),
('EM', 'School of Economic Management', 1, 'College', 2, '1/4', 1, 3, 'Economic Management School');

-- 创建部门
INSERT INTO Sys_Department (DepartmentCode, DepartmentName, InstitutionID, ParentID, DepartmentType, Level, FullPath, ManagerID, Status, SortOrder, Description) VALUES
('SE', 'Software Engineering', 2, 0, 'Department', 1, '1', 1, 1, 1, 'Software Engineering Department'),
('NE', 'Network Engineering', 2, 0, 'Department', 1, '2', 1, 1, 2, 'Network Engineering Department'),
('AI', 'Artificial Intelligence', 2, 0, 'Department', 1, '3', 1, 1, 3, 'AI Department'),
('MD', 'Mechanical Design', 3, 0, 'Department', 1, '4', 1, 1, 1, 'Mechanical Design Department'),
('IE', 'Industrial Engineering', 3, 0, 'Department', 1, '5', 1, 1, 2, 'Industrial Engineering Department');

-- 创建专业
INSERT INTO Edu_Major (MajorCode, MajorName, MajorNameEn, DepartmentID, DegreeLevel, Duration, DegreeName, Status, SortOrder, Description) VALUES
('SE001', 'Software Engineering', 'Software Engineering', 1, 'Bachelor', 4, 'Bachelor of Engineering', 1, 1, 'Software Engineering Major'),
('NE001', 'Network Engineering', 'Network Engineering', 2, 'Bachelor', 4, 'Bachelor of Engineering', 1, 2, 'Network Engineering Major'),
('AI001', 'Artificial Intelligence', 'Artificial Intelligence', 3, 'Bachelor', 4, 'Bachelor of Engineering', 1, 3, 'AI Major'),
('MD001', 'Mechanical Design', 'Mechanical Design', 4, 'Bachelor', 4, 'Bachelor of Engineering', 1, 1, 'Mechanical Design Major');

-- 创建学期
INSERT INTO Edu_Semester (SemesterCode, SemesterName, SchoolYear, SemesterNo, StartDate, EndDate, TotalWeeks, IsActive, Status, SortOrder, Description) VALUES
('2024-1', '2024-2025 Semester 1', '2024-2025', 1, '2024-09-01', '2025-01-15', 18, 0, 1, 1, 'First Semester'),
('2024-2', '2024-2025 Semester 2', '2024-2025', 2, '2025-02-24', '2025-06-30', 16, 1, 1, 2, 'Second Semester'),
('2025-1', '2025-2026 Semester 1', '2025-2026', 1, '2025-09-01', '2026-01-15', 18, 0, 1, 3, 'First Semester');

-- 创建课程
INSERT INTO Edu_Course (CourseCode, CourseName, CourseNameEn, CourseNature, Credits, TotalHours, LectureHours, PracticeHours, LabHours, OnlineHours, OpenSemesters, Status, SortOrder, Description) VALUES
('CS101', 'Introduction to Computer Science', 'Introduction to Computer Science', 'Compulsory', 3.0, 48, 32, 16, 0, 0, '1,2', 1, 1, 'Basic CS Course'),
('SE101', 'Programming Fundamentals', 'Programming Fundamentals', 'Compulsory', 4.0, 64, 40, 24, 0, 0, '1', 1, 2, 'Programming Basics'),
('SE201', 'Data Structures', 'Data Structures', 'Compulsory', 4.0, 64, 40, 24, 0, 0, '2', 1, 3, 'Data Structures Course'),
('AI101', 'Artificial Intelligence', 'Artificial Intelligence', 'Elective', 3.0, 48, 32, 16, 0, 0, '2,3', 1, 4, 'AI Introduction'),
('ME101', 'Mechanical Design', 'Mechanical Design', 'Compulsory', 4.0, 64, 32, 32, 0, 0, '2', 1, 1, 'Mechanical Design Basics');

-- 创建班级
INSERT INTO Edu_Class (ClassCode, DepartmentID, MajorID, GradeName, ClassName, MonitorID, HeadTeacherID, StudentCount, Status, SortOrder, Description) VALUES
('SE-2021-01', 1, 1, '2021', 'Software Engineering 2021-01', 2, 2, 45, 1, 1, 'SE Class 2021-01'),
('SE-2021-02', 1, 1, '2021', 'Software Engineering 2021-02', 3, 3, 42, 1, 2, 'SE Class 2021-02'),
('AI-2022-01', 3, 3, '2022', 'Artificial Intelligence 2022-01', NULL, 2, 38, 1, 1, 'AI Class 2022-01'),
('MD-2021-01', 4, 4, '2021', 'Mechanical Design 2021-01', NULL, 3, 40, 1, 1, 'MD Class 2021-01');

-- 创建楼宇
INSERT INTO Ven_Building (BuildingCode, BuildingName, BuildingNameEn, Address, TotalFloors, Area, BuildYear, UseType, Status, SortOrder, Description) VALUES
('LIB', 'Library', 'Library', 'Main Campus', 6, 15000.00, 2000, 'library', 1, 1, 'Main Library'),
('TEACH-A', 'Teaching Building A', 'Teaching Building A', 'Main Campus', 5, 10000.00, 1995, 'teaching', 1, 2, 'Building A'),
('TEACH-B', 'Teaching Building B', 'Teaching Building B', 'Main Campus', 5, 10000.00, 1998, 'teaching', 1, 3, 'Building B'),
('LAB', 'Lab Building', 'Lab Building', 'Main Campus', 4, 8000.00, 2010, 'laboratory', 1, 4, 'Lab Building'),
('ADMIN', 'Admin Building', 'Admin Building', 'Main Campus', 4, 6000.00, 1990, 'office', 1, 5, 'Admin Building');

-- 创建房间
INSERT INTO Ven_Room (RoomCode, RoomName, BuildingID, FloorNo, RoomNumber, SeatCount, Area, RoomType, Photo, IsAvailable, Status, SortOrder, Description) VALUES
('LIB-101', 'Reading Room 1', 1, 1, '101', 100, 200.00, 'reading', NULL, 1, 1, 1, '1st Floor Reading Room'),
('LIB-201', 'Reading Room 2', 1, 2, '201', 120, 250.00, 'reading', NULL, 1, 1, 2, '2nd Floor Reading Room'),
('TEACH-A-101', 'Classroom A101', 2, 1, '101', 60, 80.00, 'classroom', NULL, 1, 1, 1, 'Classroom 101'),
('TEACH-A-201', 'Classroom A201', 2, 2, '201', 80, 100.00, 'classroom', NULL, 1, 1, 2, 'Classroom 201'),
('LAB-101', 'Computer Lab', 4, 1, '101', 40, 120.00, 'lab', NULL, 1, 1, 1, 'Computer Laboratory');

-- 创建教学任务
INSERT INTO Edu_TeachingTask (TaskCode, SemesterID, CourseID, ClassID, WeeklyHours, StartWeek, EndWeek, ExamMode, Status, SortOrder, Description) VALUES
('TASK-001', 2, 1, 1, 4, 1, 16, 'Exam', 1, 1, 'CS101 for SE-2021-01'),
('TASK-002', 2, 2, 1, 4, 1, 16, 'Exam', 1, 2, 'SE101 for SE-2021-01'),
('TASK-003', 2, 3, 2, 4, 1, 16, 'Exam', 1, 1, 'SE201 for SE-2021-02'),
('TASK-004', 2, 4, 3, 3, 1, 16, 'Paper', 1, 1, 'AI101 for AI-2022-01');

-- 创建教学任务教师关联
INSERT INTO Edu_TeachingTaskTeacher (TaskID, TeacherID, TeacherRole) VALUES
(1, 2, 'main'),
(2, 2, 'main'),
(3, 3, 'main'),
(4, 2, 'main');
