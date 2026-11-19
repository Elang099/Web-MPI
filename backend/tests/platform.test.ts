import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const app = createApp();

describe('FUTURE ENGLISH CENTER — Fullstack API, Security & Progression Integration Tests', () => {
  const unique = Date.now().toString(36);
  const testEmail = `test_${unique}@futureenglish.test`;
  const testUsername = `user_${unique}`;
  let studentToken = '';
  let adminToken = '';
  let teacherToken = '';

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } }).catch(() => undefined);
    await prisma.$disconnect();
  });

  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('registers a new student, hashes password, and enforces validation', async () => {
    const bad = await request(app).post('/api/auth/register').send({ email: 'not-an-email', password: '123' });
    expect(bad.status).toBe(400);

    const res = await request(app).post('/api/auth/register').send({
      email: testEmail,
      username: testUsername,
      displayName: 'Test Learner',
      password: 'Password123!',
      audience: 'SMK',
    });
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.user.role).toBe('STUDENT');
    expect(res.body.user.passwordHash).toBeUndefined();
    studentToken = res.body.accessToken;
  });

  it('logs in seeded admin and teacher accounts and rejects wrong passwords', async () => {
    const wrong = await request(app).post('/api/auth/login').send({
      identifier: 'admin@futureenglish.test',
      password: 'WrongPassword1!',
    });
    expect(wrong.status).toBe(401);

    const adminLogin = await request(app).post('/api/auth/login').send({
      identifier: 'admin@futureenglish.test',
      password: 'Password123!',
    });
    expect(adminLogin.status).toBe(200);
    adminToken = adminLogin.body.accessToken;

    const teacherLogin = await request(app).post('/api/auth/login').send({
      identifier: 'teacher@futureenglish.test',
      password: 'Password123!',
    });
    expect(teacherLogin.status).toBe(200);
    teacherToken = teacherLogin.body.accessToken;
  });

  it('enforces role-based authorization on admin routes', async () => {
    const unauth = await request(app).get('/api/admin/overview');
    expect(unauth.status).toBe(401);

    const studentRes = await request(app).get('/api/admin/overview').set('Authorization', `Bearer ${studentToken}`);
    expect(studentRes.status).toBe(403);

    const teacherRes = await request(app).get('/api/admin/overview').set('Authorization', `Bearer ${teacherToken}`);
    expect(teacherRes.status).toBe(200);

    const studentRoleChange = await request(app)
      .patch('/api/admin/users/fake-id')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ role: 'ADMIN' });
    expect(studentRoleChange.status).toBe(403); // Only ADMIN can change roles

    const adminRes = await request(app).get('/api/admin/overview').set('Authorization', `Bearer ${adminToken}`);
    expect(adminRes.status).toBe(200);
    expect(adminRes.body.counts.lessons).toBeGreaterThanOrEqual(20);
  });

  it('loads curriculum topics/lessons WITHOUT leaking answer keys, and grades exercises server-side', async () => {
    const topicsRes = await request(app).get('/api/learning/topics');
    expect(topicsRes.status).toBe(200);
    expect(topicsRes.body.topics.length).toBeGreaterThanOrEqual(10);

    const lessonRes = await request(app)
      .get('/api/learning/lessons/parts-of-speech-overview')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(lessonRes.status).toBe(200);
    const lesson = lessonRes.body.lesson;
    expect(lesson.exercises.length).toBeGreaterThan(0);

    const ex = lesson.exercises[0];
    // Answer key must never leak before submission
    for (const q of ex.questions) {
      expect(q.answer).toBeUndefined();
    }

    // Submit answers (using known first question + others)
    const submitRes = await request(app)
      .post(`/api/learning/exercises/${ex.id}/submit`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        answers: ex.questions.map((q: { id: string }, i: number) => ({
          questionId: q.id,
          response: i === 0 ? 'designs' : 'test',
        })),
        timeSpentSec: 45,
      });
    expect(submitRes.status).toBe(200);
    expect(submitRes.body.score).toBeGreaterThanOrEqual(1);
    expect(submitRes.body.reward.xp).toBeGreaterThan(0);

    // Complete lesson twice -> second call must mark duplicate=true (no duplicate lesson XP farming!)
    const comp1 = await request(app)
      .post(`/api/learning/lessons/${lesson.id}/complete`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ timeSpentSec: 90 });
    expect(comp1.status).toBe(200);
    expect(comp1.body.reward.duplicate).not.toBe(true);

    const comp2 = await request(app)
      .post(`/api/learning/lessons/${lesson.id}/complete`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ timeSpentSec: 30 });
    expect(comp2.status).toBe(200);
    expect(comp2.body.reward.duplicate).toBe(true);
    expect(comp2.body.reward.xp).toBe(0);
  });

  it('starts and finishes a Game Session, blocks double submission, and enforces Avatar shop rules', async () => {
    const startRes = await request(app)
      .post('/api/games/sessions/start')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ gameSlug: 'english-dash' });
    expect(startRes.status).toBe(201);
    const { sessionId, questions } = startRes.body;
    expect(questions.length).toBeGreaterThan(0);

    // Finish session
    const finishRes = await request(app)
      .post(`/api/games/sessions/${sessionId}/finish`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        score: 850,
        distance: 420,
        coinsCollected: 30,
        answers: [{ questionId: questions[0].id, response: questions[0].data?.options?.[0] ?? 'quick' }],
      });
    expect(finishRes.status).toBe(200);
    expect(finishRes.body.reward.xp).toBeGreaterThan(0);

    // Replay protection: finishing the same game session again returns 409 ALREADY_FINISHED
    const replay = await request(app)
      .post(`/api/games/sessions/${sessionId}/finish`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ score: 999999, distance: 99999, answers: [] });
    expect(replay.status).toBe(409);

    // Avatar protection: equipping unowned cosmetic must fail 400
    const unownedEquip = await request(app)
      .patch('/api/avatar')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ outfit: 'outfit-cyber-legend' });
    expect(unownedEquip.status).toBe(400);
  });

  it('builds in City Builder, chats with AI Tutor, and downloads PDF report', async () => {
    const cityBuild = await request(app)
      .post('/api/games/city/build')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ buildingType: 'cottage', x: 1, y: 1 });
    expect(cityBuild.status).toBe(200);
    expect(cityBuild.body.city.population).toBeGreaterThan(0);

    const aiRes = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ mode: 'grammar', message: 'Explain Present Perfect vs Simple Past' });
    expect(aiRes.status).toBe(200);
    expect(aiRes.body.messages[1].content).toContain('Present Perfect');

    const pdfRes = await request(app)
      .get('/api/assessments/me/report/pdf')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(pdfRes.status).toBe(200);
    expect(pdfRes.headers['content-type']).toContain('application/pdf');
  });
});
