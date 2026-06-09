import type { LaunchLanguage, ScenarioId } from '@/constants/scenarios';

export type ScenarioStarter = {
  starterTitle: string;
  starterPrompt: string;
  firstAssistantMessage: string | null;
  suggestedUserReply?: string;
};

export const DEFAULT_SCENARIO_STARTER: ScenarioStarter = {
  starterTitle: 'Start the conversation',
  starterPrompt: "Send your first message when you're ready.",
  firstAssistantMessage: null,
};

/** Base starters keyed by scenario (English / path-agnostic defaults). */
const SCENARIO_STARTERS: Record<ScenarioId, ScenarioStarter> = {
  job_interview: {
    starterTitle: 'Start your interview',
    starterPrompt: "Introduce yourself and explain why you're interested in the role.",
    firstAssistantMessage:
      "Hi, I'm Karen, the hiring manager. Thanks for coming in today. Can you start by telling me a little about yourself?",
    suggestedUserReply:
      "Thank you for having me. I'm excited about this role because it aligns with my experience in…",
  },
  networking: {
    starterTitle: 'Start the conversation',
    starterPrompt: 'Say hello and introduce what you do.',
    firstAssistantMessage: 'Hi, great to meet you. What brings you to this event?',
    suggestedUserReply: "Hi! I'm [name]. I work in [field]. What about you?",
  },
  small_talk: {
    starterTitle: 'Break the ice',
    starterPrompt: 'Start with a simple friendly comment or question.',
    firstAssistantMessage: "Hey, how's your day going so far?",
    suggestedUserReply: 'Pretty good, thanks! How about yours?',
  },
  business_meeting: {
    starterTitle: 'Join the meeting',
    starterPrompt: 'Share your view or ask a clarifying question.',
    firstAssistantMessage: "Thanks everyone for joining. Let's start with a quick round of updates.",
    suggestedUserReply: 'From my side, the main priority this week is…',
  },
  customer_support: {
    starterTitle: 'Open the call',
    starterPrompt: 'Greet the client and confirm the purpose of the call.',
    firstAssistantMessage:
      "Thanks for joining. Can you give me a quick overview of what you'd like to discuss today?",
    suggestedUserReply: "Thanks for your time. I'm calling about…",
  },
  airport: {
    starterTitle: 'At the airport',
    starterPrompt: 'Ask for help or confirm your travel details.',
    firstAssistantMessage: 'Hello — how can I help you today?',
    suggestedUserReply: 'Hi, I have a reservation under [name]. Could you help me check in?',
  },
  restaurant: {
    starterTitle: 'At the restaurant',
    starterPrompt: 'Greet the server and place your order politely.',
    firstAssistantMessage: 'Good evening! Are you ready to order, or would you like a few more minutes?',
    suggestedUserReply: "I think we're ready. Could I get…",
  },
  travel: {
    starterTitle: 'On the road',
    starterPrompt: 'Ask for directions or confirm your booking.',
    firstAssistantMessage: 'Hi there — do you need help finding something?',
    suggestedUserReply: 'Yes, could you tell me how to get to…',
  },
  dating: {
    starterTitle: 'Start the chat',
    starterPrompt: 'Open with something warm and genuine.',
    firstAssistantMessage: "Hey! Nice to finally meet in person. How's your evening going?",
    suggestedUserReply: "Great to meet you too! It's been a long day, but I'm glad we could meet up.",
  },
};

/** Language-path overrides merged on top of scenario base + defaults. */
const STARTER_OVERRIDES: Partial<Record<`${ScenarioId}:${LaunchLanguage}`, Partial<ScenarioStarter>>> = {
  'small_talk:spanish': {
    starterTitle: 'Start in Spanish',
    starterPrompt: 'Say hello and ask how the other person is doing.',
    firstAssistantMessage: '¡Hola! ¿Cómo estás hoy?',
    suggestedUserReply: '¡Hola! Estoy bien, gracias. ¿Y tú?',
  },
  'small_talk:mandarin': {
    starterTitle: 'Start in Mandarin',
    starterPrompt: 'Say hello and introduce yourself.',
    firstAssistantMessage: '你好！你叫什么名字？',
    suggestedUserReply: '你好！我叫…',
  },
  'job_interview:spanish': {
    starterTitle: 'Empieza la entrevista',
    starterPrompt: 'Preséntate y explica por qué te interesa el puesto.',
    firstAssistantMessage:
      'Hola, soy Karen, la responsable de contratación. ¿Puedes contarme un poco sobre ti?',
    suggestedUserReply: 'Muchas gracias por la oportunidad. Me interesa este puesto porque…',
  },
  'job_interview:mandarin': {
    starterTitle: '开始面试',
    starterPrompt: '介绍自己并说明为什么对这个职位感兴趣。',
    firstAssistantMessage: '你好，我是Karen，招聘经理。请先简单介绍一下你自己好吗？',
    suggestedUserReply: '谢谢您给我这个机会。我对这个职位很感兴趣，因为…',
  },
  'networking:spanish': {
    starterTitle: 'Empieza la conversación',
    starterPrompt: 'Saluda y presenta a qué te dedicas.',
    firstAssistantMessage: '¡Hola! Encantado/a. ¿Qué te trae a este evento?',
    suggestedUserReply: '¡Hola! Soy… Trabajo en…',
  },
  'networking:mandarin': {
    starterTitle: '开始交流',
    starterPrompt: '打招呼并介绍你的工作。',
    firstAssistantMessage: '你好！很高兴认识你。是什么把你带到这个活动来的？',
    suggestedUserReply: '你好！我是…我在…工作。',
  },
  'customer_support:spanish': {
    starterTitle: 'Abre la llamada',
    starterPrompt: 'Saluda al cliente y confirma el motivo de la llamada.',
    firstAssistantMessage: 'Gracias por unirte. ¿Puedes darme un resumen de lo que te gustaría tratar hoy?',
    suggestedUserReply: 'Gracias por su tiempo. Llamo porque…',
  },
  'customer_support:mandarin': {
    starterTitle: '开始通话',
    starterPrompt: '问候客户并确认通话目的。',
    firstAssistantMessage: '感谢参加。能简单说一下今天想讨论的内容吗？',
    suggestedUserReply: '谢谢。我打电话是想了解…',
  },
  'business_meeting:spanish': {
    starterTitle: 'Únete a la reunión',
    starterPrompt: 'Comparte tu opinión o haz una pregunta para aclarar.',
    firstAssistantMessage: 'Gracias a todos por venir. Empecemos con una ronda rápida de novedades.',
    suggestedUserReply: 'Por mi parte, la prioridad principal de esta semana es…',
  },
  'business_meeting:mandarin': {
    starterTitle: '加入会议',
    starterPrompt: '分享你的看法或提出一个澄清的问题。',
    firstAssistantMessage: '感谢大家参加。我们先简单地轮流汇报一下最新进展吧。',
    suggestedUserReply: '我这边本周的主要重点是… (wǒ zhè biān běn zhōu de zhǔyào zhòngdiǎn shì…)',
  },
  'airport:spanish': {
    starterTitle: 'En el aeropuerto',
    starterPrompt: 'Pide ayuda o confirma los datos de tu viaje.',
    firstAssistantMessage: 'Hola, ¿en qué puedo ayudarle hoy?',
    suggestedUserReply: 'Hola, tengo una reserva a nombre de… ¿Podría ayudarme a facturar?',
  },
  'airport:mandarin': {
    starterTitle: '在机场',
    starterPrompt: '寻求帮助或确认你的出行信息。',
    firstAssistantMessage: '您好，今天有什么可以帮您的吗？',
    suggestedUserReply: '您好，我有一个预订，名字是… 能帮我办理登机吗？(néng bāng wǒ bànlǐ dēngjī ma?)',
  },
  'restaurant:spanish': {
    starterTitle: 'En el restaurante',
    starterPrompt: 'Saluda al camarero y pide con amabilidad.',
    firstAssistantMessage: '¡Buenas noches! ¿Ya están listos para pedir o necesitan unos minutos más?',
    suggestedUserReply: 'Creo que estamos listos. ¿Me podría traer…?',
  },
  'restaurant:mandarin': {
    starterTitle: '在餐厅',
    starterPrompt: '问候服务员并礼貌地点餐。',
    firstAssistantMessage: '晚上好！您们准备好点菜了吗，还是需要再看几分钟？',
    suggestedUserReply: '我们准备好了。请给我… (qǐng gěi wǒ…)',
  },
  'travel:spanish': {
    starterTitle: 'En el viaje',
    starterPrompt: 'Pide indicaciones o confirma tu reserva.',
    firstAssistantMessage: 'Hola, ¿necesita ayuda para encontrar algo?',
    suggestedUserReply: 'Sí, ¿me podría decir cómo llegar a…?',
  },
  'travel:mandarin': {
    starterTitle: '在旅途中',
    starterPrompt: '询问方向或确认你的预订。',
    firstAssistantMessage: '你好，需要帮忙找什么地方吗？',
    suggestedUserReply: '是的，请问怎么去…？(qǐng wèn zěnme qù…?)',
  },
  'dating:spanish': {
    starterTitle: 'Conócete con alguien',
    starterPrompt: 'Empieza con un saludo amable y una pregunta sencilla.',
    firstAssistantMessage: '¡Hola! Qué bueno conocerte. ¿Cómo va tu día?',
    suggestedUserReply: '¡Hola! Igualmente, encantado/a. Mi día va muy bien, gracias. ¿Y el tuyo?',
  },
  'dating:mandarin': {
    starterTitle: '认识新朋友',
    starterPrompt: '用友好的问候和一个简单的问题开场。',
    firstAssistantMessage: '你好！很高兴认识你。今天过得怎么样？',
    suggestedUserReply: '你好！我也很高兴认识你。我今天过得很好，谢谢。你呢？(nǐ ne?)',
  },
};

export function getScenarioStarter(scenarioId: ScenarioId, language: LaunchLanguage): ScenarioStarter {
  const base = SCENARIO_STARTERS[scenarioId];
  const override = STARTER_OVERRIDES[`${scenarioId}:${language}`];
  return {
    ...DEFAULT_SCENARIO_STARTER,
    ...base,
    ...override,
  };
}

export function countScenariosWithCustomStarters(): number {
  return Object.keys(SCENARIO_STARTERS).length;
}
