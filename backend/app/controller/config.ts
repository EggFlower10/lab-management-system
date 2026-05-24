import BaseController from './base';

export default class ConfigController extends BaseController {
  public async index() {
    const { ctx, app } = this;
    const { key, groupName, status } = ctx.query;

    const where: any = {};
    if (key) where.config_key = key;
    if (groupName) where.group_name = groupName;
    if (status) where.status = parseInt(status as string);

    const total = await app.mysql.count('sys_config', where);
    const list = await app.mysql.select('sys_config', {
      where,
      orders: [['created_at', 'DESC']],
      limit: this.pageSize,
      offset: this.offset,
    });

    this.pageResult(list, total);
  }

  public async show() {
    const { ctx, app } = this;
    const id = ctx.params.id;

    const config = await app.mysql.get('sys_config', { id });
    if (!config) {
      this.notFound('配置不存在');
      return;
    }

    this.success(config);
  }

  public async create() {
    const { ctx, app } = this;
    const { configKey, configValue, groupName, description, status } = ctx.request.body;

    const existConfig = await app.mysql.get('sys_config', { config_key: configKey });
    if (existConfig) {
      this.error('配置键已存在', 400);
      return;
    }

    const result = await app.mysql.insert('sys_config', {
      config_key: configKey,
      config_value: configValue,
      group_name: groupName,
      description,
      status: status ?? 1,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await this.log(`创建配置: ${configKey}`);
    this.success({ id: result.insertId }, '创建成功');
  }

  public async update() {
    const { ctx, app } = this;
    const id = ctx.params.id;
    const { configKey, configValue, groupName, description, status } = ctx.request.body;

    const config = await app.mysql.get('sys_config', { id });
    if (!config) {
      this.notFound('配置不存在');
      return;
    }

    await app.mysql.update('sys_config', {
      id,
      config_key: configKey,
      config_value: configValue,
      group_name: groupName,
      description,
      status,
      updated_at: new Date(),
    });

    await this.log(`更新配置: ${configKey || config.config_key}`);
    this.success(null, '更新成功');
  }

  public async destroy() {
    const { ctx, app } = this;
    const id = ctx.params.id;

    const config = await app.mysql.get('sys_config', { id });
    if (!config) {
      this.notFound('配置不存在');
      return;
    }

    await app.mysql.delete('sys_config', { id });

    await this.log(`删除配置: ${config.config_key}`);
    this.success(null, '删除成功');
  }

  public async getByKey() {
    const { ctx, app } = this;
    const key = ctx.params.key;

    const config = await app.mysql.get('sys_config', { config_key: key, status: 1 });
    if (!config) {
      this.notFound('配置不存在');
      return;
    }

    this.success(config.config_value);
  }

  public async getByGroup() {
    const { ctx, app } = this;
    const group = ctx.params.group;

    const list = await app.mysql.select('sys_config', {
      where: { group_name: group, status: 1 },
    });

    const result: any = {};
    list.forEach(item => {
      result[item.config_key] = item.config_value;
    });

    this.success(result);
  }
}
