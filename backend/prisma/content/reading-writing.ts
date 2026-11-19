import type { TopicSeed } from '@fec/shared';
import { b, fill, makeTopic, mcq, order, tf } from './helpers.js';

export const readingTopics: TopicSeed[] = [
  makeTopic(
    'reading-strategies-and-comprehension',
    'READING',
    'Reading Strategies: Main Idea, Details, Inference & Context Clues',
    'Unlock faster, deeper reading across short stories, articles, dialogues and informational texts.',
    [
      {
        slug: 'main-idea-and-supporting-details',
        title: 'Main Idea & Supporting Details',
        summary: 'Spot the core message of any paragraph and separate major points from small examples.',
        level: 'BEGINNER',
        audiences: ['SMP', 'SMA', 'GENERAL'],
        durationMin: 11,
        emoji: '🎯',
        blocks: [
          b.objectives([
            'Find the topic sentence and main idea of an informational paragraph.',
            'Distinguish supporting evidence from unrelated statements.',
          ]),
          b.steps(
            [
              { title: '1. Ask "Who or what is this mostly about?"', body: 'That gives you the **topic** (usually 1–3 words).' },
              { title: '2. Ask "What is the key point about that topic?"', body: 'Often found in the **first** or **last** sentence of a paragraph.' },
              { title: '3. Check the details', body: 'Facts, numbers, and examples **support** the main idea—they don’t replace it.' },
            ],
            '3-Step Main Idea Strategy',
          ),
          b.reading(
            'Urban Vertical Gardens',
            'As cities grow denser, rooftop and vertical gardens are transforming concrete walls into living ecosystems. Plants grown vertically cool surrounding buildings by up to 4°C in summer, filter dust from busy streets, and provide fresh herbs and vegetables just steps from local kitchens. Schools in several cities have even turned hallway balconies into outdoor biology classrooms.',
            [
              { word: 'denser', meaning: 'more crowded with buildings and people' },
              { word: 'ecosystem', meaning: 'a living community of plants, animals, and their environment' },
            ],
          ),
          b.quickCheck(
            'What is the **main idea** of "Urban Vertical Gardens"?',
            ['Hallway balconies are hard to water.', 'Vertical gardens bring cooling, cleaner air, food, and learning spaces to dense cities.', 'Concrete walls never get hot in summer.', 'Only biology teachers use herbs.'],
            'Vertical gardens bring cooling, cleaner air, food, and learning spaces to dense cities.',
            'All the details (cooling by 4°C, filtering dust, fresh food, classrooms) support how vertical gardens benefit cities.',
          ),
        ],
        exercises: [
          mcq('According to the passage, how much can vertical plants cool buildings in summer?', ['Up to 4°C', 'Up to 14°C', 'Up to 2°C', 'Not mentioned'], 'Up to 4°C', 'Directly stated: "cool surrounding buildings by up to 4°C in summer".', 'READING', 'BEGINNER'),
          tf('True or False: Vertical gardens only work in rural villages.', 'False', 'The passage describes transforming city concrete walls and school balconies.', 'READING', 'BEGINNER'),
          mcq('Which sentence is a **supporting detail** rather than the main idea?', ['Vertical gardens improve urban life in multiple ways.', 'Plants filter dust from busy streets.', 'Cities are transforming spaces creatively.', 'Green architecture matters.'], 'Plants filter dust from busy streets.', 'Filtering dust is one specific example supporting the broader main idea.', 'READING', 'BEGINNER'),
        ],
      },
      {
        slug: 'inference-and-context-clues',
        title: 'Inference & Context Clues (Articles & Short Stories)',
        summary: 'Read between the lines and figure out unfamiliar words without reaching for a dictionary.',
        level: 'INTERMEDIATE',
        audiences: ['SMA', 'SMK', 'GENERAL'],
        durationMin: 13,
        emoji: '🕵️',
        blocks: [
          b.objectives([
            'Infer characters’ feelings and unstated conclusions from textual clues.',
            'Use surrounding context clues (synonyms, contrast, examples) to decode new words.',
          ]),
          b.callout('tip', 'Four common **Context Clues**: Definition (*"x, meaning y"*), Synonym (*"or"*), Contrast (*"unlike, however"*), and Example (*"such as"*).'),
          b.reading(
            'The Last Train at Platform 3',
            'Mira glanced at the glowing departures board, then tucked her soggy umbrella under her arm. She had sprinted four blocks only to watch the red tail-lights of the 9:15 train slide silently into the mist. Instead of groaning, she let out a slow breath, pulled her English audiobook from her bag, and sat down on the wooden bench. The next train wouldn’t arrive for forty minutes, and she intended to finish Chapter Four.',
            [
              { word: 'soggy', meaning: 'very wet and soaked' },
              { word: 'intended', meaning: 'planned or decided to do' },
            ],
          ),
          b.quickCheck(
            'What can you **infer** about the weather in the story?',
            ['It is hot and sunny.', 'It has been raining.', 'It is snowing heavily.', 'There is a sandstorm.'],
            'It has been raining.',
            'Clues: "soggy umbrella" and "mist" imply rain without saying "It was raining".',
          ),
        ],
        exercises: [
          mcq('How does Mira react after missing the 9:15 train?', ['She yells at the guard.', 'She stays calm and decides to read/listen productively.', 'She runs onto the tracks.', 'She throws away her umbrella.'], 'She stays calm and decides to read/listen productively.', 'She lets out a slow breath and puts on her English audiobook.', 'READING', 'INTERMEDIATE'),
          mcq('Based on context, what does **soggy** mean?', ['broken in half', 'soaked with water', 'bright neon', 'brand new'], 'soaked with water', 'An umbrella gets soggy when used in rain.', 'VOCABULARY', 'INTERMEDIATE'),
          tf('True or False: Mira had plenty of time to walk slowly to the station.', 'False', 'She "sprinted four blocks" and still missed the train.', 'READING', 'INTERMEDIATE'),
        ],
      },
      {
        slug: 'dialogues-and-informational-texts',
        title: 'Reading Dialogues & Informational Texts',
        summary: 'Extract facts quickly from schedules, tech articles, and realistic workplace dialogues.',
        level: 'INTERMEDIATE',
        audiences: ['SMP', 'SMA', 'SMK', 'GENERAL'],
        durationMin: 11,
        emoji: '📰',
        blocks: [
          b.objectives([
            'Scan informational texts for dates, rules, and key numbers.',
            'Track speaker intentions and agreements in multi-turn dialogues.',
          ]),
          b.dialogue(
            [
              { speaker: 'Rafi', text: 'Have you seen the Digital Innovation Fair notice? Team registration closes this Thursday at 4 PM.' },
              { speaker: 'Nadia', text: 'Wait, really? I thought we had until Saturday!' },
              { speaker: 'Rafi', text: 'Saturday is the prototype demo day. Thursday is for submitting our 150-word English abstract.' },
              { speaker: 'Nadia', text: 'Good catch! Let’s draft the abstract together right after lunch.' },
            ],
            'School Project Dialogue',
          ),
          b.quickCheck(
            'What happens on **Saturday**?',
            ['Registration closes', 'Abstract submission', 'Prototype demo day', 'Winter break starts'],
            'Prototype demo day',
            'Rafi clarifies that Thursday is for the abstract and Saturday is the prototype demo day.',
          ),
        ],
        exercises: [
          mcq('When does team registration close?', ['Saturday morning', 'Thursday at 4 PM', 'Friday noon', 'Monday'], 'Thursday at 4 PM', 'Stated in Rafi’s first line.', 'READING', 'BEGINNER'),
          mcq('What must the team submit on Thursday?', ['A 10-page novel', 'A 150-word English abstract', 'A printed poster only', 'Ticket fees'], 'A 150-word English abstract', 'Rafi states Thursday is for submitting their 150-word English abstract.', 'READING', 'BEGINNER'),
          fill('Complete: "Nadia and Rafi plan to draft the abstract right after ___."', 'lunch', 'Nadia says: "Let’s draft the abstract together right after lunch."', 'l _ _ _ h', 'READING', 'BEGINNER'),
        ],
      },
    ],
  ),
];

export const writingTopics: TopicSeed[] = [
  makeTopic(
    'sentences-paragraphs-emails',
    'WRITING',
    'Sentence Construction, Paragraph Writing & Formal/Informal Emails',
    'Write crystal-clear sentences, unified paragraphs, and confident emails for school or work.',
    [
      {
        slug: 'sentence-and-paragraph-building',
        title: 'Sentence Construction & Paragraph Architecture',
        summary: 'Combine Subject–Verb–Object clarity with Topic Sentence → Evidence → Concluding Sentence paragraphs.',
        level: 'BEGINNER',
        audiences: ['SMP', 'SMA', 'SMK', 'GENERAL'],
        durationMin: 12,
        emoji: '🧱',
        blocks: [
          b.objectives([
            'Avoid run-on sentences and incomplete fragments.',
            'Structure a clear **hamburger paragraph**: Topic Sentence + 2–3 Supporting Details + Wrap-up.',
          ]),
          b.formula(
            [
              { label: '1. Topic Sentence', value: 'State your main point clearly', color: '#00D1FF' },
              { label: '2. Supporting Details', value: 'Add reasons, facts, or examples', color: '#7C5CFF' },
              { label: '3. Closing Sentence', value: 'Summarize or connect forward', color: '#22C55E' },
            ],
            '**Topic:** Morning walks boost focus. **Detail:** Fresh air increases energy before class. **Closing:** Just ten minutes outside makes studying easier.',
            'Paragraph Blueprint',
          ),
          b.sentenceBuilder('Fix the word order into a clean complex sentence:', ['we', 'practice,', 'more', 'The', 'we', 'confident', 'become.', 'more'], 'The more we practice, the more confident we become.'),
          b.writing(
            'Write one focused paragraph (at least 40 words) about **one habit that helps you learn better**. Include a clear topic sentence, two supporting sentences, and one concluding sentence.',
            40,
            ['Clear topic sentence', 'At least one linking word (First, Because, Furthermore)', 'Proper capitalization and end punctuation'],
            'Keeping a personal vocabulary notebook helps me remember new English words much faster. Whenever I read an article or play a word game, I write down two useful words with my own example sentence. Reviewing that list for five minutes before sleep turns passive words into active English I can actually use.',
          ),
        ],
        exercises: [
          mcq('Which sentence is a **complete sentence** (not a fragment)?', ['Because I studied late.', 'While running down the hall.', 'Studying daily builds real confidence.', 'The big green book on the shelf.'], 'Studying daily builds real confidence.', 'A complete sentence needs both a subject and a finite main verb ("builds").', 'WRITING', 'BEGINNER'),
          mcq('What is the job of a **topic sentence**?', ['List every tiny number in the text', 'Introduce the main idea of the paragraph', 'Say goodbye to the reader', 'Replace punctuation'], 'Introduce the main idea of the paragraph', 'The topic sentence acts like a mini headline for the paragraph.', 'WRITING', 'BEGINNER'),
          order('Order these sentences into a coherent 3-sentence paragraph:', ['First, open the app for ten minutes.', 'Building an English habit is simpler than you think.', 'Over a month, those minutes turn into real fluency.'], 'Building an English habit is simpler than you think. First, open the app for ten minutes. Over a month, those minutes turn into real fluency.', 'Topic sentence → supporting step → closing takeaway.', 'WRITING', 'INTERMEDIATE'),
        ],
      },
      {
        slug: 'formal-vs-informal-emails',
        title: 'Formal & Informal Emails',
        summary: 'Write polished internship/teacher emails and friendly messages to peers with the right tone.',
        level: 'INTERMEDIATE',
        audiences: ['SMA', 'SMK', 'GENERAL'],
        durationMin: 13,
        emoji: '✉️',
        blocks: [
          b.objectives([
            'Match greeting, tone, vocabulary, and sign-off to your reader.',
            'Write clear subject lines that get quick replies.',
          ]),
          b.table(
            ['Part', 'Formal Email (Teacher / HR / Client)', 'Informal Email (Friend / Classmate)'],
            [
              ['Subject', 'Internship Application — Rina Putri (SMK)', 'Quick question about Friday’s project!'],
              ['Greeting', 'Dear Ms. Kartika, / Dear Hiring Manager,', 'Hi Tara! / Hey Leo,'],
              ['Body Tone', 'Full forms ("I am writing to..."), polite modals ("Could you...")', 'Contractions ("I\'m excited..."), casual phrasing'],
              ['Closing', 'Sincerely, / Best regards,', 'Talk soon, / Cheers,'],
            ],
            'Formal vs. Informal Comparison',
          ),
          b.writing(
            'Write a **formal email** (at least 45 words) to a teacher or supervisor requesting a 15-minute meeting to review your English project.',
            45,
            ['Clear subject mention or formal greeting ("Dear ...")', 'Polite request ("I would like to request..." / "Could we meet...")', 'Professional closing ("Best regards," / "Sincerely,")'],
            'Dear Mr. Hendra,\n\nI hope this message finds you well. I am writing to request a brief 15-minute meeting this Thursday afternoon to review the draft of our team’s English presentation. Could you please let me know what time works best for you?\n\nThank you for your guidance.\n\nBest regards,\nDina Pratama',
          ),
        ],
        exercises: [
          mcq('Which closing fits a **formal job application email**?', ['Catch ya later!', 'Sincerely,', 'XOXO,', 'Heya,'], 'Sincerely,', '"Sincerely," or "Best regards," are standard professional sign-offs.', 'WRITING', 'INTERMEDIATE'),
          mcq('Which line is **too informal** for a message to a school principal?', ['I am writing to inquire about...', 'Thank you very much for your time.', 'Yo, can u check my grade real quick?', 'Could you please confirm the schedule?'], 'Yo, can u check my grade real quick?', 'Avoid slang ("Yo") and text abbreviations ("u") in formal emails.', 'WRITING', 'BEGINNER'),
          fill('Complete the polite request: "I am writing ___ inquire about the summer internship."', 'to', '"I am writing to + verb" is the classic formal email opener.', 't _', 'WRITING', 'INTERMEDIATE'),
        ],
      },
    ],
  ),

  makeTopic(
    'essays-exposition-creative-writing',
    'WRITING',
    'Essays, Expositions, Argumentative & Creative Writing',
    'Cover Descriptive, Narrative, Recount, Report, Procedure, Analytical Exposition, Argumentative Essays & Creative Writing.',
    [
      {
        slug: 'analytical-exposition-and-argumentative',
        title: 'Analytical Exposition, Argumentative Essays & Persuasive Flow',
        summary: 'Build thesis statements, counterarguments, PEEL paragraphs, and decisive conclusions.',
        level: 'ADVANCED',
        audiences: ['SMA', 'SMK', 'GENERAL'],
        durationMin: 15,
        emoji: '⚖️',
        blocks: [
          b.objectives([
            'Craft a strong **Thesis Statement** that takes a clear, arguable stance.',
            'Structure body paragraphs with **PEEL** (Point, Evidence, Explain, Link).',
            'Address a counterargument respectfully using *While some argue..., however...*.',
          ]),
          b.expandable([
            { title: 'Descriptive, Narrative, Recount, Report & Procedure Writing', body: '• **Descriptive**: vivid sensory details about a specific person/place.\n• **Narrative**: story with conflict and climax.\n• **Recount**: retelling a real past event in chronological order.\n• **Report**: factual classification of a general category.\n• **Procedure**: numbered imperative steps (*Mix, Press, Click*) to complete a task.' },
            { title: 'Analytical Exposition vs. Argumentative Essay', body: '**Analytical Exposition** convinces the reader that a view is true using Thesis → Arguments → Reiteration. **Argumentative Writing** goes a step further by acknowledging the opposing view and refuting it with stronger evidence.' },
            { title: 'Creative Writing Craft', body: 'Use **Show, Don’t Tell**: instead of *"She was nervous"*, write *"Her fingers tapped rapidly against her notebook as the moderator called her name."*' },
          ], 'Writing Genres Toolbox'),
          b.writing(
            'Write a short **Analytical Exposition paragraph** (at least 50 words) on why every student should learn practical English communication.',
            50,
            ['Clear thesis/claim', 'At least 2 transition markers (Firstly, Moreover, Therefore)', 'One concrete real-world example'],
          ),
        ],
        exercises: [
          mcq('In a **PEEL** paragraph, what does the **E** after Point stand for?', ['Emoji', 'Evidence', 'Ending', 'Exclamation'], 'Evidence', 'PEEL = Point, Evidence, Explanation, Link.', 'WRITING', 'INTERMEDIATE'),
          mcq('Which sentence is the stronger **Thesis Statement**?', ['This essay is about smartphones.', 'Schools should integrate structured digital English apps because they personalize pacing and boost daily speaking confidence.', 'Smartphones exist everywhere today.', 'I like phones.'], 'Schools should integrate structured digital English apps because they personalize pacing and boost daily speaking confidence.', 'A great thesis makes a clear claim and previews the reasoning.', 'WRITING', 'ADVANCED'),
          mcq('Which writing style uses "Show, Don’t Tell" sensory imagery?', ['Creative & Narrative Writing', 'Hardware Invoices', 'Flight Boarding Tables', 'Grammar Answer Keys'], 'Creative & Narrative Writing', 'Sensory detail brings stories and creative scenes alive.', 'WRITING', 'INTERMEDIATE'),
        ],
      },
    ],
  ),
];
