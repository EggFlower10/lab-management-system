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
  
  if (!fs.existsSync(dbPath)) {
    console.error('数据库文件不存在！');
    return;
  }

  const data = fs.readFileSync(dbPath);
  console.log('原始文件大小:', data.length, 'bytes');

  const db = new SQL.Database(new Uint8Array(data));

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
        const stmt = db.prepare(insertSql);
        stmt.bind([
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
        stmt.step();
        stmt.free();
        
        console.log('插入成功');
        console.log('受影响行数:', db.getRowsModified());
      } catch (err) {
        console.error('插入失败:', err);
      }
    });

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
    
    db.close();
    
    const buffer = Buffer.from(updatedData);
    console.log('Buffer大小:', buffer.length, 'bytes');
    
    fs.writeFileSync(dbPath, buffer);
    
    const newData = fs.readFileSync(dbPath);
    console.log('写入后文件大小:', newData.length, 'bytes');
    
    console.log('');
    console.log('数据库已更新！');

  } else {
    console.log('没有发现需要修复的记录');
    db.close();
  }

  console.log('');
  console.log('=== 最终验证 ===');
  const verifyDb = new SQL.Database(new Uint8Array(fs.readFileSync(dbPath)));
  const finalResults = verifyDb.exec(`
    SELECT r.reservation_code, s.scheduling_code, s.week_no, s.week_day, s.time_slot_start
    FROM lab_reservation r
    LEFT JOIN lab_scheduling s ON r.id = s.source_id AND s.source_type = 'Reservation'
    WHERE r.approval_status = 'approved'
  `);
  
  if (finalResults.length > 0) {
    console.log('已通过审批的预约及其排课:');
    finalResults[0].values.forEach(r => {
      const [reservation_code, scheduling_code, week_no, week_day, time_slot] = r;
      console.log(`${reservation_code} -> ${scheduling_code} (周${week_no}, 周${week_day}, ${time_slot})`);
    });
  }
  
  verifyDb.close();
}

fixData().catch(err => {
  console.error('修复失败:', err);
});
