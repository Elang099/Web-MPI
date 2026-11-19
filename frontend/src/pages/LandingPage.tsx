import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Award,
  BookOpen,
  Bot,
  CheckCircle2,
  Compass,
  Flame,
  Gamepad2,
  GraduationCap,
  Layers,
  Mic,
  Play,
  Sparkles,
  Trophy,
  Volume2,
  Zap,
} from 'lucide-react';
import { CATEGORY_META, CATEGORIES, GAME_META, GAME_SLUGS } from '@fec/shared';
import { Logo } from '@/components/Logo';
import { Button, ButtonLink } from '@/components/ui/Button';
import { ProgressRing } from '@/components/ui/Progress';
import { useAuth } from '@/stores/auth';
import { useSpeak } from '@/hooks/useSpeech';
import { AvatarRenderer } from '@/games/AvatarRenderer';

const PREVIEW_STEPS = [
  {
    tab: 'Interactive Lesson',
    title: 'Present Perfect vs. Simple Past',
    badge: 'Grammar · B1',
    question: 'Choose the right form: "She ___ in Surabaya since 2021."',
    options: ['lives', 'has lived', 'was live'],
    answer: 'has lived',
    tip: '"Since 2021" links the past to right now → Present Perfect!',
  },
  {
    tab: 'Word Card + Audio',
    title: 'Resilient /rɪˈzɪliənt/',
    badge: 'Academic & Career',
    question: 'Tap to check: What does "resilient" mean?',
    options: ['Able to recover quickly from difficulties', 'Very noisy in a meeting', 'Afraid to speak'],
    answer: 'Able to recover quickly from difficulties',
    tip: 'Example: "Resilient learners turn mistakes into momentum."',
  },
  {
    tab: 'AI Coach Tip',
    title: 'Instant Writing & Speaking Check',
    badge: 'AI Tutor',
    question: 'Upgrade this sentence: "I want to ask about the job."',
    options: ['I am writing to inquire about the position.', 'Hey, give me the job.', 'Tell me job now.'],
    answer: 'I am writing to inquire about the position.',
    tip: 'Professional correspondence pairs polite openers with clear purpose.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Rina Wijaya',
    track: 'SMK Software Engineering',
    quote: 'The Vocational English emails and Job Interview practice helped me pass my internship interview in English—and English Dash made grammar fun!',
    cefr: 'B2',
  },
  {
    name: 'Bima Santoso',
    track: 'SMP Grade 8',
    quote: 'I used to mix up tenses and prepositions. The visual timelines and building my own English City kept me practicing every single evening.',
    cefr: 'A2 → B1',
  },
  {
    name: 'Nadia Kusuma',
    track: 'SMA & Debate Club',
    quote: 'Analytical Exposition and Discussion Text breakdowns plus instant AI writing feedback improved my essay scores in three weeks.',
    cefr: 'C1',
  },
];

export function LandingPage() {
  const { user } = useAuth();
  const { say } = useSpeak();
  const [previewIdx, setPreviewIdx] = useState(0);
  const [pickedOpt, setPickedOpt] = useState<string | null>(null);
  const activePreview = PREVIEW_STEPS[previewIdx];

  return (
    <div className="min-h-screen bg-bg text-ink">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-line/60 bg-bg/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Logo to="/" />
          <nav className="hidden items-center gap-6 text-sm font-semibold text-muted md:flex">
            <a href="#features" className="hover:text-ink">
              Features
            </a>
            <a href="#curriculum" className="hover:text-ink">
              Curriculum
            </a>
            <a href="#games" className="hover:text-ink">
              Game Center
            </a>
            <a href="#progression" className="hover:text-ink">
              Progression
            </a>
          </nav>
          <div className="flex items-center gap-2.5">
            {user ? (
              <ButtonLink to="/dashboard" size="sm" icon={<ArrowRight className="h-4 w-4" />}>
                Go to Dashboard
              </ButtonLink>
            ) : (
              <>
                <ButtonLink to="/login" variant="ghost" size="sm">
                  Log in
                </ButtonLink>
                <ButtonLink to="/register" size="sm">
                  Start Learning
                </ButtonLink>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-grid py-16 sm:py-24">
        <div className="pointer-events-none absolute -left-32 top-0 h-[420px] w-[420px] rounded-full bg-cyan/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-[420px] w-[420px] rounded-full bg-neon/20 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-12">
          <motion.div className="lg:col-span-6" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
            <span className="chip border-cyan/40 text-cyan">
              <Sparkles className="h-3.5 w-3.5" /> Interactive Learning + Immersive Game Center
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-6xl">
              Master English. <span className="text-gradient">Unlock Your Future.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              FUTURE ENGLISH CENTER blends structured interactive lessons for SMP, SMA, SMK, and global learners with an AI English Tutor and a vibrant
              educational Game Center—connected under one account.
            </p>
            <div className="mt-8 flex flex-wrap gap-3.5">
              <ButtonLink to={user ? '/dashboard' : '/register'} size="lg" icon={<Play className="h-4 w-4 fill-current" />}>
                Start Learning Free
              </ButtonLink>
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-2xl border border-line bg-surface/80 px-6 py-3.5 text-base font-semibold hover:border-cyan/60"
              >
                Explore Features
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-xs font-semibold text-muted">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-success" /> 9 Complete English Tracks
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-cyan" /> 5 Interactive Educational Games
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-neon" /> CEFR Placement & PDF Certificates
              </span>
            </div>
          </motion.div>

          {/* Interactive Live Preview Widget */}
          <motion.div className="lg:col-span-6" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
            <div className="panel border-cyan/40 p-6 shadow-glow">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {PREVIEW_STEPS.map((s, idx) => (
                    <button
                      key={s.tab}
                      onClick={() => {
                        setPreviewIdx(idx);
                        setPickedOpt(null);
                      }}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                        previewIdx === idx ? 'bg-brand-gradient text-white' : 'bg-surface-2 text-muted hover:text-ink'
                      }`}
                    >
                      {s.tab}
                    </button>
                  ))}
                </div>
                <span className="chip text-cyan">{activePreview.badge}</span>
              </div>

              <div className="rounded-2xl border border-line bg-surface-2/50 p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">{activePreview.title}</h3>
                  <button
                    onClick={() => say(activePreview.question)}
                    aria-label="Speak preview"
                    className="rounded-xl bg-surface p-2 text-cyan hover:bg-cyan/15"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-2 text-sm text-ink/90">{activePreview.question}</p>

                <div className="mt-4 space-y-2">
                  {activePreview.options.map((opt) => {
                    const right = opt === activePreview.answer;
                    const chosen = pickedOpt === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => setPickedOpt(opt)}
                        className={`w-full rounded-xl border px-4 py-2.5 text-left text-sm font-semibold transition ${
                          !pickedOpt
                            ? 'border-line bg-surface hover:border-cyan/60'
                            : right
                              ? 'border-success bg-success/15 text-success'
                              : chosen
                                ? 'border-danger bg-danger/15 text-danger'
                                : 'border-line/50 opacity-50'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {pickedOpt && <p className="mt-3 text-xs font-medium text-cyan">{activePreview.tip}</p>}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-line/60 pt-4 text-xs">
                <div className="flex items-center gap-3">
                  <ProgressRing value={72} size={42} stroke={5}>
                    <span className="text-[10px] font-bold">72%</span>
                  </ProgressRing>
                  <div>
                    <p className="font-bold">Daily Learning Goal</p>
                    <p className="text-muted">36 / 50 XP today · 7-day streak 🔥</p>
                  </div>
                </div>
                <Link to="/learn" className="font-bold text-cyan hover:underline">
                  Try full lessons →
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Platform Advantages */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mb-12 max-w-2xl">
          <p className="eyebrow mb-2">Why FUTURE ENGLISH CENTER</p>
          <h2 className="text-3xl font-bold sm:text-4xl">Two specialized worlds, one connected journey.</h2>
          <p className="mt-3 text-muted">
            Study cleanly in a modern, distraction-free educational app—then jump into colorful mobile-inspired games where English mastery powers every move.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Layers, title: 'Visual Interactive Lessons', desc: 'Timelines, formulas, audio cards, dialogues and sentence builders instead of walls of text.', color: 'text-cyan' },
            { icon: Gamepad2, title: 'Immersive Game Center', desc: '3-lane endless runner, exploration adventure, virtual city builder, puzzles & life simulator.', color: 'text-neon' },
            { icon: Bot, title: 'Adaptive AI English Tutor', desc: 'Explains grammar, reviews essays, roleplays conversations & adapts to your CEFR level.', color: 'text-success' },
            { icon: GraduationCap, title: 'Career & PDF Certificates', desc: 'Placement tests, SMP/SMA/SMK tracks, downloadable PDF progress reports & verified certificates.', color: 'text-warning' },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="panel panel-hover p-6">
                <div className={`mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-surface-2 ${f.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 9 English Learning Categories */}
      <section id="curriculum" className="border-y border-line/60 bg-surface/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow mb-2">100% Focused on English</p>
              <h2 className="text-3xl font-bold sm:text-4xl">Complete Curriculum from A1 to C2</h2>
              <p className="mt-2 max-w-2xl text-muted">Tailored pathways for SMP, SMA, SMK Vocational students, and independent global learners.</p>
            </div>
            <ButtonLink to="/learn" variant="outline" icon={<BookOpen className="h-4 w-4" />}>
              Browse Curriculum
            </ButtonLink>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((cat) => {
              const meta = CATEGORY_META[cat];
              return (
                <Link
                  key={cat}
                  to={`/learn?category=${cat}`}
                  className="panel panel-hover flex items-start gap-4 p-5"
                >
                  <div
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl font-display text-lg font-bold"
                    style={{ background: `${meta.color}22`, color: meta.color }}
                  >
                    {meta.label.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold">{meta.label}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted">{meta.blurb}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Game Center Preview (Distinct Colorful Arcade Band) */}
      <section id="games" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="relative overflow-hidden rounded-4xl border border-white/15 bg-gradient-to-br from-[#10184B] via-[#1C1458] to-[#0D1336] p-8 text-white shadow-glow-purple sm:p-12">
          <div className="grid items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <span className="inline-flex items-center gap-2 rounded-full bg-game-candy/25 px-3.5 py-1 font-game text-xs font-extrabold uppercase tracking-wider text-game-sun">
                <Gamepad2 className="h-4 w-4" /> Educational Game Center
              </span>
              <h2 className="mt-4 font-game text-3xl font-black sm:text-4xl">Play First-Class Casual Games That Actually Teach English.</h2>
              <p className="mt-3 max-w-xl font-sans text-sm text-white/80 sm:text-base">
                Swipe through word gates in <strong>English Dash</strong>, unlock mystery doors in <strong>English Adventure</strong>, construct your
                virtual <strong>English City</strong>, crack puzzles, and converse with NPCs across 8 real-life locations!
              </p>
              <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
                {GAME_SLUGS.map((slug) => {
                  const g = GAME_META[slug];
                  return (
                    <div key={slug} className="rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur">
                      <p className="font-game font-extrabold" style={{ color: g.color }}>
                        {g.title}
                      </p>
                      <p className="text-xs text-white/75">{g.tagline}</p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-7 flex flex-wrap gap-3">
                <ButtonLink to={user ? '/games' : '/register'} className="btn-game bg-gradient-to-r from-game-candy to-game-grape border-none">
                  Enter Game Center →
                </ButtonLink>
              </div>
            </div>
            <div className="flex flex-col items-center lg:col-span-5">
              <div className="relative grid place-items-center rounded-4xl border border-white/15 bg-white/5 p-8 backdrop-blur-md">
                <AvatarRenderer
                  size={200}
                  pose="celebrate"
                  avatar={{
                    outfit: 'outfit-varsity-purple',
                    hairStyle: 'hair-spiky',
                    hairColor: '#1E293B',
                    accessory: 'acc-headphones',
                    shoes: 'shoes-hover',
                    effect: 'fx-sparkle',
                    expression: 'happy',
                  }}
                />
                <div className="mt-4 rounded-2xl bg-black/30 px-4 py-2 text-center font-game text-xs font-bold text-game-sky">
                  Customizable Avatar · Outfits · Hover Boots · XP Rewards
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Learning Progression Overview */}
      <section id="progression" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-10 text-center">
          <p className="eyebrow mb-2">Clear Progression System</p>
          <h2 className="text-3xl font-bold">Your Path from First Word to Career Fluency</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-4">
          {[
            { step: '01', title: 'Diagnose Level', desc: 'Take the 15-min CEFR Placement Test to pinpoint A1–C2 strengths & gaps.', icon: Compass },
            { step: '02', title: 'Interactive Study', desc: 'Follow SMP, SMA, SMK, or General paths with audio & speaking practice.', icon: Mic },
            { step: '03', title: 'Play & Reinforce', desc: 'Earn coins, build your city, and drill vocabulary inside 5 educational games.', icon: Flame },
            { step: '04', title: 'Get Certified', desc: 'Download official PDF learning reports & verified completion certificates.', icon: Trophy },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="panel p-6">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-display text-2xl font-bold text-cyan">{item.step}</span>
                  <Icon className="h-5 w-5 text-neon" />
                </div>
                <h3 className="font-bold">{item.title}</h3>
                <p className="mt-1.5 text-sm text-muted">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Student Feedback */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="eyebrow mb-2">Learner Stories</p>
            <h2 className="text-3xl font-bold">Built for Real Progress</h2>
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="panel flex flex-col justify-between p-6">
              <p className="text-sm leading-relaxed text-ink/90">“{t.quote}”</p>
              <div className="mt-5 flex items-center justify-between border-t border-line/60 pt-4">
                <div>
                  <p className="text-sm font-bold">{t.name}</p>
                  <p className="text-xs text-muted">{t.track}</p>
                </div>
                <span className="chip text-cyan">CEFR {t.cefr}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line/70 bg-surface/50 py-12">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          <div>
            <Logo to="/" />
            <p className="mt-3 text-xs leading-relaxed text-muted">
              Master English. Unlock Your Future. Interactive English learning, AI coaching, and educational arcade experiences in one platform.
            </p>
          </div>
          <div>
            <p className="mb-3 text-sm font-bold">Learning</p>
            <ul className="space-y-2 text-xs text-muted">
              <li><Link to="/learn" className="hover:text-cyan">English Learning Center</Link></li>
              <li><Link to="/paths" className="hover:text-cyan">Learning Paths</Link></li>
              <li><Link to="/practice" className="hover:text-cyan">Interactive Practice</Link></li>
              <li><Link to="/resources" className="hover:text-cyan">Resources Library</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-sm font-bold">Experiences</p>
            <ul className="space-y-2 text-xs text-muted">
              <li><Link to="/games" className="hover:text-cyan">Educational Game Center</Link></li>
              <li><Link to="/ai-tutor" className="hover:text-cyan">AI English Tutor</Link></li>
              <li><Link to="/assessments" className="hover:text-cyan">Assessments & Career</Link></li>
              <li><Link to="/community" className="hover:text-cyan">Community & Leaderboard</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-sm font-bold">Get Started</p>
            <div className="flex flex-col gap-2">
              <ButtonLink to="/register" size="sm" icon={<Zap className="h-3.5 w-3.5" />}>Create Free Account</ButtonLink>
              <ButtonLink to="/login" variant="secondary" size="sm" icon={<Award className="h-3.5 w-3.5" />}>Sign In</ButtonLink>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-7xl border-t border-line/50 px-4 pt-6 text-center text-xs text-muted sm:px-6">
          © {new Date().getFullYear()} FUTURE ENGLISH CENTER — Master English. Unlock Your Future.
        </div>
      </footer>
    </div>
  );
}
