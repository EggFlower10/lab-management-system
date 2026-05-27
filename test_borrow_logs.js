const http = require('http');
const fs = require('fs');

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

function getBorrowLogs(token, callback) {
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
    console.log('状态码:', res.statusCode);
    console.log('响应头:', res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('响应数据:', data);
      
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
  console.log('登录成功，获取到token:', token);
  
  getBorrowLogs(token, (err, result) => {
    if (err) {
      console.error('获取借还流水失败:', err.message);
    } else {
      console.log('获取借还流水成功:');
      console.log('总数:', result.data?.total);
      console.log('数据:', JSON.stringify(result.data?.data, null, 2));
    }
  });
});