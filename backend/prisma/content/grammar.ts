import type { TopicSeed } from '@fec/shared';
import { b, fill, makeTopic, match, mcq, order } from './helpers.js';

export const grammarTopics: TopicSeed[] = [
  makeTopic(
    'parts-of-speech',
    'GRAMMAR',
    'Parts of Speech & Word Classes',
    'Master nouns, pronouns, verbs, adjectives, adverbs, articles, prepositions and conjunctions.',
    [
      {
        slug: 'parts-of-speech-overview',
        title: 'The 8 Parts of Speech',
        summary: 'See how every word plays a clear role in an English sentence.',
        level: 'BEGINNER',
        audiences: ['SMP', 'GENERAL'],
        durationMin: 10,
        emoji: '🧩',
        blocks: [
          b.objectives([
            'Identify the 8 core parts of speech in real sentences.',
            'Tell adjectives apart from adverbs.',
            'Recognize how one word can switch roles depending on context.',
          ]),
          b.text(
            'Think of a sentence like a **sports team**: each word has a specific job. When you know each job, reading and writing English becomes much faster.',
            'How Sentences Work',
          ),
          b.table(
            ['Part of Speech', 'Job in the Sentence', 'Examples'],
            [
              ['Noun', 'Names a person, place, thing, or idea', 'student, Jakarta, laptop, confidence'],
              ['Pronoun', 'Replaces a noun to avoid repetition', 'I, you, she, they, it, mine'],
              ['Verb', 'Shows action or a state of being', 'study, run, build, is, become'],
              ['Adjective', 'Describes a noun or pronoun', 'bright, helpful, three, modern'],
              ['Adverb', 'Modifies a verb, adjective, or adverb', 'quickly, very, always, yesterday'],
              ['Preposition', 'Shows time, place, or direction', 'in, on, at, under, through'],
              ['Conjunction', 'Connects words or clauses', 'and, but, because, although'],
              ['Interjection', 'Expresses sudden emotion', 'Wow! Hey! Awesome!'],
            ],
            'Quick Reference Grid',
          ),
          b.sort(
            'Sort these words into the correct part of speech:',
            ['Noun', 'Verb', 'Adjective', 'Adverb'],
            [
              { text: 'library', bucket: 'Noun' },
              { text: 'explore', bucket: 'Verb' },
              { text: 'creative', bucket: 'Adjective' },
              { text: 'carefully', bucket: 'Adverb' },
              { text: 'achievement', bucket: 'Noun' },
              { text: 'fluently', bucket: 'Adverb' },
            ],
          ),
          b.quickCheck(
            'In "She **quickly** finished her project", what part of speech is **quickly**?',
            ['Adjective', 'Adverb', 'Verb', 'Noun'],
            'Adverb',
            '"Quickly" modifies the verb "finished" — telling us *how* she finished.',
          ),
        ],
        exercises: [
          mcq('Which word is a **verb** in "Our team designs smart apps"?', ['Our', 'team', 'designs', 'smart'], 'designs', '"Designs" shows the action the team performs.'),
          mcq('Which word is an **adjective** in "The confident speaker smiled"?', ['The', 'confident', 'speaker', 'smiled'], 'confident', '"Confident" describes the noun "speaker".'),
          fill('Complete with an adverb: "He explained the rule ___." (clear)', 'clearly', 'Add -ly to the adjective "clear" to form the adverb modifying "explained".', 'c _ _ _ _ _ y'),
          order('Build a sentence with adjective + noun + verb + adverb:', ['The', 'talented', 'student', 'spoke', 'clearly.'], 'The talented student spoke clearly.', 'Subject ("The talented student") + verb ("spoke") + adverb ("clearly").'),
        ],
      },
      {
        slug: 'nouns-and-pronouns',
        title: 'Nouns & Pronouns Mastery',
        summary: 'Countable vs uncountable nouns, plurals, and subject/object/possessive pronouns.',
        level: 'BEGINNER',
        audiences: ['SMP', 'SMA', 'GENERAL'],
        durationMin: 12,
        emoji: '🏷️',
        blocks: [
          b.objectives([
            'Distinguish countable and uncountable nouns.',
            'Choose the right subject, object, and possessive pronouns.',
          ]),
          b.callout('remember', 'Uncountable nouns like **information, advice, water, equipment, homework** never take `-s` or `a/an`. Use *some*, *a piece of*, or *much*.', 'Watch Out!'),
          b.table(
            ['Subject', 'Object', 'Possessive Adj.', 'Possessive Pronoun'],
            [
              ['I', 'me', 'my', 'mine'],
              ['you', 'you', 'your', 'yours'],
              ['he / she / it', 'him / her / it', 'his / her / its', 'his / hers / —'],
              ['we', 'us', 'our', 'ours'],
              ['they', 'them', 'their', 'theirs'],
            ],
            'Pronoun Family Table',
          ),
          b.examples([
            { en: 'Can you give me **some advice**?', note: 'Correct — advice is uncountable.' },
            { en: 'Can you give me an advices?', note: 'Incorrect — avoid "an" and "-s" on uncountable nouns.', wrong: true },
            { en: 'This notebook is **mine**, not **hers**.', note: 'Possessive pronouns stand alone without a noun.' },
          ]),
          b.quickCheck(
            'Choose the right pronoun: "Mr. Adi gave the feedback to Rina and ___."',
            ['I', 'me', 'my', 'mine'],
            'me',
            'After a preposition ("to"), use the object pronoun **me**.',
          ),
        ],
        exercises: [
          mcq('Which noun is **uncountable**?', ['laptop', 'idea', 'information', 'student'], 'information', '"Information" has no plural form in English.'),
          mcq('Pick the correct sentence:', ['The equipments are new.', 'The equipment is new.', 'Many equipment are new.', 'An equipment is new.'], 'The equipment is new.', '"Equipment" is uncountable and takes a singular verb.'),
          fill('Fill in the possessive pronoun: "That backpack belongs to Maya. It is ___."', 'hers', '"Hers" replaces "her backpack".', 'h _ _ s'),
          match('Match each subject pronoun to its object pronoun:', [
            ['we', 'us'],
            ['they', 'them'],
            ['she', 'her'],
            ['he', 'him'],
          ], 'Object pronouns follow verbs and prepositions.'),
        ],
      },
      {
        slug: 'verbs-adjectives-adverbs',
        title: 'Verbs, Adjectives & Adverbs',
        summary: 'Action vs linking verbs, adjective order, comparatives/superlatives, and adverb placement.',
        level: 'BEGINNER',
        audiences: ['SMP', 'SMA', 'SMK', 'GENERAL'],
        durationMin: 12,
        emoji: '⚡',
        blocks: [
          b.objectives([
            'Use action and linking verbs accurately.',
            'Form comparatives (`-er` / `more`) and superlatives (`-est` / `most`).',
            'Place adverbs of frequency in the right position.',
          ]),
          b.formula(
            [
              { label: 'Short Adj (1 syl)', value: 'fast → faster → the fastest', color: '#00D1FF' },
              { label: 'Long Adj (2+ syl)', value: 'fluent → more fluent → the most fluent', color: '#A855F7' },
              { label: 'Irregular', value: 'good → better → the best', color: '#22C55E' },
            ],
            'Practicing daily is **better** than cramming once a month.',
            'Comparison Rules',
          ),
          b.callout('tip', 'Adverbs of frequency (*always, usually, often, sometimes, never*) go **before** main verbs (*"She **always** arrives early"*), but **after** *be* (*"He is **always** polite"*).'),
          b.sentenceBuilder('Arrange the words with the adverb in the correct place:', ['usually', 'practice', 'We', 'together.', 'speaking'], 'We usually practice speaking together.'),
        ],
        exercises: [
          mcq('Which sentence places the adverb correctly?', ['She speaks always clearly.', 'She always speaks clearly.', 'Always she speaks is clearly.', 'She is always speaks clearly.'], 'She always speaks clearly.', 'Frequency adverbs come before ordinary action verbs.'),
          mcq('What is the comparative form of **good**?', ['gooder', 'more good', 'better', 'best'], 'better', '"Good" is irregular: good → better → best.'),
          fill('Complete the superlative: "This is the ___ useful app for learners."', 'most', 'Long adjectives take "most" for superlatives.', 'm _ _ t'),
          order('Put the words in order:', ['English', 'is', 'more', 'useful', 'than', 'ever.'], 'English is more useful than ever.', 'Use "more + adjective + than" for comparison.'),
        ],
      },
      {
        slug: 'articles-prepositions-conjunctions',
        title: 'Articles, Prepositions & Conjunctions',
        summary: 'Master a/an/the, in/on/at, and coordinating & subordinating conjunctions.',
        level: 'BEGINNER',
        audiences: ['SMP', 'SMA', 'SMK', 'GENERAL'],
        durationMin: 12,
        emoji: '🔗',
        blocks: [
          b.objectives([
            'Choose between `a`, `an`, `the`, and zero article based on sound and specificity.',
            'Use `in`, `on`, and `at` accurately for time and place.',
            'Join ideas smoothly with `and, but, so, because, although`.',
          ]),
          b.table(
            ['Word', 'Use for Time', 'Use for Place'],
            [
              ['AT', 'clock times: at 7:00 AM, at noon', 'exact points: at the door, at the station'],
              ['ON', 'days & dates: on Friday, on May 5', 'surfaces & streets: on the table, on Sudirman St.'],
              ['IN', 'months, years, seasons: in 2026, in June', 'enclosed/large areas: in the room, in Bandung'],
            ],
            'The IN / ON / AT Pyramid',
          ),
          b.examples([
            { en: 'She is **an** honest leader and **a** university graduate.', note: '"Honest" starts with a vowel sound /ɒ/; "university" starts with /j/.' },
            { en: 'We stayed inside **because** it was raining heavily.', note: '"Because" introduces a reason.' },
            { en: '**Although** the puzzle was tough, he solved it.', note: 'Don’t use "but" together with "although"!' },
          ]),
          b.quickCheck(
            'Pick the right sentence:',
            ['Although he was tired, but he studied.', 'Although he was tired, he studied.', 'He was tired although, he studied.', 'Because he was tired, he studied hard for the exam?'],
            'Although he was tired, he studied.',
            'In English, never pair **although** and **but** in the same sentence.',
          ),
        ],
        exercises: [
          mcq('We have an English workshop ___ Monday morning.', ['in', 'on', 'at', 'by'], 'on', 'Always use **on** with days of the week (even with morning: *on Monday morning*).'),
          mcq('He waited for ___ hour before the train arrived.', ['a', 'an', 'the', 'any'], 'an', 'The "h" in "hour" is silent, so it starts with a vowel sound.'),
          fill('Join the contrast: "I wanted to call you, ___ my battery died."', 'but', '"But" connects two contrasting ideas.', 'b _ t'),
          match('Match each preposition with its time expression:', [
            ['at', '9:15 AM'],
            ['on', 'Independence Day'],
            ['in', 'December'],
          ], 'AT = exact time, ON = specific day, IN = month/year.'),
        ],
      },
    ],
  ),

  makeTopic(
    'core-tenses',
    'GRAMMAR',
    'English Tenses: Present, Past & Future',
    'Visualize and master Simple Present, Continuous, Simple Past, Past Continuous, Present/Past Perfect and Future Tenses.',
    [
      {
        slug: 'present-simple-vs-continuous',
        title: 'Simple Present vs. Present Continuous',
        summary: 'Daily habits and facts vs. actions happening right now.',
        level: 'BEGINNER',
        audiences: ['SMP', 'SMA', 'SMK', 'GENERAL'],
        durationMin: 12,
        emoji: '⏱️',
        blocks: [
          b.objectives([
            'Distinguish permanent routines (Simple Present) from live ongoing actions (Present Continuous).',
            'Form negatives and questions cleanly with `do/does` and `am/is/are`.',
          ]),
          b.timeline(
            [
              { position: 15, label: 'Yesterday' },
              { position: 50, label: 'NOW (Continuous)', span: 20 },
              { position: 85, label: 'Always / Habit (Simple)' },
            ],
            'Simple Present covers repeated habits across time; Present Continuous zooms in on right now.',
          ),
          b.formula(
            [
              { label: 'Simple Present', value: 'S + V1 (-s/-es for he/she/it)', color: '#00D1FF' },
              { label: 'Present Continuous', value: 'S + am/is/are + V-ing', color: '#A855F7' },
            ],
            'She **checks** her email every morning, and right now she **is replying** to a client.',
          ),
          b.sort(
            'Match each time expression to the tense it usually signals:',
            ['Simple Present', 'Present Continuous'],
            [
              { text: 'every morning', bucket: 'Simple Present' },
              { text: 'right now', bucket: 'Present Continuous' },
              { text: 'at the moment', bucket: 'Present Continuous' },
              { text: 'twice a week', bucket: 'Simple Present' },
            ],
          ),
          b.quickCheck(
            'Choose the correct option: "Listen! Someone ___ the piano."',
            ['plays', 'is playing', 'play', 'are playing'],
            'is playing',
            '"Listen!" signals an action happening at this exact moment → Present Continuous.',
          ),
        ],
        exercises: [
          mcq('Water ___ at 100 degrees Celsius.', ['boil', 'boils', 'is boiling', 'boiling'], 'boils', 'Scientific truths use Simple Present (+s for singular "water").'),
          mcq('Look! The students ___ a 3D model in the workshop.', ['build', 'builds', 'are building', 'is building'], 'are building', '"Look!" signals an action happening right now; "students" takes "are".'),
          fill('Negative form: "He ___ (not/live) near the station."', "doesn't live|does not live", 'Use "does not + base verb" for he/she/it in Simple Present.'),
          order('Make a Present Continuous question:', ['you', 'Are', 'working', 'on', 'the', 'report?'], 'Are you working on the report?', 'Invert "Are" and "you" to ask a Present Continuous question.'),
        ],
      },
      {
        slug: 'past-simple-vs-continuous',
        title: 'Simple Past & Past Continuous',
        summary: 'Tell clear stories about finished events and interrupted actions in the past.',
        level: 'BEGINNER',
        audiences: ['SMP', 'SMA', 'SMK', 'GENERAL'],
        durationMin: 12,
        emoji: '⏪',
        blocks: [
          b.objectives([
            'Use regular (`-ed`) and irregular Verb 2 forms accurately.',
            'Combine Past Continuous and Simple Past with `when` and `while`.',
          ]),
          b.timeline(
            [
              { position: 25, label: 'was studying (background)', span: 35 },
              { position: 42, label: 'phone rang (interruption)' },
              { position: 80, label: 'NOW' },
            ],
            'A longer background action (Past Continuous) interrupted by a shorter event (Simple Past).',
          ),
          b.examples([
            { en: 'I **was practicing** my speech **when** the power **went** out.', note: 'Background = was + V-ing; sudden interruption = V2.' },
            { en: '**While** they **were designing** the app, we **tested** the audio.', note: 'Two long actions at the same time both use Past Continuous (or simple past for testing).' },
          ]),
          b.quickCheck(
            'Fix the error: "Did you went to the seminar yesterday?"',
            ['Did you go', 'Did you going', 'Were you went', 'Do you went'],
            'Did you go',
            'After "Did", the main verb always returns to its base form (V1): **go**.',
          ),
        ],
        exercises: [
          mcq('She ___ a great presentation last week.', ['give', 'gives', 'gave', 'was give'], 'gave', '"Gave" is the irregular past form of "give".', 'GRAMMAR', 'BEGINNER'),
          mcq('While I ___ home, it started to rain.', ['walked', 'was walking', 'am walking', 'walk'], 'was walking', 'Ongoing background action in the past → Past Continuous.', 'GRAMMAR', 'INTERMEDIATE'),
          fill('Complete with V2: "They ___ (write) three emails this morning."', 'wrote', 'Irregular past of "write" is "wrote".', 'w _ _ _ e'),
          order('Put the story sentence in order:', ['When', 'the', 'teacher', 'entered,', 'we', 'were', 'discussing.'], 'When the teacher entered, we were discussing.', 'Short event after "When" + ongoing past action.'),
        ],
      },
      {
        slug: 'present-and-past-perfect',
        title: 'Present Perfect & Past Perfect',
        summary: 'Connect past experiences to now, and order two past events with clarity.',
        level: 'INTERMEDIATE',
        audiences: ['SMA', 'SMK', 'GENERAL'],
        durationMin: 14,
        emoji: '🌉',
        blocks: [
          b.objectives([
            'Use **Present Perfect** (`have/has + V3`) for life experience, duration (`for/since`), and recent results.',
            'Use **Past Perfect** (`had + V3`) to show which of two past actions happened first.',
          ]),
          b.formula(
            [
              { label: 'Present Perfect', value: 'S + have/has + V3', color: '#00D1FF' },
              { label: 'Past Perfect', value: 'S + had + V3', color: '#A855F7' },
            ],
            'By the time we arrived at the station, the train **had already left**.',
          ),
          b.callout('note', '**Since** marks a starting point (*since 2022, since Monday*). **For** marks a length of time (*for three years, for two hours*).'),
          b.quickCheck(
            'Choose the best option: "I have known my best friend ___ six years."',
            ['since', 'for', 'ago', 'during'],
            'for',
            '"Six years" is a duration of time, so use **for**.',
          ),
        ],
        exercises: [
          mcq('She ___ in Surabaya since 2021.', ['lives', 'lived', 'has lived', 'had live'], 'has lived', 'Action starting in 2021 and continuing now → Present Perfect.', 'GRAMMAR', 'INTERMEDIATE'),
          mcq('After he ___ his homework, he played English Dash.', ['finishes', 'has finished', 'had finished', 'is finishing'], 'had finished', 'Earlier of two past actions → Past Perfect (had + V3).', 'GRAMMAR', 'INTERMEDIATE'),
          fill('Use Present Perfect: "Have you ever ___ (speak) at a school assembly?"', 'spoken', 'Past participle (V3) of "speak" is "spoken".', 's _ _ _ _ n', 'GRAMMAR', 'INTERMEDIATE'),
          order('Build a Present Perfect sentence:', ['We', 'have', 'already', 'completed', 'this', 'module.'], 'We have already completed this module.', '"Already" fits between "have" and the past participle "completed".', 'GRAMMAR', 'INTERMEDIATE'),
        ],
      },
      {
        slug: 'future-tenses',
        title: 'Future Tenses (will, going to, Future Continuous & Perfect)',
        summary: 'Express instant decisions, solid plans, schedules, and future milestones.',
        level: 'INTERMEDIATE',
        audiences: ['SMP', 'SMA', 'SMK', 'GENERAL'],
        durationMin: 12,
        emoji: '🚀',
        blocks: [
          b.objectives([
            'Choose naturally between `will` and `be going to`.',
            'Use Future Continuous (`will be + V-ing`) and Future Perfect (`will have + V3`).',
          ]),
          b.table(
            ['Form', 'When to Use', 'Example'],
            [
              ['will + V1', 'Instant decisions, promises, predictions', "I'll help you carry those books!"],
              ['be going to + V1', 'Prior plans & visible evidence', "Look at those dark clouds — it's going to rain."],
              ['will be + V-ing', 'Action in progress at a future time', 'At 9 AM tomorrow, we will be taking the quiz.'],
              ['will have + V3', 'Completed before a future deadline', 'By Friday, I will have finished 10 lessons.'],
            ],
            'Future Toolbox',
          ),
          b.quickCheck(
            '"Oh, the phone is ringing!" — "Don’t worry, I ___ get it!"',
            ['am going to', 'will', 'will have', 'am'],
            'will',
            'An instant decision made at the moment of speaking uses **will**.',
          ),
        ],
        exercises: [
          mcq('By next month, she ___ her English certificate.', ['earns', 'will earning', 'will have earned', 'earned'], 'will have earned', '"By next month" points to completion before a future deadline → Future Perfect.', 'GRAMMAR', 'INTERMEDIATE'),
          mcq('They bought plane tickets yesterday. They ___ fly to Singapore on Monday.', ['will', 'are going to', 'have', 'were'], 'are going to', 'A pre-decided plan with tickets already booked uses **be going to**.', 'GRAMMAR', 'BEGINNER'),
          fill('At this time tomorrow, we ___ (present) our project to the judges.', 'will be presenting', 'Action in progress at a specific future moment → will be + V-ing.', 'will be ...', 'GRAMMAR', 'INTERMEDIATE'),
          order('Arrange the sentence:', ['I', 'am', 'going', 'to', 'practice', 'every', 'evening.'], 'I am going to practice every evening.', 'Future intention: S + am/is/are + going to + V1.'),
        ],
      },
    ],
  ),

  makeTopic(
    'advanced-structures',
    'GRAMMAR',
    'Voice, Conditionals, Modals & Complex Clauses',
    'Active & passive voice, conditionals, modals, reported speech, relative clauses, gerunds/infinitives, sentence structure and agreement.',
    [
      {
        slug: 'active-and-passive-voice',
        title: 'Active Voice & Passive Voice',
        summary: 'Focus on the action receiver in news, science reports, and formal writing.',
        level: 'INTERMEDIATE',
        audiences: ['SMA', 'SMK', 'GENERAL'],
        durationMin: 12,
        emoji: '🔄',
        blocks: [
          b.objectives([
            'Transform sentences smoothly between Active and Passive Voice.',
            'Recognize when Passive Voice is preferred (reports, procedures, news).',
          ]),
          b.formula(
            [
              { label: 'New Subject', value: '(Old Object)', color: '#00D1FF' },
              { label: 'BE (matched tense)', value: 'is / was / will be / has been', color: '#7C5CFF' },
              { label: 'Past Participle', value: 'V3 (+ by agent)', color: '#22C55E' },
            ],
            'Active: *Engineers **designed** the app.* → Passive: *The app **was designed** by engineers.*',
          ),
          b.examples([
            { en: 'English **is spoken** in over 60 countries.', note: 'Present Simple Passive — agent omitted because it is obvious.' },
            { en: 'The solar panels **were installed** last week.', note: 'Past Simple Passive.' },
            { en: 'Safety helmets **must be worn** inside the factory.', note: 'Modal Passive: modal + be + V3.' },
          ]),
          b.quickCheck(
            'Turn into passive: "The students clean the lab every Friday."',
            ['The lab cleans every Friday.', 'The lab is cleaned every Friday.', 'The lab was cleaned every Friday.', 'The lab is cleaning every Friday.'],
            'The lab is cleaned every Friday.',
            'Present simple passive uses **is/are + V3**.',
          ),
        ],
        exercises: [
          mcq('The new bridge ___ in 2024.', ['builds', 'built', 'was built', 'is building'], 'was built', 'Past time ("2024") + passive receiver ("bridge") → was built.', 'GRAMMAR', 'INTERMEDIATE'),
          mcq('All applications must ___ before Friday.', ['submit', 'submitted', 'be submitted', 'submitting'], 'be submitted', 'Modal passive structure: must + be + V3.', 'GRAMMAR', 'INTERMEDIATE'),
          fill('Complete passive: "This article was ___ (write) by a senior teacher."', 'written', 'V3 of "write" is "written".', 'w _ _ _ _ _ n', 'GRAMMAR', 'INTERMEDIATE'),
          order('Build a passive sentence:', ['The', 'report', 'has', 'been', 'sent', 'today.'], 'The report has been sent today.', 'Present perfect passive: has/have + been + V3.', 'GRAMMAR', 'INTERMEDIATE'),
        ],
      },
      {
        slug: 'conditional-sentences',
        title: 'Conditional Sentences (Zero, 1, 2 & 3)',
        summary: 'Express facts, real possibilities, hypothetical dreams, and past reflections.',
        level: 'INTERMEDIATE',
        audiences: ['SMA', 'SMK', 'GENERAL'],
        durationMin: 14,
        emoji: '🔀',
        blocks: [
          b.objectives([
            'Distinguish Types 0, 1, 2, and 3 conditionals by meaning and verb tense.',
            'Avoid the common mistake of putting `would` inside the `if`-clause.',
          ]),
          b.table(
            ['Type', 'If-Clause', 'Main Clause', 'Meaning'],
            [
              ['Zero', 'Present Simple', 'Present Simple', 'Always true (facts)'],
              ['Type 1', 'Present Simple', 'will + V1', 'Real possibility in the future'],
              ['Type 2', 'Past Simple (were)', 'would + V1', 'Imaginary / unlikely now'],
              ['Type 3', 'Past Perfect (had V3)', 'would have + V3', 'Imaginary past / regret'],
            ],
            'Conditional Cheat Sheet',
          ),
          b.callout('warning', 'Never put `will` or `would` directly inside the `if` part! Say *"If I **have** time..."*, not *"If I will have time..."*.'),
          b.quickCheck(
            'Complete Type 2: "If I ___ fluent in five languages, I would work as an interpreter."',
            ['am', 'were', 'had been', 'will be'],
            'were',
            'Type 2 unreal present uses Past Simple (**were** for all subjects in formal English).',
          ),
        ],
        exercises: [
          mcq('If she practices daily, she ___ win the speech contest.', ['would', 'will', 'had', 'was'], 'will', 'Type 1 real future condition: If + Present Simple → will + V1.', 'GRAMMAR', 'INTERMEDIATE'),
          mcq('If they had left earlier, they ___ the flight.', ['would catch', 'will catch', 'would have caught', 'caught'], 'would have caught', 'Type 3 unreal past: had + V3 → would have + V3.', 'GRAMMAR', 'ADVANCED'),
          fill('Zero conditional: "If you heat ice, it ___ (melt)."', 'melts', 'Scientific fact uses Simple Present in both clauses.', 'm _ _ _ s', 'GRAMMAR', 'BEGINNER'),
          order('Build a Type 2 conditional:', ['If', 'I', 'were', 'you,', 'I', 'would', 'accept', 'it.'], 'If I were you, I would accept it.', 'Classic Type 2 advice expression.', 'GRAMMAR', 'INTERMEDIATE'),
        ],
      },
      {
        slug: 'modal-verbs-and-reported-speech',
        title: 'Modal Verbs & Direct/Indirect Speech',
        summary: 'Express obligation, possibility and advice, and report what someone said accurately.',
        level: 'INTERMEDIATE',
        audiences: ['SMA', 'SMK', 'GENERAL'],
        durationMin: 14,
        emoji: '💬',
        blocks: [
          b.objectives([
            'Choose the right modal (`can, could, should, must, might, have to`).',
            'Shift tenses and pronouns correctly from Direct to Indirect Speech.',
          ]),
          b.examples([
            { en: 'Direct: Maya said, *"I am studying now."*', note: 'Exact words inside quotation marks.' },
            { en: 'Indirect: Maya said (that) she **was studying then**.', note: 'Present → Past; "I" → "she"; "now" → "then".' },
            { en: 'Direct: *"Do you like coffee?"* → Indirect: He asked **if I liked** coffee.', note: 'Reported Yes/No questions use **if/whether** and statement word order.' },
          ]),
          b.quickCheck(
            'Report this: Tom said, "I finished the task."',
            ['Tom said he finishes the task.', 'Tom said he had finished the task.', 'Tom said I finished the task.', 'Tom asked if he finished the task.'],
            'Tom said he had finished the task.',
            'Simple Past shifts back to Past Perfect (**had finished**) in indirect speech.',
          ),
        ],
        exercises: [
          mcq('You ___ wear a seatbelt when driving. It is the law.', ['might', 'must', 'could', 'would'], 'must', '**Must** expresses strong obligation or rules.', 'GRAMMAR', 'BEGINNER'),
          mcq('She told me that she ___ call me the next day.', ['will', 'would', 'can', 'is'], 'would', 'In indirect speech, "will" backshifts to "would".', 'GRAMMAR', 'INTERMEDIATE'),
          fill('Report the polite request: The teacher asked us ___ (open) our books.', 'to open', 'Reported imperatives use: ask/tell + object + to + V1.', 'to ...', 'GRAMMAR', 'INTERMEDIATE'),
          order('Arrange the reported question:', ['He', 'asked', 'where', 'the', 'library', 'was.'], 'He asked where the library was.', 'Indirect WH-questions keep statement order (subject before verb).', 'GRAMMAR', 'INTERMEDIATE'),
        ],
      },
      {
        slug: 'clauses-gerunds-agreement',
        title: 'Relative Clauses, Gerunds, Infinitives & Subject-Verb Agreement',
        summary: 'Write polished complex sentences using who/which/that, verbals, and clean agreement.',
        level: 'ADVANCED',
        audiences: ['SMA', 'SMK', 'GENERAL'],
        durationMin: 15,
        emoji: '🏛️',
        blocks: [
          b.objectives([
            'Connect ideas cleanly using relative pronouns (`who, which, that, whose, where`).',
            'Choose between gerunds (`V-ing`) and infinitives (`to + V1`).',
            'Ensure Subject-Verb Agreement even with long noun phrases.',
          ]),
          b.expandable(
            [
              { title: 'Relative Clauses (who / which / whose / where)', body: 'Use **who** for people, **which** for things, **that** for either (defining clauses), **whose** for possession, and **where** for places. Example: *The mentor **who** guided us is a software architect.*' },
              { title: 'Gerunds vs. Infinitives', body: '**Gerunds (V-ing)** follow prepositions and verbs like *enjoy, avoid, finish, suggest*. **Infinitives (to V1)** follow *decide, hope, plan, agree, promise*.' },
              { title: 'Sentence Structure & Subject-Verb Agreement', body: 'Find the **core subject** before any `of / with / along with` phrase: *"The **collection** of rare books **is** valuable"* (singular *collection* takes *is*). Clauses starting with *Each, Everyone, Neither* also take a singular verb.' },
            ],
            'Explore the 3 Core Rules',
          ),
          b.quickCheck(
            'Pick the grammatically accurate verb: "Each of the participants ___ given a certificate."',
            ['are', 'were', 'is', 'have been'],
            'is',
            '**Each** is always singular, even when followed by a plural phrase (*of the participants*).',
          ),
        ],
        exercises: [
          mcq('That is the engineer ___ designed our solar grid.', ['which', 'who', 'whose', 'where'], 'who', 'Use **who** as the subject relative pronoun for a person.', 'GRAMMAR', 'INTERMEDIATE'),
          mcq('She suggested ___ the presentation one more time.', ['rehearse', 'to rehearse', 'rehearsing', 'rehearsed'], 'rehearsing', 'The verb **suggest** is always followed by a gerund (V-ing).', 'GRAMMAR', 'INTERMEDIATE'),
          mcq('Neither the manager nor the employees ___ ready for the delay.', ['is', 'was', 'were', 'has been'], 'were', 'With "neither ... nor ...", the verb agrees with the closer subject ("employees" → plural "were").', 'GRAMMAR', 'ADVANCED'),
          order('Build a complex sentence:', ['Learning', 'English', 'every', 'day', 'opens', 'global', 'doors.'], 'Learning English every day opens global doors.', 'A gerund phrase ("Learning English every day") acts as a singular subject.', 'GRAMMAR', 'INTERMEDIATE'),
        ],
      },
    ],
  ),
];
