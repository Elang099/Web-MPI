import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';

interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

const GRAMMAR_KB: { match: RegExp; title: string; rule: string; examples: string[]; tip: string }[] = [
  {
    match: /present perfect.*simple past|simple past.*present perfect/i,
    title: 'Present Perfect vs. Simple Past',
    rule: '• **Simple Past** (`V2`) is for **finished** actions at a **specific past time** (*yesterday, in 2022, two hours ago*).\n• **Present Perfect** (`have/has + V3`) connects the past to **now**—either unfinished duration (*for/since*), life experience (*ever/never*), or a result visible right now.',
    examples: ['**Simple Past:** *I **visited** Bali in 2024.* (exact finished year)', '**Present Perfect:** *I **have visited** Bali three times.* (life experience up to now)', '**Present Perfect:** *She **has lived** here since 2021.* (still lives here now)'],
    tip: 'Ask: "Is the time period finished?" If YES (*yesterday, last week*), pick **Simple Past**. If it connects to **now** (*so far, since, today, already*), pick **Present Perfect**.',
  },
  {
    match: /\b(present simple|simple present|do|does|routine|habit)\b/i,
    title: 'Simple Present Tense',
    rule: 'Use **Simple Present** for daily habits, routines, general truths, and permanent states.\nFormula: **Subject + Verb 1** (add **-s / -es** for *he, she, it*).',
    examples: ['She **studies** English every morning.', 'Water **boils** at 100°C.', '**Do** you **like** technology? / He **does not** work on Sundays.'],
    tip: 'Watch out for third-person singular (*he/she/it*): don’t forget `-s` in positive sentences, and drop `-s` after `does` / `doesn’t`!',
  },
  {
    match: /\b(present continuous|progressive|am|is|are.*ing|right now)\b/i,
    title: 'Present Continuous Tense',
    rule: 'Use **Present Continuous** for actions happening **right now** or temporary projects around this time.\nFormula: **Subject + am / is / are + Verb-ing**.',
    examples: ['I **am reading** a grammar guide right now.', 'They **are building** a new city in the Game Center.', '**Is** she **preparing** for the job interview?'],
    tip: 'Stative verbs (*know, love, want, believe, own*) usually stay in Simple Present rather than `-ing`.',
  },
  {
    match: /\b(simple past|past tense|did|yesterday|ago)\b/i,
    title: 'Simple Past Tense',
    rule: 'Use **Simple Past** for finished actions at a specific time in the past.\nFormula: **Subject + Verb 2** (regular `-ed` or irregular like *went, saw, wrote*). Questions & negatives use **did + Verb 1**.',
    examples: ['We **visited** the science museum yesterday.', 'She **didn’t go** to school last Monday.', '**Did** you **finish** your report?'],
    tip: 'After `did` or `didn’t`, always return the main verb to **base form (V1)** — e.g. *"Did you see?"*, never *"Did you saw?"*.',
  },
  {
    match: /\b(present perfect|have|has.*pp|v3|since|for|already|yet)\b/i,
    title: 'Present Perfect Tense',
    rule: 'Use **Present Perfect** for past experiences (no exact time stated), actions that started in the past and continue now, or past actions with a present result.\nFormula: **Subject + have / has + Verb 3 (past participle)**.',
    examples: ['I **have lived** in Jakarta **for** five years.', 'She **has already completed** three lessons today.', '**Have** you ever **visited** Singapore?'],
    tip: 'Use **for** + duration (*for two hours*) and **since** + starting point (*since 2023*).',
  },
  {
    match: /\b(passive|active voice|by)\b/i,
    title: 'Passive Voice',
    rule: 'Use **Passive Voice** when the receiver of the action is more important than the doer.\nFormula: **Subject + be (tense) + Verb 3 (+ by agent)**.',
    examples: ['Active: *The chef cooks the meal.* → Passive: *The meal **is cooked** by the chef.*', 'Past Passive: *The bridge **was built** in 2020.*', 'Future Passive: *Results **will be announced** tomorrow.*'],
    tip: 'Only transitive verbs (verbs that take an object) can become passive.',
  },
  {
    match: /\b(conditional|if clause|type 1|type 2|type 3|would)\b/i,
    title: 'Conditional Sentences (If-Clauses)',
    rule: 'Conditionals express cause and result:\n• **Zero (Facts):** If + Present, Present\n• **Type 1 (Real Future):** If + Present, will + V1\n• **Type 2 (Unreal Present):** If + Past, would + V1\n• **Type 3 (Unreal Past):** If + Past Perfect, would have + V3',
    examples: ['Type 1: If you **study** consistently, your English **will improve**.', 'Type 2: If I **had** more time, I **would travel** around the world.', 'Type 3: If she **had left** earlier, she **would have caught** the train.'],
    tip: 'In formal Type 2 conditionals, use **were** for all subjects: *"If I **were** you, I would apply."* ',
  },
  {
    match: /\b(modal|can|could|should|must|might|may|would)\b/i,
    title: 'Modal Verbs',
    rule: 'Modals express ability, advice, obligation, permission, or possibility.\nFormula: **Subject + Modal + Verb 1 (base form, no "to", no "-s")**.',
    examples: ['Ability: *She **can speak** three languages.*', 'Advice: *You **should review** your notes daily.*', 'Obligation: *Students **must wear** safety gear in the lab.*'],
    tip: 'Never put `to` after a modal verb (*"must go"*, not *"must to go"*).',
  },
  {
    match: /\b(article|a |an |the )\b/i,
    title: 'Articles (a, an, the)',
    rule: '• **a** before consonant *sounds* (*a university, a book*)\n• **an** before vowel *sounds* (*an apple, an hour*)\n• **the** for specific or unique things (*the sun, the book on your desk*)',
    examples: ['I bought **a** laptop. **The** laptop is fast.', 'He is **an** honest engineer (*h* is silent!).', 'Zero article for general plurals: ***Books** open new worlds.*'],
    tip: 'Listen to the **sound**, not the spelling: *an hour* (silent h), *a European city* ("y" sound).',
  },
  {
    match: /\b(preposition|in |on |at )\b/i,
    title: 'Prepositions of Time & Place (in / on / at)',
    rule: 'Think of a pyramid from biggest to smallest:\n• **IN** = months, years, seasons, countries, cities, enclosed spaces\n• **ON** = days, dates, surfaces, streets\n• **AT** = exact clock times, specific points/addresses',
    examples: ['**In** 2026 / **In** November / **In** Indonesia', '**On** Monday / **On** July 14 / **On** the desk', '**At** 8:30 AM / **At** the station / **At** school'],
    tip: 'Remember exceptions: **in** the morning/afternoon/evening, but **at** night.',
  },
  {
    match: /\b(gerund|infinitive|verb-ing|to verb)\b/i,
    title: 'Gerunds & Infinitives',
    rule: '• **Gerund (V-ing)** acts like a noun and follows prepositions + verbs like *enjoy, avoid, finish, suggest, keep*.\n• **Infinitive (to + V1)** follows verbs like *want, decide, hope, plan, promise, need*.',
    examples: ['I **enjoy learning** English through games.', 'She **decided to apply** for the internship.', 'Thank you **for helping** me! (always V-ing after a preposition)'],
    tip: 'Some verbs change meaning! *Stop smoking* = quit the habit; *Stop to smoke* = pause walking in order to smoke.',
  },
];

const VOCAB_KB: Record<string, { pos: string; phonetic: string; meaning: string; example: string; synonyms: string[] }> = {
  resilient: { pos: 'adjective', phonetic: '/rɪˈzɪliənt/', meaning: 'able to recover quickly from difficulties', example: 'Resilient learners keep practicing even after making mistakes.', synonyms: ['adaptable', 'tough', 'strong'] },
  collaborate: { pos: 'verb', phonetic: '/kəˈlæbəreɪt/', meaning: 'to work together with others toward a shared goal', example: 'Our engineering and design teams collaborate every morning.', synonyms: ['cooperate', 'partner', 'team up'] },
  concise: { pos: 'adjective', phonetic: '/kənˈsaɪs/', meaning: 'giving a lot of information clearly in a few words', example: 'Write a concise summary before the meeting starts.', synonyms: ['brief', 'clear', 'succinct'] },
  negotiate: { pos: 'verb', phonetic: '/nɪˈɡəʊʃieɪt/', meaning: 'to discuss something in order to reach an agreement', example: 'Managers often negotiate project deadlines with clients.', synonyms: ['bargain', 'discuss', 'mediate'] },
  proficient: { pos: 'adjective', phonetic: '/prəˈfɪʃənt/', meaning: 'skilled and experienced in doing something well', example: 'She is proficient in both spoken and written English.', synonyms: ['skilled', 'competent', 'fluent'] },
  ambitious: { pos: 'adjective', phonetic: '/æmˈbɪʃəs/', meaning: 'having a strong desire to succeed or achieve big goals', example: 'He set an ambitious goal to reach C1 English this year.', synonyms: ['driven', 'determined', 'aspiring'] },
};

function analyzeWriting(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const issues: string[] = [];

  if (/\bi\b/.test(text)) issues.push('Always capitalize the pronoun **"I"** (found lowercase `i`).');
  if (/\b(he|she|it)\s+(don't|do not|have)\b/i.test(text)) issues.push('Check **subject-verb agreement**: use **doesn’t / does not / has** with *he, she, it*.');
  if (/\b(yesterday|last week|last year|ago)\b/i.test(text) && /\b(am|is|are|go|eat|see|buy)\b/i.test(text)) {
    issues.push('You mentioned a past time marker (*yesterday / last ... / ago*). Make sure your verbs are in **Simple Past (V2)**.');
  }
  if (/\bvery (good|big|small|happy|sad|fast)\b/i.test(text)) {
    issues.push('Upgrade *"very + adjective"* with stronger vocabulary: *very good → **excellent / outstanding***, *very big → **enormous***, *very fast → **rapid***.');
  }
  if (sentences.length > 0 && sentences.some((s) => /^[a-z]/.test(s.trim()))) {
    issues.push('Start every sentence with a **capital letter**.');
  }

  const connectors = ['however', 'therefore', 'moreover', 'although', 'because', 'firstly', 'finally', 'in addition'];
  const usedConnectors = connectors.filter((c) => text.toLowerCase().includes(c));

  return [
    `### ✍️ Writing Feedback`,
    `**Length:** ${words.length} words · ${sentences.length} sentence(s)`,
    '',
    issues.length ? `**Grammar & Mechanics Checks:**\n${issues.map((i) => `- ${i}`).join('\n')}` : '✅ **Grammar Check:** No common mechanical errors spotted in this draft!',
    '',
    usedConnectors.length
      ? `✅ **Cohesion:** Nice use of linking words (${usedConnectors.join(', ')}).`
      : '💡 **Flow Tip:** Try adding linking words like *However, Furthermore, Because,* or *As a result* to connect your ideas smoothly.',
    '',
    words.length < 25
      ? '🎯 **Expansion Idea:** Try adding one concrete example or reason (*"For example, ..."* or *"This matters because..."*) to strengthen your point.'
      : '🌟 **Great length!** Want me to help polish a specific sentence? Paste it and ask *"How can I make this sound more formal/natural?"*',
  ].join('\n');
}

function builtInTutorReply(opts: { mode: string; message: string; context?: string; cefr?: string | null; weakSkills: string[] }): string {
  const { mode, message, context, cefr, weakSkills } = opts;
  const levelNote = cefr ? ` (tailored for **${cefr}** level)` : '';

  if (mode === 'writing' || message.trim().split(/\s+/).length >= 18) {
    return analyzeWriting(message);
  }

  // Vocabulary lookup or "what does X mean"
  const defineMatch = message.match(/(?:what does|meaning of|define|explain word)\s+["']?([a-zA-Z-]+)["']?/i);
  const singleWord = message.trim().match(/^[a-zA-Z]{4,20}$/)?.[0];
  const lookup = (defineMatch?.[1] ?? singleWord)?.toLowerCase();
  if (lookup && VOCAB_KB[lookup]) {
    const v = VOCAB_KB[lookup];
    return `### 📖 Vocabulary Spotlight: **${lookup}**\n- **Part of Speech:** ${v.pos} \`${v.phonetic}\`\n- **Meaning:** ${v.meaning}\n- **Example:** *"${v.example}"*\n- **Synonyms:** ${v.synonyms.join(', ')}\n\nTry writing your own sentence using **${lookup}** and send it to me for feedback!`;
  }

  // Grammar KB match
  const g = GRAMMAR_KB.find((item) => item.match.test(message));
  if (g) {
    return [
      `### 🧠 ${g.title}${levelNote}`,
      g.rule,
      '',
      '**Examples:**',
      ...g.examples.map((e) => `- ${e}`),
      '',
      `💡 **Pro Tip:** ${g.tip}`,
      '',
      'Want to try a quick sentence? Write one example below and I will check it!',
    ].join('\n');
  }

  // Explain wrong answer
  if (mode === 'explain' || /why is|wrong|incorrect|explain this answer/i.test(message)) {
    return [
      `### 🔍 Answer Breakdown${levelNote}`,
      context ? `> Context: ${context.slice(0, 220)}` : '',
      'When checking why an English answer works, look at **three clues**:',
      '1. **Time markers** (*yesterday, right now, since 2022, tomorrow*) tell you which **tense** to pick.',
      '2. **Subject agreement** (*he/she/it* vs *they/we*) controls singular vs plural verbs.',
      '3. **Word role** — do you need a noun, verb, adjective (`-ful/-ous`), or adverb (`-ly`)?',
      '',
      'Paste the full question and your chosen answer here and I will walk through the exact rule step by step!',
    ]
      .filter(Boolean)
      .join('\n');
  }

  // Pronunciation mode
  if (mode === 'pronunciation' || /pronounce|pronunciation|stress|vowel|intonation|ipa/i.test(message)) {
    return [
      `### 🎙️ Pronunciation Coach${levelNote}`,
      'Here are the three high-impact habits that make your spoken English immediately clearer:',
      '- **Word Stress:** In 2-syllable nouns (*TA-ble, PRO-ject*), stress the **1st** syllable; in 2-syllable verbs (*re-CORD, pro-JECT*), stress the **2nd**.',
      '- **TH sounds (`/θ/` & `/ð/`):** Gently touch the tip of your tongue between your teeth for *think* and *this* — avoid turning them into `/t/` or `/d/`.',
      '- **Final Consonants:** Pronounce word endings clearly (*work**ed**, task**s**, importan**t***) so listeners hear tense and plurals accurately.',
      '',
      'Use the **Speak** button in any lesson or type a tricky word here so we can break down its syllables!',
    ].join('\n');
  }

  // Conversation practice mode
  if (mode === 'conversation' || /\b(hi|hello|hey|let's talk|practice speaking|interview)\b/i.test(message)) {
    const scenarios = [
      'Great to talk with you! Let’s practice a **Job Interview** warm-up:\n\n*"Welcome! Thank you for coming today. Could you tell me a little bit about yourself and one skill you are proud of?"*\n\nReply in 2–4 full sentences and I’ll respond and give friendly grammar tips!',
      'Let’s practice **Travel & Café Conversation**!\n\n*"Good morning! Welcome to Future Café. What can I get started for you today, and are you visiting the city for work or study?"*',
    ];
    if (/hello|hi|hey/i.test(message) && message.length < 25) return scenarios[0];
    return `Nice response! Here’s a quick tip: keep sentences clear with one main verb and connecting words like *because* or *actually*.\n\n**Follow-up question:** How do you usually use English in your school, work, or daily life, and what goal do you want to achieve in the next 3 months?`;
  }

  // Personalized study recommendation fallback
  const focus = weakSkills.length ? weakSkills.join(' and ') : 'Grammar and Vocabulary';
  return [
    `### ✨ FUTURE AI English Tutor${levelNote}`,
    `I’m ready to help you with **${mode === 'tutor' ? 'any English question' : mode}**!`,
    '',
    `Based on your profile, a great next focus for you is **${focus}**. Here are ways I can help right now:`,
    '- **Ask a grammar question:** e.g. *"Explain Present Perfect vs Simple Past"* or *"How do Type 2 conditionals work?"*',
    '- **Check your writing:** Paste a paragraph (18+ words) and I’ll analyze grammar, flow, and word choice.',
    '- **Vocabulary & Idioms:** Ask *"What does resilient mean?"* or try **Conversation Mode** above.',
    '- **Speaking & Pronunciation:** Ask for stress or sound tips anytime.',
  ].join('\n');
}

async function callGemini(system: string, history: ChatTurn[], userMessage: string): Promise<string | null> {
  if (!env.GEMINI_API_KEY) return null;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`;
  const contents = [
    ...history.map((h) => ({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.content }] })),
    { role: 'user', parts: [{ text: userMessage }] },
  ];
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents,
      generationConfig: { temperature: 0.7, maxOutputTokens: 700 },
    }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  return json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') || null;
}

async function callOpenAI(system: string, history: ChatTurn[], userMessage: string): Promise<string | null> {
  if (!env.OPENAI_API_KEY) return null;
  const res = await fetch(`${env.OPENAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      messages: [{ role: 'system', content: system }, ...history, { role: 'user', content: userMessage }],
      temperature: 0.7,
      max_tokens: 700,
    }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return json.choices?.[0]?.message?.content ?? null;
}

export async function generateTutorReply(opts: {
  userId: string;
  mode: string;
  message: string;
  context?: string;
  history: ChatTurn[];
}): Promise<{ reply: string; provider: string }> {
  const [profile, skills] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: opts.userId } }),
    prisma.skillMastery.findMany({ where: { userId: opts.userId } }),
  ]);

  const weakSkills = skills
    .map((s) => ({ skill: s.skill, acc: s.attempts ? s.correct / s.attempts : 0 }))
    .sort((a, b) => a.acc - b.acc)
    .slice(0, 2)
    .map((s) => s.skill);

  const systemPrompt = [
    `You are the FUTURE ENGLISH CENTER AI Tutor ("Master English. Unlock Your Future.").`,
    `Learner track: ${profile?.audience ?? 'GENERAL'}, CEFR level: ${profile?.cefr ?? 'unassessed'}, weak areas: ${weakSkills.join(', ') || 'none yet'}.`,
    `Mode: ${opts.mode}. Always teach ONLY English (never Indonesian or Japanese tracks). Be encouraging, concise, structured with markdown bullets/bold, include examples, and adapt vocabulary complexity to the learner's level.`,
    opts.context ? `Current lesson/question context:\n${opts.context}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  let reply: string | null = null;
  let provider = 'built-in';

  try {
    if (env.AI_PROVIDER === 'gemini') {
      reply = await callGemini(systemPrompt, opts.history, opts.message);
      if (reply) provider = 'gemini';
    } else if (env.AI_PROVIDER === 'openai') {
      reply = await callOpenAI(systemPrompt, opts.history, opts.message);
      if (reply) provider = 'openai';
    }
  } catch {
    reply = null;
  }

  if (!reply) {
    reply = builtInTutorReply({ mode: opts.mode, message: opts.message, context: opts.context, cefr: profile?.cefr, weakSkills });
    provider = 'built-in';
  }

  return { reply, provider };
}
