// Real API + Socket.IO probe against docker-compose.test.yml only.
import assert from 'node:assert/strict';
import { io } from 'socket.io-client';
import {
  cleanupGd1Fixtures,
  createGd1Fixtures,
  waitForAuthWindow,
} from './gd1-fixtures.mjs';

const api = 'http://localhost:55000/api';
const socketUrl = 'http://localhost:55000';
let fixture;
let socket;

async function request(path, { method = 'GET', token, cookie, data } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (cookie) headers.Cookie = cookie;
  if (data) headers['Content-Type'] = 'application/json';
  const response = await fetch(`${api}${path}`, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    signal: AbortSignal.timeout(10_000),
  });
  return { response, body: await response.json() };
}

async function login(email, password) {
  const { response, body } = await request('/auth/login', {
    method: 'POST', data: { email, password },
  });
  assert.equal(response.status, 201, `login: ${JSON.stringify(body)}`);
  const refreshCookie = response.headers.getSetCookie()
    .find((value) => value.startsWith('refreshToken='))?.split(';')[0];
  assert.ok(refreshCookie, 'API must set a refresh cookie');
  return { accessToken: body.data.accessToken, refreshCookie };
}

try {
  await waitForAuthWindow();
  fixture = await createGd1Fixtures(api);
  const platform = await login('admin@ats.local', 'Admin@123');
  const created = await request('/users', {
    method: 'POST', token: platform.accessToken,
    data: {
      fullName: fixture.adminA.name,
      email: fixture.adminA.email,
      password: fixture.password,
      role: 'org_admin',
      organizationId: fixture.orgA.id,
    },
  });
  assert.equal(created.response.status, 201, JSON.stringify(created.body));
  const userId = created.body.data.userId;
  assert.ok(userId);
  const staff = await login(fixture.adminA.email, fixture.password);

  socket = io(socketUrl, {
    transports: ['websocket'],
    reconnection: false,
    auth: { token: staff.accessToken },
    extraHeaders: { Origin: 'http://localhost:3000' },
  });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Socket connection timed out')), 10_000);
    socket.once('connect', () => { clearTimeout(timer); resolve(); });
    socket.once('connect_error', (error) => { clearTimeout(timer); reject(error); });
  });
  // Let the asynchronous DB-backed handshake finish, then leave the user room.
  // The revocation must still find this socket by authenticated user identity.
  await new Promise((resolve) => setTimeout(resolve, 500));
  assert.equal(socket.connected, true, 'Authenticated socket must remain connected');
  socket.emit('leave_user_room', { userId });
  await new Promise((resolve) => setTimeout(resolve, 150));
  const disconnected = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Socket remained connected after organization change')), 10_000);
    socket.once('disconnect', (reason) => { clearTimeout(timer); resolve(reason); });
  });

  const moved = await request(`/users/${userId}`, {
    method: 'PATCH', token: platform.accessToken,
    data: { organizationId: fixture.orgB.id },
  });
  assert.equal(moved.response.status, 200, JSON.stringify(moved.body));
  assert.equal(await disconnected, 'io server disconnect');

  const oldDepartment = await request(`/departments/${fixture.departmentA.id}`, { token: staff.accessToken });
  const newDepartment = await request(`/departments/${fixture.departmentB.id}`, { token: staff.accessToken });
  assert.equal(oldDepartment.response.status, 404);
  assert.equal(newDepartment.response.status, 200);
  const replay = await request('/auth/refresh', {
    method: 'POST', cookie: staff.refreshCookie,
  });
  assert.equal(replay.response.status, 401, 'Old refresh token must be revoked');
  console.log('PASS: authenticated socket left user room, then org move disconnected it; old token scope follows DB; old refresh is 401.');

  const loggedOut = await request('/auth/logout', {
    method: 'POST', token: platform.accessToken, cookie: platform.refreshCookie,
  });
  assert.equal(loggedOut.response.status, 201);
} finally {
  socket?.disconnect();
  if (fixture) {
    assert.deepEqual(await cleanupGd1Fixtures(fixture), {
      organizationsRemaining: 0, usersRemaining: 0,
    });
  }
}
