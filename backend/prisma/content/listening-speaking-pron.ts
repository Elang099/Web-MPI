import type { TopicSeed } from '@fec/shared';
import { b, fill, listen, makeTopic, match, mcq, order } from './helpers.js';

export const listeningTopics: TopicSeed[] = [
  makeTopic(
    'listening-comprehension-lab',
    'LISTENING',
    'Listening Lab: Conversations, Announcements, Interviews & Stories',
    'Train your ear on daily conversations, announcements, dialogues, interviews, instructions and short stories.',
    [
      {
        slug: 'daily-conversations-and-announcements',
        title: 'Daily Conversations, Announcements & Instructions',
        summary: 'Catch key numbers, times, locations, and action steps in real-time spoken English.',
        level: 'BEGINNER',
        audiences: ['SMP', 'SMA', 'SMK', 'GENERAL'],
        durationMin: 11,
        emoji: '🎧',
        blocks: [
          b.objectives([
            'Catch key details (gate, time, room, sequence words) from live announcements and conversations.',
            'Follow multi-step spoken instructions accurately.',
          ]),
          b.audio(
            'Attention passengers on Flight GA 402 to Surabaya. Boarding has moved from Gate 7 to Gate 11 due to a quick safety check. Boarding will begin in fifteen minutes at 10:45 AM. Please have your boarding pass and ID card ready.',
            'Airport Gate Announcement (Tap Play, then answer below)',
            true,
          ),
          b.audio(
            'To assemble the study lamp, first connect the base cable to the USB adapter. Second, tighten the neck screw clockwise until snug. Finally, tap the touch sensor once for warm light or twice for daylight mode.',
            'Spoken Product Instructions',
            false,
          ),
          b.quickCheck(
            'In the airport announcement, what is the NEW boarding gate?',
            ['Gate 4', 'Gate 7', 'Gate 11', 'Gate 15'],
            'Gate 11',
            'The announcement states: "Boarding has moved from Gate 7 to Gate 11."',
          ),
        ],
        exercises: [
          listen(
            'Listen to the cafe order and pick what the customer ordered:',
            'Hi there! Could I get one medium iced latte with oat milk and a blueberry muffin, please? For here, thanks!',
            ['Hot green tea & bagel', 'Medium iced latte with oat milk & blueberry muffin', 'Large espresso & croissant', 'Orange juice only'],
            'Medium iced latte with oat milk & blueberry muffin',
            'The customer specifically asked for "one medium iced latte with oat milk and a blueberry muffin".',
            'BEGINNER',
          ),
          listen(
            'Listen to the school notice. What should students bring tomorrow?',
            'Good afternoon, everyone! Remember that tomorrow’s science workshop starts at 8 AM in Lab B. Do not forget to bring your safety goggles and a charged tablet.',
            ['A basketball', 'Safety goggles and a charged tablet', 'A printed novel', 'Swimming gear'],
            'Safety goggles and a charged tablet',
            'Listen for the items after "bring".',
            'BEGINNER',
          ),
          listen(
            'Listen to the teacher’s instructions. What is Step 2?',
            'First, underline any unfamiliar words in the paragraph. Next, discuss their meanings with your partner for three minutes. Finally, share your best sentence with the class.',
            ['Share with the class', 'Underline unfamiliar words', 'Discuss meanings with a partner for three minutes', 'Close the textbook'],
            'Discuss meanings with a partner for three minutes',
            'Watch for sequence signals: First → Next (Step 2) → Finally.',
            'BEGINNER',
          ),
        ],
      },
      {
        slug: 'interviews-dialogues-and-short-stories',
        title: 'Interviews, Dialogues & Audio Short Stories',
        summary: 'Understand main ideas, speaker attitudes, and storytelling details without subtitles.',
        level: 'INTERMEDIATE',
        audiences: ['SMA', 'SMK', 'GENERAL'],
        durationMin: 13,
        emoji: '🎙️',
        blocks: [
          b.objectives([
            'Follow Q&A interviews and notice speaker tone and reasons.',
            'Identify plot twists and lessons in spoken short stories.',
          ]),
          b.audio(
            'Interviewer: Welcome to Tech Voices! Maya, how did you go from shy student to leading a global engineering call? Maya: Honestly, I stopped waiting to speak "perfect" English. I practiced describing what I was building out loud for five minutes every morning. Consistency beat perfection.',
            'Podcast Interview Clip',
            false,
          ),
          b.quickCheck(
            'According to Maya, what helped her most?',
            ['Memorizing an entire dictionary', 'Practicing 5 minutes out loud every morning consistently', 'Never making any mistakes', 'Moving abroad immediately'],
            'Practicing 5 minutes out loud every morning consistently',
            'Maya says: "Consistency beat perfection."',
          ),
        ],
        exercises: [
          listen(
            'Listen to the short story clip. Why did Kevin smile at the end?',
            'Kevin walked into the community hall feeling nervous about his first English speech. Midway through, he forgot one line, paused calmly, and made a quick joke. The audience laughed warmly, and he finished to loud applause.',
            ['The microphone broke', 'He handled a brief pause calmly and the audience applauded', 'Everyone left early', 'He won a lottery ticket'],
            'He handled a brief pause calmly and the audience applauded',
            'Listen for how Kevin recovered and how the audience reacted.',
            'INTERMEDIATE',
          ),
          listen(
            'Listen to the job interview clip. What strength does the candidate mention?',
            'When asked about my biggest strength, I’d say calm problem-solving. During my SMK internship, our inventory spreadsheet crashed before a rush, and I rebuilt the checklist in fifteen minutes so customers stayed happy.',
            ['Playing guitar', 'Calm problem-solving under pressure', 'Baking pastries', 'Running marathons'],
            'Calm problem-solving under pressure',
            'She says "calm problem-solving" and backs it up with an internship story.',
            'INTERMEDIATE',
          ),
          listen(
            'Listen to the library dialogue. When can the student borrow the reference book?',
            'Student: Excuse me, is "Modern Grammar Guide" available? Librarian: Someone is reading it right now, but it’s due back at 3 PM. You can reserve it for 3:15.',
            ['Right now', 'At 3:15 PM', 'Next Monday', 'Never'],
            'At 3:15 PM',
            'The librarian says it is due back at 3 PM and available at 3:15.',
            'INTERMEDIATE',
          ),
        ],
      },
    ],
  ),
];

export const speakingTopics: TopicSeed[] = [
  makeTopic(
    'conversational-fluency-speaking',
    'SPEAKING',
    'Daily Conversation, Introductions, Directions, Opinions, Requests & Suggestions',
    'Speak clearly and politely in everyday social situations.',
    [
      {
        slug: 'introductions-directions-requests-suggestions',
        title: 'Introductions, Directions, Requests & Suggestions',
        summary: 'Practical speaking formulas you can use immediately in school, travel, and life.',
        level: 'BEGINNER',
        audiences: ['SMP', 'SMA', 'SMK', 'GENERAL'],
        durationMin: 12,
        emoji: '🗣️',
        blocks: [
          b.objectives([
            'Deliver a confident 30-second self-introduction.',
            'Ask and give directions politely.',
            'Make polite requests (`Could you...? / Would you mind...?`) and helpful suggestions (`Why don’t we...? / How about...?`).',
          ]),
          b.table(
            ['Function', 'Natural Phrases'],
            [
              ['Self Introduction', '"Hi, I’m Arya from Bandung. I’m passionate about design and currently sharpening my English."'],
              ['Asking Directions', '"Excuse me, could you tell me how to get to the nearest MRT station?"'],
              ['Giving Directions', '"Go straight ahead for two blocks, turn left at the corner, and it’s on your right."'],
              ['Making Requests', '"Could you possibly send me the slides?" / "Would you mind speaking a little slower?"'],
              ['Giving Suggestions', '"How about reviewing together?" / "Why don’t we start with the vocabulary deck?"'],
            ],
            'Speaking Phrasebook',
          ),
          b.speaking(
            'Introduce yourself out loud using the pattern: Greeting + Name + Where you study/work + Your English goal.',
            'Hello! My name is Raka, and I am a vocational high school student majoring in software engineering. I am practicing English every day so I can collaborate with international tech teams.',
            ['Smile slightly as you speak — it brightens your vocal tone!', 'Pause briefly between sentences instead of rushing.'],
          ),
        ],
        exercises: [
          mcq('Which phrase is the MOST polite way to ask a stranger to repeat something?', ['Repeat!', 'What?!', 'Could you please say that one more time?', 'Speak louder now.'], 'Could you please say that one more time?', 'Using "Could you please..." sounds warm and respectful.', 'SPEAKING', 'BEGINNER'),
          mcq('After "Would you mind...", which verb form comes next?', ['to help', 'helped', 'helping', 'helps'], 'helping', '"Would you mind + V-ing?" is always followed by a gerund.', 'SPEAKING', 'INTERMEDIATE'),
          order('Build a clear direction sentence:', ['Go', 'straight', 'ahead', 'and', 'turn', 'right', 'at', 'the', 'library.'], 'Go straight ahead and turn right at the library.', 'Imperative direction pattern: Go straight + turn left/right + landmark.', 'SPEAKING', 'BEGINNER'),
        ],
      },
      {
        slug: 'opinions-interviews-presentations-fluency',
        title: 'Expressing Opinions, Interviews, Presentations & Fluency',
        summary: 'Speak persuasively in discussions, job interviews, and live presentations.',
        level: 'INTERMEDIATE',
        audiences: ['SMA', 'SMK', 'GENERAL'],
        durationMin: 14,
        emoji: '🎤',
        blocks: [
          b.objectives([
            'Frame opinions clearly using **ORE** (Opinion → Reason → Example).',
            'Answer common job interview questions using the **STAR** method.',
            'Open and transition smoothly during presentations.',
          ]),
          b.steps([
            { title: 'Opinion Opener', body: '*"In my view..."*, *"I strongly believe..."*, *"From my perspective..."*' },
            { title: 'Job Interview (STAR)', body: '**S**ituation → **T**ask → **A**ction → **R**esult. Keep answers to 60–90 seconds.' },
            { title: 'Presentation Hooks & Transitions', body: '*"Good morning everyone. Today I’ll walk you through three key points..."* → *"Moving on to our next slide..."*' },
          ], 'Fluency Frameworks'),
          b.speaking(
            'Practice expressing an opinion aloud: Why is learning English valuable for your future career?',
            'In my opinion, English is one of the best investments for any career. That is because global documentation, international clients, and online courses rely heavily on English. For example, yesterday I solved a coding problem in minutes using an English tutorial.',
            ['Use one clear transition: "That is because..." and "For example..."'],
          ),
        ],
        exercises: [
          mcq('In the **STAR** interview framework, what does **R** stand for?', ['Resume', 'Result', 'Salary', 'Repeat'], 'Result', 'STAR = Situation, Task, Action, Result (what outcome your actions achieved).', 'SPEAKING', 'INTERMEDIATE'),
          mcq('Which phrase politely disagrees in a team discussion?', ['You are totally wrong!', 'Shut up and listen.', 'I see your point, however I think we should also consider...', 'Whatever.'], 'I see your point, however I think we should also consider...', 'Acknowledge the other person’s point before presenting your alternative.', 'SPEAKING', 'INTERMEDIATE'),
          fill('Presentation transition: "Moving ___ to our second point, let’s examine the chart."', 'on', '"Moving on to..." is a natural presentation bridge.', 'o _', 'SPEAKING', 'INTERMEDIATE'),
        ],
      },
    ],
  ),
];

export const pronunciationTopics: TopicSeed[] = [
  makeTopic(
    'phonetics-stress-intonation',
    'PRONUNCIATION',
    'Phonetics, Vowels, Consonants, Word/Sentence Stress & Intonation',
    'Master IPA basics, tricky vowels & consonants, natural rhythm, and common pronunciation pitfalls.',
    [
      {
        slug: 'vowels-consonants-and-phonetics',
        title: 'Phonetics, Vowels & Tricky Consonants',
        summary: 'Hear and produce clear contrasts like ship/sheep, think/sink, and silent letters.',
        level: 'BEGINNER',
        audiences: ['SMP', 'SMA', 'SMK', 'GENERAL'],
        durationMin: 12,
        emoji: '🔤',
        blocks: [
          b.objectives([
            'Distinguish short vs. long vowel pairs (`/ɪ/` vs `/iː/`, `/æ/` vs `/e/`).',
            'Pronounce `/θ/` (*think*), `/ð/` (*this*), `/v/` (*very*), and `-ed` verb endings cleanly.',
          ]),
          b.table(
            ['Contrast', 'Word A', 'Word B', 'Tip'],
            [
              ['/ɪ/ vs /iː/', 'ship /ʃɪp/', 'sheep /ʃiːp/', 'Relax mouth for /ɪ/; smile & hold slightly longer for /iː/'],
              ['/θ/ vs /t/', 'think /θɪŋk/', 'tink', 'Touch tongue tip gently between teeth for /θ/'],
              ['/v/ vs /f/', 'very /ˈveri/', 'ferry /ˈferi/', 'Top teeth on bottom lip — vibrate throat for /v/'],
              ['-ed endings', 'worked /t/', 'played /d/, wanted /ɪd/', 'Only add an extra syllable /ɪd/ after **t** or **d**!'],
            ],
            'High-Impact Sound Contrasts',
          ),
          b.audio('Ship and sheep. Live and leave. Think through these three things. I worked, played, and wanted to learn.', 'Tap Play & Shadow Slowly'),
          b.speaking(
            'Read this clarity drill out loud slowly and clearly:',
            'I think these three green sheep live near the clean beach.',
            ['Feel the gentle airflow between your teeth on "think", "these", and "three".'],
          ),
        ],
        exercises: [
          mcq('In which past verb does **-ed** add an extra syllable `/ɪd/`?', ['worked', 'played', 'wanted', 'helped'], 'wanted', 'Only verbs ending in a /t/ or /d/ sound (wanted, decided, needed) pronounce -ed as an extra syllable.', 'PRONUNCIATION', 'BEGINNER'),
          mcq('Which pair differs only by short `/ɪ/` vs long `/iː/`?', ['cat / cut', 'ship / sheep', 'pen / pan', 'boat / boot'], 'ship / sheep', 'Ship uses short /ɪ/ while sheep uses tense long /iː/.', 'PRONUNCIATION', 'BEGINNER'),
          mcq('Which word contains a **silent letter**?', ['mountain', 'knight', 'speaker', 'planet'], 'knight', 'Both "k" and "gh" are silent in "knight" (/naɪt/).', 'PRONUNCIATION', 'INTERMEDIATE'),
        ],
      },
      {
        slug: 'word-stress-sentence-stress-intonation',
        title: 'Word Stress, Sentence Stress, Intonation & Common Errors',
        summary: 'Sound expressive and understandable with natural English rhythm and melody.',
        level: 'INTERMEDIATE',
        audiences: ['SMA', 'SMK', 'GENERAL'],
        durationMin: 12,
        emoji: '🎵',
        blocks: [
          b.objectives([
            'Place word stress accurately on nouns vs. verbs (`PRO-ject` vs. `pro-JECT`).',
            'Use **content-word stress** in sentences and rising vs. falling intonation.',
            'Fix common errors like silent letters (*comfortable, island, Wednesday*) and `-tion` endings.',
          ]),
          b.expandable([
            { title: 'Word Stress Rules', body: '• Words ending in **-tion / -sion / -ic** stress the syllable right **before** the suffix: *in-for-**MA**-tion, fan-**TAS**-tic*.\n• Two-syllable noun/verb twins: ***PRE**-sent* (noun = gift) vs. *pre-**SENT*** (verb = show).' },
            { title: 'Sentence Stress & Rhythm', body: 'English stresses **content words** (nouns, main verbs, adjectives) and reduces small **function words** (to, of, and, the). Example: *"**OUR** **TEAM** **WON** the **PRIZE**!"*' },
            { title: 'Rising vs. Falling Intonation', body: '• **Falling ↘** for statements and WH-questions: *"Where do you LIVE ↘?"*\n• **Rising ↗** for Yes/No questions and polite checks: *"Are you READ-y ↗?"*' },
            { title: 'Common Pronunciation Errors', body: '• **Wednesday** → `/ˈwenzdeɪ/` (silent d)\n• **Comfortable** → 3 syllables `/ˈkʌmftəbəl/`\n• **Island** → `/ˈaɪlənd/` (silent s)' },
          ], 'Rhythm & Melody Guide'),
          b.quickCheck(
            'Where is the main stress in the noun **eduCAtion** (`ed-u-ca-tion`)?',
            ['1st syllable (ED)', '2nd syllable (u)', '3rd syllable (CA)', '4th syllable (tion)'],
            '3rd syllable (CA)',
            'In `-tion` words, stress always falls right before `-tion`: *ed-u-**CA**-tion*.',
          ),
        ],
        exercises: [
          mcq('Which syllable is stressed in the verb "to re-CORD"?', ['1st (RE-cord)', '2nd (re-CORD)', 'Both equally', 'Neither'], '2nd (re-CORD)', 'Two-syllable verbs like *re-CORD, pre-SENT, pro-JECT* usually stress the 2nd syllable.', 'PRONUNCIATION', 'INTERMEDIATE'),
          mcq('Which intonation pattern usually fits a **Yes/No question** like "Did you finish?"', ['Flat monotone', 'Rising ↗ at the end', 'Falling ↘ sharply', 'Whispering'], 'Rising ↗ at the end', 'Yes/No questions typically rise in pitch at the end.', 'PRONUNCIATION', 'INTERMEDIATE'),
          match('Match each commonly mispronounced word to its silent letter:', [
            ['island', 'silent s'],
            ['castle', 'silent t'],
            ['climb', 'silent b'],
            ['honest', 'silent h'],
          ], 'Checking silent letters prevents common speaking slip-ups!', 'PRONUNCIATION', 'BEGINNER'),
        ],
      },
    ],
  ),
];
