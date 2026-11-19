import type { TopicSeed } from '@fec/shared';
import { b, fill, makeTopic, match, mcq, tf } from './helpers.js';

export const textTypeTopics: TopicSeed[] = [
  makeTopic(
    'descriptive-narrative-recount-procedure-report',
    'TEXT_TYPES',
    'Core Text Types: Descriptive, Narrative, Recount, Procedure & Report',
    'Master the purpose, generic structure, and language features of foundational English text genres.',
    [
      {
        slug: 'descriptive-recount-narrative',
        title: 'Descriptive, Recount & Narrative Texts',
        summary: 'Compare how each genre organizes time, characters, and sensory detail.',
        level: 'BEGINNER',
        audiences: ['SMP', 'SMA', 'GENERAL'],
        durationMin: 13,
        emoji: '📖',
        blocks: [
          b.objectives([
            'Identify the social purpose and structure of Descriptive, Recount, and Narrative texts.',
            'Choose Simple Present vs. Simple Past accurately for each genre.',
          ]),
          b.table(
            ['Text Type', 'Social Purpose', 'Structure', 'Key Grammar'],
            [
              ['Descriptive', 'Describe a specific person, place, or object', 'Identification → Description', 'Simple Present + vivid adjectives'],
              ['Recount', 'Retell real past events in order', 'Orientation → Events → Re-orientation', 'Simple Past + time connectives (First, Then)'],
              ['Narrative', 'Entertain & teach a lesson via conflict', 'Orientation → Complication → Resolution (→ Coda)', 'Simple Past + action verbs + dialogue'],
            ],
            'Genre Comparison Chart',
          ),
          b.reading(
            'Sample Narrative Excerpt — The Lantern Maker',
            'Years ago, a young artisan named Hana lived in a quiet mountain village (Orientation). One winter night, a fierce wind blew out every lantern before the festival, plunging the town square into darkness (Complication). Instead of panicking, Hana gathered bright glass jars and tiny solar lamps she had crafted from scrap wire, lighting up the entire plaza before midnight (Resolution).',
          ),
          b.quickCheck(
            'Which genre MUST include a **Complication** (problem/conflict) and **Resolution**?',
            ['Descriptive Text', 'Narrative Text', 'Report Text', 'Procedure Text'],
            'Narrative Text',
            'A Narrative revolves around a problem (Complication) and how characters solve it (Resolution).',
          ),
        ],
        exercises: [
          mcq('Which tense dominates a **Descriptive Text** about Jakarta’s National Monument?', ['Simple Present', 'Past Perfect', 'Future Continuous', 'Past Continuous'], 'Simple Present', 'Descriptive texts state enduring features in Simple Present.', 'READING', 'BEGINNER'),
          mcq('Retelling your school trip to Borobudur last month is an example of a ___ text.', ['Procedure', 'Recount', 'Analytical Exposition', 'Discussion'], 'Recount', 'Recount retells real past experiences chronologically without dramatic complication.', 'READING', 'BEGINNER'),
          match('Match each text type to its primary purpose:', [
            ['Descriptive', 'describe a specific object/place'],
            ['Narrative', 'entertain via story & conflict'],
            ['Recount', 'retell real past events'],
          ], 'Understanding genre makes reading and writing effortless.', 'READING', 'BEGINNER'),
        ],
      },
      {
        slug: 'procedure-and-report-text',
        title: 'Procedure Text & Report Text',
        summary: 'Give crystal-clear step-by-step instructions (Procedure) and objective scientific facts (Report).',
        level: 'BEGINNER',
        audiences: ['SMP', 'SMA', 'SMK', 'GENERAL'],
        durationMin: 12,
        emoji: '🛠️',
        blocks: [
          b.objectives([
            'Write imperative steps for a **Procedure Text** (Goal → Materials/Tools → Steps).',
            'Distinguish a **Report Text** (general class, e.g. *Whales*) from a **Descriptive Text** (specific item, e.g. *My Pet Cat*).',
          ]),
          b.reading(
            'Sample Report vs. Sample Procedure',
            '**Report Text (Coral Reefs):** Coral reefs are underwater ecosystems formed by colonies of tiny marine animals called polyps (General Classification). Although they cover less than 1% of the ocean floor, reefs support nearly 25% of all marine species and protect coastlines from storm waves (Description).\n\n**Procedure (How to Back Up Study Notes):** Goal: Save notes safely in the cloud. Materials: Laptop, internet connection. Steps: 1. Open your Notes folder. 2. Click "Export as PDF". 3. Upload the file to your cloud drive.',
          ),
          b.quickCheck(
            'Which title belongs to a **Report Text** rather than a Descriptive Text?',
            ['My Favorite Backpack', 'Komodo Dragons (General Species Overview)', 'Our School Garden Behind Lab 2', 'How to Brew Herbal Tea'],
            'Komodo Dragons (General Species Overview)',
            'Report texts classify and describe a general category/species objectively.',
          ),
        ],
        exercises: [
          mcq('Which verb form starts steps in a **Procedure Text**?', ['Gerunds (Clicking...)', 'Imperatives (Click, Connect, Pour...)', 'Past Participles (Clicked...)', 'Future tense (Will click...)'], 'Imperatives (Click, Connect, Pour...)', 'Procedure steps use base-form imperative commands.', 'WRITING', 'BEGINNER'),
          tf('True or False: "How to Calibrate a Digital Multimeter" is a Procedure Text.', 'True', 'It explains sequential steps to achieve a practical goal.', 'READING', 'BEGINNER'),
          fill('The opening section of a Report Text is called General ___.', 'Classification', 'Report structure: General Classification → Description.', 'C _ _ _ _ _ _ _ _ _ _ _ _ n', 'READING', 'INTERMEDIATE'),
        ],
      },
    ],
  ),

  makeTopic(
    'exposition-explanation-discussion-media-genres',
    'TEXT_TYPES',
    'Exposition, Explanation, Discussion, News, Announcements, Invitations, Ads & Biographies',
    'Analyze persuasive, scientific, journalistic, and functional texts for SMA, SMK, and real life.',
    [
      {
        slug: 'exposition-explanation-discussion',
        title: 'Analytical Exposition, Explanation & Discussion Texts',
        summary: 'Persuade with arguments, explain how natural/tech processes work, and weigh two sides fairly.',
        level: 'INTERMEDIATE',
        audiences: ['SMA', 'SMK', 'GENERAL'],
        durationMin: 14,
        emoji: '🔬',
        blocks: [
          b.objectives([
            'Distinguish **Analytical Exposition** (one-sided thesis) from **Discussion Text** (pros & cons + conclusion).',
            'Understand **Explanation Text** (how/why phenomena happen in sequence).',
          ]),
          b.table(
            ['Genre', 'Purpose', 'Structure'],
            [
              ['Analytical Exposition', 'Convince reader an idea/issue is important', 'Thesis → Arguments → Reiteration'],
              ['Explanation', 'Explain *how* or *why* something happens', 'General Statement → Sequenced Explanation'],
              ['Discussion', 'Present two differing viewpoints on an issue', 'Issue → Arguments For → Arguments Against → Recommendation'],
            ],
            'Upper-Level Genres',
          ),
          b.quickCheck(
            'An essay examining BOTH the benefits AND drawbacks of AI homework tools before giving a balanced conclusion is a ___ text.',
            ['Procedure', 'Discussion', 'Recount', 'Invitation'],
            'Discussion',
            'Discussion texts explicitly present Arguments For + Arguments Against.',
          ),
        ],
        exercises: [
          mcq('What is the final section of an **Analytical Exposition** called?', ['Complication', 'Reiteration', 'Orientation', 'Ingredients'], 'Reiteration', 'Reiteration restates the writer’s thesis strongly at the end.', 'READING', 'INTERMEDIATE'),
          mcq('"How Solar Panels Convert Sunlight into Electricity" is best categorized as an ___ text.', ['Explanation', 'Advertisement', 'Invitation', 'Recount'], 'Explanation', 'Explanation texts trace how/why a scientific or technical process occurs.', 'READING', 'INTERMEDIATE'),
          fill('In a Discussion Text, phrases like "On the other hand" introduce opposing ___.', 'arguments', 'Discussion texts balance supporting and opposing arguments.', 'a _ _ _ _ _ _ _ s', 'READING', 'INTERMEDIATE'),
        ],
      },
      {
        slug: 'news-announcement-invitation-ad-biography',
        title: 'News Items, Announcements, Invitations, Advertisements & Biographies',
        summary: 'Read and write functional everyday texts and inspiring life stories accurately.',
        level: 'BEGINNER',
        audiences: ['SMP', 'SMA', 'SMK', 'GENERAL'],
        durationMin: 12,
        emoji: '📣',
        blocks: [
          b.objectives([
            'Spot the **Newsworthy Event**, **Background**, and **Sources** in a News Item.',
            'Identify essential 5W+1H info in Announcements, Invitations, Advertisements, and Biographies.',
          ]),
          b.expandable([
            { title: 'News Item', body: 'Reports newsworthy daily events: **Newsworthy Event** (lead) → **Background Events** → **Sources** (quotes from witnesses/officials).' },
            { title: 'Announcement & Invitation', body: 'Must clearly state **Event, Date, Time, Venue, Contact/RSVP**. Announcements inform a group; Invitations formally or warmly invite specific guests.' },
            { title: 'Advertisement', body: 'Persuades an audience to buy, join, or act — highlights key benefits, call-to-action (*"Enroll today!"*), and contact info.' },
            { title: 'Biography', body: 'Tells the real life story of a notable person using **Orientation** → **Notable Events & Achievements** → **Re-orientation** (legacy), written in **third person + Simple Past**.' },
          ], '5 Essential Genres'),
          b.quickCheck(
            'Which genre is written in **third person** (*he/she*) to chronicle a real person’s life achievements?',
            ['Biography', 'Advertisement', 'Procedure', 'Announcement'],
            'Biography',
            'A biography recounts someone else’s real life story and contributions.',
          ),
        ],
        exercises: [
          mcq('In a **News Item**, quotes from witnesses or experts form the ___ section.', ['Complication', 'Sources', 'Coda', 'Materials'], 'Sources', 'News articles cite credible Sources for verification.', 'READING', 'INTERMEDIATE'),
          mcq('What does **RSVP** on an invitation ask guests to do?', ['Bring snacks', 'Confirm whether they will attend', 'Read a book', 'Arrive two hours late'], 'Confirm whether they will attend', 'RSVP asks invitees to reply and confirm attendance.', 'VOCABULARY', 'BEGINNER'),
          match('Match each text to its key element:', [
            ['News Item', 'Newsworthy event & sources'],
            ['Advertisement', 'Persuasive slogan & call-to-action'],
            ['Biography', 'Life milestones in 3rd person'],
            ['Announcement', 'Public notice with date/time/venue'],
          ], 'All 13 English Text Types mastered!', 'READING', 'BEGINNER'),
        ],
      },
    ],
  ),
];

export const vocationalTopics: TopicSeed[] = [
  makeTopic(
    'workplace-and-customer-english',
    'VOCATIONAL',
    'Workplace Communication, Correspondence, Customer Service & Hospitality',
    'Essential SMK & professional English for offices, hotels, retail, and client care.',
    [
      {
        slug: 'workplace-communication-and-correspondence',
        title: 'Workplace Communication & Business Correspondence',
        summary: 'Handle team standups, polite memos, purchase inquiries, and professional follow-ups.',
        level: 'INTERMEDIATE',
        audiences: ['SMK', 'GENERAL'],
        durationMin: 12,
        emoji: '🏢',
        blocks: [
          b.objectives([
            'Write clear business memos, inquiries, and confirmation emails.',
            'Give polite status updates during team meetings.',
          ]),
          b.dialogue(
            [
              { speaker: 'Manager', text: 'Morning team! Could everyone share a quick update on the client portal?' },
              { speaker: 'Sinta', text: 'Sure! I finished updating the user guide yesterday. Next, I am coordinating with QA to test the login form by 3 PM.' },
              { speaker: 'Manager', text: 'Great clarity, Sinta. Please loop me in once QA signs off.' },
            ],
            'Daily Workplace Standup',
          ),
          b.writing(
            'Write a short **business inquiry email** (at least 40 words) asking a supplier for a price quote and delivery timeline for 30 office headsets.',
            40,
            ['Formal greeting', 'Exact quantity & item', 'Polite request for quote + delivery timeline', 'Professional closing'],
          ),
        ],
        exercises: [
          mcq('What does **"Please loop me in"** mean in a workplace email?', ['Delete my account', 'Keep me updated / include me in the email thread', 'Restart the router', 'Cancel the order'], 'Keep me updated / include me in the email thread', '"Loop someone in" is a common business expression meaning include/inform them.', 'VOCABULARY', 'INTERMEDIATE'),
          mcq('Which opening suits a formal business correspondence letter?', ['Dear Supplier Team,', 'Yo guys,', 'Listen up,', 'Hey bestie,'], 'Dear Supplier Team,', 'Keep business openings polite and direct.', 'WRITING', 'BEGINNER'),
          fill('Complete: "Please find ___ (attached/attaching) the invoice for May."', 'attached', '"Please find attached..." is the standard phrase for file attachments.', 'a _ _ _ _ _ _ d', 'WRITING', 'INTERMEDIATE'),
        ],
      },
      {
        slug: 'customer-service-and-hospitality',
        title: 'Customer Service & Hospitality English',
        summary: 'Greet guests warmly, solve complaints with empathy, and manage hotel/restaurant requests.',
        level: 'BEGINNER',
        audiences: ['SMK', 'GENERAL'],
        durationMin: 12,
        emoji: '🛎️',
        blocks: [
          b.objectives([
            'Follow the **L-E-A-P** formula for resolving complaints: Listen, Empathize, Act, Prevent.',
            'Handle hotel check-ins, room requests, and polite hospitality phrasing.',
          ]),
          b.dialogue(
            [
              { speaker: 'Guest', text: 'Excuse me, the Wi-Fi in Room 408 keeps disconnecting.' },
              { speaker: 'Receptionist', text: 'I’m very sorry for the inconvenience, Mr. Tan. I completely understand how frustrating that is before a meeting. Let me reset the access point right away and provide our priority conference network password as well.' },
              { speaker: 'Guest', text: 'Thank you—I really appreciate the fast help!' },
            ],
            'Hospitality Service Recovery',
          ),
          b.speaking(
            'Roleplay greeting a hotel guest at check-in and confirming their reservation.',
            'Good afternoon and welcome to Horizon Hotel! How may I assist you today? Could I please see your passport or booking confirmation so I can check you into your room right away?',
            ['Keep your tone warm, unhurried, and helpful.'],
          ),
        ],
        exercises: [
          mcq('Which response uses empathy when a customer receives the wrong order?', ['Not my fault!', 'Wait over there.', 'I sincerely apologize for the mix-up—let me prepare the correct dish for you right away.', 'Did you read the menu properly?'], 'I sincerely apologize for the mix-up—let me prepare the correct dish for you right away.', 'Apologize sincerely without blaming the guest, then offer immediate action.', 'SPEAKING', 'BEGINNER'),
          mcq('At a hotel desk, "May I see your ID and booking confirmation?" happens during ___.', ['check-in', 'room service', 'emergency drill', 'graduation'], 'check-in', 'Front desk staff verify identity and booking details at check-in.', 'VOCABULARY', 'BEGINNER'),
          fill('Polite hospitality offer: "Would you like any assistance ___ your luggage?"', 'with', '"Assistance with..." is natural hospitality English.', 'w _ _ h', 'VOCABULARY', 'BEGINNER'),
        ],
      },
    ],
  ),

  makeTopic(
    'technical-instructions-interviews-presentations',
    'VOCATIONAL',
    'Technical English, Workplace Instructions, Job Interviews & Professional Presentations',
    'Prepare SMK & career learners for technical manuals, safety rules, interviews, and pitches.',
    [
      {
        slug: 'technical-english-and-workplace-instructions',
        title: 'Technical English & Workplace Instructions (SOPs & Safety)',
        summary: 'Read troubleshooting guides, equipment manuals, and safety briefings with zero guesswork.',
        level: 'INTERMEDIATE',
        audiences: ['SMK', 'GENERAL'],
        durationMin: 12,
        emoji: '🔧',
        blocks: [
          b.objectives([
            'Understand standard safety signs (`Caution`, `Warning`, `Mandatory PPE`).',
            'Give and follow clear multi-step technical instructions.',
          ]),
          b.table(
            ['Signal Word', 'Meaning', 'Example'],
            [
              ['CAUTION', 'Minor risk if ignored', 'Caution: Hot surface during calibration.'],
              ['WARNING', 'Serious injury risk', 'Warning: Disconnect power before opening panel.'],
              ['MANDATORY', 'Required action/gear', 'Safety goggles must be worn in Zone B.'],
            ],
            'Safety & SOP Terminology',
          ),
          b.quickCheck(
            'What should a technician do BEFORE opening an electrical panel marked "WARNING: Disconnect power"?',
            ['Increase the voltage', 'Unplug or switch off the power source', 'Pour water nearby', 'Ignore the label'],
            'Unplug or switch off the power source',
            '"Disconnect power" means turning off and isolating electricity first.',
          ),
        ],
        exercises: [
          mcq('Which phrase introduces a troubleshooting check in a tech manual?', ['Once upon a time,', 'Verify that the Ethernet cable is firmly seated.', 'Deliciously seasoned,', 'Sincerely yours,'], 'Verify that the Ethernet cable is firmly seated.', 'Technical instructions start with clear action verbs like Verify, Inspect, Reset.', 'READING', 'INTERMEDIATE'),
          tf('True or False: "PPE" stands for Personal Protective Equipment.', 'True', 'Safety helmets, gloves, and goggles are examples of PPE.', 'VOCABULARY', 'INTERMEDIATE'),
          fill('Safety imperative: "Always ___ (wear) insulated gloves when handling live tools."', 'wear', 'Safety instructions use base-form imperatives.', 'w _ _ r', 'GRAMMAR', 'BEGINNER'),
        ],
      },
      {
        slug: 'job-interviews-and-professional-presentations',
        title: 'Job Interviews & Professional Presentations',
        summary: 'Answer tough interview questions, highlight SMK/project skills, and deliver memorable slides.',
        level: 'INTERMEDIATE',
        audiences: ['SMA', 'SMK', 'GENERAL'],
        durationMin: 14,
        emoji: '💼',
        blocks: [
          b.objectives([
            'Handle "Tell me about yourself", "Why should we hire you?", and strength/growth questions.',
            'Structure a crisp 3-part professional presentation (Hook → Core Points → Call to Action).',
          ]),
          b.steps([
            { title: 'Present → Past → Future Formula', body: 'For *"Tell me about yourself"*: what you do **now**, a key **past** achievement, and why you’re excited for this **future** role.' },
            { title: 'Signposting in Presentations', body: 'Guide your listeners: *"First, let’s look at the challenge..."*, *"As this graph illustrates..."*, *"To summarize, our solution cuts wait time by 40%."*' },
          ], 'Career Mastery Playbook'),
          b.speaking(
            'Practice answering: "Tell me about a project you are proud of and what you learned."',
            'During my final vocational semester, I led a three-person team to build an inventory web app. I coordinated task schedules and wrote our English documentation, which helped us finish two days ahead of deadline and taught me clear communication.',
            ['Include numbers or concrete results when possible!'],
          ),
        ],
        exercises: [
          mcq('In a job interview, which answer to "What is a weakness you’re improving?" works BEST?', ['I have zero weaknesses.', 'I’m always late to everything.', 'I used to rush through slide notes, so now I practice aloud with a timer beforehand.', 'I hate teamwork.'], 'I used to rush through slide notes, so now I practice aloud with a timer beforehand.', 'Show self-awareness + concrete steps you are taking to improve.', 'SPEAKING', 'INTERMEDIATE'),
          mcq('Which phrase works best to end a professional presentation?', ['Okay bye.', 'That’s all I guess.', 'Thank you for your attention—I would be glad to answer your questions.', 'Next slide please.'], 'Thank you for your attention—I would be glad to answer your questions.', 'Invite Q&A warmly and professionally.', 'SPEAKING', 'INTERMEDIATE'),
          fill('Signposting: "As this chart ___, user engagement doubled in Q3."', 'illustrates|shows', 'Use "illustrates" or "shows" when pointing to slide data.', 's _ _ _ s / i _ _ _ _ _ _ _ _ _ s', 'VOCABULARY', 'INTERMEDIATE'),
        ],
      },
    ],
  ),
];
