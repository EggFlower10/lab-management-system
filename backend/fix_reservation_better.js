const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

function fixData() {
  const dbPath = path.join(__dirname, 'database', 'lab_management.db');
  
  console.log('数据库路径:', dbPath);
  console.log('文件存在:', fs.existsSync(dbPath));
  
  if (fs.existsSync(dbPath)) {
    console.log('原始文件大小:', fs.statSync(dbPath).size, 'bytes');
  }

  const db = new Database(dbPath);

  console.log('');
  console.log('=== 检查已通过审批但缺少排课记录的预约 ===');
  
  const results = db.prepare(`
    SELECT r.id, r.reservation_code, r.project_name, r.week_no, r.week_day, 
           r.time_slot, r.room_id, r.room_name, r.room_number,
           r.building_id, r.building_name, r.member_class, r.project_leader, r.member_count
    FROM lab_reservation r
    LEFT JOIN lab_scheduling s ON r.id = s.source_id AND s.source_type = 'Reservation'
    WHERE r.approval_status = 'approved' AND s.id IS NULL
  `).all();

  if (results.length > 0) {
    console.log('发现', results.length, '条需要修复的记录:');
    
    results.forEach(row => {
      const { id, reservation_code, project_name, week_no, week_day, time_slot, 
             room_id, room_name, room_number, building_id, building_name, 
             member_class, project_leader, member_count } = row;
      
      console.log('');
      console.log(`预约ID: ${id}, 编号: ${reservation_code}`);
      console.log(`项目名称: ${project_name}`);
      console.log(`周次: ${week_no}, 星期: ${week_day}, 节次: ${time_slot}`);
      
      const schedulingCode = 'RV-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
      
      console.log(`创建排课记录: ${schedulingCode}`);
      
      const insertStmt = db.prepare(`
        INSERT INTO lab_scheduling 
        (scheduling_code, semester_id, course_name, class_name, teacher_name, 
         building_id, building_name, room_id, room_name, room_number, 
         week_no, week_day, time_slot_start, time_slot_end, student_count, 
         source_type, source_id, status) 
        VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Reservation', ?, 1)
      `);
      
      try {
        const result = insertStmt.run(
          schedulingCode,
          project_name,
          member_class || '-',
          project_leader,
          building_id || null,
          building_name || '',
          room_id || null,
          room_name || '',
          room_number || '',
          week_no,
          week_day,
          time_slot,
          time_slot,
          member_count || 0,
          id
        );
        console.log('插入成功, ID:', result.lastInsertRowid);
      } catch (err) {
        console.error('插入失败:', err);
      }
    });

    console.log('');
    console.log('=== 验证插入结果 ===');
    const memResults = db.prepare(`
      SELECT scheduling_code, week_no, week_day, time_slot_start, source_type, source_id
      FROM lab_scheduling 
      WHERE source_type = 'Reservation'
    `).all();
    
    if (memResults.length > 0) {
      console.log('预约排课记录:');
      memResults.forEach(r => {
        console.log(`${r.scheduling_code} | 周${r.week_no} 周${r.week_day} ${r.time_slot_start} | source_id: ${r.source_id}`);
      });
    }

    // 统计记录数
    const count = db.prepare("SELECT COUNT(*) FROM lab_scheduling").get();
    console.log('');
    console.log('排课记录数:', count['COUNT(*)']);
    
    // 关闭数据库
    db.close();
    
    // 验证文件大小
    console.log('写入后文件大小:', fs.statSync(dbPath).size, 'bytes');
    
    console.log('');
    console.log('=== 最终验证 ===');
    const verifyDb = new Database(dbPath);
    const finalResults = verifyDb.prepare(`
      SELECT r.reservation_code, s.scheduling_code, s.week_no, s.week_day, s.time_slot_start
      FROM lab_reservation r
      LEFT JOIN lab_scheduling s ON r.id = s.source_id AND s.source_type = 'Reservation'
      WHERE r.approval_status = 'approved'
    `).all();
    
    if (finalResults.length > 0) {
      console.log('已通过审批的预约及其排课:');
      finalResults.forEach(r => {
        console.log(`${r.reservation_code} -> ${r.scheduling_code} (周${r.week_no}, 周${r.week_day}, ${r.time_slot_start})`);
      });
    }
    
    verifyDb.close();
    
    console.log('');
    console.log('数据库已更新！');

  } else {
    console.log('没有发现需要修复的记录');
    db.close();
  }
}

fixData();
