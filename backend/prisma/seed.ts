import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { topicSeedSchema } from '@fec/shared';
import { grammarTopics } from './content/grammar.js';
import { vocabularyTopics, vocabularyBank } from './content/vocabulary.js';
import { readingTopics, writingTopics } from './content/reading-writing.js';
import { listeningTopics, speakingTopics, pronunciationTopics } from './content/listening-speaking-pron.js';
import { textTypeTopics, vocationalTopics } from './content/texttypes-vocational.js';
import { assessmentSeeds, pathSeeds } from './content/paths-assessments.js';
import { achievementSeeds, challengeSeeds, cosmeticSeeds, gameQuestions, missionSeeds } from './content/games-progression.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding FUTURE ENGLISH CENTER database...');

  // 1. Role Definitions
  const roles = [
    { role: 'STUDENT' as const, label: 'Student', description: 'Learns English, plays educational games, earns XP & certificates.', permissions: ['learn', 'play', 'ai', 'community'] },
    { role: 'TEACHER' as const, label: 'Teacher / Content Manager', description: 'Authors lessons, vocabulary, questions, and reviews learner progress.', permissions: ['learn', 'play', 'ai', 'community', 'manage_content'] },
    { role: 'ADMIN' as const, label: 'Administrator', description: 'Full platform control including users, roles, moderation, and certificates.', permissions: ['*'] },
  ];
  for (const r of roles) {
    await prisma.roleDefinition.upsert({ where: { role: r.role }, update: r, create: r });
  }

  // 2. Topics, Lessons, Exercises, Questions, GrammarRules
  const allTopics = [
    ...grammarTopics,
    ...vocabularyTopics,
    ...readingTopics,
    ...writingTopics,
    ...listeningTopics,
    ...speakingTopics,
    ...pronunciationTopics,
    ...textTypeTopics,
    ...vocationalTopics,
  ];

  const lessonIdBySlug = new Map<string, string>();
  let lessonOrder = 0;

  for (let tIdx = 0; tIdx < allTopics.length; tIdx++) {
    const rawTopic = allTopics[tIdx];
    const t = topicSeedSchema.parse(rawTopic);
    const topic = await prisma.topic.upsert({
      where: { slug: t.slug },
      update: { category: t.category, title: t.title, description: t.description, order: tIdx },
      create: { slug: t.slug, category: t.category, title: t.title, description: t.description, order: tIdx },
    });

    for (const l of t.lessons) {
      lessonOrder += 1;
      const lesson = await prisma.lesson.upsert({
        where: { slug: l.slug },
        update: {
          topicId: topic.id,
          title: l.title,
          summary: l.summary,
          level: l.level,
          audiences: l.audiences,
          durationMin: l.durationMin,
          emoji: l.emoji,
          order: lessonOrder,
          content: l.blocks as never,
          isPublished: true,
        },
        create: {
          slug: l.slug,
          topicId: topic.id,
          title: l.title,
          summary: l.summary,
          level: l.level,
          audiences: l.audiences,
          durationMin: l.durationMin,
          emoji: l.emoji,
          order: lessonOrder,
          content: l.blocks as never,
          isPublished: true,
        },
      });
      lessonIdBySlug.set(lesson.slug, lesson.id);

      // Recreate lesson's primary exercise cleanly if not yet attempted, or sync questions if empty
      const existingEx = await prisma.exercise.findFirst({ where: { lessonId: lesson.id }, include: { _count: { select: { attempts: true } } } });
      if (!existingEx) {
        const skill = t.category === 'TEXT_TYPES' ? 'READING' : t.category === 'VOCATIONAL' ? 'SPEAKING' : (t.category as never);
        await prisma.exercise.create({
          data: {
            lessonId: lesson.id,
            title: `${l.title} — Practice Check`,
            skill,
            questions: {
              create: l.exercises.map((q, qIdx) => ({
                type: q.type,
                prompt: q.prompt,
                data: q.data as never,
                answer: q.answer as never,
                explanation: q.explanation,
                skill: q.skill ?? skill,
                level: q.level ?? l.level,
                tags: q.tags ?? [],
                order: qIdx,
              })),
            },
          },
        });
      }
    }
  }

  // GrammarRules quick reference entries
  const grammarRules = [
    { slug: 'simple-present', title: 'Simple Present Tense', formula: 'S + V1 (-s/-es for he/she/it)', explanation: 'Habits, routines, timetables, and permanent truths.', examples: ['She practices English every day.', 'Water boils at 100°C.'], level: 'BEGINNER' as const, lessonSlug: 'present-simple-vs-continuous' },
    { slug: 'present-continuous', title: 'Present Continuous Tense', formula: 'S + am/is/are + V-ing', explanation: 'Actions happening right now or temporary projects.', examples: ['We are building an English city right now.'], level: 'BEGINNER' as const, lessonSlug: 'present-simple-vs-continuous' },
    { slug: 'simple-past', title: 'Simple Past Tense', formula: 'S + V2 (or did + V1 in questions/negatives)', explanation: 'Completed actions at a specific past time.', examples: ['They won the debate yesterday.', 'Did you finish the quiz?'], level: 'BEGINNER' as const, lessonSlug: 'past-simple-vs-continuous' },
    { slug: 'present-perfect', title: 'Present Perfect Tense', formula: 'S + have/has + V3', explanation: 'Life experience, actions continuing up to now (for/since), or present impact.', examples: ['I have studied here for three years.'], level: 'INTERMEDIATE' as const, lessonSlug: 'present-and-past-perfect' },
    { slug: 'passive-voice', title: 'Passive Voice', formula: 'S + be (tense) + V3 (+ by agent)', explanation: 'Highlights the receiver of an action in reports, news, and procedures.', examples: ['The prototype was tested yesterday.'], level: 'INTERMEDIATE' as const, lessonSlug: 'active-and-passive-voice' },
    { slug: 'conditionals', title: 'Conditional Sentences (0, 1, 2, 3)', formula: 'If + condition clause, result clause', explanation: 'Express facts (0), likely futures (1), unreal presents (2), and unreal pasts (3).', examples: ['If I were you, I would apply today.'], level: 'INTERMEDIATE' as const, lessonSlug: 'conditional-sentences' },
    { slug: 'modals', title: 'Modal Verbs', formula: 'S + modal (can/should/must/might) + V1', explanation: 'Ability, advice, obligation, and probability without adding -s or "to".', examples: ['Students must wear safety goggles.'], level: 'BEGINNER' as const, lessonSlug: 'modal-verbs-and-reported-speech' },
  ];
  for (const gr of grammarRules) {
    await prisma.grammarRule.upsert({
      where: { slug: gr.slug },
      update: { title: gr.title, formula: gr.formula, explanation: gr.explanation, examples: gr.examples, level: gr.level, lessonId: lessonIdBySlug.get(gr.lessonSlug) ?? null },
      create: { slug: gr.slug, title: gr.title, formula: gr.formula, explanation: gr.explanation, examples: gr.examples, level: gr.level, lessonId: lessonIdBySlug.get(gr.lessonSlug) ?? null },
    });
  }

  // 3. Vocabulary Bank
  for (const v of vocabularyBank) {
    await prisma.vocabulary.upsert({
      where: { word_category: { word: v.word, category: v.category } },
      update: v,
      create: v,
    });
  }

  // 4. Learning Paths
  for (const p of pathSeeds) {
    const path = await prisma.learningPath.upsert({
      where: { slug: p.slug },
      update: { title: p.title, description: p.description, level: p.level, audience: p.audience, color: p.color, icon: p.icon, order: p.order },
      create: { slug: p.slug, title: p.title, description: p.description, level: p.level, audience: p.audience, color: p.color, icon: p.icon, order: p.order },
    });
    for (let i = 0; i < p.steps.length; i++) {
      const lessonId = lessonIdBySlug.get(p.steps[i].lessonSlug);
      if (!lessonId) continue;
      await prisma.learningPathStep.upsert({
        where: { pathId_lessonId: { pathId: path.id, lessonId } },
        update: { order: i + 1, unit: p.steps[i].unit },
        create: { pathId: path.id, lessonId, order: i + 1, unit: p.steps[i].unit },
      });
    }
  }

  // 5. Assessments
  for (const a of assessmentSeeds) {
    const existing = await prisma.assessment.findUnique({ where: { slug: a.slug }, include: { _count: { select: { questions: true } } } });
    const assessment = await prisma.assessment.upsert({
      where: { slug: a.slug },
      update: { title: a.title, description: a.description, type: a.type, skill: a.skill ?? null, careerField: a.careerField ?? null, timeLimitMin: a.timeLimitMin, passingScore: a.passingScore, order: a.order },
      create: { slug: a.slug, title: a.title, description: a.description, type: a.type, skill: a.skill ?? null, careerField: a.careerField ?? null, timeLimitMin: a.timeLimitMin, passingScore: a.passingScore, order: a.order },
    });
    if (!existing || existing._count.questions === 0) {
      await prisma.question.createMany({
        data: a.questions.map((q, idx) => ({
          assessmentId: assessment.id,
          type: q.type,
          prompt: q.prompt,
          data: q.data as never,
          answer: q.answer as never,
          explanation: q.explanation,
          skill: q.skill ?? 'GRAMMAR',
          level: q.level ?? 'BEGINNER',
          tags: q.tags ?? [],
          order: idx,
        })),
      });
    }
  }

  // 6. Game Question Bank
  const existingGameQs = await prisma.question.count({ where: { gameSlug: { not: null } } });
  if (existingGameQs === 0) {
    await prisma.question.createMany({
      data: gameQuestions.map((q, idx) => ({
        gameSlug: q.gameSlug,
        type: q.type,
        prompt: q.prompt,
        data: q.data as never,
        answer: q.answer as never,
        explanation: q.explanation,
        skill: q.skill ?? 'VOCABULARY',
        level: q.level ?? 'BEGINNER',
        tags: q.tags ?? [],
        order: idx,
      })),
    });
  }

  // 7. Cosmetics, Achievements, Missions, Challenges
  for (const c of cosmeticSeeds) {
    await prisma.cosmeticItem.upsert({ where: { slug: c.slug }, update: c, create: c });
  }
  for (const a of achievementSeeds) {
    await prisma.achievement.upsert({ where: { slug: a.slug }, update: a, create: a });
  }
  for (const m of missionSeeds) {
    await prisma.mission.upsert({ where: { slug: m.slug }, update: m, create: m });
  }
  for (const ch of challengeSeeds) {
    const startsAt = new Date();
    const endsAt = new Date(Date.now() + 7 * 86400_000);
    await prisma.challenge.upsert({
      where: { slug: ch.slug },
      update: { title: ch.title, description: ch.description, period: ch.period, metric: ch.metric, target: ch.target, xpReward: ch.xpReward, endsAt },
      create: { ...ch, startsAt, endsAt },
    });
  }

  // 8. Demo Users (Admin, Teacher, Student + community peers)
  const defaultItems = await prisma.cosmeticItem.findMany({ where: { isDefault: true } });
  const demoUsers = [
    { email: 'student@futureenglish.test', username: 'alex_learner', displayName: 'Alex Pratama', role: 'STUDENT' as const, password: 'Password123!', xp: 240, coins: 220, streak: 4, audience: 'SMA', cefr: 'B1' },
    { email: 'teacher@futureenglish.test', username: 'ms_nadia', displayName: 'Nadia Kusuma (Teacher)', role: 'TEACHER' as const, password: 'Password123!', xp: 480, coins: 300, streak: 7, audience: 'GENERAL', cefr: 'C1' },
    { email: 'admin@futureenglish.test', username: 'admin_fec', displayName: 'FEC Administrator', role: 'ADMIN' as const, password: 'Password123!', xp: 920, coins: 500, streak: 12, audience: 'GENERAL', cefr: 'C2' },
    { email: 'rina_smk@futureenglish.test', username: 'rina_tech', displayName: 'Rina Wijaya', role: 'STUDENT' as const, password: 'Password123!', xp: 610, coins: 340, streak: 9, audience: 'SMK', cefr: 'B2' },
    { email: 'bima_smp@futureenglish.test', username: 'bima_dash', displayName: 'Bima Santoso', role: 'STUDENT' as const, password: 'Password123!', xp: 370, coins: 190, streak: 5, audience: 'SMP', cefr: 'A2' },
  ];

  let adminId: string | null = null;
  let studentId: string | null = null;

  for (const u of demoUsers) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      if (u.role === 'ADMIN') adminId = existing.id;
      if (u.email === 'student@futureenglish.test') studentId = existing.id;
      continue;
    }
    const passwordHash = await bcrypt.hash(u.password, 10);
    const level = 1 + Math.floor(Math.sqrt(u.xp / 50));
    const created = await prisma.user.create({
      data: {
        email: u.email,
        username: u.username,
        displayName: u.displayName,
        role: u.role,
        passwordHash,
        profile: { create: { audience: u.audience, cefr: u.cefr, goal: 'Build daily speaking and workplace English fluency', bio: 'Learning English every day at FUTURE ENGLISH CENTER.' } },
        settings: { create: {} },
        stats: { create: { xp: u.xp, level, coins: u.coins, streak: u.streak, longestStreak: u.streak } },
        avatar: { create: { name: u.displayName.split(' ')[0] } },
        cityState: {
          create: {
            name: `${u.displayName.split(' ')[0]}'s City`,
            bricks: 80,
            wood: 70,
            books: 20,
            energy: 30,
            population: 20,
            buildings: [{ id: 'b-starter', type: 'library', x: 2, y: 2, level: 1 }],
          },
        },
        inventory: { create: defaultItems.map((d) => ({ itemId: d.id, source: 'default' })) },
        leaderboard: { create: { periodKey: 'all', xp: u.xp } },
      },
    });
    if (u.role === 'ADMIN') adminId = created.id;
    if (u.email === 'student@futureenglish.test') studentId = created.id;
  }

  // 9. Welcome Announcement & Sample Community Posts
  const annCount = await prisma.announcement.count();
  if (annCount === 0) {
    await prisma.announcement.createMany({
      data: [
        { title: 'Welcome to FUTURE ENGLISH CENTER!', body: 'Start with the CEFR Placement Test, explore interactive lessons across all 9 categories, and build your English City in the Game Center!', audience: 'ALL', authorId: adminId },
        { title: 'New SMK Career & Vocational Modules Live', body: 'Practice hotel check-in, technical SOPs, business emails, and STAR job interviews in Vocational English and English Life Simulator.', audience: 'SMK', authorId: adminId },
      ],
    });
  }

  const postCount = await prisma.communityPost.count();
  if (postCount === 0 && studentId) {
    await prisma.communityPost.createMany({
      data: [
        { userId: studentId, type: 'MILESTONE', content: 'Just completed Present Simple vs. Continuous and hit 450m in English Dash! 🚀' },
        { userId: adminId ?? studentId, type: 'TEXT', content: 'Tip of the week: Use "Could you please..." or "Would you mind + V-ing..." for warm, polite requests!' },
      ],
    });
  }

  console.log(`✅ Seeded ${allTopics.length} topics, ${lessonOrder} lessons, ${vocabularyBank.length} vocabulary cards, ${assessmentSeeds.length} assessments, ${gameQuestions.length} game questions, ${cosmeticSeeds.length} cosmetics.`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
