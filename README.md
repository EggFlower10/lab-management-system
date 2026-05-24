# 高校实验室信息管理系统

一个基于 Vue3 + TypeScript + Element Plus（前端）和 Egg.js + MySQL + JWT（后端）的全栈实验室信息管理系统。

## 项目结构

```
lab-management-system/
├── backend/                 # 后端项目
│   ├── app/                 # 应用目录
│   │   ├── controller/      # 控制器
│   │   ├── service/         # 服务层
│   │   ├── middleware/      # 中间件
│   │   ├── extend/          # 扩展
│   │   └── schedule/        # 定时任务
│   ├── config/              # 配置文件
│   ├── database/            # 数据库脚本
│   └── package.json
├── frontend/                # 前端项目
│   ├── src/
│   │   ├── assets/          # 静态资源
│   │   ├── components/      # 公共组件
│   │   ├── layouts/         # 布局组件
│   │   ├── router/          # 路由配置
│   │   ├── stores/          # Pinia状态管理
│   │   ├── styles/          # 全局样式
│   │   ├── types/           # TypeScript类型
│   │   ├── utils/           # 工具函数
│   │   └── views/           # 页面组件
│   └── package.json
└── README.md
```

## 功能模块

### 系统管理
- 用户管理：用户的增删改查、密码重置
- 角色管理：角色的增删改查、权限分配
- 菜单管理：菜单的树形管理
- 权限管理：API权限的管理
- 机构管理：组织机构的树形管理
- 部门管理：部门的树形管理
- 操作日志：系统操作日志查询
- 系统配置：系统参数配置

### 教学信息管理
- 课程管理：课程信息管理
- 学期管理：学期信息管理
- 校历查看：校历日历展示
- 专业管理：专业信息管理
- 班级管理：班级信息管理
- 教学任务：教学任务分配
- 节次管理：上课节次配置

### 场馆信息管理
- 校区管理：校区信息管理
- 楼宇管理：楼宇信息管理
- 房间管理：实验室/教室管理
- 楼层平面图：楼层平面图管理

## 技术栈

### 前端
- Vue 3.4 + TypeScript 5.4
- Element Plus 2.6
- Vue Router 4.3
- Pinia 2.1
- Axios 1.6
- Vite 5.1
- Sass

### 后端
- Egg.js 3.15
- TypeScript 5.3
- MySQL
- JWT认证
- bcryptjs密码加密

## 快速开始

### 环境要求
- Node.js >= 18.0.0
- MySQL >= 5.7
- npm 或 pnpm

### 数据库配置

1. 创建数据库并导入初始数据：
```bash
mysql -u root -p < backend/database/init.sql
```

2. 修改后端数据库配置（`backend/config/config.default.ts`）：
```typescript
mysql: {
  client: {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'your_password',
    database: 'lab_management',
  },
}
```

### 后端启动

```bash
cd backend
npm install
npm run dev
```

后端服务将运行在 http://localhost:7001

### 前端启动

```bash
cd frontend
npm install
npm run dev
```

前端服务将运行在 http://localhost:3000

### 默认账号
- 用户名：admin
- 密码：123456

## API文档

### 认证接口
- POST `/api/v1/auth/login` - 登录
- POST `/api/v1/auth/logout` - 退出登录
- GET `/api/v1/auth/info` - 获取用户信息
- PUT `/api/v1/auth/password` - 修改密码

### 系统管理接口
- `/api/v1/users` - 用户管理
- `/api/v1/roles` - 角色管理
- `/api/v1/menus` - 菜单管理
- `/api/v1/permissions` - 权限管理
- `/api/v1/organizations` - 机构管理
- `/api/v1/departments` - 部门管理
- `/api/v1/logs` - 操作日志
- `/api/v1/configs` - 系统配置

### 教学管理接口
- `/api/v1/courses` - 课程管理
- `/api/v1/semesters` - 学期管理
- `/api/v1/calendars` - 校历管理
- `/api/v1/majors` - 专业管理
- `/api/v1/classes` - 班级管理
- `/api/v1/teaching-tasks` - 教学任务
- `/api/v1/time-slots` - 节次管理

### 场馆管理接口
- `/api/v1/campuses` - 校区管理
- `/api/v1/buildings` - 楼宇管理
- `/api/v1/rooms` - 房间管理
- `/api/v1/floor-plans` - 楼层平面图

## 项目特点

1. **完整的RBAC权限控制**：基于角色的访问控制，支持菜单权限和API权限
2. **统一的响应格式**：后端统一返回格式，前端统一处理
3. **JWT认证**：无状态的身份认证
4. **动态菜单**：根据用户权限动态生成菜单
5. **响应式布局**：适配不同屏幕尺寸
6. **TypeScript**：前后端均使用TypeScript，类型安全

## 开发说明

### 后端开发
- 控制器位于 `app/controller/` 目录
- 服务层位于 `app/service/` 目录
- 中间件位于 `app/middleware/` 目录

### 前端开发
- 页面组件位于 `src/views/` 目录
- 公共组件位于 `src/components/` 目录
- 状态管理位于 `src/stores/` 目录

## License

MIT
