import { Service } from 'egg';

export default class PermissionService extends Service {
  public async getUserPermissions(userId: number) {
    const { app } = this;
    
    const user = await app.mysql.get('sys_user', { id: userId });
    if (user && user.username === 'admin') {
      return await app.mysql.select('sys_permission', { where: { status: 1 } });
    }

    const permissions = await app.mysql.query(
      `SELECT DISTINCT p.* FROM sys_permission p 
       INNER JOIN sys_role_permission rp ON p.id = rp.permission_id 
       INNER JOIN sys_user_role ur ON rp.role_id = ur.role_id 
       WHERE ur.user_id = ? AND p.status = 1`,
      [userId]
    );

    return permissions;
  }

  public async getRolePermissions(roleId: number) {
    const { app } = this;
    const permissions = await app.mysql.query(
      `SELECT p.* FROM sys_permission p 
       INNER JOIN sys_role_permission rp ON p.id = rp.permission_id 
       WHERE rp.role_id = ?`,
      [roleId]
    );
    return permissions;
  }
}
