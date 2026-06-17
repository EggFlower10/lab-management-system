const db = require('better-sqlite3')('database/lab_management.db');

// 各模块配置项
const configItems = [
  // 系统设置
  { configKey: 'system_name', name: '系统名称', configValue: '高校实验室信息管理系统', group: 'system', description: '系统的中文显示名称', sortOrder: 1 },
  { configKey: 'system_english_name', name: '系统英文名称', configValue: 'Lab Management System', group: 'system', description: '系统的英文显示名称', sortOrder: 2 },
  { configKey: 'version', name: '系统版本', configValue: '1.0.0', group: 'system', description: '当前系统版本号', sortOrder: 3 },
  { configKey: 'copyright', name: '版权信息', configValue: 'Copyright © 2024 Lab Management System. All rights reserved.', group: 'system', description: '页脚显示的版权信息', sortOrder: 4 },
  { configKey: 'icp', name: '备案号', configValue: '', group: 'system', description: '网站备案号', sortOrder: 5 },
  { configKey: 'logo_url', name: '系统Logo地址', configValue: '/logo.png', group: 'system', description: '系统Logo图片地址', sortOrder: 6 },
  
  // 安全设置
  { configKey: 'password_min_length', name: '密码最小长度', configValue: '6', group: 'security', description: '用户密码的最小字符数', sortOrder: 1 },
  { configKey: 'password_complexity', name: '密码复杂度要求', configValue: 'medium', group: 'security', description: '密码复杂度（low:仅长度, medium:字母+数字, high:字母+数字+特殊字符）', sortOrder: 2 },
  { configKey: 'login_max_retry', name: '登录最大重试次数', configValue: '5', group: 'security', description: '连续登录失败的最大次数', sortOrder: 3 },
  { configKey: 'login_lock_duration', name: '账户锁定时长(分钟)', configValue: '30', group: 'security', description: '登录失败超过限制后账户锁定时长', sortOrder: 4 },
  { configKey: 'session_timeout', name: '会话超时时间(分钟)', configValue: '120', group: 'security', description: '用户无操作后自动退出的时间', sortOrder: 5 },
  { configKey: 'enable_captcha', name: '启用验证码', configValue: '1', group: 'security', description: '登录时是否需要输入验证码（0:否 1:是）', sortOrder: 6 },
  
  // 设备管理
  { configKey: 'equipment_approval_mode', name: '设备借用审批模式', configValue: 'tutor', group: 'equipment', description: '设备借用审批流程（none:无需审批, tutor:导师审批, admin:管理员审批, both:两级审批）', sortOrder: 1 },
  { configKey: 'equipment_max_borrow_duration', name: '设备最大借用时长(天)', configValue: '30', group: 'equipment', description: '单次借用设备的最大时长', sortOrder: 2 },
  { configKey: 'equipment_max_renew_times', name: '设备续借最大次数', configValue: '2', group: 'equipment', description: '单次借用允许续借的最大次数', sortOrder: 3 },
  { configKey: 'equipment_renew_duration', name: '设备续借时长(天)', configValue: '15', group: 'equipment', description: '每次续借可延长的时长', sortOrder: 4 },
  { configKey: 'equipment_overdue_reminder', name: '设备逾期提醒天数', configValue: '3', group: 'equipment', description: '到期前N天提醒归还', sortOrder: 5 },
  { configKey: 'equipment_maintenance_cycle', name: '设备维护周期(月)', configValue: '6', group: 'equipment', description: '设备例行维护的周期', sortOrder: 6 },
  
  // 耗材管理
  { configKey: 'consumable_approval_mode', name: '耗材领用审批模式', configValue: 'single', group: 'consumable', description: '耗材领用审批流程（none:无需审批, single:一级审批, multi:多级审批）', sortOrder: 1 },
  { configKey: 'consumable_max_out_quantity', name: '单次最大领用数量', configValue: '100', group: 'consumable', description: '单次领用耗材的最大数量', sortOrder: 2 },
  { configKey: 'consumable_monthly_out_limit', name: '月度领用额度', configValue: '500', group: 'consumable', description: '每人每月可领用的最大数量', sortOrder: 3 },
  { configKey: 'consumable_warning_threshold', name: '库存预警阈值(%)', configValue: '20', group: 'consumable', description: '库存低于该百分比时触发预警', sortOrder: 4 },
  { configKey: 'consumable_warning_notification', name: '低库存通知开关', configValue: '1', group: 'consumable', description: '是否开启低库存自动通知（0:关闭 1:开启）', sortOrder: 5 },
  { configKey: 'consumable_expiry_reminder_days', name: '耗材过期提醒天数', configValue: '30', group: 'consumable', description: '耗材过期前N天提醒', sortOrder: 6 },
  
  // 排课管理
  { configKey: 'reservation_max_duration', name: '单次预约最大时长(小时)', configValue: '4', group: 'reservation', description: '单次场地预约的最大时长', sortOrder: 1 },
  { configKey: 'reservation_advance_days', name: '预约提前天数(天)', configValue: '7', group: 'reservation', description: '可提前预约的最大天数', sortOrder: 2 },
  { configKey: 'reservation_cancel_deadline', name: '取消预约截止时间(小时)', configValue: '2', group: 'reservation', description: '距开始时间多久前可免费取消', sortOrder: 3 },
  { configKey: 'reservation_conflict_check', name: '冲突检测开关', configValue: '1', group: 'reservation', description: '是否开启预约冲突自动检测（0:关闭 1:开启）', sortOrder: 4 },
  { configKey: 'teaching_task_auto_generate', name: '教学任务自动生成', configValue: '1', group: 'reservation', description: '是否根据课程自动生成排课任务（0:关闭 1:开启）', sortOrder: 5 },
  
  // 教学管理
  { configKey: 'course_min_credit', name: '课程最低学分', configValue: '1', group: 'teaching', description: '课程的最低学分数', sortOrder: 1 },
  { configKey: 'course_max_credit', name: '课程最高学分', configValue: '8', group: 'teaching', description: '课程的最高学分数', sortOrder: 2 },
  { configKey: 'class_size_limit', name: '班级人数上限', configValue: '60', group: 'teaching', description: '教学班级的最大学生人数', sortOrder: 3 },
  { configKey: 'lab_min_class_size', name: '实验课最小开课人数', configValue: '10', group: 'teaching', description: '实验课开课的最小学生人数', sortOrder: 4 },
  { configKey: 'attendance_auto_reminder', name: '考勤自动提醒', configValue: '1', group: 'teaching', description: '是否开启考勤自动提醒（0:关闭 1:开启）', sortOrder: 5 },
  
  // 场地管理
  { configKey: 'room_booking_lead_time', name: '场地预订提前时间(小时)', configValue: '24', group: 'venue', description: '场地预订需提前的时间', sortOrder: 1 },
  { configKey: 'room_weekend_booking', name: '场地周末可预订', configValue: '1', group: 'venue', description: '周末是否允许预订场地（0:否 1:是）', sortOrder: 2 },
  { configKey: 'room_night_booking', name: '场地夜间可预订', configValue: '0', group: 'venue', description: '夜间(20:00-次日8:00)是否允许预订（0:否 1:是）', sortOrder: 3 },
  { configKey: 'room_check_before_booking', name: '预订前检查维修状态', configValue: '1', group: 'venue', description: '预订前是否检查房间维修状态（0:否 1:是）', sortOrder: 4 },
  
  // 通知设置
  { configKey: 'notification_email_enabled', name: '邮件通知开关', configValue: '1', group: 'notification', description: '是否启用邮件通知（0:关闭 1:开启）', sortOrder: 1 },
  { configKey: 'notification_sms_enabled', name: '短信通知开关', configValue: '0', group: 'notification', description: '是否启用短信通知（0:关闭 1:开启）', sortOrder: 2 },
  { configKey: 'notification_system_enabled', name: '站内信通知开关', configValue: '1', group: 'notification', description: '是否启用站内信通知（0:关闭 1:开启）', sortOrder: 3 },
  { configKey: 'notification_approval_reminder', name: '审批超时提醒(小时)', configValue: '24', group: 'notification', description: '审批超过N小时未处理时提醒', sortOrder: 4 }
];

// 插入配置项
const stmt = db.prepare(`INSERT OR IGNORE INTO sys_config (configKey, name, configValue, \`group\`, description, sortOrder, status) VALUES (?, ?, ?, ?, ?, ?, 1)`);

let inserted = 0;
let skipped = 0;

for (const item of configItems) {
  const result = stmt.run(item.configKey, item.name, item.configValue, item.group, item.description, item.sortOrder);
  if (result.changes > 0) {
    inserted++;
    console.log('+ 新增:', item.configKey);
  } else {
    skipped++;
    console.log('- 已存在:', item.configKey);
  }
}

console.log(`\n=== 完成 ===`);
console.log(`新增: ${inserted} 条`);
console.log(`跳过: ${skipped} 条`);

const total = db.prepare('SELECT COUNT(*) as cnt FROM sys_config').get();
console.log(`配置项总数: ${total.cnt} 条`);

db.close();
