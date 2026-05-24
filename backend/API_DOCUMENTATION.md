# 高校实验室信息管理系统 - 后端接口文档

## 概述

本文档描述了高校实验室信息管理系统的后端RESTful API接口。系统采用Express.js框架构建，提供完整的CRUD操作，支持用户认证、数据管理和业务逻辑处理。

## 技术栈

- **运行环境**: Node.js >= 18.0.0
- **框架**: Express.js 4.18.2
- **数据库**: MySQL 5.7+
- **认证方式**: JWT (JSON Web Token)
- **依赖库**:
  - `cors`: 跨域资源共享
  - `jsonwebtoken`: JWT认证
  - `bcryptjs`: 密码加密
  - `mysql2`: MySQL数据库驱动
  - `dayjs`: 日期时间处理
  - `docx`: Word文档生成

## 基础信息

- **服务地址**: `http://localhost:7001`
- **API版本**: v1
- **基础路径**: `/api/v1`
- **认证方式**: Bearer Token (JWT)

## 认证说明

除登录接口外，所有接口都需要在请求头中携带有效的JWT Token：

```
Authorization: Bearer <token>
```

### 统一响应格式

所有接口返回统一的JSON格式：

```json
{
  "code": 200,
  "message": "成功",
  "data": null
}
```

- `code`: 状态码（200表示成功，其他表示错误）
- `message`: 操作结果描述
- `data`: 返回的数据（可为null）

### 状态码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 操作成功 |
| 400 | 请求参数错误 |
| 401 | 未授权或登录状态已过期 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 一、认证接口

### 1.1 用户登录

- **接口路径**: `POST /api/v1/auth/login`
- **描述**: 用户登录验证，成功返回JWT Token
- **是否需要认证**: 否

**请求参数 (application/json)**:

```json
{
  "username": "admin",
  "password": "123456"
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

**响应示例**:

```json
{
  "code": 200,
  "message": "成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "name": "管理员",
      "role": "admin"
    }
  }
}
```

### 1.2 获取用户信息

- **接口路径**: `GET /api/v1/auth/info`
- **描述**: 获取当前登录用户的信息
- **需要认证**: 是

**响应示例**:

```json
{
  "code": 200,
  "message": "成功",
  "data": {
    "id": 1,
    "username": "admin",
    "name": "管理员",
    "email": "admin@example.com",
    "phone": "13800138000",
    "status": 1,
    "roles": ["admin"]
  }
}
```

### 1.3 修改密码

- **接口路径**: `PUT /api/v1/auth/password`
- **描述**: 修改当前用户的密码
- **需要认证**: 是

**请求参数 (application/json)**:

```json
{
  "oldPassword": "123456",
  "newPassword": "654321",
  "confirmPassword": "654321"
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| oldPassword | string | 是 | 旧密码 |
| newPassword | string | 是 | 新密码 |
| confirmPassword | string | 是 | 确认新密码 |

### 1.4 用户登出

- **接口路径**: `POST /api/v1/auth/logout`
- **描述**: 用户退出登录
- **需要认证**: 是

---

## 二、系统管理模块

### 2.1 用户管理

#### 获取用户列表

- **接口路径**: `GET /api/v1/users`
- **描述**: 获取所有用户列表
- **需要认证**: 是

**响应示例**:

```json
{
  "code": 200,
  "message": "成功",
  "data": [
    {
      "UserID": 1,
      "UserName": "admin",
      "RealName": "管理员",
      "EmployeeNo": "EMP001",
      "Gender": "男",
      "Mobile": "13800138000",
      "Email": "admin@example.com",
      "Status": 1
    }
  ]
}
```

#### 获取单个用户

- **接口路径**: `GET /api/v1/users/:id`
- **描述**: 根据用户ID获取详细信息
- **需要认证**: 是

**路径参数**:

| 参数名 | 类型 | 说明 |
|--------|------|------|
| id | number | 用户ID |

#### 创建用户

- **接口路径**: `POST /api/v1/users`
- **描述**: 创建新用户
- **需要认证**: 是

**请求参数 (application/json)**:

```json
{
  "UserName": "newuser",
  "Password": "123456",
  "RealName": "新用户",
  "EmployeeNo": "EMP002",
  "Gender": "女",
  "Mobile": "13800138001",
  "Email": "newuser@example.com",
  "MainInstitutionID": 1,
  "MainDepartmentID": 1,
  "UserType": "teacher",
  "Status": 1
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| UserName | string | 是 | 用户名 |
| RealName | string | 是 | 真实姓名 |
| EmployeeNo | string | 否 | 员工编号 |
| Gender | string | 否 | 性别 |
| Mobile | string | 否 | 手机号 |
| Email | string | 否 | 邮箱 |
| Password | string | 否 | 密码（默认123456） |
| MainInstitutionID | number | 否 | 主机构ID |
| MainDepartmentID | number | 否 | 主部门ID |
| UserType | string | 否 | 用户类型 |
| Status | number | 否 | 状态（1启用，0禁用） |

#### 更新用户

- **接口路径**: `PUT /api/v1/users/:id`
- **描述**: 更新指定用户的信息
- **需要认证**: 是

#### 删除用户

- **接口路径**: `DELETE /api/v1/users/:id`
- **描述**: 删除指定用户
- **需要认证**: 是

### 2.2 机构管理

#### 获取机构列表

- **接口路径**: `GET /api/v1/organizations`
- **描述**: 获取所有机构信息，支持树形结构
- **需要认证**: 是

**响应示例**:

```json
{
  "code": 200,
  "message": "成功",
  "data": [
    {
      "id": 1,
      "name": "计算机学院",
      "InstitutionCode": "CS",
      "InstitutionType": "college",
      "ParentID": 0,
      "Level": 1,
      "Status": 1,
      "SortOrder": 1
    }
  ]
}
```

#### 创建机构

- **接口路径**: `POST /api/v1/organizations`
- **描述**: 创建新机构
- **需要认证**: 是

**请求参数 (application/json)**:

```json
{
  "InstitutionCode": "CS",
  "InstitutionName": "计算机学院",
  "ParentID": 0,
  "InstitutionType": "college",
  "Level": 1,
  "FullPath": "/1",
  "Status": 1,
  "SortOrder": 1,
  "Description": "计算机科学与技术学院"
}
```

#### 更新机构

- **接口路径**: `PUT /api/v1/organizations/:id`
- **描述**: 更新指定机构
- **需要认证**: 是

#### 删除机构

- **接口路径**: `DELETE /api/v1/organizations/:id`
- **描述**: 删除指定机构
- **需要认证**: 是

### 2.3 部门管理

#### 获取部门列表

- **接口路径**: `GET /api/v1/departments`
- **描述**: 获取所有部门信息
- **需要认证**: 是

#### 创建部门

- **接口路径**: `POST /api/v1/departments`
- **描述**: 创建新部门
- **需要认证**: 是

**请求参数 (application/json)**:

```json
{
  "DepartmentCode": "CS001",
  "DepartmentName": "软件工程系",
  "InstitutionID": 1,
  "ParentID": 0,
  "DepartmentType": "department",
  "Level": 1,
  "FullPath": "/1/1",
  "ManagerID": 1,
  "Status": 1,
  "SortOrder": 1,
  "Description": "软件工程系"
}
```

#### 更新部门

- **接口路径**: `PUT /api/v1/departments/:id`
- **描述**: 更新指定部门
- **需要认证**: 是

#### 删除部门

- **接口路径**: `DELETE /api/v1/departments/:id`
- **描述**: 删除指定部门
- **需要认证**: 是

### 2.4 菜单管理

#### 获取菜单列表

- **接口路径**: `GET /api/v1/menus`
- **描述**: 获取所有菜单项
- **需要认证**: 是

#### 创建菜单

- **接口路径**: `POST /api/v1/menus`
- **描述**: 创建新菜单项
- **需要认证**: 是

**请求参数 (application/json)**:

```json
{
  "name": "用户管理",
  "code": "system:user",
  "path": "/system/user",
  "icon": "User",
  "parent_id": 1,
  "sort": 1,
  "status": 1
}
```

#### 更新菜单

- **接口路径**: `PUT /api/v1/menus/:id`
- **描述**: 更新指定菜单
- **需要认证**: 是

#### 删除菜单

- **接口路径**: `DELETE /api/v1/menus/:id`
- **描述**: 删除指定菜单
- **需要认证**: 是

### 2.5 权限管理

#### 获取权限列表

- **接口路径**: `GET /api/v1/permissions`
- **描述**: 获取所有权限定义
- **需要认证**: 是

#### 创建权限

- **接口路径**: `POST /api/v1/permissions`
- **描述**: 创建新权限
- **需要认证**: 是

**请求参数 (application/json)**:

```json
{
  "name": "用户查看",
  "code": "user:view",
  "type": "button",
  "path": "/api/v1/users",
  "method": "GET",
  "sort": 1,
  "status": 1,
  "parent_id": 1
}
```

#### 更新权限

- **接口路径**: `PUT /api/v1/permissions/:id`
- **描述**: 更新指定权限
- **需要认证**: 是

#### 删除权限

- **接口路径**: `DELETE /api/v1/permissions/:id`
- **描述**: 删除指定权限
- **需要认证**: 是

### 2.6 角色管理

#### 获取角色列表

- **接口路径**: `GET /api/v1/roles`
- **描述**: 获取所有角色
- **需要认证**: 是

#### 创建角色

- **接口路径**: `POST /api/v1/roles`
- **描述**: 创建新角色
- **需要认证**: 是

**请求参数 (application/json)**:

```json
{
  "roleName": "管理员",
  "roleCode": "admin",
  "description": "系统管理员",
  "status": 1
}
```

#### 更新角色

- **接口路径**: `PUT /api/v1/roles/:id`
- **描述**: 更新指定角色
- **需要认证**: 是

#### 删除角色

- **接口路径**: `DELETE /api/v1/roles/:id`
- **描述**: 删除指定角色
- **需要认证**: 是

### 2.7 日志管理

#### 获取日志列表

- **接口路径**: `GET /api/v1/logs`
- **描述**: 获取系统操作日志
- **需要认证**: 是

**响应示例**:

```json
{
  "code": 200,
  "message": "成功",
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "username": "admin",
      "action": "登录",
      "ip": "127.0.0.1",
      "created_at": "2024-01-01 10:00:00"
    }
  ]
}
```

### 2.8 系统配置

#### 获取配置列表

- **接口路径**: `GET /api/v1/configs`
- **描述**: 获取所有系统配置项
- **需要认证**: 是

#### 创建配置

- **接口路径**: `POST /api/v1/configs`
- **描述**: 创建新的系统配置
- **需要认证**: 是

**请求参数 (application/json)**:

```json
{
  "configKey": "SystemName",
  "name": "系统名称",
  "configValue": "高校实验室信息管理系统",
  "group": "system",
  "description": "系统显示名称"
}
```

#### 更新配置

- **接口路径**: `PUT /api/v1/configs/:id`
- **描述**: 更新指定配置
- **需要认证**: 是

#### 删除配置

- **接口路径**: `DELETE /api/v1/configs/:id`
- **描述**: 删除指定配置
- **需要认证**: 是

---

## 三、教学信息管理模块

### 3.1 课程管理

#### 获取课程列表

- **接口路径**: `GET /api/v1/courses`
- **描述**: 获取所有课程信息
- **需要认证**: 是

**响应示例**:

```json
{
  "code": 200,
  "message": "成功",
  "data": [
    {
      "CourseID": 1,
      "CourseCode": "CS101",
      "CourseName": "计算机基础",
      "CourseCategory": "必修",
      "Credit": 3,
      "TheoryHours": 32,
      "ExperimentHours": 16,
      "Status": 1
    }
  ]
}
```

#### 创建课程

- **接口路径**: `POST /api/v1/courses`
- **描述**: 创建新课程
- **需要认证**: 是

**请求参数 (application/json)**:

```json
{
  "CourseCode": "CS102",
  "CourseName": "数据结构",
  "CourseCategory": "必修",
  "Credit": 4,
  "TheoryHours": 48,
  "ExperimentHours": 16,
  "Description": "数据结构与算法基础",
  "Status": 1
}
```

#### 更新课程

- **接口路径**: `PUT /api/v1/courses/:id`
- **描述**: 更新指定课程
- **需要认证**: 是

#### 删除课程

- **接口路径**: `DELETE /api/v1/courses/:id`
- **描述**: 删除指定课程
- **需要认证**: 是

### 3.2 学期管理

#### 获取学期列表

- **接口路径**: `GET /api/v1/semesters`
- **描述**: 获取所有学期信息
- **需要认证**: 是

#### 创建学期

- **接口路径**: `POST /api/v1/semesters`
- **描述**: 创建新学期
- **需要认证**: 是

**请求参数 (application/json)**:

```json
{
  "SemesterCode": "2024-1",
  "SemesterName": "2024年春季学期",
  "StartDate": "2024-02-26",
  "EndDate": "2024-07-05",
  "Status": 1
}
```

#### 更新学期

- **接口路径**: `PUT /api/v1/semesters/:id`
- **描述**: 更新指定学期
- **需要认证**: 是

#### 删除学期

- **接口路径**: `DELETE /api/v1/semesters/:id`
- **描述**: 删除指定学期
- **需要认证**: 是

### 3.3 专业管理

#### 获取专业列表

- **接口路径**: `GET /api/v1/majors`
- **描述**: 获取所有专业信息
- **需要认证**: 是

#### 创建专业

- **接口路径**: `POST /api/v1/majors`
- **描述**: 创建新专业
- **需要认证**: 是

**请求参数 (application/json)**:

```json
{
  "MajorCode": "CS",
  "MajorName": "计算机科学与技术",
  "InstitutionID": 1,
  "EducationLevel": "本科",
  "Duration": 4,
  "Status": 1
}
```

#### 更新专业

- **接口路径**: `PUT /api/v1/majors/:id`
- **描述**: 更新指定专业
- **需要认证**: 是

#### 删除专业

- **接口路径**: `DELETE /api/v1/majors/:id`
- **描述**: 删除指定专业
- **需要认证**: 是

### 3.4 班级管理

#### 获取班级列表

- **接口路径**: `GET /api/v1/classes`
- **描述**: 获取所有班级信息
- **需要认证**: 是

#### 创建班级

- **接口路径**: `POST /api/v1/classes`
- **描述**: 创建新班级
- **需要认证**: 是

**请求参数 (application/json)**:

```json
{
  "ClassCode": "CS2021-1",
  "ClassName": "计算机21级1班",
  "MajorID": 1,
  "Grade": 2021,
  "StudentCount": 40,
  "Counselor": "张老师",
  "Status": 1
}
```

#### 更新班级

- **接口路径**: `PUT /api/v1/classes/:id`
- **描述**: 更新指定班级
- **需要认证**: 是

#### 删除班级

- **接口路径**: `DELETE /api/v1/classes/:id`
- **描述**: 删除指定班级
- **需要认证**: 是

### 3.5 教学任务管理

#### 获取教学任务列表

- **接口路径**: `GET /api/v1/teaching-tasks`
- **描述**: 获取所有教学任务
- **需要认证**: 是

**响应示例**:

```json
{
  "code": 200,
  "message": "成功",
  "data": [
    {
      "TaskID": 1,
      "TaskCode": "TASK-001",
      "SemesterID": 1,
      "CourseID": 1,
      "ClassID": 1,
      "TeacherID": 1,
      "WeeklyHours": 4,
      "TotalHours": 64,
      "StartWeek": 1,
      "EndWeek": 16,
      "ExamMode": "Exam",
      "Classroom": "A101",
      "Status": 1
    }
  ]
}
```

#### 创建教学任务

- **接口路径**: `POST /api/v1/teaching-tasks`
- **描述**: 创建新的教学任务
- **需要认证**: 是

**请求参数 (application/json)**:

```json
{
  "SemesterID": 1,
  "CourseID": 1,
  "ClassID": 1,
  "TeacherID": 1,
  "WeeklyHours": 4,
  "TotalHours": 64,
  "StartWeek": 1,
  "EndWeek": 16,
  "ExamMode": "Exam",
  "Classroom": "A101",
  "Status": 1
}
```

#### 更新教学任务

- **接口路径**: `PUT /api/v1/teaching-tasks/:id`
- **描述**: 更新指定教学任务
- **需要认证**: 是

#### 删除教学任务

- **接口路径**: `DELETE /api/v1/teaching-tasks/:id`
- **描述**: 删除指定教学任务
- **需要认证**: 是

### 3.6 校历管理

#### 获取校历列表

- **接口路径**: `GET /api/v1/calendars`
- **描述**: 获取校历信息
- **需要认证**: 是

#### 创建校历

- **接口路径**: `POST /api/v1/calendars`
- **描述**: 创建校历
- **需要认证**: 是

#### 更新校历

- **接口路径**: `PUT /api/v1/calendars/:id`
- **描述**: 更新校历
- **需要认证**: 是

#### 删除校历

- **接口路径**: `DELETE /api/v1/calendars/:id`
- **描述**: 删除校历
- **需要认证**: 是

### 3.7 节次管理

#### 获取节次列表

- **接口路径**: `GET /api/v1/time-slots`
- **描述**: 获取每天的上课节次配置
- **需要认证**: 是

#### 创建节次

- **接口路径**: `POST /api/v1/time-slots`
- **描述**: 创建上课节次
- **需要认证**: 是

#### 更新节次

- **接口路径**: `PUT /api/v1/time-slots/:id`
- **描述**: 更新节次
- **需要认证**: 是

#### 删除节次

- **接口路径**: `DELETE /api/v1/time-slots/:id`
- **描述**: 删除节次
- **需要认证**: 是

---

## 四、实验教学模块

### 4.1 实验教学任务管理

#### 获取实验教学任务列表

- **接口路径**: `GET /api/v1/experiment-tasks`
- **描述**: 获取所有实验教学任务，包含关联的学期、专业、班级、机构、部门信息
- **需要认证**: 是

**响应示例**:

```json
{
  "code": 200,
  "message": "成功",
  "data": [
    {
      "TaskID": 1,
      "SemesterID": 1,
      "SemesterName": "2024年春季学期",
      "MajorID": 1,
      "MajorName": "计算机科学与技术",
      "ClassID": 1,
      "ClassName": "计算机21级1班",
      "StudentCount": 40,
      "StudentLevel": "本科",
      "CourseName": "数据结构与算法",
      "CourseCategory": "必修",
      "IsIndependent": 1,
      "ExperimentTotalHours": 32,
      "ExperimentCurrentHours": 16,
      "PracticeTotalHours": 16,
      "PracticeCurrentHours": 8,
      "TrainingTotalHours": 0,
      "TrainingCurrentHours": 0,
      "OrgID": 1,
      "OrgName": "计算机学院",
      "DeptID": 1,
      "DeptName": "软件工程系",
      "TeacherName": "李老师",
      "TeacherTitle": "教授",
      "TechnicianName": "王老师",
      "TechnicianTitle": "实验师",
      "TextbookName": "《数据结构》",
      "GuidebookName": "《数据结构实验指导》",
      "Status": 1,
      "CreatedAt": "2024-01-01 10:00:00"
    }
  ]
}
```

#### 获取单个实验教学任务

- **接口路径**: `GET /api/v1/experiment-tasks/:id`
- **描述**: 获取指定实验教学任务的详细信息
- **需要认证**: 是

#### 创建实验教学任务

- **接口路径**: `POST /api/v1/experiment-tasks`
- **描述**: 创建新的实验教学任务
- **需要认证**: 是

**请求参数 (application/json)**:

```json
{
  "SemesterID": 1,
  "MajorID": 1,
  "ClassID": 1,
  "StudentCount": 40,
  "StudentLevel": "本科",
  "CourseName": "数据结构与算法",
  "CourseCategory": "必修",
  "IsIndependent": 1,
  "ExperimentTotalHours": 32,
  "ExperimentCurrentHours": 16,
  "PracticeTotalHours": 16,
  "PracticeCurrentHours": 8,
  "TrainingTotalHours": 0,
  "TrainingCurrentHours": 0,
  "OrgID": 1,
  "DeptID": 1,
  "TeacherName": "李老师",
  "TeacherTitle": "教授",
  "TechnicianName": "王老师",
  "TechnicianTitle": "实验师",
  "TextbookName": "《数据结构》",
  "GuidebookName": "《数据结构实验指导》",
  "Status": 1
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| SemesterID | number | 是 | 学期ID |
| MajorID | number | 否 | 专业ID |
| ClassID | number | 否 | 班级ID |
| StudentCount | number | 否 | 学生人数 |
| StudentLevel | string | 否 | 学生层次 |
| CourseName | string | 是 | 课程名称 |
| CourseCategory | string | 否 | 课程类别 |
| IsIndependent | number | 否 | 是否独立设课（1是，0否） |
| ExperimentTotalHours | number | 否 | 实验总学时 |
| ExperimentCurrentHours | number | 否 | 实验已用学时 |
| PracticeTotalHours | number | 否 | 实践总学时 |
| PracticeCurrentHours | number | 否 | 实践已用学时 |
| TrainingTotalHours | number | 否 | 实训总学时 |
| TrainingCurrentHours | number | 否 | 实训已用学时 |
| OrgID | number | 否 | 机构ID |
| DeptID | number | 否 | 部门ID |
| TeacherName | string | 否 | 主讲教师 |
| TeacherTitle | string | 否 | 教师职称 |
| TechnicianName | string | 否 | 实验技术人员 |
| TechnicianTitle | string | 否 | 技术人员职称 |
| TextbookName | string | 否 | 教材名称 |
| GuidebookName | string | 否 | 指导书名称 |
| Status | number | 否 | 状态（1启用，0禁用） |

#### 更新实验教学任务

- **接口路径**: `PUT /api/v1/experiment-tasks/:id`
- **描述**: 更新指定实验教学任务
- **需要认证**: 是

#### 删除实验教学任务

- **接口路径**: `DELETE /api/v1/experiment-tasks/:id`
- **描述**: 删除指定实验教学任务
- **需要认证**: 是

### 4.2 实验项目库管理

#### 获取实验项目库列表

- **接口路径**: `GET /api/v1/experiment-projects`
- **描述**: 获取所有实验项目
- **需要认证**: 是

**响应示例**:

```json
{
  "code": 200,
  "message": "成功",
  "data": [
    {
      "id": 1,
      "course_code": "CS101",
      "project_name": "排序算法实现",
      "experiment_hours": 4,
      "experiment_type": "基础",
      "experiment_requirement": "必做",
      "description": "实现快速排序和归并排序算法",
      "status": 1
    }
  ]
}
```

#### 获取单个实验项目

- **接口路径**: `GET /api/v1/experiment-projects/:id`
- **描述**: 获取指定实验项目详情
- **需要认证**: 是

#### 创建实验项目

- **接口路径**: `POST /api/v1/experiment-projects`
- **描述**: 创建新的实验项目
- **需要认证**: 是

**请求参数 (application/json)**:

```json
{
  "courseCode": "CS101",
  "projectName": "排序算法实现",
  "experimentHours": 4,
  "experimentType": "基础",
  "experimentRequirement": "必做",
  "status": 1,
  "description": "实现快速排序和归并排序算法"
}
```

#### 更新实验项目

- **接口路径**: `PUT /api/v1/experiment-projects/:id`
- **描述**: 更新指定实验项目
- **需要认证**: 是

#### 删除实验项目

- **接口路径**: `DELETE /api/v1/experiment-projects/:id`
- **描述**: 删除指定实验项目
- **需要认证**: 是

### 4.3 实验项目开出管理

#### 获取实验项目开出列表

- **接口路径**: `GET /api/v1/experiment-offers`
- **描述**: 获取所有实验项目开出安排
- **需要认证**: 是

**响应示例**:

```json
{
  "code": 200,
  "message": "成功",
  "data": [
    {
      "id": 1,
      "taskId": 1,
      "TaskCourseName": "数据结构与算法",
      "projectId": 1,
      "ProjectName": "排序算法实现",
      "weekNo": 3,
      "weekDay": 3,
      "timeSlot": "1-2",
      "groupCount": 2,
      "studentsPerGroup": 20,
      "cycleCount": 2,
      "experimentRequirement": "必做",
      "buildingName": "实验楼A",
      "roomNumber": "A101",
      "isOffered": 1,
      "notOfferedReason": "",
      "status": 1
    }
  ]
}
```

#### 获取单个实验项目开出

- **接口路径**: `GET /api/v1/experiment-offers/:id`
- **描述**: 获取指定实验项目开出详情
- **需要认证**: 是

#### 创建实验项目开出

- **接口路径**: `POST /api/v1/experiment-offers`
- **描述**: 创建新的实验项目开出安排
- **需要认证**: 是

**请求参数 (application/json)**:

```json
{
  "taskId": 1,
  "projectId": 1,
  "weekNo": 3,
  "weekDay": 3,
  "timeSlot": "1-2",
  "groupCount": 2,
  "studentsPerGroup": 20,
  "cycleCount": 2,
  "experimentRequirement": "必做",
  "buildingName": "实验楼A",
  "roomNumber": "A101",
  "isOffered": 1,
  "notOfferedReason": "",
  "status": 1
}
```

#### 更新实验项目开出

- **接口路径**: `PUT /api/v1/experiment-offers/:id`
- **描述**: 更新指定实验项目开出
- **需要认证**: 是

#### 删除实验项目开出

- **接口路径**: `DELETE /api/v1/experiment-offers/:id`
- **描述**: 删除指定实验项目开出
- **需要认证**: 是

### 4.4 实验课程教学质量管理

#### 获取实验教学质量列表

- **接口路径**: `GET /api/v1/experiment-quality`
- **描述**: 获取所有实验课程教学质量记录
- **需要认证**: 是

**响应示例**:

```json
{
  "code": 200,
  "message": "成功",
  "data": [
    {
      "id": 1,
      "task_id": 1,
      "TaskCourseName": "数据结构与算法",
      "organization": "计算机学院",
      "course_name": "数据结构与算法",
      "experiment_hours": 32,
      "is_independent": 1,
      "teacher_name": "李老师",
      "teacher_title": "教授",
      "technician_name": "王老师",
      "technician_title": "实验师",
      "class_name": "计算机21级1班",
      "class_student_count": 40,
      "planned_project_count": 8,
      "actual_project_count": 8,
      "not_offered_projects": "",
      "assessment_method": "考试",
      "assessment_count": 40,
      "assessment_time": "2024-06-20 10:00:00",
      "status": 1
    }
  ]
}
```

#### 获取单个教学质量记录

- **接口路径**: `GET /api/v1/experiment-quality/:id`
- **描述**: 获取指定教学质量记录详情
- **需要认证**: 是

#### 创建教学质量记录

- **接口路径**: `POST /api/v1/experiment-quality`
- **描述**: 创建新的教学质量记录
- **需要认证**: 是

**请求参数 (application/json)**:

```json
{
  "taskId": 1,
  "organization": "计算机学院",
  "courseName": "数据结构与算法",
  "experimentHours": 32,
  "isIndependent": 1,
  "teacherName": "李老师",
  "teacherTitle": "教授",
  "technicianName": "王老师",
  "technicianTitle": "实验师",
  "className": "计算机21级1班",
  "classStudentCount": 40,
  "plannedProjectCount": 8,
  "actualProjectCount": 8,
  "notOfferedProjects": "",
  "notOfferedReasons": "",
  "assessmentMethod": "考试",
  "assessmentCount": 40,
  "assessmentTime": "2024-06-20T10:00:00",
  "status": 1
}
```

#### 更新教学质量记录

- **接口路径**: `PUT /api/v1/experiment-quality/:id`
- **描述**: 更新指定教学质量记录
- **需要认证**: 是

#### 删除教学质量记录

- **接口路径**: `DELETE /api/v1/experiment-quality/:id`
- **描述**: 删除指定教学质量记录
- **需要认证**: 是

### 4.5 实训教学计划管理

#### 获取实训教学计划列表

- **接口路径**: `GET /api/v1/training-plans`
- **描述**: 获取所有实训教学计划
- **需要认证**: 是

**响应示例**:

```json
{
  "code": 200,
  "message": "成功",
  "data": [
    {
      "id": 1,
      "courseCode": "CS201",
      "organizationMode": "校内集中",
      "trainingLocation": "实验楼A",
      "trainingPurpose": "掌握软件开发流程",
      "teachingContent": "软件开发流程实训",
      "trainingMethod": "项目驱动",
      "assessmentMethod": "答辩",
      "qualityMeasures": "过程监控",
      "centerOpinion": "同意",
      "departmentOpinion": "同意",
      "status": 1
    }
  ]
}
```

#### 创建实训教学计划

- **接口路径**: `POST /api/v1/training-plans`
- **描述**: 创建新的实训教学计划
- **需要认证**: 是

**请求参数 (application/json)**:

```json
{
  "courseCode": "CS201",
  "organizationMode": "校内集中",
  "trainingLocation": "实验楼A",
  "trainingPurpose": "掌握软件开发流程",
  "teachingContent": "软件开发流程实训",
  "trainingMethod": "项目驱动",
  "assessmentMethod": "答辩",
  "qualityMeasures": "过程监控",
  "centerOpinion": "同意",
  "departmentOpinion": "同意",
  "status": 1
}
```

#### 更新实训教学计划

- **接口路径**: `PUT /api/v1/training-plans/:id`
- **描述**: 更新指定实训教学计划
- **需要认证**: 是

#### 删除实训教学计划

- **接口路径**: `DELETE /api/v1/training-plans/:id`
- **描述**: 删除指定实训教学计划
- **需要认证**: 是

---

## 五、场馆信息管理模块

### 5.1 校区管理

#### 获取校区列表

- **接口路径**: `GET /api/v1/campuses`
- **描述**: 获取所有校区信息
- **需要认证**: 是

**响应示例**:

```json
{
  "code": 200,
  "message": "成功",
  "data": [
    {
      "id": 1,
      "code": "MAIN",
      "name": "主校区",
      "address": "北京市海淀区中关村大街1号",
      "contactPerson": "张主任",
      "contactPhone": "010-12345678",
      "status": 1
    }
  ]
}
```

#### 创建校区

- **接口路径**: `POST /api/v1/campuses`
- **描述**: 创建新校区
- **需要认证**: 是

**请求参数 (application/json)**:

```json
{
  "code": "MAIN",
  "name": "主校区",
  "address": "北京市海淀区中关村大街1号",
  "contactPerson": "张主任",
  "contactPhone": "010-12345678",
  "status": 1
}
```

#### 更新校区

- **接口路径**: `PUT /api/v1/campuses/:id`
- **描述**: 更新指定校区
- **需要认证**: 是

#### 删除校区

- **接口路径**: `DELETE /api/v1/campuses/:id`
- **描述**: 删除指定校区
- **需要认证**: 是

### 5.2 楼宇管理

#### 获取楼宇列表

- **接口路径**: `GET /api/v1/buildings`
- **描述**: 获取所有楼宇信息
- **需要认证**: 是

#### 创建楼宇

- **接口路径**: `POST /api/v1/buildings`
- **描述**: 创建新楼宇
- **需要认证**: 是

**请求参数 (application/json)**:

```json
{
  "code": "A",
  "name": "A教学楼",
  "campusId": 1,
  "floorCount": 6,
  "buildingType": "教学楼",
  "status": 1
}
```

#### 更新楼宇

- **接口路径**: `PUT /api/v1/buildings/:id`
- **描述**: 更新指定楼宇
- **需要认证**: 是

#### 删除楼宇

- **接口路径**: `DELETE /api/v1/buildings/:id`
- **描述**: 删除指定楼宇
- **需要认证**: 是

### 5.3 房间管理

#### 获取房间列表

- **接口路径**: `GET /api/v1/rooms`
- **描述**: 获取所有房间信息
- **需要认证**: 是

#### 创建房间

- **接口路径**: `POST /api/v1/rooms`
- **描述**: 创建新房间
- **需要认证**: 是

**请求参数 (application/json)**:

```json
{
  "roomNumber": "A101",
  "name": "A101实验室",
  "buildingId": 1,
  "floor": 1,
  "type": "实验室",
  "seats": 40,
  "area": 80,
  "equipment": "电脑40台",
  "status": "空闲"
}
```

#### 更新房间

- **接口路径**: `PUT /api/v1/rooms/:id`
- **描述**: 更新指定房间
- **需要认证**: 是

#### 删除房间

- **接口路径**: `DELETE /api/v1/rooms/:id`
- **描述**: 删除指定房间
- **需要认证**: 是

### 5.4 楼层平面图管理

#### 获取楼层平面图

- **接口路径**: `GET /api/v1/floor-plans`
- **描述**: 获取楼层平面图信息
- **需要认证**: 是

#### 创建楼层平面图

- **接口路径**: `POST /api/v1/floor-plans`
- **描述**: 创建楼层平面图
- **需要认证**: 是

#### 更新楼层平面图

- **接口路径**: `PUT /api/v1/floor-plans/:id`
- **描述**: 更新楼层平面图
- **需要认证**: 是

#### 删除楼层平面图

- **接口路径**: `DELETE /api/v1/floor-plans/:id`
- **描述**: 删除楼层平面图
- **需要认证**: 是

---

## 六、数据字典

### 6.1 状态值

| 值 | 说明 |
|----|------|
| 1 | 启用/正常 |
| 0 | 禁用/停用 |

### 6.2 用户类型

| 值 | 说明 |
|----|------|
| admin | 管理员 |
| teacher | 教师 |
| student | 学生 |
| technician | 实验技术人员 |

### 6.3 课程类别

| 值 | 说明 |
|----|------|
| 必修 | 必修课 |
| 选修 | 选修课 |
| 公选 | 公选课 |

### 6.4 实验类型

| 值 | 说明 |
|----|------|
| 基础 | 基础实验 |
| 综合 | 综合实验 |
| 设计 | 设计性实验 |

### 6.5 实验要求

| 值 | 说明 |
|----|------|
| 必做 | 必修实验 |
| 选做 | 选修实验 |

---

## 七、数据库表结构

系统使用的主要数据表：

| 表名 | 说明 |
|------|------|
| sys_user | 用户表 |
| sys_institution | 机构表 |
| sys_department | 部门表 |
| sys_menu | 菜单表 |
| sys_permission | 权限表 |
| sys_role | 角色表 |
| sys_log | 日志表 |
| sys_config | 配置表 |
| edu_course | 课程表 |
| edu_semester | 学期表 |
| edu_major | 专业表 |
| edu_class | 班级表 |
| edu_teaching_task | 教学任务表 |
| edu_experiment_task | 实验教学任务表 |
| edu_experiment_project | 实验项目表 |
| edu_experiment_project_offer | 实验项目开出表 |
| edu_experiment_quality | 实验教学质量表 |
| edu_training_plan | 实训计划表 |
| ven_campus | 校区表 |
| ven_building | 楼宇表 |
| ven_room | 房间表 |
| ven_floor_plan | 平面图表 |

---

## 八、错误处理

所有接口在发生错误时都会返回相应的错误信息：

```json
{
  "code": 400,
  "message": "请求参数错误",
  "data": null
}
```

常见错误码：

- **400**: 请求参数缺失或格式错误
- **401**: 未提供Token或Token已过期
- **404**: 请求的资源不存在
- **500**: 服务器内部错误

---

## 九、使用示例

### 9.1 登录获取Token

```javascript
const response = await fetch('http://localhost:7001/api/v1/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'admin',
    password: '123456'
  })
});

const result = await response.json();
const token = result.data.token;
```

### 9.2 获取用户列表

```javascript
const response = await fetch('http://localhost:7001/api/v1/users', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const result = await response.json();
console.log(result.data);
```

### 9.3 创建用户

```javascript
const response = await fetch('http://localhost:7001/api/v1/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    UserName: 'newuser',
    RealName: '新用户',
    Password: '123456',
    Status: 1
  })
});

const result = await response.json();
console.log(result);
```

---

## 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.0 | 2024-01-01 | 初始版本 |

---

## 联系方式

如有问题，请联系系统管理员。
