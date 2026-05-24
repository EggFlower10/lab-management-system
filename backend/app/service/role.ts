import { Service } from 'egg';

export default class RoleService extends Service {
  public async getUserRoles(userId: number) {
    const { app } = this;
    const roles = await app.mysql.query(
      `SELECT r.id, r.name, r.code FROM sys_role r 
       INNER JOIN sys_user_role ur ON r.id = ur.role_id 
       WHERE ur.user_id = ? AND r.status = 1`,
      [userId]
    );
    return roles;
  }

  public async assignMenus(roleId: number, menuIds: number[]) {
    const { app } = this;
    await app.mysql.delete('sys_role_menu', { role_id: roleId });

    if (menuIds && menuIds.length > 0) {
      const records = menuIds.map(menuId => ({
        role_id: roleId,
        menu_id: menuId,
        created_at: new Date(),
      }));
      await app.mysql.insert('sys_role_menu', records);
    }
  }

  public async assignPermissions(roleId: number, permissionIds: number[]) {
    const { app } = this;
    await app.mysql.delete('sys_role_permission', { role_id: roleId });

    if (permissionIds && permissionIds.length > 0) {
      const records = permissionIds.map(permissionId => ({
        role_id: roleId,
        permission_id: permissionId,
        created_at: new Date(),
      }));
      await app.mysql.insert('sys_role_permission', records);
    }
  }
}
