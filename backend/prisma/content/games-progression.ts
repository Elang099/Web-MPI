import type { QuestionSeed } from '@fec/shared';
import { fill, listen, mcq, order } from './helpers.js';

/** Questions tagged by `gameSlug` for the 5 educational games */
export const gameQuestions: (QuestionSeed & { gameSlug: string })[] = [
  // 1. ENGLISH DASH (fast vocabulary gates, synonyms/antonyms, grammar lane picks, sentence checks)
  { ...mcq('Synonym of **FAST**?', ['quick', 'slow', 'heavy'], 'quick', '"Quick" means fast.', 'VOCABULARY', 'BEGINNER'), gameSlug: 'english-dash' },
  { ...mcq('Antonym of **BRAVE**?', ['fearless', 'cowardly', 'proud'], 'cowardly', '"Cowardly" is the opposite of brave.', 'VOCABULARY', 'INTERMEDIATE'), gameSlug: 'english-dash' },
  { ...mcq('Pick the right verb: "She ___ every morning."', ['run', 'runs', 'running'], 'runs', 'Singular subject "She" takes -s.', 'GRAMMAR', 'BEGINNER'), gameSlug: 'english-dash' },
  { ...mcq('Pick the right preposition: "Class starts ___ 8 AM."', ['on', 'in', 'at'], 'at', 'Clock times always take AT.', 'GRAMMAR', 'BEGINNER'), gameSlug: 'english-dash' },
  { ...mcq('Which word means **very easy**?', ['piece of cake', 'hard nut', 'heavy rain'], 'piece of cake', 'Idiom: piece of cake = very easy.', 'VOCABULARY', 'INTERMEDIATE'), gameSlug: 'english-dash' },
  { ...mcq('Past tense of **TEACH**?', ['teached', 'taught', 'thought'], 'taught', 'Teach → taught (think → thought).', 'GRAMMAR', 'BEGINNER'), gameSlug: 'english-dash' },
  { ...mcq('Pick the right article: "___ honest friend"', ['a', 'an', 'many'], 'an', 'Silent h → vowel sound → an honest.', 'GRAMMAR', 'BEGINNER'), gameSlug: 'english-dash' },
  { ...mcq('Synonym of **CONCISE**?', ['brief', 'endless', 'noisy'], 'brief', 'Concise means brief and clear.', 'VOCABULARY', 'ADVANCED'), gameSlug: 'english-dash' },
  { ...mcq('Choose the right modal: "You ___ wear a helmet."', ['must', 'must to', 'musts'], 'must', 'Never put "to" after "must".', 'GRAMMAR', 'BEGINNER'), gameSlug: 'english-dash' },
  { ...mcq('Antonym of **EXPAND**?', ['grow', 'shrink', 'rise'], 'shrink', '"Shrink" means become smaller.', 'VOCABULARY', 'INTERMEDIATE'), gameSlug: 'english-dash' },
  { ...mcq('"They ___ English since 2022."', ['study', 'have studied', 'studying'], 'have studied', '"Since 2022" signals Present Perfect.', 'GRAMMAR', 'INTERMEDIATE'), gameSlug: 'english-dash' },
  { ...mcq('Pick the collocation: "___ a decision"', ['do', 'make', 'eat'], 'make', 'Always "make a decision".', 'VOCABULARY', 'INTERMEDIATE'), gameSlug: 'english-dash' },

  // 2. ENGLISH ADVENTURE (clues, unlocking doors, story dialogue puzzles)
  { ...mcq('Gatekeeper Clue: "I hold thousands of books, and visitors borrow knowledge here quietly." Where are you?', ['Library', 'Airport', 'Bakery'], 'Library', 'Books are borrowed quietly at a library.', 'READING', 'BEGINNER'), gameSlug: 'english-adventure' },
  { ...mcq('Ancient Door Inscription: "Complete me to pass: If I ___ wings, I would fly over the canyon."', ['have', 'had', 'will have'], 'had', 'Type 2 unreal conditional uses Past Simple ("had").', 'GRAMMAR', 'INTERMEDIATE'), gameSlug: 'english-adventure' },
  { ...mcq('River Bridge Guard: "Which word means able to bounce back quickly from hardship?"', ['resilient', 'fragile', 'hesitant'], 'resilient', '"Resilient" means recovering strongly from difficulties.', 'VOCABULARY', 'INTERMEDIATE'), gameSlug: 'english-adventure' },
  { ...mcq('Lighthouse Clue: "Read the sign: *Warning: High voltage! Disconnect power first.*" What must you do?', ['Turn off power before touching', 'Splash water on it', 'Ignore the warning'], 'Turn off power before touching', 'Safety procedure requires disconnecting power first.', 'READING', 'BEGINNER'), gameSlug: 'english-adventure' },
  { ...mcq('Sky Citadel Scroll: "The golden compass ___ by a forgotten navigator in 1790."', ['crafted', 'was crafted', 'is crafting'], 'was crafted', 'Past Passive: was + V3.', 'GRAMMAR', 'INTERMEDIATE'), gameSlug: 'english-adventure' },
  { ...mcq('Crystal Vault Riddle: "Which phrasal verb means *solve or understand*?"', ['figure out', 'turn off', 'run out'], 'figure out', '"Figure out" means solve or understand.', 'VOCABULARY', 'INTERMEDIATE'), gameSlug: 'english-adventure' },

  // 3. CITY BUILDER (educational missions to earn bricks, wood, books, energy)
  { ...mcq('Architect Brief: "All blueprints ___ reviewed before construction begins."', ['is', 'are', 'was'], 'are', 'Plural subject "blueprints" takes "are".', 'GRAMMAR', 'BEGINNER'), gameSlug: 'city-builder' },
  { ...mcq('Library Supply: Which genre gives factual classifications about a general topic (e.g. Solar Energy)?', ['Report Text', 'Invitation', 'Comedy Skit'], 'Report Text', 'Report texts classify and explain general categories objectively.', 'READING', 'INTERMEDIATE'), gameSlug: 'city-builder' },
  { ...fill('Civic Planning: Type a synonym for **work together**: c _ _ _ _ _ _ _ _ e', 'collaborate', 'Collaborate means work together.', 'collaborate', 'VOCABULARY', 'INTERMEDIATE'), gameSlug: 'city-builder' },
  { ...mcq('Power Grid Notice: "Technicians ___ testing the new solar array right now."', ['is', 'are', 'was'], 'are', 'Plural subject + "right now" → Present Continuous.', 'GRAMMAR', 'BEGINNER'), gameSlug: 'city-builder' },
  { ...mcq('Café Grand Opening: What do you call a small starter dish served before the main meal?', ['appetizer', 'itinerary', 'receipt'], 'appetizer', 'An appetizer comes before the main course.', 'VOCABULARY', 'BEGINNER'), gameSlug: 'city-builder' },
  { ...mcq('City Hall Memo: Pick the polite formal email closing:', ['Bye bro,', 'Best regards,', 'Laterz,'], 'Best regards,', 'Professional correspondence uses Best regards or Sincerely.', 'WRITING', 'BEGINNER'), gameSlug: 'city-builder' },

  // 4. WORD PUZZLE QUEST (grammar puzzle, missing word, sentence builder, idiom, synonym)
  { ...order('Sentence Puzzle: Assemble the proverb:', ['Practice', 'makes', 'steady', 'progress', 'possible.'], 'Practice makes steady progress possible.', 'Subject + Verb + Object + Complement.', 'GRAMMAR', 'BEGINNER'), gameSlug: 'word-puzzle' },
  { ...fill('Missing Word: "He stayed calm ___ the storm." (during/between)', 'during', '"During" covers the period of an event.', 'd _ _ _ _ g', 'GRAMMAR', 'BEGINNER'), gameSlug: 'word-puzzle' },
  { ...mcq('Idiom Puzzle: What does **"break the ice"** mean?', ['Freeze water', 'Help people feel comfortable talking', 'Drop a glass'], 'Help people feel comfortable talking', 'Breaking the ice eases social tension.', 'VOCABULARY', 'INTERMEDIATE'), gameSlug: 'word-puzzle' },
  { ...fill('Spelling Challenge: Complete the word meaning *time plan*: s c h _ d u l e', 'schedule', 'Spelled s-c-h-e-d-u-l-e.', 's c h _ d u l e', 'VOCABULARY', 'BEGINNER'), gameSlug: 'word-puzzle' },
  { ...mcq('Grammar Puzzle: Find the error-free sentence:', ['She suggested to go early.', 'She suggested going early.', 'She suggested me go early.'], 'She suggested going early.', 'Always follow "suggest" with V-ing.', 'GRAMMAR', 'INTERMEDIATE'), gameSlug: 'word-puzzle' },
  { ...mcq('Synonym Match: Closest word to **INNOVATIVE**?', ['outdated', 'creative & original', 'ordinary'], 'creative & original', 'Innovative describes original new ideas.', 'VOCABULARY', 'INTERMEDIATE'), gameSlug: 'word-puzzle' },

  // 5. ENGLISH LIFE SIMULATOR (real-world NPC dialogues)
  { ...mcq('[Restaurant] Waiter: "Good evening! Would you like to start with a beverage?" Best reply:', ['No talk.', 'Yes, could I have an iced lemon tea, please?', 'Give water now.'], 'Yes, could I have an iced lemon tea, please?', 'Polite request: "Could I have..., please?"', 'SPEAKING', 'BEGINNER'), gameSlug: 'life-simulator' },
  { ...mcq('[Airport] Agent: "May I see your passport and boarding pass?" You say:', ['Here you go. Could you confirm my departure gate?', 'Why?', 'I lost my name.'], 'Here you go. Could you confirm my departure gate?', 'Natural, clear airport communication.', 'SPEAKING', 'BEGINNER'), gameSlug: 'life-simulator' },
  { ...mcq('[Shopping Mall] Clerk: "Does that jacket fit well, or would you like a medium?"', ['It’s slightly tight—could I try a medium, please?', 'Jacket bad.', 'I am wearing shoes.'], 'It’s slightly tight—could I try a medium, please?', 'Clear size request at a store.', 'SPEAKING', 'BEGINNER'), gameSlug: 'life-simulator' },
  { ...mcq('[School] Librarian: "The textbook is checked out until 4 PM."', ['No problem! Could I reserve it for 4:15?', 'Give it anyway!', 'Books are boring.'], 'No problem! Could I reserve it for 4:15?', 'Polite problem-solving.', 'SPEAKING', 'BEGINNER'), gameSlug: 'life-simulator' },
  { ...mcq('[Workplace] Lead: "How is the slide deck coming along?"', ['Almost done—I’m adding the final chart and will share it by noon.', 'Maybe later.', 'What slides?'], 'Almost done—I’m adding the final chart and will share it by noon.', 'Give status + clear ETA at work.', 'SPEAKING', 'INTERMEDIATE'), gameSlug: 'life-simulator' },
  { ...mcq('[Hotel] Guest: "My key card isn’t opening Room 302." Receptionist:', ['Try harder.', 'I’m sorry for the trouble—let me re-encode a fresh card for you right away.', 'Sleep in lobby.'], 'I’m sorry for the trouble—let me re-encode a fresh card for you right away.', 'Empathy + quick action in hospitality.', 'SPEAKING', 'INTERMEDIATE'), gameSlug: 'life-simulator' },
  { ...mcq('[Hospital] Nurse: "Take this medicine twice daily after meals." Patient confirms:', ['Once a month?', 'Got it—one tablet after breakfast and one after dinner, right?', 'Without food!'], 'Got it—one tablet after breakfast and one after dinner, right?', 'Repeating medical instructions confirms understanding safely.', 'LISTENING', 'INTERMEDIATE'), gameSlug: 'life-simulator' },
  { ...listen('[Public Transport] Listen to the station announcement. Which platform goes downtown?', 'Train Line B to Central Plaza arrives at Platform 2 in four minutes.', ['Platform 1', 'Platform 2', 'Platform 5'], 'Platform 2', 'Line B to Central Plaza arrives at Platform 2.', 'BEGINNER'), gameSlug: 'life-simulator' },
];

export const cosmeticSeeds = [
  // Hair
  { slug: 'hair-short', name: 'Classic Short', type: 'HAIR' as const, rarity: 'COMMON' as const, priceCoins: 0, unlockLevel: 1, isDefault: true },
  { slug: 'hair-spiky', name: 'Cyber Spikes', type: 'HAIR' as const, rarity: 'COMMON' as const, priceCoins: 40, unlockLevel: 1 },
  { slug: 'hair-bob', name: 'Sleek Bob', type: 'HAIR' as const, rarity: 'COMMON' as const, priceCoins: 45, unlockLevel: 1 },
  { slug: 'hair-ponytail', name: 'Runner Ponytail', type: 'HAIR' as const, rarity: 'RARE' as const, priceCoins: 80, unlockLevel: 2 },
  { slug: 'hair-wavy', name: 'Ocean Waves', type: 'HAIR' as const, rarity: 'RARE' as const, priceCoins: 95, unlockLevel: 2 },
  { slug: 'hair-neon-crest', name: 'Neon Crest', type: 'HAIR' as const, rarity: 'EPIC' as const, priceCoins: 180, unlockLevel: 4 },
  // Outfits
  { slug: 'outfit-hoodie-cyan', name: 'Cyan Tech Hoodie', type: 'OUTFIT' as const, rarity: 'COMMON' as const, priceCoins: 0, unlockLevel: 1, color: '#00D1FF', isDefault: true },
  { slug: 'outfit-varsity-purple', name: 'Future Varsity Jacket', type: 'OUTFIT' as const, rarity: 'RARE' as const, priceCoins: 90, unlockLevel: 1, color: '#A855F7' },
  { slug: 'outfit-blazer-navy', name: 'Career Pro Blazer', type: 'OUTFIT' as const, rarity: 'RARE' as const, priceCoins: 120, unlockLevel: 2, color: '#1B2763' },
  { slug: 'outfit-runner-gold', name: 'Solar Dash Suit', type: 'OUTFIT' as const, rarity: 'EPIC' as const, priceCoins: 220, unlockLevel: 3, color: '#F59E0B' },
  { slug: 'outfit-explorer-emerald', name: 'Adventure Ranger Gear', type: 'OUTFIT' as const, rarity: 'EPIC' as const, priceCoins: 0, unlockLevel: 3, color: '#22C55E' }, // free level unlock!
  { slug: 'outfit-cyber-legend', name: 'Quantum Neon Armor', type: 'OUTFIT' as const, rarity: 'LEGENDARY' as const, priceCoins: 0, unlockLevel: 1, achievementSlug: 'xp-500', color: '#00D1FF' },
  // Accessories
  { slug: 'acc-glasses', name: 'Scholar Glasses', type: 'ACCESSORY' as const, rarity: 'COMMON' as const, priceCoins: 35, unlockLevel: 1 },
  { slug: 'acc-headphones', name: 'Studio Headphones', type: 'ACCESSORY' as const, rarity: 'RARE' as const, priceCoins: 75, unlockLevel: 1 },
  { slug: 'acc-visor', name: 'Electric Holo-Visor', type: 'ACCESSORY' as const, rarity: 'EPIC' as const, priceCoins: 160, unlockLevel: 3 },
  { slug: 'acc-crown', name: 'Fluency Crown', type: 'ACCESSORY' as const, rarity: 'LEGENDARY' as const, priceCoins: 0, unlockLevel: 1, achievementSlug: 'lessons-10' },
  // Shoes
  { slug: 'shoes-sneakers', name: 'Street Sneakers', type: 'SHOES' as const, rarity: 'COMMON' as const, priceCoins: 0, unlockLevel: 1, isDefault: true },
  { slug: 'shoes-turbo', name: 'Turbo Dash Kicks', type: 'SHOES' as const, rarity: 'RARE' as const, priceCoins: 85, unlockLevel: 2 },
  { slug: 'shoes-hover', name: 'Neon Hover Boots', type: 'SHOES' as const, rarity: 'EPIC' as const, priceCoins: 200, unlockLevel: 4 },
  // Effects
  { slug: 'fx-sparkle', name: 'Cyan Spark Trail', type: 'EFFECT' as const, rarity: 'RARE' as const, priceCoins: 110, unlockLevel: 2, color: '#00D1FF' },
  { slug: 'fx-aurora', name: 'Aurora Aura', type: 'EFFECT' as const, rarity: 'LEGENDARY' as const, priceCoins: 280, unlockLevel: 5, color: '#A855F7' },
];

export const achievementSeeds = [
  { slug: 'first-lesson', title: 'First Step Forward', description: 'Complete your very first English lesson.', icon: 'BookOpen', category: 'learning', metric: 'lessons_completed', threshold: 1, xpReward: 25, coinReward: 30, rarity: 'COMMON' as const },
  { slug: 'lessons-5', title: 'Dedicated Scholar', description: 'Complete 5 English lessons across any track.', icon: 'GraduationCap', category: 'learning', metric: 'lessons_completed', threshold: 5, xpReward: 50, coinReward: 60, rarity: 'RARE' as const },
  { slug: 'lessons-10', title: 'Curriculum Conqueror', description: 'Complete 10 lessons and earn the Fluency Crown!', icon: 'Crown', category: 'mastery', metric: 'lessons_completed', threshold: 10, xpReward: 100, coinReward: 120, itemRewardSlug: 'acc-crown', rarity: 'LEGENDARY' as const },
  { slug: 'perfect-quiz', title: 'Sharp Shooter', description: 'Score 100% on an interactive lesson exercise.', icon: 'Target', category: 'mastery', metric: 'perfect_exercises', threshold: 1, xpReward: 20, coinReward: 25, rarity: 'COMMON' as const },
  { slug: 'streak-3', title: '3-Day Momentum', description: 'Learn English 3 days in a row.', icon: 'Flame', category: 'streak', metric: 'streak_days', threshold: 3, xpReward: 30, coinReward: 40, rarity: 'COMMON' as const },
  { slug: 'streak-7', title: 'Weekly Unstoppable', description: 'Maintain a 7-day learning streak.', icon: 'Zap', category: 'streak', metric: 'streak_days', threshold: 7, xpReward: 75, coinReward: 100, rarity: 'EPIC' as const },
  { slug: 'first-game', title: 'Player One', description: 'Finish your first educational game session.', icon: 'Gamepad2', category: 'games', metric: 'games_played', threshold: 1, xpReward: 20, coinReward: 30, rarity: 'COMMON' as const },
  { slug: 'dash-500', title: 'Subway Scholar', description: 'Run 500m in a single English Dash run.', icon: 'Rocket', category: 'games', metric: 'dash_distance', threshold: 500, xpReward: 40, coinReward: 60, rarity: 'RARE' as const },
  { slug: 'city-architect', title: 'English City Architect', description: 'Construct 3 buildings in your virtual city.', icon: 'Building2', category: 'games', metric: 'city_buildings', threshold: 3, xpReward: 40, coinReward: 50, rarity: 'RARE' as const },
  { slug: 'sim-talker', title: 'Real-World Speaker', description: 'Complete 2 Life Simulator conversations.', icon: 'MessageCircle', category: 'games', metric: 'sim_conversations', threshold: 2, xpReward: 35, coinReward: 45, rarity: 'RARE' as const },
  { slug: 'assessment-pass', title: 'Certified Challenger', description: 'Pass an English or Career assessment.', icon: 'Award', category: 'mastery', metric: 'assessments_passed', threshold: 1, xpReward: 50, coinReward: 60, rarity: 'RARE' as const },
  { slug: 'xp-500', title: 'Quantum Learner', description: 'Reach 500 total XP and unlock Quantum Neon Armor!', icon: 'Sparkles', category: 'mastery', metric: 'xp_total', threshold: 500, xpReward: 50, coinReward: 100, itemRewardSlug: 'outfit-cyber-legend', rarity: 'LEGENDARY' as const },
];

export const missionSeeds = [
  { slug: 'daily-xp-50', title: 'Daily Goal Sprint', description: 'Earn 50 XP today across lessons or games.', period: 'DAILY' as const, metric: 'xp_earned', target: 50, xpReward: 20, coinReward: 30 },
  { slug: 'daily-lesson-1', title: 'Today’s Lesson', description: 'Complete 1 English lesson today.', period: 'DAILY' as const, metric: 'lessons_completed', target: 1, xpReward: 15, coinReward: 25 },
  { slug: 'daily-correct-5', title: 'Accuracy Builder', description: 'Answer 5 English challenges correctly today.', period: 'DAILY' as const, metric: 'correct_answers', target: 5, xpReward: 15, coinReward: 20 },
  { slug: 'daily-dash-300', title: 'English Dash Warmup', description: 'Reach 300m in a single English Dash run.', period: 'DAILY' as const, metric: 'dash_distance', target: 300, xpReward: 20, coinReward: 35, gameSlug: 'english-dash' },
  { slug: 'weekly-games-3', title: 'Arcade Explorer', description: 'Play 3 educational games this week.', period: 'WEEKLY' as const, metric: 'games_played', target: 3, xpReward: 45, coinReward: 70 },
  { slug: 'weekly-lessons-4', title: 'Weekly Scholar', description: 'Complete 4 lessons this week.', period: 'WEEKLY' as const, metric: 'lessons_completed', target: 4, xpReward: 60, coinReward: 90 },
  { slug: 'weekly-puzzles-2', title: 'Puzzle Tactician', description: 'Solve 2 Word Puzzle Quest rounds this week.', period: 'WEEKLY' as const, metric: 'puzzles_solved', target: 2, xpReward: 35, coinReward: 55, gameSlug: 'word-puzzle' },
];

export const challengeSeeds = [
  {
    slug: 'weekly-vocab-sprint',
    title: '7-Day Vocabulary & Idioms Sprint',
    description: 'Review words in the Vocabulary Lab or Word Puzzle Quest and climb the weekly community challenge.',
    period: 'WEEKLY' as const,
    metric: 'correct_answers',
    target: 25,
    xpReward: 75,
  },
  {
    slug: 'smk-career-challenge',
    title: 'Workplace & Interview Fluency Week',
    description: 'Practice Vocational English lessons and Life Simulator scenarios to boost career readiness.',
    period: 'WEEKLY' as const,
    metric: 'lessons_completed',
    target: 3,
    xpReward: 80,
  },
  {
    slug: 'dash-marathon',
    title: 'English Dash 1,000m Cup',
    description: 'Push your English Dash distance and answer word gates at top speed!',
    period: 'DAILY' as const,
    metric: 'dash_distance',
    target: 1000,
    xpReward: 50,
  },
];
