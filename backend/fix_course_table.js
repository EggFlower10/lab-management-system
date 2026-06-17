const db = require('better-sqlite3')('database/lab_management.db');

console.log('=== 修改前的表结构 ===');
const colsBefore = db.prepare("PRAGMA table_info(Edu_Course)").all();
colsBefore.forEach(c => console.log(' -', c.name));

try {
  db.prepare("ALTER TABLE Edu_Course ADD COLUMN CourseNameEn VARCHAR(100)").run();
  console.log('+ 添加 CourseNameEn');
} catch (e) {
  console.log('~ CourseNameEn 已存在');
}

try {
  db.prepare("ALTER TABLE Edu_Course ADD COLUMN CourseNature VARCHAR(50)").run();
  console.log('+ 添加 CourseNature');
} catch (e) {
  console.log('~ CourseNature 已存在');
}

try {
  db.prepare("ALTER TABLE Edu_Course ADD COLUMN Credits REAL").run();
  console.log('+ 添加 Credits');
} catch (e) {
  console.log('~ Credits 已存在');
}

try {
  db.prepare("ALTER TABLE Edu_Course ADD COLUMN TotalHours INTEGER").run();
  console.log('+ 添加 TotalHours');
} catch (e) {
  console.log('~ TotalHours 已存在');
}

try {
  db.prepare("ALTER TABLE Edu_Course ADD COLUMN LectureHours INTEGER").run();
  console.log('+ 添加 LectureHours');
} catch (e) {
  console.log('~ LectureHours 已存在');
}

try {
  db.prepare("ALTER TABLE Edu_Course ADD COLUMN PracticeHours INTEGER").run();
  console.log('+ 添加 PracticeHours');
} catch (e) {
  console.log('~ PracticeHours 已存在');
}

try {
  db.prepare("ALTER TABLE Edu_Course ADD COLUMN LabHours INTEGER").run();
  console.log('+ 添加 LabHours');
} catch (e) {
  console.log('~ LabHours 已存在');
}

try {
  db.prepare("ALTER TABLE Edu_Course ADD COLUMN OnlineHours INTEGER").run();
  console.log('+ 添加 OnlineHours');
} catch (e) {
  console.log('~ OnlineHours 已存在');
}

try {
  db.prepare("ALTER TABLE Edu_Course ADD COLUMN OpenSemesters VARCHAR(50)").run();
  console.log('+ 添加 OpenSemesters');
} catch (e) {
  console.log('~ OpenSemesters 已存在');
}

console.log('\n=== 修改后的表结构 ===');
const colsAfter = db.prepare("PRAGMA table_info(Edu_Course)").all();
colsAfter.forEach(c => console.log(' -', c.name, '(', c.type, ')'));

console.log('\n=== 更新现有数据 ===');
const updateStmt = db.prepare(`
  UPDATE Edu_Course 
  SET CourseNature = CourseType,
      Credits = Credit,
      TotalHours = Hours
  WHERE CourseNature IS NULL
`);
const result = updateStmt.run();
console.log('更新了', result.changes, '条记录');

db.close();
console.log('\n完成！');