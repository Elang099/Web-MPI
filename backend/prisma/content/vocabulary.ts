import type { TopicSeed } from '@fec/shared';
import { b, fill, makeTopic, match, mcq } from './helpers.js';

export interface VocabSeed {
  word: string;
  phonetic?: string;
  partOfSpeech: string;
  meaning: string;
  example: string;
  category: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  synonyms: string[];
  antonyms: string[];
  emoji?: string;
}

export const vocabularyTopics: TopicSeed[] = [
  makeTopic(
    'everyday-and-school-vocab',
    'VOCABULARY',
    'Daily & School Vocabulary',
    'Essential English words for home, daily routines, classrooms, and academic study.',
    [
      {
        slug: 'daily-and-school-life',
        title: 'Daily Routines & School Life',
        summary: 'High-frequency words for morning habits, school subjects, and study skills.',
        level: 'BEGINNER',
        audiences: ['SMP', 'GENERAL'],
        durationMin: 10,
        emoji: '🎒',
        blocks: [
          b.objectives([
            'Use 8 core daily & school words in natural sentences.',
            'Practice pronunciation and spelling with interactive word cards.',
          ]),
          b.wordCards([
            { word: 'schedule', phonetic: '/ˈskedʒuːl/', pos: 'noun', meaning: 'a plan of activities and times', example: 'Check your class schedule before Monday.', emoji: '📅' },
            { word: 'assignment', phonetic: '/əˈsaɪnmənt/', pos: 'noun', meaning: 'a task or homework given by a teacher', example: 'We submitted our English assignment early.', emoji: '📝' },
            { word: 'curious', phonetic: '/ˈkjʊəriəs/', pos: 'adjective', meaning: 'eager to learn or know more', example: 'Curious students ask thoughtful questions.', emoji: '🔎' },
            { word: 'routine', phonetic: '/ruːˈtiːn/', pos: 'noun', meaning: 'the usual way you do things each day', example: 'Reading for 15 minutes is my evening routine.', emoji: '⏰' },
            { word: 'collaborate', phonetic: '/kəˈlæbəreɪt/', pos: 'verb', meaning: 'work together with someone', example: 'Students collaborate on the science poster.', emoji: '🤝' },
            { word: 'library', phonetic: '/ˈlaɪbrəri/', pos: 'noun', meaning: 'a place where books and media are kept for study', example: 'Let’s meet at the library after class.', emoji: '📚' },
          ], 'Tap each card to hear & flip'),
          b.quickCheck(
            'Which word means "working together as a team"?',
            ['routine', 'collaborate', 'schedule', 'assignment'],
            'collaborate',
            '"Collaborate" means to work together toward a shared goal.',
          ),
        ],
        exercises: [
          mcq('Which word refers to homework or a task assigned by a teacher?', ['routine', 'assignment', 'library', 'curious'], 'assignment', 'An assignment is a task given for school or work.', 'VOCABULARY', 'BEGINNER'),
          fill('Complete: "Reading before bed is part of my nightly ___."', 'routine', '"Routine" means a regular daily habit.', 'r _ _ _ _ _ e', 'VOCABULARY', 'BEGINNER'),
          match('Match each word to its meaning:', [
            ['schedule', 'time plan'],
            ['curious', 'eager to learn'],
            ['collaborate', 'work together'],
          ], 'Great job connecting meanings!', 'VOCABULARY', 'BEGINNER'),
        ],
      },
      {
        slug: 'academic-vocabulary',
        title: 'Academic Vocabulary for Essays & Exams',
        summary: 'Upgrade everyday words into crisp academic English for SMA, SMK, and university.',
        level: 'INTERMEDIATE',
        audiences: ['SMA', 'SMK', 'GENERAL'],
        durationMin: 12,
        emoji: '🎓',
        blocks: [
          b.objectives([
            'Replace casual verbs with precise academic words (`analyze, evaluate, significant`).',
            'Use academic vocabulary in essays and reading passages.',
          ]),
          b.wordCards([
            { word: 'analyze', phonetic: '/ˈænəlaɪz/', pos: 'verb', meaning: 'examine something carefully in detail', example: 'First, analyze the chart before writing your conclusion.', emoji: '📊' },
            { word: 'evidence', phonetic: '/ˈevɪdəns/', pos: 'noun', meaning: 'facts or proof showing something is true', example: 'Support every argument with clear evidence.', emoji: '🔍' },
            { word: 'significant', phonetic: '/sɪɡˈnɪfɪkənt/', pos: 'adjective', meaning: 'important or noticeable enough to matter', example: 'Daily practice produces a significant boost in fluency.', emoji: '⭐' },
            { word: 'demonstrate', phonetic: '/ˈdemənstreɪt/', pos: 'verb', meaning: 'show clearly how something works or is true', example: 'The experiment demonstrates how heat travels.', emoji: '🧪' },
          ]),
          b.quickCheck(
            'Which academic verb best replaces "look carefully at" in an essay?',
            ['ignore', 'analyze', 'guess', 'copy'],
            'analyze',
            '**Analyze** means to examine parts carefully to understand or explain.',
          ),
        ],
        exercises: [
          mcq('Every strong opinion paragraph needs supporting ___.', ['evidence', 'rumors', 'greetings', 'margins'], 'evidence', 'Evidence provides facts or examples that prove your claim.', 'VOCABULARY', 'INTERMEDIATE'),
          fill('Complete: "The survey showed a ___ (big/important) increase in reading speed."', 'significant', '"Significant" means notably large or important.', 's _ _ _ _ _ _ _ _ _ t', 'VOCABULARY', 'INTERMEDIATE'),
          match('Match casual phrases to academic words:', [
            ['show clearly', 'demonstrate'],
            ['examine closely', 'analyze'],
            ['proof/facts', 'evidence'],
          ], 'Academic vocabulary makes writing sharper.', 'VOCABULARY', 'INTERMEDIATE'),
        ],
      },
    ],
  ),

  makeTopic(
    'work-tech-travel-food-vocab',
    'VOCABULARY',
    'Workplace, Business, Technology, Travel & Food',
    'Practical English vocabulary for offices, tech teams, airports, hotels, and restaurants.',
    [
      {
        slug: 'workplace-business-technology',
        title: 'Workplace, Business & Technology English',
        summary: 'Speak confidently about projects, meetings, startups, and modern tools.',
        level: 'INTERMEDIATE',
        audiences: ['SMA', 'SMK', 'GENERAL'],
        durationMin: 12,
        emoji: '💻',
        blocks: [
          b.objectives([
            'Master key words across office life, business, and software/tech.',
            'Understand workplace expressions like *deadline, stakeholder, deploy, bandwidth*.',
          ]),
          b.wordCards([
            { word: 'deadline', phonetic: '/ˈdedlaɪn/', pos: 'noun', meaning: 'the latest time a task must be finished', example: 'Our project deadline is Friday at 5 PM.', emoji: '⏳' },
            { word: 'negotiate', phonetic: '/nɪˈɡəʊʃieɪt/', pos: 'verb', meaning: 'discuss terms to reach an agreement', example: 'Both teams met to negotiate the contract.', emoji: '💼' },
            { word: 'innovative', phonetic: '/ˈɪnəveɪtɪv/', pos: 'adjective', meaning: 'using new and creative ideas', example: 'They built an innovative AI study tool.', emoji: '💡' },
            { word: 'deploy', phonetic: '/dɪˈplɔɪ/', pos: 'verb', meaning: 'release software or put resources into action', example: 'The developers deployed the update overnight.', emoji: '🚀' },
            { word: 'productivity', phonetic: '/ˌprɒdʌkˈtɪvəti/', pos: 'noun', meaning: 'how efficiently useful work gets done', example: 'Quiet focus blocks doubled our productivity.', emoji: '📈' },
            { word: 'feedback', phonetic: '/ˈfiːdbæk/', pos: 'noun', meaning: 'helpful comments for improvement', example: 'Constructive feedback helps every designer grow.', emoji: '💬' },
          ]),
          b.sort(
            'Group each term into Business/Workplace or Technology:',
            ['Business & Workplace', 'Technology'],
            [
              { text: 'invoice', bucket: 'Business & Workplace' },
              { text: 'database', bucket: 'Technology' },
              { text: 'negotiate', bucket: 'Business & Workplace' },
              { text: 'encryption', bucket: 'Technology' },
            ],
          ),
        ],
        exercises: [
          mcq('If you finish a report before the ___, you submit it on time.', ['deadline', 'browser', 'receipt', 'keyboard'], 'deadline', 'A deadline is the due date/time for finishing work.', 'VOCABULARY', 'INTERMEDIATE'),
          fill('Complete: "The team gave helpful ___ on my presentation slides."', 'feedback', '"Feedback" is constructive comments on your work.', 'f _ _ _ _ _ _ k', 'VOCABULARY', 'INTERMEDIATE'),
          mcq('In software, what does **deploy** mean?', ['delete a file', 'publish/release into live use', 'turn off the monitor', 'write an email'], 'publish/release into live use', 'Deploying pushes code or a system live for users.', 'VOCABULARY', 'INTERMEDIATE'),
        ],
      },
      {
        slug: 'travel-and-restaurant-vocab',
        title: 'Travel, Airport & Restaurant English',
        summary: 'Navigate boarding passes, hotels, menus, and polite requests anywhere in the world.',
        level: 'BEGINNER',
        audiences: ['SMP', 'SMA', 'SMK', 'GENERAL'],
        durationMin: 11,
        emoji: '✈️',
        blocks: [
          b.objectives([
            'Handle airport check-in, hotel reservations, and directions.',
            'Order food politely and discuss dietary preferences at a restaurant.',
          ]),
          b.wordCards([
            { word: 'itinerary', phonetic: '/aɪˈtɪnərəri/', pos: 'noun', meaning: 'a planned travel route and schedule', example: 'Our Bali itinerary includes three museums.', emoji: '🗺️' },
            { word: 'boarding pass', phonetic: '/ˈbɔːdɪŋ pɑːs/', pos: 'noun', meaning: 'the document allowing you onto a plane', example: 'Keep your passport and boarding pass ready at Gate 4.', emoji: '🎫' },
            { word: 'reservation', phonetic: '/ˌrezəˈveɪʃən/', pos: 'noun', meaning: 'a booking for a table, room, or seat', example: 'I have a reservation for two under the name Dika.', emoji: '🛎️' },
            { word: 'appetizer', phonetic: '/ˈæpɪtaɪzər/', pos: 'noun', meaning: 'a small starter dish before the main meal', example: 'Would you like soup or salad as an appetizer?', emoji: '🥗' },
            { word: 'beverage', phonetic: '/ˈbevərɪdʒ/', pos: 'noun', meaning: 'any drink (water, tea, juice, coffee)', example: 'May I bring you a hot or cold beverage?', emoji: '🥤' },
            { word: 'receipt', phonetic: '/rɪˈsiːt/', pos: 'noun', meaning: 'printed proof of payment (silent p!)', example: 'Could I have the bill and a receipt, please?', emoji: '🧾' },
          ]),
          b.quickCheck(
            'Which letter is SILENT in the word **receipt**?',
            ['r', 'c', 'p', 't'],
            'p',
            'Say **/rɪˈsiːt/** — the "p" is completely silent!',
          ),
        ],
        exercises: [
          mcq('Which item do you show at the airport gate to enter the airplane?', ['appetizer', 'boarding pass', 'menu', 'receipt'], 'boarding pass', 'A boarding pass confirms your seat and flight gate.', 'VOCABULARY', 'BEGINNER'),
          fill('Complete: "We booked a dinner ___ for 7 PM."', 'reservation', 'A reservation holds a table or room in advance.', 'r _ _ _ _ _ _ _ _ _ n', 'VOCABULARY', 'BEGINNER'),
          match('Match each travel/dining term:', [
            ['itinerary', 'travel plan'],
            ['beverage', 'drink'],
            ['appetizer', 'starter dish'],
          ], 'Ready for your next trip!', 'VOCABULARY', 'BEGINNER'),
        ],
      },
    ],
  ),

  makeTopic(
    'expressions-idioms-collocations',
    'VOCABULARY',
    'Expressions, Phrasal Verbs, Idioms, Synonyms, Antonyms & Collocations',
    'Sound truly natural with phrasal verbs, idioms, common word pairings, and rich synonyms/antonyms.',
    [
      {
        slug: 'phrasal-verbs-and-idioms',
        title: 'Phrasal Verbs, Idioms & Natural Expressions',
        summary: 'Understand figurative English like "figure out", "break the ice", and "hit the books".',
        level: 'INTERMEDIATE',
        audiences: ['SMA', 'SMK', 'GENERAL'],
        durationMin: 13,
        emoji: '✨',
        blocks: [
          b.objectives([
            'Decode 6 high-value phrasal verbs used in daily and work conversations.',
            'Understand popular English idioms and everyday expressions.',
          ]),
          b.wordCards([
            { word: 'figure out', pos: 'phrasal verb', meaning: 'understand or solve something', example: 'Don’t worry—we will figure out the solution together.', emoji: '🧠' },
            { word: 'look forward to', pos: 'phrasal verb', meaning: 'feel excited about something coming soon (+ V-ing)', example: 'I look forward to meeting your team!', emoji: '🌟' },
            { word: 'break the ice', pos: 'idiom', meaning: 'make people feel relaxed in a new situation', example: 'A quick game helped break the ice on day one.', emoji: '🧊' },
            { word: 'piece of cake', pos: 'idiom', meaning: 'very easy to do', example: 'After practicing all week, the grammar quiz was a piece of cake.', emoji: '🍰' },
            { word: 'call it a day', pos: 'idiom', meaning: 'stop working for the rest of the day', example: 'We finished three chapters—let’s call it a day!', emoji: '🌙' },
            { word: 'turn down', pos: 'phrasal verb', meaning: 'refuse an offer, or lower volume', example: 'Please turn down the music, or never turn down a good learning opportunity!', emoji: '🎚️' },
          ]),
          b.callout('tip', 'After **look forward to**, **to** is a preposition — so always follow it with a noun or **V-ing**: *"I look forward to **hearing** from you"*, not *"to hear"*.'),
          b.quickCheck(
            'If an exam was "a piece of cake", how was it?',
            ['very tasty', 'very difficult', 'very easy', 'cancelled'],
            'very easy',
            '"A piece of cake" is an idiom meaning effortless or very easy.',
          ),
        ],
        exercises: [
          mcq('What does **figure out** mean?', ['give up', 'solve or understand', 'leave early', 'postpone'], 'solve or understand', '"Figure out" means to find the answer or understand something.', 'VOCABULARY', 'INTERMEDIATE'),
          mcq('Choose the natural ending: "I look forward to ___ you soon."', ['see', 'seeing', 'saw', 'seen'], 'seeing', '"To" in "look forward to" is a preposition → followed by V-ing.', 'GRAMMAR', 'INTERMEDIATE'),
          match('Match each idiom/phrasal verb to its meaning:', [
            ['break the ice', 'reduce awkwardness'],
            ['call it a day', 'stop working now'],
            ['piece of cake', 'very easy'],
            ['turn down', 'refuse an offer'],
          ], 'Mastering idioms makes movies and conversations way easier!', 'VOCABULARY', 'INTERMEDIATE'),
        ],
      },
      {
        slug: 'synonyms-antonyms-collocations',
        title: 'Synonyms, Antonyms & Natural Collocations',
        summary: 'Pair words the way fluent speakers do ("make a decision", "heavy rain") and expand your vocabulary range.',
        level: 'INTERMEDIATE',
        audiences: ['SMA', 'SMK', 'GENERAL'],
        durationMin: 12,
        emoji: '🎭',
        blocks: [
          b.objectives([
            'Distinguish **make vs. do** and common English collocations.',
            'Choose vivid synonyms and accurate antonyms in context.',
          ]),
          b.table(
            ['Verb', 'Natural Collocations', 'Example'],
            [
              ['make', 'make a decision, make progress, make a mistake, make an effort', 'You are making steady progress!'],
              ['do', 'do homework, do research, do your best, do a favor', 'Always do your best on practice drills.'],
              ['take', 'take notes, take a break, take responsibility, take part', 'Remember to take notes during the lecture.'],
              ['keep', 'keep a promise, keep in touch, keep calm', 'Let’s keep in touch after graduation!'],
            ],
            'Power Collocations',
          ),
          b.sort(
            'Sort these collocations under **MAKE** or **DO**:',
            ['MAKE', 'DO'],
            [
              { text: 'a decision', bucket: 'MAKE' },
              { text: 'homework', bucket: 'DO' },
              { text: 'progress', bucket: 'MAKE' },
              { text: 'research', bucket: 'DO' },
            ],
          ),
        ],
        exercises: [
          mcq('Which verb pairs naturally with **a decision**?', ['do', 'make', 'take', 'say'], 'make', 'English speakers say **make a decision**, not "do a decision".', 'VOCABULARY', 'INTERMEDIATE'),
          mcq('What is an **antonym** of *scarce* (rare)?', ['abundant', 'tiny', 'empty', 'silent'], 'abundant', '**Abundant** (plentiful) is the opposite of **scarce**.', 'VOCABULARY', 'ADVANCED'),
          mcq('What is a **synonym** of *resilient*?', ['fragile', 'adaptable', 'lazy', 'careless'], 'adaptable', 'Both describe someone who recovers and adapts well.', 'VOCABULARY', 'INTERMEDIATE'),
          match('Match each word to its antonym:', [
            ['optimistic', 'pessimistic'],
            ['expand', 'shrink'],
            ['ancient', 'modern'],
            ['temporary', 'permanent'],
          ], 'Antonym pairs sharpen reading comprehension.', 'VOCABULARY', 'INTERMEDIATE'),
        ],
      },
    ],
  ),
];

export const vocabularyBank: VocabSeed[] = [
  // Daily
  { word: 'routine', phonetic: '/ruːˈtiːn/', partOfSpeech: 'noun', meaning: 'a regular sequence of daily actions', example: 'A morning study routine builds consistency.', category: 'daily', level: 'BEGINNER', synonyms: ['habit', 'pattern'], antonyms: ['chaos'], emoji: '⏰' },
  { word: 'errand', phonetic: '/ˈerənd/', partOfSpeech: 'noun', meaning: 'a short trip to buy or deliver something', example: 'I need to run a quick errand at the post office.', category: 'daily', level: 'INTERMEDIATE', synonyms: ['task', 'chore'], antonyms: ['vacation'], emoji: '🛍️' },
  { word: 'punctual', phonetic: '/ˈpʌŋktʃuəl/', partOfSpeech: 'adjective', meaning: 'arriving or doing things right on time', example: 'Being punctual shows respect for others.', category: 'daily', level: 'INTERMEDIATE', synonyms: ['on-time', 'prompt'], antonyms: ['late', 'tardy'], emoji: '⌚' },
  { word: 'tidy', phonetic: '/ˈtaɪdi/', partOfSpeech: 'adjective', meaning: 'neat and organized', example: 'Keep your desk tidy so you can focus.', category: 'daily', level: 'BEGINNER', synonyms: ['neat', 'orderly'], antonyms: ['messy'], emoji: '🧹' },
  { word: 'refreshing', phonetic: '/rɪˈfreʃɪŋ/', partOfSpeech: 'adjective', meaning: 'making you feel energized again', example: 'A short walk after studying is refreshing.', category: 'daily', level: 'BEGINNER', synonyms: ['revitalizing', 'cool'], antonyms: ['exhausting'], emoji: '💧' },
  // School
  { word: 'assignment', phonetic: '/əˈsaɪnmənt/', partOfSpeech: 'noun', meaning: 'homework or a project given by a teacher', example: 'Submit your writing assignment before 8 PM.', category: 'school', level: 'BEGINNER', synonyms: ['task', 'homework'], antonyms: ['break'], emoji: '📝' },
  { word: 'curriculum', phonetic: '/kəˈrɪkjələm/', partOfSpeech: 'noun', meaning: 'the subjects and lessons taught in a school', example: 'The new curriculum blends speaking and digital skills.', category: 'school', level: 'INTERMEDIATE', synonyms: ['syllabus', 'program'], antonyms: [], emoji: '📘' },
  { word: 'scholarship', phonetic: '/ˈskɒləʃɪp/', partOfSpeech: 'noun', meaning: 'financial award to support a student’s education', example: 'Strong English skills help you win an international scholarship.', category: 'school', level: 'INTERMEDIATE', synonyms: ['grant', 'fellowship'], antonyms: ['debt'], emoji: '🎓' },
  { word: 'rehearse', phonetic: '/rɪˈhɜːs/', partOfSpeech: 'verb', meaning: 'practice a speech or performance beforehand', example: 'Let’s rehearse our dialogue twice before recording.', category: 'school', level: 'INTERMEDIATE', synonyms: ['practice', 'drill'], antonyms: ['improvise'], emoji: '🎭' },
  // Academic
  { word: 'analyze', phonetic: '/ˈænəlaɪz/', partOfSpeech: 'verb', meaning: 'examine something closely to understand it', example: 'Analyze the author’s main claim in paragraph two.', category: 'academic', level: 'INTERMEDIATE', synonyms: ['examine', 'inspect'], antonyms: ['ignore'], emoji: '🔎' },
  { word: 'evidence', phonetic: '/ˈevɪdəns/', partOfSpeech: 'noun', meaning: 'facts or examples proving an idea', example: 'Cite clear evidence in your essay.', category: 'academic', level: 'INTERMEDIATE', synonyms: ['proof', 'data'], antonyms: ['guesswork'], emoji: '📄' },
  { word: 'hypothesis', phonetic: '/haɪˈpɒθəsɪs/', partOfSpeech: 'noun', meaning: 'an educated guess tested by an experiment', example: 'Our science team tested the hypothesis in the lab.', category: 'academic', level: 'ADVANCED', synonyms: ['theory', 'assumption'], antonyms: ['certainty'], emoji: '🔬' },
  { word: 'concise', phonetic: '/kənˈsaɪs/', partOfSpeech: 'adjective', meaning: 'clear and brief without extra words', example: 'Write a concise 3-sentence summary.', category: 'academic', level: 'ADVANCED', synonyms: ['brief', 'succinct'], antonyms: ['wordy', 'lengthy'], emoji: '✂️' },
  { word: 'coherent', phonetic: '/kəʊˈhɪərənt/', partOfSpeech: 'adjective', meaning: 'logical, clear, and easy to follow', example: 'Good linking words keep your essay coherent.', category: 'academic', level: 'ADVANCED', synonyms: ['logical', 'clear'], antonyms: ['confused'], emoji: '🧩' },
  // Workplace & Business
  { word: 'collaborate', phonetic: '/kəˈlæbəreɪt/', partOfSpeech: 'verb', meaning: 'work together toward a shared outcome', example: 'Engineers and teachers collaborate to build lessons.', category: 'workplace', level: 'INTERMEDIATE', synonyms: ['cooperate', 'partner'], antonyms: ['compete'], emoji: '🤝' },
  { word: 'deadline', phonetic: '/ˈdedlaɪn/', partOfSpeech: 'noun', meaning: 'the final time by which work must be done', example: 'We met every project deadline this month.', category: 'workplace', level: 'BEGINNER', synonyms: ['due date', 'cutoff'], antonyms: ['extension'], emoji: '⏳' },
  { word: 'agenda', phonetic: '/əˈdʒendə/', partOfSpeech: 'noun', meaning: 'list of topics to discuss in a meeting', example: 'Item one on today’s agenda is customer feedback.', category: 'business', level: 'INTERMEDIATE', synonyms: ['schedule', 'plan'], antonyms: [], emoji: '📋' },
  { word: 'negotiate', phonetic: '/nɪˈɡəʊʃieɪt/', partOfSpeech: 'verb', meaning: 'discuss terms to reach mutual agreement', example: 'They negotiated a fair partnership deal.', category: 'business', level: 'INTERMEDIATE', synonyms: ['discuss', 'mediate'], antonyms: ['refuse'], emoji: '💼' },
  { word: 'revenue', phonetic: '/ˈrevənjuː/', partOfSpeech: 'noun', meaning: 'total income generated by a business', example: 'Online courses increased company revenue by 30%.', category: 'business', level: 'ADVANCED', synonyms: ['income', 'earnings'], antonyms: ['expense', 'loss'], emoji: '💰' },
  { word: 'stakeholder', phonetic: '/ˈsteɪkhəʊldər/', partOfSpeech: 'noun', meaning: 'anyone affected by or invested in a project', example: 'Share the progress report with every stakeholder.', category: 'business', level: 'ADVANCED', synonyms: ['partner', 'investor'], antonyms: [], emoji: '👥' },
  // Technology
  { word: 'algorithm', phonetic: '/ˈælɡərɪðəm/', partOfSpeech: 'noun', meaning: 'step-by-step rules a computer follows to solve a problem', example: 'The search algorithm finds matching words in milliseconds.', category: 'technology', level: 'INTERMEDIATE', synonyms: ['procedure', 'formula'], antonyms: [], emoji: '⚙️' },
  { word: 'deploy', phonetic: '/dɪˈplɔɪ/', partOfSpeech: 'verb', meaning: 'release software so users can access it', example: 'We deploy updates after all tests pass.', category: 'technology', level: 'INTERMEDIATE', synonyms: ['launch', 'release'], antonyms: ['halt'], emoji: '🚀' },
  { word: 'bandwidth', phonetic: '/ˈbændwɪdθ/', partOfSpeech: 'noun', meaning: 'data transfer capacity (or mental time/capacity)', example: 'Fast Wi-Fi provides high bandwidth for video lessons.', category: 'technology', level: 'ADVANCED', synonyms: ['capacity', 'throughput'], antonyms: ['bottleneck'], emoji: '📡' },
  { word: 'cybersecurity', phonetic: '/ˌsaɪbəsɪˈkjʊərəti/', partOfSpeech: 'noun', meaning: 'protecting networks, data, and devices from attacks', example: 'Strong passwords are the first step in cybersecurity.', category: 'technology', level: 'INTERMEDIATE', synonyms: ['infosec', 'digital safety'], antonyms: ['vulnerability'], emoji: '🛡️' },
  // Travel & Food
  { word: 'itinerary', phonetic: '/aɪˈtɪnərəri/', partOfSpeech: 'noun', meaning: 'a planned travel schedule and destinations', example: 'Send me your flight itinerary before takeoff.', category: 'travel', level: 'INTERMEDIATE', synonyms: ['route', 'schedule'], antonyms: [], emoji: '🗺️' },
  { word: 'departure', phonetic: '/dɪˈpɑːtʃər/', partOfSpeech: 'noun', meaning: 'the act of leaving (plane, train, bus)', example: 'Check the departure board for Gate 12.', category: 'travel', level: 'BEGINNER', synonyms: ['exit', 'takeoff'], antonyms: ['arrival'], emoji: '🛫' },
  { word: 'accommodation', phonetic: '/əˌkɒməˈdeɪʃən/', partOfSpeech: 'noun', meaning: 'a place to stay such as a hotel or hostel', example: 'Our hotel accommodation includes breakfast.', category: 'travel', level: 'INTERMEDIATE', synonyms: ['lodging', 'housing'], antonyms: [], emoji: '🏨' },
  { word: 'appetizer', phonetic: '/ˈæpɪtaɪzər/', partOfSpeech: 'noun', meaning: 'a small dish served before the main course', example: 'Would you like garlic bread as an appetizer?', category: 'food', level: 'BEGINNER', synonyms: ['starter'], antonyms: ['dessert'], emoji: '🥗' },
  { word: 'beverage', phonetic: '/ˈbevərɪdʒ/', partOfSpeech: 'noun', meaning: 'a drink of any kind', example: 'Complimentary beverages are served on the flight.', category: 'food', level: 'BEGINNER', synonyms: ['drink', 'refreshment'], antonyms: [], emoji: '🥤' },
  { word: 'nutritious', phonetic: '/njuːˈtrɪʃəs/', partOfSpeech: 'adjective', meaning: 'rich in healthy nutrients', example: 'A nutritious breakfast fuels your brain for learning.', category: 'food', level: 'INTERMEDIATE', synonyms: ['healthy', 'wholesome'], antonyms: ['unhealthy'], emoji: '🥑' },
  // Phrasal verbs, idioms, collocations
  { word: 'figure out', partOfSpeech: 'phrasal verb', meaning: 'understand or find the answer to something', example: 'Together we can figure out this grammar rule.', category: 'phrasal', level: 'INTERMEDIATE', synonyms: ['solve', 'discover'], antonyms: ['ignore'], emoji: '💡' },
  { word: 'carry out', partOfSpeech: 'phrasal verb', meaning: 'perform or complete a plan, study, or task', example: 'Students will carry out a short survey.', category: 'phrasal', level: 'INTERMEDIATE', synonyms: ['execute', 'perform'], antonyms: ['abandon'], emoji: '✅' },
  { word: 'look forward to', partOfSpeech: 'phrasal verb', meaning: 'feel happy and excited about something upcoming', example: 'I look forward to seeing your new city!', category: 'phrasal', level: 'BEGINNER', synonyms: ['anticipate', 'await'], antonyms: ['dread'], emoji: '🌟' },
  { word: 'break the ice', partOfSpeech: 'idiom', meaning: 'help strangers feel relaxed and start talking', example: 'Asking about favorite games helps break the ice.', category: 'idiom', level: 'INTERMEDIATE', synonyms: ['warm up'], antonyms: [], emoji: '🧊' },
  { word: 'piece of cake', partOfSpeech: 'idiom', meaning: 'something very easy to accomplish', example: 'With practice, reading articles becomes a piece of cake.', category: 'idiom', level: 'BEGINNER', synonyms: ['effortless', 'breeze'], antonyms: ['uphill battle'], emoji: '🍰' },
  { word: 'resilient', phonetic: '/rɪˈzɪliənt/', partOfSpeech: 'adjective', meaning: 'able to bounce back quickly from setbacks', example: 'Resilient learners treat mistakes as stepping stones.', category: 'collocation', level: 'ADVANCED', synonyms: ['adaptable', 'strong'], antonyms: ['fragile'], emoji: '🌱' },
];
