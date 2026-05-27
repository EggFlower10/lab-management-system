const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'database', 'lab_management.db');
const backupPath = path.join(__dirname, 'database', 'scheduling_backup.json');

console.log('=== 备份当前排课数据...');

const db = new Database(dbPath);

try {
  // 备份 lab_scheduling 表
  const schedulingData = db.prepare('SELECT * FROM lab_scheduling').all();
  // 备份 lab_reservation 表
  const reservationData = db.prepare('SELECT * FROM lab_reservation').all();

  const backup = {
    timestamp: new Date().toISOString(),
    lab_scheduling: schedulingData,
    lab_reservation: reservationData
  };

  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
  console.log(`备份完成: lab_scheduling (${schedulingData.length}), lab_reservation (${reservationData.length})');
  console.log('备份文件:', backupPath);

} catch (e) {
  console.warn('备份失败:', e.message);
}

db.close();
