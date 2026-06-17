const axios = require('axios');

const BASE_URL = 'http://localhost:7002/api/v1';

let token = '';

async function testLogin() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: '123456'
    });
    token = response.data.data.token;
    console.log('登录成功:', token ? 'token获取成功' : '无token');
    return true;
  } catch (error) {
    console.error('登录失败:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testAPI(name, url, method = 'get', data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    const result = response.data;
    
    if (result.code === 200) {
      const dataType = Array.isArray(result.data) ? `Array(${result.data.length})` : typeof result.data;
      console.log(`✅ ${name}: ${dataType}`);
      if (Array.isArray(result.data) && result.data.length > 0) {
        console.log('  示例数据:', JSON.stringify(result.data[0], null, 2).substring(0, 200));
      }
      return result.data;
    } else {
      console.log(`❌ ${name}: ${result.message}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ ${name}: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

async function runTests() {
  console.log('=== 开始测试后端API ===\n');
  
  const loginSuccess = await testLogin();
  if (!loginSuccess) {
    console.log('登录失败，无法继续测试');
    return;
  }
  
  console.log('\n--- 用户相关接口 ---');
  await testAPI('获取用户列表', '/users');
  await testAPI('获取当前用户信息', '/auth/me');
  
  console.log('\n--- 设备管理接口 ---');
  await testAPI('获取设备列表', '/equipment');
  await testAPI('获取设备分类', '/equipment/categories');
  await testAPI('获取借用记录', '/equipment/borrow');
  
  console.log('\n--- 耗材管理接口 ---');
  await testAPI('获取耗材列表', '/consumable');
  await testAPI('获取耗材分类', '/consumable/categories');
  await testAPI('获取耗材供应商', '/consumable/suppliers');
  await testAPI('获取入库列表', '/consumable/stock-in');
  await testAPI('获取出库列表', '/consumable/stock-out');
  
  console.log('\n--- 场地管理接口 ---');
  await testAPI('获取校区列表', '/campuses');
  await testAPI('获取楼宇列表', '/buildings');
  await testAPI('获取房间列表', '/rooms');
  
  console.log('\n--- 教学管理接口 ---');
  await testAPI('获取课程列表', '/courses');
  await testAPI('获取班级列表', '/classes');
  await testAPI('获取学期列表', '/semesters');
  await testAPI('获取专业列表', '/majors');
  
  console.log('\n--- 排课管理接口 ---');
  await testAPI('获取预约列表', '/reservation');
  await testAPI('获取教学任务', '/teaching-tasks');
  
  console.log('\n--- 系统管理接口 ---');
  await testAPI('获取菜单列表', '/menus');
  await testAPI('获取角色列表', '/roles');
  await testAPI('获取部门列表', '/departments');
  await testAPI('获取组织列表', '/organizations');
  
  console.log('\n=== 测试完成 ===');
}

runTests().catch(console.error);