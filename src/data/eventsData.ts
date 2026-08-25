import { SymposiumEvent } from '../types';

export interface EventCombo {
  id: string;
  title: string;
  tagline: string;
  price: number;
  originalPrice: number;
  savings: number;
  badge: string;
  description: string;
  includedEventIds: string[];
  includedEventTitles: string[];
  rules: string[];
}

export const COMBOS_DATA: EventCombo[] = [
  {
    id: 'combo-individual-all-access',
    title: '3-Event Individual Combo Pass',
    tagline: 'All-access solo pass for Profile Architect, Memergency and Prompt Perfect.',
    price: 350,
    originalPrice: 450,
    savings: 100,
    badge: '3-EVENT INDIVIDUAL COMBO',
    description: 'One single combo pass for ₹350 that grants complete official entry to Profile Architect, Memergency, and Prompt Perfect.',
    includedEventIds: [
      'tech-profile-architect',
      'nontech-prompt-perfect',
      'nontech-memergency'
    ],
    includedEventTitles: [
      'Profile Architect (Tech - ₹150)',
      'Prompt Perfect (Non-Tech - ₹150)',
      'Memergency (Non-Tech - ₹150)'
    ],
    rules: [
      'Valid for 1 individual attendee across 3 selected individual event tracks.',
      'Grants all-inclusive access to Profile Architect, Prompt Perfect, and Memergency for a single flat fee of ₹350 (Saves ₹100).',
      'Single QR Pass grants entry to all 3 included individual event arenas with refreshments included.',
      'Participation & Merit certificates awarded for each included event completed.'
    ]
  }
];

export const EVENTS_DATA: SymposiumEvent[] = [
  // =========================================================================
  // 1. CRACK THE CODE (TECHNICAL - TEAM OF 2)
  // =========================================================================
  {
    id: 'tech-crack-the-code',
    title: 'Crack The Code',
    tagline: 'Team-based programming competition combining fundamentals, balloon challenge, and jumbled code.',
    category: 'technical',
    day: 'Day 1',
    time: '10:00 AM - 01:00 PM',
    venue: 'Lab (Computer Lab)',
    teamSize: 'Team of 2 Members',
    minTeamSize: 2,
    maxTeamSize: 2,
    entryFee: 300,
    prizePool: '1st, 2nd & 3rd Cash Prizes + Merit Certificates',
    shortDescription: 'Three progressive rounds testing syntax, communication, problem-solving, and jumbled logic under time pressure.',
    fullDescription: 'Crack The Code is a team-based programming competition conducted as part of IgniteX\'26. The event is designed to test participants\' programming knowledge, logical thinking, communication, teamwork, problem-solving ability, and performance under time pressure. Unlike conventional coding contests, each round combines technical knowledge with interactive game-based challenges.',
    rules: [
      'Each team must consist of exactly two members.',
      'Participants must follow the instructions provided by coordinators and judges.',
      'Only shortlisted teams may proceed to subsequent rounds.',
      'The allotted time for each round must be strictly followed.',
      'In Round 2, the challenge must be completed according to the announced format and time limit.',
      'In Round 3, the difficulty level is determined by the randomly selected paper and cannot be changed after selection.',
      'The jumbled code must be correctly rearranged and executed to receive performance marks.',
      'Any form of unfair assistance, cheating, or manipulation will lead to immediate disqualification.',
      'Professional and respectful conduct is mandatory throughout the event.',
      'The decision of the judges and organizing committee will be final.'
    ],
    ruleBook: {
      eventOverview: 'Crack The Code is an engaging, three-round team coding showdown. Teams advance after rigorous evaluation of logic, correctness, speed, and collaborative dynamics.',
      eventFormatSummary: '3 Progressive Rounds: Round 1 (Programming Basics) → Shortlisted Teams → Round 2 (Balloon Code Challenge) → Finalists → Round 3 (Jumbled Code Challenge) → Top 3 Winners.',
      rounds: [
        {
          roundNumber: 1,
          roundName: 'Round 1 — Programming Basics',
          duration: '30 Minutes',
          description: 'Teams answer basic questions related to programming languages and coding concepts. Questions cover programming fundamentals, syntax identification, output prediction, and basic logical questions.',
          details: [
            'Multiple choice questions, syntax debugging, and output prediction',
            'Testing core logic across C, C++, Python, and Java',
            'Teams with highest aggregate scores qualify for Round 2'
          ],
          scoring: 'Highest total score determines qualification for Round 2.'
        },
        {
          roundNumber: 2,
          roundName: 'Round 2 — Balloon Code Challenge',
          duration: '45 Minutes',
          description: 'Interactive team coordination sprint. Member 1 comes forward and selects or bursts a balloon containing a coding question. Member 1 communicates the problem statement to Member 2, and the team collaborates on the logic to complete the working program within the allotted time.',
          details: [
            'Member 1 receives the problem inside the balloon and dictates logic',
            'Member 2 types and constructs the source code',
            'Evaluated on correctness, logical approach, teamwork, communication, and time management',
            'Top-performing teams advance to the Final Round'
          ],
          scoring: 'Correctness of code (40%), Team coordination (30%), Time management (30%).'
        },
        {
          roundNumber: 3,
          roundName: 'Round 3 — Jumbled Code Challenge',
          duration: '45 Minutes',
          description: 'The final round combines luck, logical thinking, and programming skills. One member randomly selects a paper from a bowl determining challenge difficulty (Easy, Moderate, or Hard). The code is provided in a scrambled order; teams must re-order, debug, compile, and execute with matching output.',
          details: [
            'Random bowl draw determines difficulty level (cannot be swapped)',
            'Analyze scrambled lines of code, deduce algorithm flow, and reconstruct syntax',
            'Execute program successfully against hidden test cases under tight countdown',
            'Additional performance consideration given for faster completion'
          ],
          scoring: 'Easy = 10 Base Marks | Moderate = 20 Base Marks | Hard = 30 Base Marks + Speed Bonus.'
        }
      ],
      evaluationCriteria: [
        { criterion: 'Round 1: Fundamental Accuracy', weightage: 'Qualifying', description: 'Correct answers, syntax identification, and total score.' },
        { criterion: 'Round 2: Collaborative Execution', weightage: 'Shortlist', description: 'Code correctness, algorithmic logic, communication, and time taken.' },
        { criterion: 'Round 3: Code Arrangement & Output', weightage: 'Final Ranking', description: 'Correct logical sequence, successful execution, target output matching, and difficulty multiplier.' }
      ],
      participantFlow: [
        'Registration & Verification',
        'Round 1: Programming Basics (MCQs & Syntax)',
        'Shortlisting of Qualifying Teams',
        'Round 2: Balloon Code Challenge (Team Relay)',
        'Finalist Shortlisting',
        'Round 3: Jumbled Code Challenge (Difficulty Draw & Execution)',
        'Final Evaluation & Ranking (1st, 2nd, 3rd Place)'
      ],
      facilitiesProvided: [
        'Suitable laboratory with seating for participants and judges',
        'Laptops or computer systems with pre-installed IDEs and compilers',
        'Projector / LED display for instructions and time management',
        'Balloons with printed coding challenges (Round 2)',
        'Bowls and difficulty-selection slips (Round 3)',
        'Participation certificates, winner certificates, and cash prizes'
      ],
      prizeStructure: [
        { place: '1st Place', prize: 'Cash Prize + Winner Certificate + Trophy' },
        { place: '2nd Place', prize: 'Cash Prize + Winner Certificate' },
        { place: '3rd Place', prize: 'Cash Prize + Winner Certificate' }
      ]
    },
    coordinators: [
      { name: 'Yathika S', phone: '+91 74180 57041', role: 'Event Coordinator' }
    ],
    slotsTotal: 40,
    slotsFilled: 29,
    iconName: 'Code2',
    featured: true
  },

  // =========================================================================
  // 2. NEURAL RUSH / GEN AI CLASH (TECHNICAL - DUO)
  // =========================================================================
  {
    id: 'tech-neural-rush',
    title: 'Neural Rush (Gen AI Clash)',
    tagline: '4-Level duo AI tech quiz, AI vs. Human detection, logic vault, and rapid-fire finals.',
    category: 'technical',
    day: 'Day 1',
    time: '11:00 AM - 02:00 PM',
    venue: 'Seminar Hall II',
    teamSize: 'Duo (2 Members)',
    minTeamSize: 2,
    maxTeamSize: 2,
    entryFee: 150,
    prizePool: '1st, 2nd & 3rd Cash Prizes + Winner Certificates',
    shortDescription: 'Multi-level challenge from Byte Rush quiz to AI Detective detection, AI Vault puzzles, and high-pressure finals.',
    fullDescription: 'Neural Rush (Gen AI Clash) is a duo technical quiz and challenge event conducted as part of IgniteX\'26. The event is designed to test participants\' knowledge of Artificial Intelligence, emerging technologies, logical thinking, observation skills, and ability to detect AI artifacts within strict time limits. Progress through four progressive levels from Byte Rush to high-pressure finals.',
    rules: [
      'Neural Rush is a duo event. Each team must have exactly 2 unique members.',
      'Each participant may register only once.',
      'Participants must follow the instructions given by the event coordinators throughout all levels.',
      'Mobile phones or personal devices are permitted only during Level 1, strictly for accessing the designated digital quiz platform.',
      'Mobile phones and other personal devices are strictly prohibited from Level 2 onwards, unless specifically instructed.',
      'Participants must not use external assistance, communication, or unauthorized AI tools during any round.',
      'The time limit specified for each challenge must be strictly followed (30s per question in Level 1).',
      'Any attempt to cheat, manipulate quiz systems, or communicate will lead to immediate disqualification.',
      'The organizers reserve the right to modify qualifying thresholds based on registration volume.',
      'The decision of the evaluation/organizing committee regarding ranking, tie-breakers and winners is final.'
    ],
    ruleBook: {
      eventOverview: 'Four-level comprehensive AI competition assessing theoretical foundations, multimodal AI generation detection, prompt and tool reasoning, and rapid-fire problem solving under pressure.',
      eventFormatSummary: 'Level 1: Byte Rush (Quiz) → Top 35–40% Qualify → Level 2: AI Detective (AI vs Human) → Level 3: AI Vault (Logic & Tools) → Level 4: Final Challenge (Rapid Fire & Visual) → Top 3 Winners.',
      rounds: [
        {
          roundNumber: 1,
          roundName: 'Level 1 — Byte Rush',
          duration: '20 Minutes (30s / Question)',
          description: 'A fast-paced AI and Technology quiz round conducted via a digital platform. Questions auto-advance after 30 seconds.',
          details: [
            'AI and Technology MCQs & Logo Identification',
            'Image-based questions, core AI concepts, and current LLM trends',
            'Top 35–40% highest scoring participants advance to Level 2'
          ],
          scoring: 'Speed & accuracy points on digital platform.'
        },
        {
          roundNumber: 2,
          roundName: 'Level 2 — AI Detective',
          duration: '30 Minutes',
          description: 'Challenge-based round focused on identifying whether presented multimedia content is AI-generated or human/real.',
          details: [
            'AI-generated image vs. real image detection',
            'AI-synthesized voice vs. authentic human voice',
            'AI fake news vs. real journalism',
            'AI-generated text vs. human-written literature'
          ],
          scoring: 'Detection accuracy score; top scorers advance to Level 3.'
        },
        {
          roundNumber: 3,
          roundName: 'Level 3 — AI Vault',
          duration: '35 Minutes',
          description: 'A collection of short AI, logical, and computational problem-solving challenges.',
          details: [
            'AI Tool Matching & Architecture association',
            'Binary and Logical reasoning challenges',
            'AI Logo Puzzles and Mini Challenges',
            'Top participants qualify for the Grand Final'
          ],
          scoring: 'Composite points from puzzle and logic completion.'
        },
        {
          roundNumber: 4,
          roundName: 'Level 4 — Final Challenge',
          duration: '30 Minutes',
          description: 'High-pressure final round conducted exclusively for the top shortlisted finalists in front of the jury.',
          details: [
            'Rapid-fire buzzer and technical questions',
            'Visual deduction and AI architectural puzzles',
            'Surprise AI challenges revealed live during the stage',
            'Top 3 determine 1st, 2nd, and 3rd place winners'
          ],
          scoring: 'Jury score + rapid response timer.'
        }
      ],
      evaluationCriteria: [
        { criterion: 'Level 1: Byte Rush Score', weightage: 'Top 35-40%', description: 'Speed and accuracy on digital quiz platform.' },
        { criterion: 'Level 2: AI Detective Accuracy', weightage: 'Shortlist', description: 'Precision in discerning AI generated artifacts from real human assets.' },
        { criterion: 'Level 3: AI Vault Logic', weightage: 'Finalist Filter', description: 'Problem-solving speed on binary, logo, and tool logic.' },
        { criterion: 'Level 4: Final Challenge Performance', weightage: 'Final Ranking', description: 'Overall mastery under time pressure, accuracy, and live stage reasoning.' }
      ],
      participantFlow: [
        'Registration & Identification Badge Issue',
        'Level 1: Byte Rush (Digital AI Quiz via Mobile/PC)',
        'Top 35–40% Shortlisted for Level 2',
        'Level 2: AI Detective (Deepfake & AI vs Real Detection)',
        'Selected Participants Qualify for Level 3',
        'Level 3: AI Vault (Logic, Binary & Tool Puzzles)',
        'Top 5 Finalists Qualify for Level 4',
        'Level 4: Final Challenge (Rapid-Fire & Visual Stage)',
        'Final Evaluation & Winner Declaration'
      ],
      facilitiesProvided: [
        'Designated Seminar Hall seating with high-speed network access',
        'Participant badge and official ID card',
        'Drinking water & refreshments',
        'Participation certificates for all completed attendees',
        'Cash prizes and winner certificates for 1st, 2nd, and 3rd place'
      ],
      prizeStructure: [
        { place: '1st Place', prize: 'Cash Prize + Winner Certificate' },
        { place: '2nd Place', prize: 'Cash Prize + Winner Certificate' },
        { place: '3rd Place', prize: 'Cash Prize + Winner Certificate' }
      ]
    },
    coordinators: [
      { name: 'R.Kanishka', phone: '+91 63833 38549', role: 'Event Coordinator' }
    ],
    slotsTotal: 60,
    slotsFilled: 48,
    iconName: 'Cpu',
    featured: true
  },

  // =========================================================================
  // 3. POSTERXPO (TECHNICAL - TEAM EVENT: 2-3 MEMBERS)
  // =========================================================================
  {
    id: 'tech-poster-xpo',
    title: 'PosterXpo',
    tagline: 'Team Poster Presentation Event across two progressive rounds (2–3 Members per Team).',
    category: 'technical',
    day: 'Day 1',
    time: '01:30 PM - 04:30 PM',
    venue: 'Lab',
    teamSize: 'Team of 2–3 Members',
    minTeamSize: 2,
    maxTeamSize: 3,
    entryFee: 150,
    prizePool: '1st: ₹3,000 | 2nd: ₹2,000 | 3rd: ₹1,000 + Winner Certificates',
    shortDescription: 'Level 1: Digital A3 poster on 5 common topics. Level 2: On-the-spot confidential challenge for shortlisted teams.',
    fullDescription: 'PosterXpo is a team-based poster presentation event designed to provide participants with a platform to demonstrate creativity, subject knowledge, research ability, visual communication, teamwork, presentation skills and innovative thinking through posters. The event is conducted across two levels for teams of 2–3 members.',
    rules: [
      'PosterXpo is strictly a team event. Each team must consist of 2–3 members. Teams outside this limit will not be permitted.',
      'Each participant may be part of only one team and each team may register only once.',
      'Team members must follow all instructions given by the event coordinators.',
      'The Level 1 poster must be prepared in A3 size and must be relevant to the selected topic.',
      'The content must be original and presented by the team. Plagiarism or direct copying is strictly prohibited.',
      'Teams must not use offensive, inappropriate or discriminatory content. Proper references should be provided wherever external information is used.',
      'Teams must complete their presentation within the allotted 2–3 minutes.',
      'The complete duration of Level 1 is 1 hour (including team presentation). The complete duration of Level 2 is 1 hour (including poster preparation and presentation).',
      'Exceeding presentation time may result in deduction of marks. Teams must be prepared to answer questions from judges.',
      'Mobile phones and personal devices may be used only as specifically permitted by the organizers.',
      'AI tools, internet resources or other external assistance during Level 2 are permitted only if explicitly allowed by event coordinators.',
      'Teams must report to the venue before the scheduled reporting time.',
      'The decision of the judging/evaluation committee regarding qualification, ranking and winners will be final.'
    ],
    ruleBook: {
      eventOverview: 'PosterXpo is a team-based poster presentation event designed to provide participants with a platform to demonstrate creativity, subject knowledge, research ability, visual communication, teamwork, presentation skills and innovative thinking through posters across two competitive levels.',
      eventFormatSummary: 'Level 1: Digital A3 Poster Presentation (1 Hour Session + 2–3 Minute Presentation) → Shortlisted Teams → Level 2: On-the-Spot Team Poster Challenge (1 Hour Session + 2–3 Minute Presentation) → 1st, 2nd, 3rd Prize Winners.',
      topics: [
        'Topic 1 — Artificial Intelligence and the Future (AI in Education, Healthcare, Business, Engineering, Arts & Creativity, Society, Responsible & Ethical AI)',
        'Topic 2 — Sustainability and Climate Change (Climate Action, Renewable Energy, Sustainable Development, Green Tech, Environmental Protection, Sustainable Communities)',
        'Topic 3 — Innovation and Technology for a Better Future (Emerging Technologies, Smart Solutions, Automation, Digital Transformation, Robotics, Smart Cities, Social Impact)',
        'Topic 4 — Youth, Society and Social Change (Youth Empowerment, Education, Social Media, Equality, Leadership, Community Development, Youth as Change Makers)',
        'Topic 5 — India 2047: Vision for a Developed India (Technology, Education, Healthcare, Economy, Infrastructure, Entrepreneurship, Sustainability, Digital India, Nation Building)'
      ],
      rounds: [
        {
          roundNumber: 1,
          roundName: 'Level 1 — Digital Poster Presentation',
          duration: '1 Hour (including 2–3 min presentation)',
          description: 'Teams prepare a digital poster in A3 size based on one of the five common topics provided by the organizers. Each team is given 2–3 minutes to present before the judging panel. Best-performing teams qualify for Level 2.',
          details: [
            'Strictly a team round (2–3 members per team)',
            'Each team selects one topic from the 5 common topics provided',
            'The poster must be prepared in A3 size with diagrams, charts, illustrations, graphs, and key points',
            'Teams may approach the selected topic according to their respective department or field',
            'All team members should contribute to the preparation and oral presentation (2–3 minutes)',
            'Evaluated by judging panel; top shortlisted teams advance to Level 2'
          ],
          scoring: 'Scored out of 100% across the 7 evaluation criteria.'
        },
        {
          roundNumber: 2,
          roundName: 'Level 2 — On-the-Spot Team Poster Challenge',
          duration: '1 Hour (including preparation + 2–3 min presentation)',
          description: 'Shortlisted teams receive a confidential on-the-spot topic/theme selected by the organizing committee. Team members collaborate to develop and present their poster within 1 hour.',
          details: [
            'Shortlisted teams receive a confidential topic/theme on the spot at round start',
            'Team members discuss, divide responsibilities, and create an original poster',
            '2–3 minute team presentation and explanation before the judging panel',
            'Judges may ask questions to any team member regarding the poster and understanding of the topic',
            'Final ranking determines 1st, 2nd, and 3rd prize-winning teams'
          ],
          scoring: 'Final ranking based on overall Level 2 performance, quick thinking, originality, and oral defense.'
        }
      ],
      evaluationCriteria: [
        { criterion: 'Relevance to Topic', weightage: '20%', description: 'How directly and thoroughly the poster addresses the chosen/assigned problem statement.' },
        { criterion: 'Content & Subject Knowledge', weightage: '20%', description: 'Depth of research, technical accuracy, and domain mastery.' },
        { criterion: 'Creativity & Originality', weightage: '20%', description: 'Innovative visual angles, fresh concepts, and unique design execution.' },
        { criterion: 'Visual Design & Presentation', weightage: '15%', description: 'Typography, visual hierarchy, clarity of diagrams/charts, and overall aesthetic.' },
        { criterion: 'Innovation / Ideas', weightage: '10%', description: 'Novel solutions, forward-thinking concepts, and practical applicability.' },
        { criterion: 'Teamwork & Coordination', weightage: '10%', description: 'Equal contribution, division of roles, and seamless coordination during defense.' },
        { criterion: 'Communication & Explanation', weightage: '5%', description: 'Clarity, confidence, and precision in the 2–3 minute oral presentation.' }
      ],
      participantFlow: [
        'Registration & Team Formation (2–3 Members)',
        'Level 1 — Select 1 of 5 Common Topics',
        'Digital A3 Poster Preparation',
        '1 Hour Session + 2–3 Minute Team Presentation',
        'Judging & Evaluation → Shortlisted Teams',
        'Level 2 — On-the-Spot Topic Announcement',
        'Team Poster Preparation (1 Hour Session + 2–3 Min Defense)',
        'Final Evaluation & Ranking → 1st, 2nd & 3rd Prize'
      ],
      facilitiesProvided: [
        'Participant badge / identification and ID card',
        'Designated seating arrangements and drinking water',
        'Participation certificate for all participants who complete the event',
        'Refreshments as part of the overall symposium arrangements',
        'Winner certificates for 1st, 2nd and 3rd place',
        'Cash prizes for the winning teams'
      ],
      prizeStructure: [
        { place: '1st Prize', prize: '₹3,000 Cash Prize + Winner Certificate' },
        { place: '2nd Prize', prize: '₹2,000 Cash Prize + Winner Certificate' },
        { place: '3rd Prize', prize: '₹1,000 Cash Prize + Winner Certificate' }
      ]
    },
    coordinators: [
      { name: 'Shobika Narendiran', phone: '+91 93422 48191', role: 'Event Coordinator' }
    ],
    slotsTotal: 40,
    slotsFilled: 28,
    iconName: 'Palette',
    featured: true
  },

  // =========================================================================
  // 4. PROFILE ARCHITECT (TECHNICAL - INDIVIDUAL)
  // =========================================================================
  {
    id: 'tech-profile-architect',
    title: 'Profile Architect',
    tagline: 'AI-Assisted resume building, debugging flawed resumes, and keyword job matching.',
    category: 'technical',
    day: 'Day 1',
    time: '10:00 AM - 12:30 PM',
    venue: 'Lab (Computer Lab)',
    teamSize: 'Individual (1 Member)',
    minTeamSize: 1,
    maxTeamSize: 1,
    entryFee: 150,
    prizePool: '1st, 2nd & 3rd Cash Prizes + Top Performer Merit Awards',
    shortDescription: 'Three progressive rounds: AI resume generation from job description, debugging a flawed CV, and keyword inference matching.',
    fullDescription: 'The AI-Assisted Resume Building Event (Profile Architect) is an individual event designed to test participants\' practical resume-building skills, ability to work with modern AI tools, and understanding of job requirements and professional resume standards. Learn responsible AI tool usage, identify resume weaknesses, infer job profiles from keywords, and combine AI assistance with human judgment.',
    rules: [
      'Strictly an individual event; no collaboration permitted.',
      'Participants may use AI tools as permitted for respective rounds.',
      'Follow all instructions and complete tasks within specified time limits.',
      'Create, edit, and submit own work; no assistance from other participants.',
      'Do not share answers, content, or prompts with others.',
      'Do not interfere with another participant\'s system or work.',
      'Submit final resume before designated deadline; no changes after submission.',
      'Copying, cheating, or unauthorized assistance leads to immediate disqualification.',
      'Organizers reserve the right to shortlist participants between rounds.',
      'Judges\' decision is final.'
    ],
    ruleBook: {
      eventOverview: 'Three-round career engineering sprint where participants leverage generative AI responsibly to tailor resumes, debug structural anti-patterns, and infer target corporate roles from raw keyword clusters.',
      eventFormatSummary: 'Round 1: AI Resume Creation (Job Profile Given) → Evaluation → Round 2: Resume Debugging & Improvement (Flawed CV Given) → Shortlisting → Round 3: Keyword-to-Job Profile Challenge (Clues Given) → Final Winners.',
      rounds: [
        {
          roundNumber: 1,
          roundName: 'Round 1 – AI Resume Creation',
          duration: '35 Minutes',
          description: 'Participants receive a general job profile or description and utilize AI tools to create a professional, tailored resume.',
          details: [
            'Test effective AI prompting and resume formatting quality',
            'Tailor qualifications, technical stack, and quantitative metrics to the job profile',
            'Edit and refine the resume within the allotted time',
            'Successful participants shortlisted for Round 2'
          ],
          scoring: 'Relevance to role, clear structure, and professional language.'
        },
        {
          roundNumber: 2,
          roundName: 'Round 2 – Resume Debugging & Improvement',
          duration: '35 Minutes',
          description: 'Participants receive a poorly structured or flawed resume riddled with weak descriptions, poor hierarchy, and irrelevant data.',
          details: [
            'Diagnose structural flaws, grammar, and ATS compliance issues',
            'Restructure and elevate document quality significantly',
            'Demonstrate sharp editorial judgment over raw machine output',
            'Top candidates advance to Round 3'
          ],
          scoring: 'Quality of corrections and structural enhancements.'
        },
        {
          roundNumber: 3,
          roundName: 'Round 3 – Keyword-to-Job Profile Challenge',
          duration: '30 Minutes',
          description: 'Participants receive raw keywords, skill lists, requirements, or cryptic clues instead of a direct job profile.',
          details: [
            'Analyze keywords to infer the appropriate industry job title/domain',
            'Determine and construct relevant resume content based on interpretation',
            'Test job-profile inference, keyword reasoning, and holistic career architecture',
            'Final evaluation determines 1st, 2nd, and 3rd place winners'
          ],
          scoring: 'Inference accuracy, keyword integration, and overall resume excellence.'
        }
      ],
      evaluationCriteria: [
        { criterion: 'Round 1: Relevance & AI Quality', weightage: 'Qualifying', description: 'Alignment with given job profile, readable layout, and concise language.' },
        { criterion: 'Round 2: Debugging Efficacy', weightage: 'Shortlist', description: 'Effectiveness in identifying weaknesses and elevating overall professionalism.' },
        { criterion: 'Round 3: Keyword Inference & Synthesis', weightage: 'Final Ranking', description: 'Accuracy in deducing the target job role and converting clues into stellar resume sections.' }
      ],
      participantFlow: [
        'Registration & System / Seat Allocation',
        'Rules Briefing & Permitted AI Tool Access',
        'Round 1: Job Profile Provided → AI Resume Creation → Submission',
        'Evaluation & Shortlisting for Round 2',
        'Round 2: Flawed Resume Provided → Debugging & Improvement',
        'Evaluation & Shortlisting for Round 3',
        'Round 3: Keywords Provided → Job Profile Inference → Final Resume',
        'Final Evaluation & Results Announcement'
      ],
      facilitiesProvided: [
        'Computer system provided by the college with internet access for permitted AI tools',
        'Designated seating arrangements and participant ID badge',
        'Drinking water & refreshments',
        'Participation certificates for all completed participants',
        'Winner certificates and awards for top performers'
      ],
      prizeStructure: [
        { place: '1st Place', prize: 'Cash Prize + Winner Certificate + Career Award' },
        { place: '2nd Place', prize: 'Cash Prize + Winner Certificate' },
        { place: '3rd Place', prize: 'Cash Prize + Winner Certificate' }
      ]
    },
    coordinators: [
      { name: 'NITHISH B', phone: '+91 73977 94623', role: 'Event Coordinator' }
    ],
    slotsTotal: 60,
    slotsFilled: 45,
    iconName: 'FileText',
    featured: true
  },

  // =========================================================================
  // 5. ZERO: THE FINAL KEY (TECHNICAL - TEAM OF 2-4 MEMBERS)
  // =========================================================================
  {
    id: 'tech-zero-final-key',
    title: 'Zero: The Final Key',
    tagline: 'Technical Mystery & Cyber Investigation Event across 5 progressive levels (2–4 Members per Team).',
    category: 'technical',
    day: 'Day 1',
    time: '10:00 AM - 01:30 PM',
    venue: 'Seminar Hall - I',
    teamSize: 'Team of 2–4 Members',
    minTeamSize: 2,
    maxTeamSize: 4,
    entryFee: 500,
    prizePool: '1st: ₹3,000 | 2nd: ₹2,000 | 3rd: ₹1,000 + Winner Certificates',
    shortDescription: 'Uncover ZERO, identify the thief, and recover the Master Key across 5 cryptic levels inside one room.',
    fullDescription: 'ZERO: THE FINAL KEY is a technical mystery and cyber investigation event conducted as part of IgniteX\'26. Teams of 2–4 members must complete 5 progressive levels using keen observation, logical thinking, decoding, technical reasoning, and problem-solving to uncover ZERO, identify the thief, and recover the stolen Master Key. Motto: OBSERVE → DECODE → CONNECT → INVESTIGATE → REVEAL.',
    rules: [
      'Each team must consist of 2–4 members. Only registered team members may participate.',
      'All team members must remain inside the designated event room. Participants must not leave the room or search for clues outside it.',
      'Teams must not share clues, answers, codes, or solutions with other teams.',
      'Only 2 hints are available for the entire event across all 5 levels. Hints must be requested from coordinators and may carry a time penalty.',
      'Once both hints are used, no additional hints will be provided. Hints will guide teams but not reveal the direct answer.',
      'Participants may use laptops, mobile phones, QR scanners, calculators, and other tools explicitly permitted by the organizers.',
      'Internet searches for direct answers, AI tools, unauthorized system access, hacking, or accessing another team\'s device/account are strictly prohibited.',
      'Tampering with or damaging event equipment/clues, or modifying another team\'s materials leads to immediate disqualification.',
      'Teams must submit answers using the method specified by organizers. Incorrect answers may result in penalties.',
      'Winning criteria: Correctness of the final solution, completion time, and applicable hint/answer penalties.'
    ],
    ruleBook: {
      eventOverview: 'ZERO is hiding among the evidence. Someone stole the Master Key. Five levels. One room. Countless clues. Teams use observation, logical thinking, decoding, and technical reasoning to find ZERO, unmask the thief, and recover the Master Key.',
      eventFormatSummary: 'Level 1: The First Code (7 codes / 5 QR clues) → Level 2: The Correct Path (One True QR) → Level 3: The Hidden Evidence (Image Steganography/Clues) → Level 4: The Suspect (Link Clues to Suspect) → Level 5: The Final Key (Crack ZERO & Master Key).',
      rounds: [
        {
          roundNumber: 1,
          roundName: 'Level 1 — The First Code',
          duration: 'Round 1 Phase',
          description: '7 codes are provided to the teams; 2 are incorrect and 5 are correct. The correct codes lead to QR clues hidden in the arena.',
          details: [
            'Test observation, code filtering, and decryption accuracy',
            'Filter out decoy/incorrect codes and scan verified QR clues',
            'Unlock data fragments required for Level 2'
          ],
          scoring: 'Accuracy and speed in identifying legitimate QR codes.'
        },
        {
          roundNumber: 2,
          roundName: 'Level 2 — The Correct Path',
          duration: 'Round 2 Phase',
          description: 'Teams analyze multiple QR pathways and identify the one single QR code that provides the correct path to Level 3.',
          details: [
            'Analyze encrypted QR payloads and logical routing hints',
            'Avoid dead-end paths and rabbit holes',
            'Secure the pathway verification pass to enter Level 3'
          ],
          scoring: 'First-try routing accuracy and path completion time.'
        },
        {
          roundNumber: 3,
          roundName: 'Level 3 — The Hidden Evidence',
          duration: 'Round 3 Phase',
          description: 'A mystery image contains hidden technical clues, steganographic data, and forensic markers that lead to Level 4.',
          details: [
            'Forensic image examination and technical clue extraction',
            'Discover hidden metadata, visual artifacts, and encrypted tags',
            'Reconstruct the evidence timeline to unlock Level 4'
          ],
          scoring: 'Number of verified technical clues extracted from mystery assets.'
        },
        {
          roundNumber: 4,
          roundName: 'Level 4 — The Suspect',
          duration: 'Round 4 Phase',
          description: 'Teams combine the clues and evidence gathered across previous levels to identify the specific suspect connected to ZERO.',
          details: [
            'Cross-examine suspect dossiers against technical forensic artifacts',
            'Deduce motives, timestamps, and digital breadcrumbs',
            'Eliminate false suspects and isolate the accomplice linked to ZERO'
          ],
          scoring: 'Correct suspect identification and deduction rationale.'
        },
        {
          roundNumber: 5,
          roundName: 'Level 5 — The Final Key',
          duration: 'Final Phase',
          description: 'Teams solve the final coded evidence, unmask ZERO, catch the thief, and decode the master key/code.',
          details: [
            'Synthesize all five layers of forensic intelligence',
            'Solve the culminating master cipher to expose ZERO\'s identity',
            'Submit the final Master Key for official verification'
          ],
          scoring: 'Timestamp of verified Master Key recovery minus penalties.'
        }
      ],
      evaluationCriteria: [
        { criterion: 'Correctness of Final Solution', weightage: 'Primary Factor', description: 'Accuracy in uncovering ZERO, identifying the thief, and solving the Master Key.' },
        { criterion: 'Completion Time', weightage: 'Speed Factor', description: 'Overall elapsed duration from START announcement to final key submission.' },
        { criterion: 'Hint & Answer Penalties', weightage: 'Penalty Offset', description: 'Deductions or time additions incurred from used hints (max 2) or incorrect answer submissions.' }
      ],
      participantFlow: [
        'Registration & Team Verification (2–4 Members)',
        'Entry into Designated Investigation Room & Rule Briefing',
        'Level 1 — The First Code (Code Filtering & QR Scanning)',
        'Level 2 — The Correct Path (Pathway Decryption)',
        'Level 3 — The Hidden Evidence (Forensic Image Analysis)',
        'Level 4 — The Suspect (Evidence Synthesis & Suspect Match)',
        'Level 5 — The Final Key (ZERO Unmasked & Master Key Recovered)',
        'Final Evaluation & Award Ceremony'
      ],
      facilitiesProvided: [
        'Designated room investigation workspace and power outlets',
        'Participant badge / ID card and official evidence dossiers',
        'Drinking water & refreshments',
        'Participation certificate for all completing participants',
        'Winner, Runner-up & Third Place certificates',
        'Cash prizes: 1st (₹3,000), 2nd (₹2,000), 3rd (₹1,000)'
      ],
      prizeStructure: [
        { place: '1st Place', prize: '₹3,000 Cash Prize + Winner Certificate' },
        { place: '2nd Place', prize: '₹2,000 Cash Prize + Runner-up Certificate' },
        { place: '3rd Place', prize: '₹1,000 Cash Prize + Third Place Certificate' }
      ]
    },
    coordinators: [
      { name: 'Shittesh S', phone: '+91 89256 75390', role: 'Event Coordinator' }
    ],
    slotsTotal: 30,
    slotsFilled: 22,
    iconName: 'KeyRound',
    featured: true
  },

  // =========================================================================
  // 6. OPERATION BERMUDA SURVIVE (NON-TECHNICAL - SQUAD OF 4)
  // =========================================================================
  {
    id: 'nontech-operation-bermuda',
    title: 'Operation Bermuda Survive',
    tagline: 'Official Free Fire Squad Battle Royale in Bermuda Custom Room (No Points System).',
    category: 'non-technical',
    day: 'Day 2',
    time: '02:00 PM - 05:30 PM',
    venue: 'Drawing Hall',
    teamSize: 'Squad of 4 Players',
    minTeamSize: 4,
    maxTeamSize: 4,
    entryFee: 500,
    prizePool: '1st: ₹3,000 (Booyah) | 2nd: ₹2,000 | 3rd: ₹1,000',
    shortDescription: 'Free Fire custom room tournament in Bermuda map. Placement determines Booyah, qualification, and cash prizes.',
    fullDescription: 'Operation Bermuda Survive is the official Free Fire Battle Royale Tournament of IgniteX\'26. Squads battle across Bermuda custom rooms with no kill points or complex tables — pure survival placement decides Booyah champions and cash prizes.',
    rules: [
      'Each team must register with exactly 4 players and a unique team name.',
      'Players cannot represent two different teams or switch after registration without organizer approval.',
      'Mode: Squad Battle Royale | Map: Bermuda | Game Type: Custom Room | Scoring: Placement only (No kill points).',
      'Qualifier 1: 12 teams → Top 6 qualify; Qualifier 2: 13 teams → Top 6 qualify; Grand Final: 12 teams in final Bermuda match.',
      'Hacks, scripts, modified game files, third-party software, bug exploits, and teaming are strictly prohibited.',
      'Players are responsible for their own device, battery charge, and internet connection.',
      'Teams must join custom room before the stated deadline; late entries will not be accepted.',
      'The decision of the event organization and authorized coordinators is final and binding.'
    ],
    ruleBook: {
      eventOverview: 'High-octane mobile esports survival tournament where 25 squads battle through qualification rooms to reach the 12-team Grand Final on the Bermuda island.',
      eventFormatSummary: 'Registration (25 Teams) → Qualifier 1 (12 Teams → Top 6) & Qualifier 2 (13 Teams → Top 6) → Grand Final (12 Teams) → Booyah Cash Prizes.',
      rounds: [
        {
          roundNumber: 1,
          roundName: 'Qualifier Room 1',
          duration: '25 Minutes',
          description: '12 registered squads drop into Bermuda custom room. Pure placement determines the top 6 teams advancing to the Grand Final.',
          scoring: 'Top 6 placement squads qualify.'
        },
        {
          roundNumber: 2,
          roundName: 'Qualifier Room 2',
          duration: '25 Minutes',
          description: '13 registered squads drop into Bermuda custom room. The top 6 surviving teams advance to the Grand Final.',
          scoring: 'Top 6 placement squads qualify.'
        },
        {
          roundNumber: 3,
          roundName: 'Grand Final Showdown',
          duration: '30 Minutes',
          description: 'The 12 qualified finalist squads compete in one definitive Bermuda match. 1st place Booyah claims ₹3,000, 2nd receives ₹2,000, and 3rd receives ₹1,000.',
          scoring: 'Final placement ranking (Booyah = Champion).'
        }
      ],
      evaluationCriteria: [
        { criterion: 'Qualifier 1 Placement', weightage: 'Top 6 Qualify', description: 'Survival rank in Qualifier 1 custom room.' },
        { criterion: 'Qualifier 2 Placement', weightage: 'Top 6 Qualify', description: 'Survival rank in Qualifier 2 custom room.' },
        { criterion: 'Grand Final Booyah', weightage: '1st, 2nd, 3rd Cash Prizes', description: 'Final match placement in Bermuda arena.' }
      ],
      participantFlow: [
        'Team Registration (4 Players per Team)',
        'Room ID & Password Distribution via Discord / Telegram',
        'Qualifier Room 1 (Top 6 Qualify)',
        'Qualifier Room 2 (Top 6 Qualify)',
        'Grand Final: 12 Teams on Bermuda Map',
        'Winner Verification & Booyah Prize Handout'
      ],
      facilitiesProvided: [
        'Air-conditioned esports spectator theater',
        'Charging points for mobile devices',
        'High-speed backup Wi-Fi connectivity',
        'Drinking water & refreshments',
        'Cash prizes transferred immediately + Winner certificates'
      ],
      prizeStructure: [
        { place: '1st Place (Booyah)', prize: '₹3,000 Cash Prize + Winner Trophy' },
        { place: '2nd Place', prize: '₹2,000 Cash Prize + Certificate' },
        { place: '3rd Place', prize: '₹1,000 Cash Prize + Certificate' }
      ]
    },
    coordinators: [
      { name: 'Munuswamy S', phone: '+91 81227 36257', role: 'Event Coordinator' }
    ],
    slotsTotal: 35,
    slotsFilled: 30,
    iconName: 'Compass',
    featured: true
  },

  // =========================================================================
  // 7. MEMERGENCY / MEME MACHINE (NON-TECHNICAL - INDIVIDUAL)
  // =========================================================================
  {
    id: 'nontech-memergency',
    title: 'Memergency',
    tagline: 'Technical meme creation tournament: prompt blitz, live meme battle, and rapid showdown.',
    category: 'non-technical',
    day: 'Day 2',
    time: '02:00 PM - 04:30 PM',
    venue: 'Lab (Computer Lab)',
    teamSize: 'Individual (1 Member)',
    minTeamSize: 1,
    maxTeamSize: 1,
    entryFee: 150,
    prizePool: '1st, 2nd & 3rd Cash Prizes + Winner Certificates',
    shortDescription: 'Test your wit, humor, and design sense across Meme Prompt Blitz, Live Meme Battle, and Rapid Meme Showdown.',
    fullDescription: 'Memergency (Meme Machine) is a technical meme creation event conducted as part of IgniteX\'26. The event tests participants\' creativity, humor, technical knowledge, and ability to translate tech, coding, and campus-life concepts into original, relatable memes under timed rounds.',
    rules: [
      'Memergency is an individual-only event. Each participant registers and competes alone.',
      'Each participant may register only once. Team or duo registration is not permitted.',
      'All memes must be technology, coding, campus-life, or symposium-themed as specified for each round.',
      'Memes must be original creations. Reusing or re-posting existing viral memes with only text changes is not permitted.',
      'Memes must NOT contain content that is offensive, communal, political, discriminatory, vulgar, or defamatory.',
      'Memes must NOT target or name specific students, staff, or faculty members.',
      'Participants may use any standard meme-making tool (Canva, Photoshop, GIMP, online generators) unless restricted.',
      'Use of AI image/text generators is permitted only where explicitly announced for a round.',
      'Participants must bring their own laptops/devices where required.',
      'The decision of the judging/organizing committee is final.'
    ],
    ruleBook: {
      eventOverview: 'Three-round elimination meme showdown evaluating relevance, wit, design, visual composition, and viral stage charisma.',
      eventFormatSummary: 'Round 1: Meme Prompt Blitz (Themed Submission) → Top 40–50% Qualify → Round 2: Live Meme Battle (On-the-Spot) → Round 3: Meme Showdown (Surprise Rapid-Fire) → Top 3 Winners.',
      rounds: [
        {
          roundNumber: 1,
          roundName: 'Round 1 — Meme Prompt Blitz (Screening Round)',
          duration: 'Submission-Based Screening',
          description: 'A themed meme creation round conducted before or at event start. Participants choose from 2–3 tech themes (e.g. "Debugging at 2 AM", "AI taking over", "Viva voce panic").',
          details: [
            'Create one original meme per chosen theme using any design tool',
            'Submit via the designated submission link before the announced deadline',
            'Screened on relevance, originality, and humor',
            'Top 40–50% qualify for Round 2'
          ],
          scoring: 'Rubric scored out of 100% (Relevance, Originality, Humor).'
        },
        {
          roundNumber: 2,
          roundName: 'Round 2 — Live Meme Battle',
          duration: '15–20 Minutes',
          description: 'A live, on-the-spot creation round conducted at the venue. Qualified participants receive a fresh tech or campus-life theme on the spot.',
          details: [
            'Design original memes within 15–20 minutes under timer constraint',
            'Internet access may be restricted to approved template libraries for fairness',
            'Completed memes submitted digitally before the countdown expires',
            'Top scorers advance to the Final Round'
          ],
          scoring: 'Judged on on-the-spot wit, composition, and topical punchline.'
        },
        {
          roundNumber: 3,
          roundName: 'Round 3 — Meme Showdown (Final / Rapid-Fire)',
          duration: '8–10 Minutes Live on Stage',
          description: 'The grand finale conducted in front of the audience and judges with surprise keywords and visual prompts.',
          details: [
            'Finalists receive surprise keyword / image prompt on stage',
            'Shorter 8–10 minute high-pressure creation countdown',
            'Judges and audience response evaluate the live punchlines',
            'Final ranking determines 1st, 2nd, and 3rd place winners'
          ],
          scoring: 'Audience decibel response + jury rubric.'
        }
      ],
      evaluationCriteria: [
        { criterion: 'Relevance to Theme', weightage: '25%', description: 'How well the meme connects to the given technical/campus theme.' },
        { criterion: 'Originality', weightage: '25%', description: 'Freshness of idea; not a copy or reskin of an existing viral template.' },
        { criterion: 'Humor & Impact', weightage: '25%', description: 'How effectively the punchline lands with the audience and judges.' },
        { criterion: 'Presentation & Clarity', weightage: '15%', description: 'Visual quality, text typography readability, and composition.' },
        { criterion: 'Timeliness', weightage: '10%', description: 'Submission within the allotted round time limit.' }
      ],
      participantFlow: [
        'Registration (Individual or Duo)',
        'Round 1: Meme Prompt Blitz (Themed Submission)',
        'Top 40–50% Qualify for Round 2',
        'Round 2: Live Meme Battle (15–20 Min On-the-Spot Sprint)',
        'Top Scorers Qualify for Round 3',
        'Round 3: Meme Showdown (Surprise Live Rapid-Fire)',
        'Final Evaluation & Winner Ranking (1st, 2nd, 3rd Place)'
      ],
      facilitiesProvided: [
        'Participant badge and identification',
        'Designated seating and laptop arrangements',
        'Drinking water & refreshments',
        'Participation certificates for all completed entries',
        'Cash prizes and winner certificates'
      ],
      prizeStructure: [
        { place: '1st Place', prize: 'Cash Prize + Winner Certificate' },
        { place: '2nd Place', prize: 'Cash Prize + Winner Certificate' },
        { place: '3rd Place', prize: 'Cash Prize + Winner Certificate' }
      ]
    },
    coordinators: [
      { name: 'Tharunkumar S', phone: '+91 63806 48278', role: 'Event Coordinator' }
    ],
    slotsTotal: 50,
    slotsFilled: 41,
    iconName: 'Flame',
    featured: false
  },

  // =========================================================================
  // 8. PROMPT PERFECT (NON-TECHNICAL - INDIVIDUAL)
  // =========================================================================
  {
    id: 'nontech-prompt-perfect',
    title: 'Prompt Perfect',
    tagline: 'Generative AI prompt engineering challenge: replicate reference imagery using AI.',
    category: 'non-technical',
    day: 'Day 2',
    time: '10:30 AM - 01:00 PM',
    venue: 'Lab (Computer Lab)',
    teamSize: 'Individual (1 Member)',
    minTeamSize: 1,
    maxTeamSize: 1,
    entryFee: 150,
    prizePool: '1st, 2nd & 3rd Cash Prizes + Top Performer Awards',
    shortDescription: 'Observe a reference image and craft precise generative AI prompts to synthesize a matching visual output within 10–15 minutes.',
    fullDescription: 'Prompt Perfect is an individual Generative AI-based event designed to test participants\' prompt-writing skills, creativity, observation, and ability to communicate effectively with modern AI tools. Participants receive a reference image and must engineer prompts in the designated AI environment to synthesize an output that closely matches the target composition.',
    rules: [
      'Prompt Perfect is strictly an individual event.',
      'A computer will be provided by the college in the Computer Lab.',
      'Participants must use only the AI tool designated for the event.',
      'A reference image will be provided at the start of the round.',
      'Participants must not download, copy, or share the reference image.',
      'Participants must create their own original prompts; getting help is strictly prohibited.',
      'Participants will have 10–15 minutes to complete the task.',
      'Participants may edit and refine prompts multiple times within the given time limit.',
      'Once the time is over, participants must submit their final generated image; no changes allowed.',
      'Any form of copying or cheating will lead to immediate disqualification.',
      'The judges\' decision will be final.'
    ],
    ruleBook: {
      eventOverview: 'A focused, high-precision Generative AI prompt-engineering sprint in Computer Lab testing visual deconstruction, vocabulary mastery, stylistic descriptors, and AI alignment.',
      eventFormatSummary: 'Registration → Participant Verification → System Allocation → Rules Briefing → Reference Image Display → Prompt Writing → AI Image Generation → Final Submission → Evaluation & Results.',
      rounds: [
        {
          roundNumber: 1,
          roundName: 'The Prompt Challenge Sprint',
          duration: '10–15 Minutes',
          description: 'Participants are seated at college computers and shown a reference target image. They must observe lighting, geometry, subject, and style, then engineer prompts in the designated AI platform to synthesize a matching output.',
          details: [
            'Observe reference image details (textures, lighting, color palette, camera angles, artistic medium)',
            'Write and iteratively refine descriptive prompts in the designated AI generator',
            'Submit the single best generated image before the 15-minute countdown ends',
            'No further edits or submissions permitted after the deadline'
          ],
          scoring: 'Judges evaluate similarity, accuracy, prompt nuance, and visual quality.'
        }
      ],
      evaluationCriteria: [
        { criterion: 'Similarity to Reference Image', weightage: '30%', description: 'How closely the generated output mirrors the target composition and theme.' },
        { criterion: 'Accuracy of Generated Output', weightage: '20%', description: 'Presence of key visual elements, lighting, and subjects.' },
        { criterion: 'Quality of the Prompt', weightage: '20%', description: 'Linguistic precision, descriptive vocabulary, and prompt engineering technique.' },
        { criterion: 'Creativity & Nuance', weightage: '15%', description: 'Artistic flair and subtle styling replication.' },
        { criterion: 'Observation of Visual Details', weightage: '15%', description: 'Capturing intricate background assets, materials, and color temperatures.' }
      ],
      participantFlow: [
        'Registration & System / Seat Allocation in Computer Lab',
        'Rules Briefing & AI Tool Verification',
        'Target Reference Image Display',
        'Prompt Writing & Iterative AI Image Generation (10–15 Min)',
        'Final Image Submission',
        'Jury Evaluation & Results Announcement'
      ],
      facilitiesProvided: [
        'Computer system provided by the college with pre-configured AI tools',
        'Designated seating in Computer Lab',
        'Participant identification badge and ID card',
        'Drinking water & refreshments',
        'Participation certificates and winner cash awards'
      ],
      prizeStructure: [
        { place: '1st Place', prize: 'Cash Prize + Winner Certificate' },
        { place: '2nd Place', prize: 'Cash Prize + Winner Certificate' },
        { place: '3rd Place', prize: 'Cash Prize + Winner Certificate' }
      ]
    },
    coordinators: [
      { name: 'Avinash S', phone: '+91 90258 49870', role: 'Event Coordinator' }
    ],
    slotsTotal: 45,
    slotsFilled: 33,
    iconName: 'Sparkles',
    featured: false
  },

  // =========================================================================
  // 9. PITCH DESK (NON-TECHNICAL - TEAM OF 4)
  // =========================================================================
  {
    id: 'nontech-pitch-desk',
    title: 'Pitch Desk',
    tagline: 'Pitch revolutionary startup models, crisis survival innovations, and venture blueprints.',
    category: 'non-technical',
    day: 'Day 2',
    time: '10:30 AM - 02:00 PM',
    venue: 'Seminar Hall - I',
    teamSize: 'Team of 4 Members',
    minTeamSize: 4,
    maxTeamSize: 4,
    entryFee: 400,
    prizePool: '1st, 2nd & 3rd Cash Prizes + Seed Mentorship',
    shortDescription: 'Startup pitch deck competition presenting business models, crisis solutions, or technology commercialization to veteran venture judges.',
    fullDescription: 'Present your groundbreaking business proposal or crisis-response innovation in front of a panel of startup founders and venture investors. Teams are judged on problem validation, market feasibility, financial projections, and deck charisma.',
    rules: [
      'Team size: exactly 4 members.',
      'Registration entry fee is ₹400 per team.',
      'Pitch deck format: PDF or PPT (maximum 10 slides).',
      'Pitch timing: 6 minutes presentation + 4 minutes Q&A by jury.',
      'Original startup or project concepts required.'
    ],
    ruleBook: {
      eventOverview: 'Venture capital pitch competition evaluating market viability, unit economics, problem validation, and oral presentation.',
      eventFormatSummary: 'Slide Deck Submission → 6 Min Live Pitch → 4 Min Jury Q&A → Deliberation → Winner Announcement.',
      rounds: [
        {
          roundNumber: 1,
          roundName: 'Venture Pitch & Defense',
          duration: '10 Minutes per Team (6m Pitch + 4m Q&A)',
          description: 'Teams present their maximum 10-slide deck to an executive jury followed by rigorous financial and strategic questioning.',
          scoring: 'Scored out of 100 on market size, feasibility, innovation, and Q&A defense.'
        }
      ],
      evaluationCriteria: [
        { criterion: 'Problem Validation & Innovation', weightage: '30%', description: 'Novelty and significance of the problem addressed.' },
        { criterion: 'Business Model & Feasibility', weightage: '30%', description: 'Revenue streams, cost structure, and scalability.' },
        { criterion: 'Deck Quality & Design', weightage: '20%', description: 'Slide layout, data charts, and aesthetic clarity.' },
        { criterion: 'Pitch Delivery & Q&A Defense', weightage: '20%', description: 'Poise, articulation, and handling jury scrutiny.' }
      ]
    },
    coordinators: [
      { name: 'Dhushyanthar P', phone: '+91 93420 88947', role: 'Event Coordinator' }
    ],
    slotsTotal: 30,
    slotsFilled: 24,
    iconName: 'Presentation',
    featured: true
  }
];

export const INITIAL_REGISTRATIONS = [
  {
    id: 'REG-2026-X89B',
    ticketHash: 'APOC-TKT-9921-X89B',
    userId: 'usr-101',
    userName: 'Rohan Sharma',
    userEmail: 'rohan.sharma@college.edu',
    userPhone: '+91 98112 33445',
    userCollege: 'St. Xavier Institute of Tech',
    eventId: 'tech-profile-architect',
    eventTitle: 'Profile Architect',
    eventCategory: 'technical' as const,
    eventDay: 'Day 1' as const,
    eventTime: '10:00 AM - 12:30 PM',
    eventVenue: 'Lab (Computer Lab)',
    teamName: 'Single Survivor',
    teamMembers: ['Rohan Sharma'],
    amountPaid: 150,
    paymentGateway: 'Stripe' as const,
    transactionId: 'txn_str_992100341',
    registeredAt: '2026-08-08T14:22:10.000Z',
    paymentStatus: 'SUCCESS' as const,
    attended: true,
    scannedAt: '2026-08-10T10:05:12.000Z'
  },
  {
    id: 'REG-2026-K41M',
    ticketHash: 'APOC-TKT-3342-K41M',
    userId: 'usr-102',
    userName: 'Priya Sundaram',
    userEmail: 'priya.s@techuniv.ac.in',
    userPhone: '+91 97223 44556',
    userCollege: 'National Cyber Academy',
    eventId: 'tech-poster-xpo',
    eventTitle: 'PosterXpo',
    eventCategory: 'technical' as const,
    eventDay: 'Day 1' as const,
    eventTime: '01:30 PM - 04:30 PM',
    eventVenue: 'Lab',
    teamName: 'Single Survivor',
    teamMembers: ['Priya Sundaram'],
    amountPaid: 150,
    paymentGateway: 'UPI' as const,
    transactionId: 'upi_utr_887711200331',
    registeredAt: '2026-08-09T09:15:40.000Z',
    paymentStatus: 'SUCCESS' as const,
    attended: false
  },
  {
    id: 'REG-2026-Z09P',
    ticketHash: 'APOC-TKT-5512-Z09P',
    userId: 'usr-103',
    userName: 'Aarav Patel',
    userEmail: 'aarav.patel@bits.edu',
    userPhone: '+91 96334 55667',
    userCollege: 'BITS Pilani',
    eventId: 'tech-zero-final-key',
    eventTitle: 'Zero - The Final Key',
    eventCategory: 'technical' as const,
    eventDay: 'Day 1' as const,
    eventTime: '10:00 AM - 01:30 PM',
    eventVenue: 'Seminar Hall - I',
    teamName: 'Cipher Breakers',
    teamMembers: ['Aarav Patel', 'Vikram S', 'Siddharth M', 'Rahul K'],
    amountPaid: 500,
    paymentGateway: 'UPI' as const,
    transactionId: 'upi_ref_1002938481',
    registeredAt: '2026-08-09T18:40:00.000Z',
    paymentStatus: 'SUCCESS' as const,
    attended: false
  },
  {
    id: 'REG-2026-B88V',
    ticketHash: 'APOC-TKT-7731-B88V',
    userId: 'usr-104',
    userName: 'Ananya Deshmukh',
    userEmail: 'ananya.d@mit.edu.in',
    userPhone: '+91 95445 66778',
    userCollege: 'MIT College of Engineering',
    eventId: 'nontech-operation-bermuda',
    eventTitle: 'Operation Bermuda Survive',
    eventCategory: 'non-technical' as const,
    eventDay: 'Day 2' as const,
    eventTime: '02:00 PM - 05:30 PM',
    eventVenue: 'Drawing Hall',
    teamName: 'Iron Scavengers',
    teamMembers: ['Ananya Deshmukh', 'Tejas N', 'Gautam B', 'Kunal R'],
    amountPaid: 500,
    paymentGateway: 'UPI' as const,
    transactionId: 'upi_ref_884739211029',
    registeredAt: '2026-08-10T11:02:15.000Z',
    paymentStatus: 'SUCCESS' as const,
    attended: false
  },
  {
    id: 'REG-2026-E12Q',
    ticketHash: 'APOC-TKT-1192-E12Q',
    userId: 'usr-105',
    userName: 'Kavya Raman',
    userEmail: 'kavya.r@srmist.edu.in',
    userPhone: '+91 94556 77889',
    userCollege: 'SRM Institute of Science',
    eventId: 'tech-crack-the-code',
    eventTitle: 'Crack The Code',
    eventCategory: 'technical' as const,
    eventDay: 'Day 1' as const,
    eventTime: '10:00 AM - 01:00 PM',
    eventVenue: 'Lab (Computer Lab)',
    teamName: 'Code Surge',
    teamMembers: ['Kavya Raman', 'Sanjay V'],
    amountPaid: 300,
    paymentGateway: 'UPI' as const,
    transactionId: 'upi_utr_990022331188',
    registeredAt: '2026-08-10T15:30:00.000Z',
    paymentStatus: 'SUCCESS' as const,
    attended: true,
    scannedAt: '2026-08-10T16:10:00.000Z'
  }
];
