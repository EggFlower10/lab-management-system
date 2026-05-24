import { Service } from 'egg';

export default class LogService extends Service {
  public async create(data: {
    userId: number;
    username: string;
    operation: string;
    method: string;
    path: string;
    ip: string;
    status: number;
    params?: any;
    result?: any;
  }) {
    const { app } = this;
    await app.mysql.insert('sys_operation_log', {
      user_id: data.userId,
      username: data.username,
      operation: data.operation,
      method: data.method,
      path: data.path,
      ip: data.ip,
      status: data.status,
      params: data.params ? JSON.stringify(data.params) : null,
      result: data.result ? JSON.stringify(data.result) : null,
      created_at: new Date(),
    });
  }
}
