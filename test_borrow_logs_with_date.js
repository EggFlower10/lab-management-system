const http = require('http');

function login(callback) {
  const postData = JSON.stringify({
    username: 'admin',
    password: '123456'
  });

  const options = {
    hostname: 'localhost',
    port: 7002,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        if (result.data && result.data.token) {
          callback(null, result.data.token);
        } else {
          callback(new Error('登录失败: ' + result.message));
        }
      } catch (e) {
        callback(new Error('解析登录响应失败'));
      }
    });
  });

  req.on('error', callback);
  req.write(postData);
  req.end();
}

function testWithDate(token, callback) {
  const options = {
    hostname: 'localhost',
    port: 7002,
    path: '/api/v1/equipment/borrow/logs?page=1&pageSize=20&start_date=2024-01-01&end_date=2026-12-31',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + token
    }
  };

  const req = http.request(options, (res) => {
    console.log('--- 带日期参数测试 - 状态码:', res.statusCode);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('--- 带日期参数测试 - 响应数据:', data);
      
      if (res.statusCode === 200) {
        try {
          const result = JSON.parse(data);
          callback(null, result);
        } catch (e) {
          callback(new Error('解析响应失败'));
        }
      } else {
        callback(new Error(`请求失败: ${res.statusCode} - ${data}`));
      }
    });
  });

  req.on('error', callback);
  req.end();
}

function testWithoutDate(token, callback) {
  const options = {
    hostname: 'localhost',
    port: 7002,
    path: '/api/v1/equipment/borrow/logs?page=1&pageSize=20',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + token
    }
  };

  const req = http.request(options, (res) => {
    console.log('\n--- 无日期参数测试 - 状态码:', res.statusCode);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('--- 无日期参数测试 - 响应数据:', data);
      
      if (res.statusCode === 200) {
        try {
          const result = JSON.parse(data);
          callback(null, result);
        } catch (e) {
          callback(new Error('解析响应失败'));
        }
      } else {
        callback(new Error(`请求失败: ${res.statusCode} - ${data}`));
      }
    });
  });

  req.on('error', callback);
  req.end();
}

// 执行测试
login((err, token) => {
  if (err) {
    console.error('登录失败:', err.message);
    return;
  }
  console.log('登录成功，获取到token');
  
  testWithoutDate(token, (err, result) => {
    if (err) {
      console.error('无日期参数测试失败:', err.message);
    } else {
      console.log('无日期参数测试成功！总数:', result.data?.total);
    }
  });
});