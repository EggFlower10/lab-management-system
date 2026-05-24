# 实验室管理系统 - 部署运行指南

## 一、项目概述

本项目是一个基于 Node.js + Vue3 的实验室管理系统，使用 SQLite 作为嵌入式数据库，无需额外安装数据库服务。

**项目结构：**
```
lab-management-system/
├── backend/          # 后端服务（Express + SQLite）
├── frontend/         # 前端应用（Vue3 + Element Plus）
└── DEPLOYMENT_GUIDE.md  # 本指南
```

---

## 二、环境要求

### 2.1 必备软件

| 软件 | 版本要求 | 说明 |
|------|----------|------|
| Node.js | >= 18.0.0 | JavaScript 运行时 |
| npm | >= 9.0.0 | 包管理器（Node.js 自带） |

### 2.2 安装 Node.js

**Windows 系统：**
1. 访问 [Node.js 官网](https://nodejs.org/)
2. 下载 LTS 版本（推荐 18.x 或 20.x）
3. 运行安装程序，勾选 "Add to PATH"

**验证安装：**
```bash
node -v    # 查看 Node.js 版本
npm -v     # 查看 npm 版本
```

---

## 三、项目运行步骤

### 3.1 解压项目

将收到的项目压缩包解压到本地目录，例如：
```
D:\Projects\lab-management-system\
```

### 3.2 安装依赖

#### 3.2.1 安装后端依赖

打开终端（PowerShell 或 CMD），执行以下命令：

```bash
# 进入后端目录
cd D:\Projects\lab-management-system\backend

# 安装依赖（约 1-2 分钟）
npm install
```

**说明：**
- 后端使用 `sql.js`（纯 JavaScript 实现的 SQLite），无需编译原生模块
- 无需安装 MySQL 或其他数据库服务

#### 3.2.2 安装前端依赖

```bash
# 进入前端目录
cd D:\Projects\lab-management-system\frontend

# 安装依赖（约 2-3 分钟）
npm install
```

### 3.3 启动服务

#### 3.3.1 启动后端服务

**打开第一个终端：**
```bash
cd D:\Projects\lab-management-system\backend
node app.js
```

**预期输出：**
```
SQLite 数据库连接成功
数据库为空，正在初始化表结构...
数据库表结构初始化完成
Server running on http://localhost:7002
```

#### 3.3.2 启动前端服务

**打开第二个终端：**
```bash
cd D:\Projects\lab-management-system\frontend
npm run dev
```

**预期输出：**
```
> vite
  VITE v6.5.0  ready in 3000 ms
  ➜  Local:   http://127.0.0.1:3000/
  ➜  Network: use --host to expose
```

### 3.4 访问系统

打开浏览器，访问：**http://127.0.0.1:3000/**

**默认登录账号：**
- 用户名：`admin`
- 密码：`123456`

---

## 四、数据库说明

### 4.1 数据库类型

本项目使用 **SQLite 嵌入式数据库**，特点：

| 特性 | 说明 |
|------|------|
| 无需独立服务 | 数据库文件直接嵌入应用 |
| 零配置 | 启动时自动创建/连接 |
| 跨平台 | 数据库文件可在 Windows/Mac/Linux 间复制 |

### 4.2 数据库文件位置

```
backend/database/lab_management.db
```

### 4.3 数据库连接机制

**首次启动：**
1. 检查 `lab_management.db` 文件是否存在
2. 如果不存在，创建新的内存数据库
3. 执行 `backend/database/init_sqlite.sql` 初始化表结构和初始数据
4. 定时保存到文件（每 30 秒）

**后续启动：**
1. 读取已存在的 `lab_management.db` 文件
2. 恢复上次保存的数据

### 4.4 数据持久化

系统会自动保存数据，无需手动操作：

- **定时保存**：每 30 秒自动将内存数据写入文件
- **退出保存**：程序正常退出时自动保存
- **强制保存**：按 `Ctrl+C` 退出时也会自动保存

### 4.5 数据库安装与初始化过程

本项目使用 `sql.js`（纯 JavaScript 实现的 SQLite），数据库的安装和初始化完全自动化。

#### 4.5.1 数据库依赖安装

当执行 `npm install` 时，`sql.js` 会自动安装：

```bash
# 进入后端目录
cd backend

# 安装依赖（包含 sql.js）
npm install
```

**安装内容：**
- `sql.js` 包：纯 JavaScript 实现的 SQLite 引擎
- 无需安装 SQLite 原生库或编译工具链

#### 4.5.2 数据库初始化流程

**首次启动时的自动初始化：**

```
┌─────────────────────────────────────────────────────────────┐
│                    启动后端服务 (node app.js)               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  检查数据库文件是否存在                                     │
│  路径: backend/database/lab_management.db                  │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
     ┌───────────────┐              ┌─────────────────┐
     │ 文件存在      │              │ 文件不存在      │
     └───────────────┘              └─────────────────┘
              │                               │
              ▼                               ▼
     ┌───────────────┐              ┌─────────────────┐
     │ 读取已有数据   │              │ 创建新数据库    │
     │ 恢复上次状态   │              │ 执行初始化脚本  │
     └───────────────┘              └─────────────────┘
              │                               │
              └───────────────┬───────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              启动定时保存任务（每30秒）                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    服务启动完成                             │
│              Server running on http://localhost:7002       │
└─────────────────────────────────────────────────────────────┘
```

#### 4.5.3 初始化脚本内容

初始化脚本 `backend/database/init_sqlite.sql` 包含：

1. **表结构定义**：创建所有业务表（用户、角色、权限、部门、学期、专业、班级、排课等）
2. **索引创建**：为常用查询字段创建索引
3. **初始数据**：
   - 管理员账号（用户名：admin，密码：123456）
   - 系统权限配置
   - 部门信息
   - 学期数据
   - 专业和班级信息
   - 实验项目数据
   - 排课示例数据

#### 4.5.4 手动重新初始化数据库

如果需要重置数据库到初始状态：

```bash
# 1. 停止后端服务（按 Ctrl+C）

# 2. 删除数据库文件
del backend/database/lab_management.db

# 3. 重新启动后端服务
node app.js
```

**注意**：此操作会清除所有自定义数据，恢复到初始状态。

---

## 五、修改数据库数据

### 5.1 通过前端界面修改

这是最推荐的方式，所有业务操作都可以通过系统界面完成：

1. **新增数据**：点击各模块的「新建」或「添加」按钮
2. **编辑数据**：点击列表中的「编辑」按钮修改记录
3. **删除数据**：点击列表中的「删除」按钮移除记录
4. **查询数据**：使用搜索框或筛选条件查找数据

### 5.2 通过 SQL 语句修改（高级）

如果需要批量操作或特殊查询，可以使用 SQLite 工具：

#### 5.2.1 使用 sqlite3 命令行工具

**安装 sqlite3（可选）：**
- 下载：https://www.sqlite.org/download.html
- 将 `sqlite3.exe` 添加到系统 PATH

**操作命令：**
```bash
# 进入数据库目录
cd backend/database

# 打开数据库
sqlite3 lab_management.db

# 查看所有表
.tables

# 查询数据
SELECT * FROM sys_user;

# 修改数据
UPDATE sys_user SET username = 'new_admin' WHERE id = 1;

# 退出
.exit
```

#### 5.2.2 使用可视化工具

推荐工具：
- **DB Browser for SQLite**（免费）：https://sqlitebrowser.org/
- **DBeaver**（支持多数据库）：https://dbeaver.io/

---

## 六、常见问题

### 6.1 端口被占用

**问题：**
```
Error: listen EADDRINUSE: address already in use :::7002
```

**解决方案：**
```bash
# Windows 系统，查找并杀死占用端口的进程
netstat -ano | findstr :7002
taskkill /F /PID <进程ID>
```

### 6.2 依赖安装失败

**问题：**
```
npm ERR! network timeout at: https://registry.npmjs.org/xxx
```

**解决方案：**
```bash
# 切换到国内镜像
npm install --registry=https://registry.npmmirror.com
```

### 6.3 数据库文件损坏

**问题：** 启动时提示数据库错误

**解决方案：**
1. 删除 `backend/database/lab_management.db` 文件
2. 重新启动后端服务，系统会自动重新初始化数据库

---

## 七、服务停止

### 7.1 停止后端服务
在后端终端按 `Ctrl+C`

### 7.2 停止前端服务
在前端终端按 `Ctrl+C`

---

## 八、项目结构说明

```
lab-management-system/
├── backend/                    # 后端服务
│   ├── app.js                  # 主应用入口
│   ├── package.json            # 依赖配置
│   └── database/               # 数据库相关
│       ├── init_sqlite.sql     # 初始化脚本（表结构+初始数据）
│       └── lab_management.db   # SQLite 数据库文件（运行后生成）
├── frontend/                   # 前端应用
│   ├── src/                    # 源代码
│   ├── package.json            # 依赖配置
│   └── vite.config.js          # 构建配置
└── DEPLOYMENT_GUIDE.md         # 部署指南（本文件）
```

---

## 九、技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 前端框架 | Vue | 3.x |
| UI 组件 | Element Plus | 2.x |
| 前端构建 | Vite | 6.x |
| 后端框架 | Express | 4.x |
| 数据库 | SQLite (sql.js) | 1.x |
| 认证 | JWT | - |

---

**文档版本：** v1.0  
**创建日期：** 2024年  
**适用项目：** 实验室管理系统