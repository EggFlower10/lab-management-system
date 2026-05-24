import { Service } from 'egg';

export default class UserService extends Service {
  public async assignRoles(userId: number, roleIds: number[]) {
    const { app } = this;
    await app.mysql.delete('sys_user_role', { user_id: userId });

    if (roleIds && roleIds.length > 0) {
      const records = roleIds.map(roleId => ({
        user_id: userId,
        role_id: roleId,
        created_at: new Date(),
      }));
      await app.mysql.insert('sys_user_role', records);
    }
  }

  public async getRoles(userId: number) {
    const { app } = this;
    const roles = await app.mysql.query(
      `SELECT r.* FROM sys_role r 
       INNER JOIN sys_user_role ur ON r.id = ur.role_id 
       WHERE ur.user_id = ? AND r.status = 1`,
      [userId]
    );
    return roles;
  }
}
