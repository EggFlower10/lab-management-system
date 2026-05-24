import BaseController from './base';

export default class LogController extends BaseController {
  public async index() {
    const { ctx, app } = this;
    const { username, operation, method, status, startTime, endTime } = ctx.query;

    const where: any = {};
    if (username) where.username = username;
    if (operation) where.operation = operation;
    if (method) where.method = method;
    if (status) where.status = parseInt(status as string);

    let sql = 'SELECT * FROM sys_operation_log WHERE 1=1';
    const params: any[] = [];

    if (startTime) {
      sql += ' AND created_at >= ?';
      params.push(startTime);
    }
    if (endTime) {
      sql += ' AND created_at <= ?';
      params.push(endTime);
    }

    Object.keys(where).forEach(key => {
      sql += ` AND ${key} = ?`;
      params.push(where[key]);
    });

    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
    const countResult = await app.mysql.query(countSql, params);
    const total = countResult[0].total;

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(this.pageSize, this.offset);

    const list = await app.mysql.query(sql, params);

    this.pageResult(list, total);
  }

  public async show() {
    const { ctx, app } = this;
    const id = ctx.params.id;

    const log = await app.mysql.get('sys_operation_log', { id });
    if (!log) {
      this.notFound('日志不存在');
      return;
    }

    this.success(log);
  }

  public async destroy() {
    const { ctx, app } = this;
    const id = ctx.params.id;

    const log = await app.mysql.get('sys_operation_log', { id });
    if (!log) {
      this.notFound('日志不存在');
      return;
    }

    await app.mysql.delete('sys_operation_log', { id });

    this.success(null, '删除成功');
  }

  public async clear() {
    const { ctx, app } = this;
    const { days } = ctx.request.body;

    const daysAgo = days || 30;
    await app.mysql.query(
      'DELETE FROM sys_operation_log WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
      [daysAgo]
    );

    await this.log(`清理${daysAgo}天前的操作日志`);
    this.success(null, '清理成功');
  }
}
