import { Controller } from 'egg';

export default abstract class BaseController extends Controller {
  protected get page(): number {
    return parseInt(this.ctx.query.page as string) || 1;
  }

  protected get pageSize(): number {
    return parseInt(this.ctx.query.pageSize as string) || 10;
  }

  protected get offset(): number {
    return (this.page - 1) * this.pageSize;
  }

  protected get userId(): number {
    return this.ctx.state.user?.id;
  }

  protected get username(): string {
    return this.ctx.state.user?.username;
  }

  protected success(data?: any, message?: string) {
    this.ctx.helper.success(this.ctx, data, message);
  }

  protected error(message?: string, code?: number) {
    this.ctx.helper.error(this.ctx, message, code);
  }

  protected pageResult(list: any[], total: number) {
    this.ctx.helper.page(this.ctx, list, total, this.page, this.pageSize);
  }

  protected notFound(message?: string) {
    this.ctx.helper.notFound(this.ctx, message);
  }

  protected async log(operation: string, status: number = 1) {
    await this.ctx.service.log.create({
      userId: this.userId,
      username: this.username,
      operation,
      method: this.ctx.method,
      path: this.ctx.path,
      ip: this.ctx.ip,
      status,
    });
  }
}
