const mysql = require('mysql2/promise');

async function addMenu() {
  const pool = await mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'lab_management'
  });

  try {
    const [rows] = await pool.query('SELECT id FROM sys_menu WHERE path = ?', ['/teaching/experiment-task']);
    if (rows.length === 0) {
      await pool.query(
        'INSERT INTO sys_menu (name, path, component, icon, parent_id, sort, type, visible, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ['实验教学任务', '/teaching/experiment-task', 'teaching/experiment-task/index', 'FlaskConical', 10, 7, 'menu', 1, 1]
      );
      console.log('菜单添加成功');
    } else {
      console.log('菜单已存在');
    }

    const [menuRows] = await pool.query('SELECT id FROM sys_menu WHERE path = ?', ['/teaching/experiment-task']);
    if (menuRows.length > 0) {
      const menuId = menuRows[0].id;
      const [roleMenuRows] = await pool.query('SELECT id FROM sys_role_menu WHERE role_id = ? AND menu_id = ?', [1, menuId]);
      if (roleMenuRows.length === 0) {
        await pool.query('INSERT INTO sys_role_menu (role_id, menu_id) VALUES (?, ?)', [1, menuId]);
        console.log('角色菜单关联添加成功');
      } else {
        console.log('角色菜单关联已存在');
      }
    }
  } catch (error) {
    console.error('添加菜单失败:', error);
  } finally {
    process.exit(0);
  }
}

addMenu();