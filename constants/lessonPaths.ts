import type { LaunchLanguage } from '@/constants/scenarios';
import type { LearnerLevel, LessonNode } from '@/lib/learning/types';

export type LessonPathKey = `${LaunchLanguage}_${LearnerLevel}`;

const SPANISH_BEGINNER: LessonNode[] = [
  {
    id: 'es_greetings',
    title: 'Greetings',
    subtitle: 'Say hello with confidence',
    order: 1,
    scenarioId: 'small_talk',
    lecture: [
      { id: '1', text: 'Start with “Hola” — the universal hello. Add “Buenos días” before noon or “Buenas tardes” in the afternoon.' },
      { id: '2', text: '“¿Cómo estás?” asks how someone is. Reply “Bien, gracias” (fine, thanks) or “Muy bien” (very well).' },
      { id: '3', text: 'Close warmly with “Hasta luego” (see you later) or “Adiós” when leaving.' },
    ],
  },
  {
    id: 'es_introductions',
    title: 'Introductions',
    subtitle: 'Share your name and where you’re from',
    order: 2,
    scenarioId: 'networking',
    lecture: [
      { id: '1', text: '“Me llamo…” means “My name is…” Follow with your name.' },
      { id: '2', text: '“Soy de…” tells people where you’re from. Example: “Soy de Estados Unidos.”' },
      { id: '3', text: 'Ask back: “¿Cómo te llamas?” (What’s your name?) and “¿De dónde eres?” (Where are you from?)' },
    ],
  },
  {
    id: 'es_ordering_coffee',
    title: 'Ordering Coffee',
    subtitle: 'Order politely at a café',
    order: 3,
    scenarioId: 'restaurant',
    lecture: [
      { id: '1', text: '“Quisiera un café, por favor” — I would like a coffee, please. Polite and natural.' },
      { id: '2', text: 'Sizes: “pequeño” (small), “mediano” (medium), “grande” (large).' },
      { id: '3', text: 'Finish with “La cuenta, por favor” when you’re ready to pay.' },
    ],
  },
  {
    id: 'es_small_talk',
    title: 'Small Talk',
    subtitle: 'Light conversation beyond basics',
    order: 4,
    scenarioId: 'small_talk',
    lecture: [
      { id: '1', text: 'Weather opener: “Hace buen tiempo hoy” (The weather is nice today).' },
      { id: '2', text: 'Show interest: “¿Qué te gusta hacer?” (What do you like to do?)' },
      { id: '3', text: 'React naturally: “¡Qué interesante!” or “Yo también” (Me too).' },
    ],
  },
  {
    id: 'es_travel_basics',
    title: 'Travel Basics',
    subtitle: 'Navigate airports and hotels',
    order: 5,
    scenarioId: 'travel',
    lecture: [
      { id: '1', text: 'At check-in: “Tengo una reserva a nombre de…” (I have a reservation under…)' },
      { id: '2', text: 'Ask for help: “¿Dónde está…?” (Where is…?) + your destination.' },
      { id: '3', text: 'Emergency phrase: “No entiendo, ¿puede repetir?” (I don’t understand, can you repeat?)' },
    ],
  },
];

const BUSINESS_ENGLISH_BEGINNER: LessonNode[] = [
  {
    id: 'be_job_interview',
    title: 'Job Interview',
    subtitle: 'Answer clearly under pressure',
    order: 1,
    scenarioId: 'job_interview',
    lecture: [
      { id: '1', text: 'Open strong: “Thank you for the opportunity. I’m excited to discuss the role.”' },
      { id: '2', text: 'Use STAR for behavioral questions: Situation, Task, Action, Result.' },
      { id: '3', text: 'Close with a thoughtful question: “What does success look like in the first 90 days?”' },
    ],
  },
  {
    id: 'be_networking',
    title: 'Networking',
    subtitle: 'Warm intros and follow-ups',
    order: 2,
    scenarioId: 'networking',
    lecture: [
      { id: '1', text: 'Lead with context: “Hi, I’m [name] — I work in [field]. What brings you here?”' },
      { id: '2', text: 'Find common ground, then ask one open question about their work.' },
      { id: '3', text: 'Exit gracefully: “It was great meeting you. I’ll send a quick follow-up this week.”' },
    ],
  },
  {
    id: 'be_team_meeting',
    title: 'Team Meeting',
    subtitle: 'Contribute without dominating',
    order: 3,
    scenarioId: 'business_meeting',
    lecture: [
      { id: '1', text: 'Agree and add: “I agree with [name], and I’d also suggest…”' },
      { id: '2', text: 'Disagree politely: “I see it differently — here’s another angle to consider.”' },
      { id: '3', text: 'Summarize: “So far we’ve aligned on X. Should we decide on Y next?”' },
    ],
  },
  {
    id: 'be_client_call',
    title: 'Client Call',
    subtitle: 'Professional tone on calls',
    order: 4,
    scenarioId: 'customer_support',
    lecture: [
      { id: '1', text: 'Set the agenda upfront: “Today I’d like to cover three items…”' },
      { id: '2', text: 'Confirm understanding: “Just to recap, you need X by Friday — is that right?”' },
      { id: '3', text: 'Handle delays honestly: “I’ll follow up with a timeline by end of day.”' },
    ],
  },
  {
    id: 'be_follow_up',
    title: 'Follow Up',
    subtitle: 'Emails and messages that land',
    order: 5,
    scenarioId: 'networking',
    lecture: [
      { id: '1', text: 'Subject line: specific and scannable — “Follow-up: [topic] from [event]”' },
      { id: '2', text: 'First line: reference your meeting. “Great connecting at…”' },
      { id: '3', text: 'One clear ask: “Would you be open to a 15-minute call next week?”' },
    ],
  },
];

const MANDARIN_BEGINNER: LessonNode[] = [
  {
    id: 'zh_greetings',
    title: 'Greetings',
    subtitle: '你好 and beyond',
    order: 1,
    scenarioId: 'small_talk',
    lecture: [
      { id: '1', text: '你好 (nǐ hǎo) — hello. 早上好 (zǎo shang hǎo) — good morning.' },
      { id: '2', text: '你好吗？(nǐ hǎo ma?) — How are you? 我很好 (wǒ hěn hǎo) — I’m fine.' },
      { id: '3', text: '再见 (zài jiàn) — goodbye. 谢谢 (xiè xie) — thank you.' },
    ],
  },
  {
    id: 'zh_introductions',
    title: 'Introductions',
    subtitle: 'Name, origin, and polite forms',
    order: 2,
    scenarioId: 'networking',
    lecture: [
      { id: '1', text: '我叫… (wǒ jiào…) — My name is… 我是…人 (wǒ shì … rén) — I am from…' },
      { id: '2', text: '很高兴认识你 (hěn gāo xìng rèn shi nǐ) — Nice to meet you.' },
      { id: '3', text: '请问 (qǐng wèn) — excuse me / may I ask — softens questions.' },
    ],
  },
  {
    id: 'zh_food_ordering',
    title: 'Food Ordering',
    subtitle: 'Order at a restaurant',
    order: 3,
    scenarioId: 'restaurant',
    lecture: [
      { id: '1', text: '我要… (wǒ yào …) — I would like… 请给我… (qǐng gěi wǒ …) — Please give me…' },
      { id: '2', text: '这个 (zhè ge) — this one. 那个 (nà ge) — that one.' },
      { id: '3', text: '买单 (mǎi dān) — check please. 好吃 (hǎo chī) — delicious!' },
    ],
  },
  {
    id: 'zh_directions',
    title: 'Directions',
    subtitle: 'Ask and understand routes',
    order: 4,
    scenarioId: 'travel',
    lecture: [
      { id: '1', text: '…在哪里？(… zài nǎ lǐ?) — Where is …?' },
      { id: '2', text: '左转 (zuǒ zhuǎn) — turn left. 右转 (yòu zhuǎn) — turn right. 直走 (zhí zǒu) — go straight.' },
      { id: '3', text: '远吗？(yuǎn ma?) — Is it far? 很近 (hěn jìn) — very close.' },
    ],
  },
  {
    id: 'zh_daily_conversation',
    title: 'Daily Conversation',
    subtitle: 'Everyday phrases and rhythm',
    order: 5,
    scenarioId: 'small_talk',
    lecture: [
      { id: '1', text: '今天怎么样？(jīn tiān zěn me yàng?) — How’s today going?' },
      { id: '2', text: '我觉得… (wǒ jué de …) — I think… — safe way to share opinions.' },
      { id: '3', text: '没问题 (méi wèn tí) — no problem. 可以的 (kě yǐ de) — that works.' },
    ],
  },
];

/** Intermediate tracks reuse beginner structure with same scenario mapping for MVP */
const SPANISH_INTERMEDIATE = SPANISH_BEGINNER.map((l) => ({
  ...l,
  id: l.id.replace('es_', 'es_int_'),
  subtitle: `${l.subtitle} · Intermediate`,
}));

const BUSINESS_ENGLISH_INTERMEDIATE = BUSINESS_ENGLISH_BEGINNER.map((l) => ({
  ...l,
  id: l.id.replace('be_', 'be_int_'),
  subtitle: `${l.subtitle} · Intermediate`,
}));

const MANDARIN_INTERMEDIATE = MANDARIN_BEGINNER.map((l) => ({
  ...l,
  id: l.id.replace('zh_', 'zh_int_'),
  subtitle: `${l.subtitle} · Intermediate`,
}));

const LESSON_PATHS: Record<string, LessonNode[]> = {
  spanish_beginner: SPANISH_BEGINNER,
  spanish_intermediate: SPANISH_INTERMEDIATE,
  spanish_advanced: SPANISH_INTERMEDIATE,
  english_business_beginner: BUSINESS_ENGLISH_BEGINNER,
  english_business_intermediate: BUSINESS_ENGLISH_INTERMEDIATE,
  english_business_advanced: BUSINESS_ENGLISH_INTERMEDIATE,
  mandarin_beginner: MANDARIN_BEGINNER,
  mandarin_intermediate: MANDARIN_INTERMEDIATE,
  mandarin_advanced: MANDARIN_INTERMEDIATE,
};

export function getLessonPathKey(language: LaunchLanguage, level: LearnerLevel): string {
  return `${language}_${level}`;
}

export function getLessonsForPath(language: LaunchLanguage, level: LearnerLevel): LessonNode[] {
  const key = getLessonPathKey(language, level);
  return LESSON_PATHS[key] ?? LESSON_PATHS[`${language}_beginner`] ?? [];
}

export function getLessonById(lessonId: string): LessonNode | undefined {
  for (const nodes of Object.values(LESSON_PATHS)) {
    const found = nodes.find((n) => n.id === lessonId);
    if (found) return found;
  }
  return undefined;
}

export function levelLabel(level: LearnerLevel): string {
  switch (level) {
    case 'beginner':
      return 'Beginner';
    case 'intermediate':
      return 'Intermediate';
    case 'advanced':
      return 'Advanced';
  }
}
