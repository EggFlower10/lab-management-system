import { Application } from 'egg';

export default (app: Application) => {
  const { controller, router } = app;

  const apiV1 = '/api/v1';

  router.post(`${apiV1}/auth/login`, controller.auth.login);
  router.post(`${apiV1}/auth/logout`, controller.auth.logout);
  router.get(`${apiV1}/auth/info`, controller.auth.info);
  router.put(`${apiV1}/auth/password`, controller.auth.updatePassword);

  router.resources('users', `${apiV1}/users`, controller.user);
  router.resources('roles', `${apiV1}/roles`, controller.role);
  router.resources('menus', `${apiV1}/menus`, controller.menu);
  router.resources('permissions', `${apiV1}/permissions`, controller.permission);
  router.resources('organizations', `${apiV1}/organizations`, controller.organization);
  router.resources('departments', `${apiV1}/departments`, controller.department);
  router.resources('logs', `${apiV1}/logs`, controller.log);
  router.resources('configs', `${apiV1}/configs`, controller.config);

  router.resources('courses', `${apiV1}/courses`, controller.course);
  router.resources('semesters', `${apiV1}/semesters`, controller.semester);
  router.resources('calendars', `${apiV1}/calendars`, controller.calendar);
  router.resources('majors', `${apiV1}/majors`, controller.major);
  router.resources('classes', `${apiV1}/classes`, controller.class);
  router.resources('teaching-tasks', `${apiV1}/teaching-tasks`, controller.teachingTask);
  router.resources('time-slots', `${apiV1}/time-slots`, controller.timeSlot);

  router.resources('campuses', `${apiV1}/campuses`, controller.campus);
  router.resources('buildings', `${apiV1}/buildings`, controller.building);
  router.resources('rooms', `${apiV1}/rooms`, controller.room);
  router.resources('floor-plans', `${apiV1}/floor-plans`, controller.floorPlan);
};
