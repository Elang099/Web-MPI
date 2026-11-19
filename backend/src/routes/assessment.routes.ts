import { Router } from 'express';
import { SKILLS, XP_RULES, cefrFromPercent, submitAnswersSchema, type SubmitAnswersInput } from '@fec/shared';
import type { Skill } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { optionalAuth, requireAuth, uid } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler, badRequest, notFound } from '../utils/errors.js';
import { grade, toPublicQuestion } from '../services/grading.service.js';
import { award, ensureStats, recordSkill } from '../services/reward.service.js';
import { shortCode } from '../utils/crypto.js';
import { buildCertificatePdf, buildLearningReportPdf } from '../services/pdf.service.js';

const router = Router();

export const CAREER_FIELDS: Record<
  string,
  { title: string; desc: string; keySkills: string[]; vocabFocus: string[]; recommendedTopics: string[]; roles: string[] }
> = {
  technology: {
    title: 'Software, IT & Digital Tech',
    desc: 'Collaborate in global engineering teams, read documentation, write clear technical specs and present demos.',
    keySkills: ['Technical Reading & Documentation', 'Concise Bug & Status Reporting', 'Remote Standup Speaking', 'Analytical Exposition'],
    vocabFocus: ['deploy', 'latency', 'scalable', 'debug', 'architecture', 'sprint'],
    recommendedTopics: ['technology-vocabulary', 'technical-english', 'formal-emails', 'procedure-text'],
    roles: ['Software Engineer', 'UI/UX Designer', 'Product Analyst', 'IT Support Specialist'],
  },
  business: {
    title: 'Business, Finance & Management',
    desc: 'Lead client meetings, craft persuasive proposals, negotiate agreements and interpret business reports.',
    keySkills: ['Business Correspondence', 'Formal Presentations', 'Negotiation & Making Requests', 'Report Writing'],
    vocabFocus: ['revenue', 'stakeholder', 'quarter', 'leverage', 'consensus', 'benchmark'],
    recommendedTopics: ['business-english', 'workplace-vocabulary', 'business-correspondence', 'professional-presentations'],
    roles: ['Business Analyst', 'Marketing Coordinator', 'Project Manager', 'Account Executive'],
  },
  hospitality: {
    title: 'Hospitality, Tourism & Aviation',
    desc: 'Deliver warm, accurate guest experiences across hotels, airports, restaurants and international travel.',
    keySkills: ['Polite Requests & Offers', 'Listening to Announcements', 'Complaint Resolution', 'Travel & Restaurant Vocabulary'],
    vocabFocus: ['itinerary', 'reservation', 'concierge', 'boarding', 'complimentary', 'accommodate'],
    recommendedTopics: ['hospitality-english', 'customer-service', 'travel-vocabulary', 'food-and-restaurant-vocabulary'],
    roles: ['Hotel Front Desk Officer', 'Flight Attendant', 'Tour Coordinator', 'Guest Relations Specialist'],
  },
  healthcare: {
    title: 'Healthcare & Life Sciences',
    desc: 'Understand medical articles, give clear patient instructions and communicate calmly in clinical settings.',
    keySkills: ['Giving Clear Instructions', 'Active Listening', 'Explanation & Report Texts', 'Empathetic Communication'],
    vocabFocus: ['symptom', 'prescription', 'diagnosis', 'dosage', 'recovery', 'precaution'],
    recommendedTopics: ['explanation-text', 'report-text', 'workplace-instructions', 'daily-conversations'],
    roles: ['Registered Nurse', 'Pharmacy Technician', 'Health Administrator', 'Lab Technologist'],
  },
  engineering: {
    title: 'Vocational Engineering & Manufacturing (SMK)',
    desc: 'Follow SOPs, safety briefings, equipment manuals and vocational workplace communication.',
    keySkills: ['Procedure & SOP Comprehension', 'Safety Instructions', 'Technical Vocabulary', 'Job Interview Readiness'],
    vocabFocus: ['calibration', 'tolerance', 'inspection', 'maintenance', 'blueprint', 'hazard'],
    recommendedTopics: ['workplace-instructions', 'procedure-text', 'technical-english', 'job-interviews'],
    roles: ['Mechatronics Technician', 'CAD Drafter', 'Quality Inspector', 'Automotive Specialist'],
  },
};

const CERTIFICATE_MILESTONES = [
  { key: 'beginner', title: 'FUTURE Foundation English Certificate', level: 'Beginner (A1–A2)', minLessons: 4, assessmentSlug: 'beginner-assessment' },
  { key: 'intermediate', title: 'FUTURE Intermediate Fluency Certificate', level: 'Intermediate (B1–B2)', minLessons: 8, assessmentSlug: 'intermediate-assessment' },
  { key: 'advanced', title: 'FUTURE Mastery & Career English Certificate', level: 'Advanced (C1–C2)', minLessons: 12, assessmentSlug: 'final-assessment' },
] as const;

/** GET /api/assessments */
router.get(
  '/',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const assessments = await prisma.assessment.findMany({
      orderBy: { order: 'asc' },
      include: { _count: { select: { questions: true } } },
    });

    const attempts = req.user
      ? await prisma.assessmentAttempt.findMany({
          where: { userId: req.user.id },
          orderBy: { createdAt: 'desc' },
        })
      : [];

    res.json({
      assessments: assessments.map((a) => ({
        ...a,
        questionCount: a._count.questions,
        latestAttempt: attempts.find((at) => at.assessmentId === a.id) ?? null,
      })),
      careerFields: CAREER_FIELDS,
    });
  }),
);

/** GET /api/assessments/:slug — loads assessment with stripped questions */
router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const slug = String(req.params.slug);
    if (slug === 'report' || slug === 'certificates') throw notFound('Assessment');
    const assessment = await prisma.assessment.findUnique({
      where: { slug },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
    if (!assessment) throw notFound('Assessment');
    res.json({
      assessment: {
        ...assessment,
        questions: assessment.questions.map(toPublicQuestion),
      },
    });
  }),
);

/** POST /api/assessments/:id/submit — grades assessment, updates CEFR (for placement), checks certificate eligibility */
router.post(
  '/:id/submit',
  requireAuth,
  validate(submitAnswersSchema),
  asyncHandler(async (req, res) => {
    const userId = uid(req);
    const { answers } = req.body as SubmitAnswersInput;
    const assessment = await prisma.assessment.findUnique({
      where: { id: String(req.params.id) },
      include: { questions: true },
    });
    if (!assessment) throw notFound('Assessment');
    if (!assessment.questions.length) throw badRequest('Assessment has no questions');

    const byId = new Map(assessment.questions.map((q) => [q.id, q]));
    const breakdown: Record<string, { correct: number; total: number }> = {};

    const results = answers.map((a) => {
      const q = byId.get(a.questionId);
      if (!q) throw badRequest(`Question ${a.questionId} is not part of this assessment`);
      const g = grade(q, a.response);
      breakdown[q.skill] ??= { correct: 0, total: 0 };
      breakdown[q.skill].total += 1;
      if (g.isCorrect) breakdown[q.skill].correct += 1;
      return { ...g, skill: q.skill };
    });

    const score = results.filter((r) => r.isCorrect).length;
    const total = assessment.questions.length;
    const percent = Math.round((score / total) * 100);
    const passed = percent >= assessment.passingScore;
    const cefr = assessment.type === 'PLACEMENT' || assessment.type === 'FINAL' ? cefrFromPercent(percent) : null;

    for (const [skill, counts] of Object.entries(breakdown)) {
      await recordSkill(userId, skill as Skill, counts.correct, counts.total);
    }

    const attempt = await prisma.assessmentAttempt.create({
      data: {
        userId,
        assessmentId: assessment.id,
        score,
        total,
        percent,
        passed,
        cefr,
        breakdown,
      },
    });

    if (cefr) {
      await prisma.profile.upsert({ where: { userId }, update: { cefr }, create: { userId, cefr } });
    }

    // Career report generation for CAREER assessments
    let careerReport = null;
    if (assessment.type === 'CAREER') {
      const fieldKey = assessment.careerField && CAREER_FIELDS[assessment.careerField] ? assessment.careerField : 'technology';
      const spec = CAREER_FIELDS[fieldKey];
      careerReport = await prisma.careerReport.create({
        data: {
          userId,
          field: fieldKey,
          data: {
            percent,
            passed,
            recommendedLevel: cefrFromPercent(percent),
            spec,
            breakdown,
          },
        },
      });
      await prisma.profile.upsert({ where: { userId }, update: { careerField: spec.title }, create: { userId, careerField: spec.title } });
    }

    const reward = await award(userId, {
      source: 'ASSESSMENT',
      sourceKey: `assessment:${assessment.id}:${passed ? 'pass' : attempt.id}`,
      xp: passed ? XP_RULES.assessmentPass : Math.max(10, score * 2),
      coins: passed ? 40 : 10,
      note: assessment.title,
      activity: { type: 'ASSESSMENT', title: `Completed ${assessment.title} (${percent}%)`, refId: assessment.id, minutes: 5 },
      metrics: { assessments_completed: 1, ...(passed ? { assessments_passed: 1 } : {}) },
    });

    // Issue eligible certificates automatically
    const completedCount = await prisma.lessonProgress.count({ where: { userId, status: 'COMPLETED' } });
    const passedSlugs = new Set(
      (
        await prisma.assessmentAttempt.findMany({
          where: { userId, passed: true },
          include: { assessment: { select: { slug: true } } },
        })
      ).map((a) => a.assessment.slug),
    );
    const issuedCertificates = [];
    for (const m of CERTIFICATE_MILESTONES) {
      if (completedCount >= m.minLessons && passedSlugs.has(m.assessmentSlug)) {
        const existing = await prisma.certificate.findUnique({ where: { userId_title: { userId, title: m.title } } });
        if (!existing) {
          const cert = await prisma.certificate.create({
            data: { userId, code: `FEC-${shortCode(8)}`, title: m.title, level: m.level, criteria: { minLessons: m.minLessons, assessmentSlug: m.assessmentSlug } },
          });
          issuedCertificates.push(cert);
        }
      }
    }

    res.json({ attempt, results, breakdown, careerReport, issuedCertificates, reward });
  }),
);

/** Build structured learning report data */
async function buildReportData(userId: string) {
  const [user, stats, lessonsDone, skillRows, attempts, certs, allLessons] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId }, include: { profile: true } }),
    ensureStats(userId),
    prisma.lessonProgress.findMany({
      where: { userId, status: 'COMPLETED' },
      include: { lesson: { select: { id: true, title: true } } },
    }),
    prisma.skillMastery.findMany({ where: { userId } }),
    prisma.assessmentAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { assessment: { select: { title: true, slug: true } } },
    }),
    prisma.certificate.findMany({ where: { userId, revoked: false } }),
    prisma.lesson.findMany({ where: { isPublished: true }, select: { id: true, title: true, level: true } }),
  ]);

  const skills = SKILLS.map((skill) => {
    const r = skillRows.find((s) => s.skill === skill);
    const attemptsCount = r?.attempts ?? 0;
    const correct = r?.correct ?? 0;
    return { skill, attempts: attemptsCount, accuracy: attemptsCount ? Math.round((correct / attemptsCount) * 100) : 0 };
  });

  const strengths = skills.filter((s) => s.attempts > 0 && s.accuracy >= 75).map((s) => `${s.skill} (${s.accuracy}%)`);
  const improvements = skills.filter((s) => s.attempts === 0 || s.accuracy < 75).map((s) => `${s.skill} (${s.attempts ? `${s.accuracy}%` : 'not yet practiced'})`);

  const doneIds = new Set(lessonsDone.map((l) => l.lesson.id));
  const recommendations = allLessons
    .filter((l) => !doneIds.has(l.id))
    .slice(0, 5)
    .map((l) => `${l.title} (${l.level})`);

  return {
    report: {
      displayName: user.displayName,
      username: user.username,
      audience: user.profile?.audience ?? 'GENERAL',
      cefr: user.profile?.cefr ?? 'Not assessed yet',
      level: stats.level,
      xp: stats.xp,
      streak: stats.longestStreak,
      completedLessons: lessonsDone.map((l) => l.lesson.title),
      skills,
      assessments: attempts.map((a) => ({
        title: a.assessment.title,
        percent: a.percent,
        passed: a.passed,
        cefr: a.cefr,
        date: a.createdAt.toISOString().slice(0, 10),
      })),
      strengths,
      improvements,
      recommendations,
      careerField: user.profile?.careerField ?? null,
    },
    certificates: certs,
    lessonsCompletedCount: lessonsDone.length,
    passedSlugs: new Set(attempts.filter((a) => a.passed).map((a) => a.assessment.slug)),
  };
}

/** GET /api/assessments/me/report */
router.get(
  '/me/report',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = uid(req);
    const { report, certificates, lessonsCompletedCount, passedSlugs } = await buildReportData(userId);

    // Check certificate progress requirements
    const certificateTracks = CERTIFICATE_MILESTONES.map((m) => ({
      ...m,
      lessonsDone: Math.min(lessonsCompletedCount, m.minLessons),
      assessmentPassed: passedSlugs.has(m.assessmentSlug),
      earned: certificates.find((c) => c.title === m.title) ?? null,
    }));

    const careerReports = await prisma.careerReport.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 5 });

    res.json({ report, certificates, certificateTracks, careerReports });
  }),
);

/** GET /api/assessments/me/report/pdf — downloadable PDF learning report */
router.get(
  '/me/report/pdf',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { report } = await buildReportData(uid(req));
    const buf = await buildLearningReportPdf(report);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="future-english-report-${report.username}.pdf"`);
    res.send(buf);
  }),
);

/** POST /api/assessments/me/certificates/claim — claim any earned milestone certificate */
router.post(
  '/me/certificates/claim',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = uid(req);
    const { lessonsCompletedCount, passedSlugs } = await buildReportData(userId);
    const issued = [];
    for (const m of CERTIFICATE_MILESTONES) {
      if (lessonsCompletedCount >= m.minLessons && passedSlugs.has(m.assessmentSlug)) {
        const existing = await prisma.certificate.findUnique({ where: { userId_title: { userId, title: m.title } } });
        if (!existing) {
          issued.push(
            await prisma.certificate.create({
              data: { userId, code: `FEC-${shortCode(8)}`, title: m.title, level: m.level, criteria: { minLessons: m.minLessons, assessmentSlug: m.assessmentSlug } },
            }),
          );
        }
      }
    }
    res.json({ issued });
  }),
);

/** GET /api/assessments/certificates/:id/pdf — downloadable PDF certificate */
router.get(
  '/certificates/:id/pdf',
  requireAuth,
  asyncHandler(async (req, res) => {
    const cert = await prisma.certificate.findUnique({
      where: { id: String(req.params.id) },
      include: { user: { select: { displayName: true } } },
    });
    if (!cert || cert.revoked) throw notFound('Certificate');
    if (cert.userId !== uid(req) && req.user?.role !== 'ADMIN') throw notFound('Certificate');
    const buf = await buildCertificatePdf({
      code: cert.code,
      displayName: cert.user.displayName,
      title: cert.title,
      level: cert.level,
      issuedAt: cert.issuedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificate-${cert.code}.pdf"`);
    res.send(buf);
  }),
);

export default router;
