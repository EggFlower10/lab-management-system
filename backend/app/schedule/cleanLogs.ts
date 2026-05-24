import { Application } from 'egg';

export default {
  schedule: {
    interval: '1h',
    type: 'all',
    immediate: false,
  },
  async task(ctx: Application) {
    try {
      await ctx.app.mysql.query('DELETE FROM sys_operation_log WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)');
    } catch (error) {
      ctx.logger.error('清理操作日志失败:', error);
    }
  },
};
