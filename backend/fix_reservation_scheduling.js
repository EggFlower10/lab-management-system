const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

async function fixData() {
  const SQL = await initSqlJs({
    locateFile: file => `node_modules/sql.js/dist/${file}`
  });

  const dbPath = path.join(__dirname, 'database', 'lab_management.db');
  
  console.log('数据库路径:', dbPath);
  console.log('文件存在:', fs.existsSync(dbPath));
  if (fs.existsSync(dbPath)) {
    console.log('文件大小:', fs.statSync(dbPath).size, 'bytes');
  }

  const data = fs.readFileSync(dbPath);
  const db = new SQL.Database(data);

  console.log('');
  console.log('=== 检查已通过审批但缺少排课记录的预约 ===');
  
  const results = db.exec(`
    SELECT r.id, r.reservation_code, r.project_name, r.week_no, r.week_day, 
           r.time_slot, r.room_id, r.room_name, r.room_number,
           r.building_id, r.building_name, r.member_class, r.project_leader, r.member_count
    FROM lab_reservation r
    LEFT JOIN lab_scheduling s ON r.id = s.source_id AND s.source_type = 'Reservation'
    WHERE r.approval_status = 'approved' AND s.id IS NULL
  `);

  if (results.length > 0) {
    console.log('发现', results[0].values.length, '条需要修复的记录:');
    
    results[0].values.forEach(row => {
      const [id, reservation_code, project_name, week_no, week_day, time_slot, 
            room_id, room_name, room_number, building_id, building_name, 
            member_class, project_leader, member_count] = row;
      
      console.log('');
      console.log(`预约ID: ${id}, 编号: ${reservation_code}`);
      console.log(`项目名称: ${project_name}`);
      console.log(`周次: ${week_no}, 星期: ${week_day}, 节次: ${time_slot}`);
      
      const schedulingCode = 'RV-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
      
      console.log(`创建排课记录: ${schedulingCode}`);
      
      const insertSql = `
        INSERT INTO lab_scheduling 
        (scheduling_code, semester_id, course_name, class_name, teacher_name, 
         building_id, building_name, room_id, room_name, room_number, 
         week_no, week_day, time_slot_start, time_slot_end, student_count, 
         source_type, source_id, status) 
        VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Reservation', ?, 1)
      `;
      
      try {
        db.run(insertSql, [
          schedulingCode,
          project_name,
          member_class || '-',
          project_leader,
          building_id,
          building_name,
          room_id,
          room_name,
          room_number,
          week_no,
          week_day,
          time_slot,
          time_slot,
          member_count || 0,
          id
        ]);
        console.log('插入成功');
      } catch (err) {
        console.error('插入失败:', err);
      }
    });

    // 先验证内存中的数据
    console.log('');
    console.log('=== 验证内存中的数据 ===');
    const memResults = db.exec(`
      SELECT scheduling_code, week_no, week_day, time_slot_start, source_type, source_id
      FROM lab_scheduling 
      WHERE source_type = 'Reservation'
    `);
    if (memResults.length > 0) {
      console.log('内存中的预约排课记录:');
      memResults[0].values.forEach(r => {
        console.log(`${r[0]} | 周${r[1]} 周${r[2]} ${r[3]} | source_id: ${r[5]}`);
      });
    }

    const updatedData = db.export();
    console.log('');
    console.log('导出数据大小:', updatedData.byteLength, 'bytes');
    
    // 关闭数据库再写入
    db.close();
    
    // 写入文件
    fs.writeFileSync(dbPath, updatedData);
    
    // 验证写入
    const newData = fs.readFileSync(dbPath);
    console.log('写入后文件大小:', newData.byteLength, 'bytes');
    
    console.log('数据库已更新！');

  } else {
    console.log('没有发现需要修复的记录');
    db.close();
  }
}

fixData().catch(err => {
  console.error('修复失败:', err);
});
