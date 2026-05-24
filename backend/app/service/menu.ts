import { Service } from 'egg';

export default class MenuService extends Service {
  public async getUserMenus(userId: number) {
    const { app } = this;
    
    const user = await app.mysql.get('sys_user', { id: userId });
    if (user && user.username === 'admin') {
      return await app.mysql.select('sys_menu', {
        where: { status: 1 },
        orders: [['sort', 'ASC']],
      });
    }

    const menus = await app.mysql.query(
      `SELECT DISTINCT m.* FROM sys_menu m 
       INNER JOIN sys_role_menu rm ON m.id = rm.menu_id 
       INNER JOIN sys_user_role ur ON rm.role_id = ur.role_id 
       WHERE ur.user_id = ? AND m.status = 1 
       ORDER BY m.sort ASC`,
      [userId]
    );

    return menus;
  }

  public async getRoleMenus(roleId: number) {
    const { app } = this;
    const menus = await app.mysql.query(
      `SELECT m.* FROM sys_menu m 
       INNER JOIN sys_role_menu rm ON m.id = rm.menu_id 
       WHERE rm.role_id = ?`,
      [roleId]
    );
    return menus;
  }
}
