import { MANNER_CATEGORIES, type MannerCategoryId } from "./manners";

export type HelpfulTabId = "manner" | "trivia" | "travel";

export interface HelpfulTab {
  id: HelpfulTabId;
  label: string;
}

export interface HelpfulTopic {
  id: string;
  tabId: Exclude<HelpfulTabId, "manner">;
  title: string;
  subtitle: string;
  description: string;
  emoji: string;
  details: string[];
  keywords: string[];
  scenes: string[];
  aiPrompt: string;
}

export type HelpfulDetail =
  | {
      kind: "manner";
      key: string;
      title: string;
      description: string;
      emoji: string;
      categoryId: MannerCategoryId;
    }
  | {
      kind: "topic";
      key: string;
      title: string;
      description: string;
      emoji: string;
      topic: HelpfulTopic;
    };

export const HELPFUL_TABS: HelpfulTab[] = [
  { id: "manner", label: "マナー" },
  { id: "trivia", label: "豆知識" },
  { id: "travel", label: "旅ガイド" },
];

export const TRIVIA_TOPICS: HelpfulTopic[] = [
  {
    id: "date-culture",
    tabId: "trivia",
    title: "伊達文化の背景",
    subtitle: "仙台らしさを知る",
    description: "仙台の文化や街並みには伊達政宗の影響が強く残っており、背景を知ると見え方が深まります。",
    emoji: "🏯",
    details: [
      "城下町として整えられた歴史があり、今も土地の呼び名や文化にその名残があります。",
      "寺社や史跡を見るときは、観光地というより地域の記憶の場として見ると印象が変わります。",
      "歴史スポットを回る前に知っておくと、展示や案内文が理解しやすくなります。",
    ],
    keywords: ["伊達政宗", "仙台", "歴史", "城下町", "文化"],
    scenes: ["museum", "facility", "walking"],
    aiPrompt: "仙台の伊達文化について、旅行者向けにわかりやすく教えて",
  },
  {
    id: "festival-meaning",
    tabId: "trivia",
    title: "祭りの意味を知る",
    subtitle: "飾りや動きにも由来があります",
    description: "祭りや行事は見た目の華やかさだけでなく、地域の祈りや願いが込められています。",
    emoji: "🎐",
    details: [
      "七夕飾りや行列の動きには、それぞれ願いや役割があることがあります。",
      "地元の人にとっては観光イベントではなく、毎年守ってきた大切な場です。",
      "背景を知ってから見ると、写真だけでは伝わらない魅力に気づきやすくなります。",
    ],
    keywords: ["祭り", "行事", "七夕", "意味", "由来"],
    scenes: ["festival", "community", "walking"],
    aiPrompt: "祭りの見どころと背景を旅行者向けに簡単に教えて",
  },
  {
    id: "kokeshi-story",
    tabId: "trivia",
    title: "こけしの違い",
    subtitle: "地域ごとに表情や形が変わります",
    description: "東北のこけしは一見似ていても、産地ごとに形や模様、表情に個性があります。",
    emoji: "🪆",
    details: [
      "宮城でも地域ごとに作風が異なり、頭や胴の形に特徴があります。",
      "おみやげとして選ぶときは、柄だけでなく産地を見ると違いが楽しめます。",
      "工芸体験とあわせて知ると、作品を見る目が少し変わります。",
    ],
    keywords: ["こけし", "工芸", "東北", "宮城", "おみやげ"],
    scenes: ["workshop", "craft", "facility"],
    aiPrompt: "宮城のこけしの特徴を、初心者向けに教えて",
  },
  {
    id: "sacred-place",
    tabId: "trivia",
    title: "神社やお寺の見方",
    subtitle: "観光地である前に祈りの場です",
    description: "神社やお寺は、写真映えする場所というだけでなく、今も地域の祈りとつながる大切な場です。",
    emoji: "⛩️",
    details: [
      "参拝の人がいるときは、観光よりも祈りが優先される場面があります。",
      "建物の歴史だけでなく、地域の暮らしとの関わりを見ると理解が深まります。",
      "案内表示や空気感を見ながら、静かな見方を意識すると心地よく過ごせます。",
    ],
    keywords: ["神社", "寺", "参拝", "歴史", "文化"],
    scenes: ["community", "walking", "facility"],
    aiPrompt: "神社やお寺を見るときの文化的なポイントを教えて",
  },
  {
    id: "local-words",
    tabId: "trivia",
    title: "地元のことば",
    subtitle: "ひとこと知ると距離が縮まります",
    description: "旅先でよく聞く言い回しや土地の呼び方を少し知っているだけで、会話がぐっと親しみやすくなります。",
    emoji: "💬",
    details: [
      "お店や体験先で聞く言い回しに戸惑っても、笑顔で聞き返せば十分伝わります。",
      "地名や祭りの呼び方には地域独特の読み方があることがあります。",
      "少し知っておくだけで、地元の人との会話のきっかけになりやすいです。",
    ],
    keywords: ["ことば", "会話", "地名", "地元", "交流"],
    scenes: ["community", "walking", "reservation"],
    aiPrompt: "宮城で旅行中に知っておくと便利な地元のことばを教えて",
  },
];

export const TRAVEL_GUIDE_TOPICS: HelpfulTopic[] = [
  {
    id: "experience-flow",
    tabId: "travel",
    title: "体験前の流れ",
    subtitle: "予約から当日までの確認",
    description: "工芸体験やワークショップは、予約確認と到着前の準備をしておくと当日がかなりスムーズです。",
    emoji: "🧾",
    details: [
      "開始時間、集合場所、持ち物の有無を前日までに確認しておきます。",
      "遅れそうなときの連絡先を控えておくと安心です。",
      "完成品の受け取り方法や乾燥時間がある場合は、帰りの予定に余裕を持たせます。",
    ],
    keywords: ["体験", "予約", "当日", "流れ", "準備"],
    scenes: ["workshop", "reservation", "craft"],
    aiPrompt: "体験施設へ行く前に確認したいことを整理して",
  },
  {
    id: "photo-tips",
    tabId: "travel",
    title: "写真の楽しみ方",
    subtitle: "きれいに残しつつ配慮も忘れずに",
    description: "文化体験の写真は、記録だけでなく場の空気を残せる魅力があります。撮る前に一度周囲を見るのがコツです。",
    emoji: "📷",
    details: [
      "体験中の手元や道具を撮ると、その場の雰囲気が伝わりやすくなります。",
      "人物が写るときは、あとで見返しても気持ちよく残せるよう配慮します。",
      "展示や祭りでは、撮影可否と立ち位置を先に確認すると安心です。",
    ],
    keywords: ["写真", "撮影", "体験", "展示", "祭り"],
    scenes: ["museum", "facility", "festival", "workshop"],
    aiPrompt: "文化体験を写真で楽しむコツを教えて",
  },
  {
    id: "season-enjoy",
    tabId: "travel",
    title: "季節ごとの楽しみ方",
    subtitle: "時期で見える文化が変わります",
    description: "同じ場所でも季節によって楽しみ方が変わるのが旅の面白さです。行事や景色と一緒に考えると選びやすくなります。",
    emoji: "🌸",
    details: [
      "春は街歩きと花の風景、夏は祭りや夕方の散策が相性よく楽しめます。",
      "秋冬は屋内体験や展示施設が落ち着いて回りやすい時期です。",
      "事前に開催時期を調べると、見たい行事に合わせて動きやすくなります。",
    ],
    keywords: ["季節", "春", "夏", "秋", "冬", "祭り"],
    scenes: ["festival", "walking", "facility"],
    aiPrompt: "季節ごとの宮城の文化体験の楽しみ方を教えて",
  },
  {
    id: "day-plan",
    tabId: "travel",
    title: "半日プランの作り方",
    subtitle: "無理なく回るコツ",
    description: "文化体験は詰め込みすぎないほうが満足度が上がりやすく、移動と滞在の余白を少し取るのがコツです。",
    emoji: "🗺️",
    details: [
      "1つの体験と1つの立ち寄り先くらいに絞ると、移動で疲れにくくなります。",
      "体験後は近くのカフェや散策時間を入れると余韻を楽しめます。",
      "雨の日の候補も1つ考えておくと、予定を崩しにくいです。",
    ],
    keywords: ["プラン", "半日", "移動", "立ち寄り", "旅程"],
    scenes: ["walking", "workshop", "facility"],
    aiPrompt: "文化体験を中心にした半日プランの組み方を教えて",
  },
];

const HELPFUL_TOPIC_MAP = new Map<string, HelpfulTopic>(
  [...TRIVIA_TOPICS, ...TRAVEL_GUIDE_TOPICS].map((topic) => [topic.id, topic])
);

export function getHelpfulCards(tabId: HelpfulTabId) {
  if (tabId === "manner") {
    return MANNER_CATEGORIES.map((category) => ({
      key: `manner:${category.id}`,
      title: category.label,
      subtitle: "マナー",
      description: category.description,
      emoji: category.emoji,
    }));
  }

  const topics = tabId === "trivia" ? TRIVIA_TOPICS : TRAVEL_GUIDE_TOPICS;
  return topics.map((topic) => ({
    key: `${topic.tabId}:${topic.id}`,
    title: topic.title,
    subtitle: topic.subtitle,
    description: topic.description,
    emoji: topic.emoji,
  }));
}

export function getHelpfulDetail(detailKey: string | null): HelpfulDetail | null {
  if (!detailKey) return null;

  const [kind, id] = detailKey.split(":");
  if (kind === "manner") {
    const category = MANNER_CATEGORIES.find((entry) => entry.id === id);
    if (!category) return null;
    return {
      kind: "manner",
      key: detailKey,
      title: category.label,
      description: category.description,
      emoji: category.emoji,
      categoryId: category.id,
    };
  }

  const topic = HELPFUL_TOPIC_MAP.get(id);
  if (!topic) return null;

  return {
    kind: "topic",
    key: detailKey,
    title: topic.title,
    description: topic.description,
    emoji: topic.emoji,
    topic,
  };
}

export function getRecommendedHelpfulTopicsByScenes(scenes: string[], limit: number = 3) {
  const normalizedScenes = Array.from(new Set(scenes.filter(Boolean)));
  const topics = [...TRIVIA_TOPICS, ...TRAVEL_GUIDE_TOPICS];

  if (normalizedScenes.length === 0) {
    return topics.slice(0, limit);
  }

  return topics
    .map((topic) => {
      const matchedScenes = topic.scenes.filter((scene) => normalizedScenes.includes(scene)).length;
      let score = matchedScenes * 100;

      if (normalizedScenes.includes("museum") && topic.id === "date-culture") score += 24;
      if (normalizedScenes.includes("festival") && topic.id === "festival-meaning") score += 24;
      if (normalizedScenes.includes("workshop") && topic.id === "experience-flow") score += 24;
      if (normalizedScenes.includes("craft") && topic.id === "kokeshi-story") score += 20;
      if (normalizedScenes.includes("walking") && topic.id === "day-plan") score += 12;

      return { topic, score };
    })
    .sort((a, b) => b.score - a.score || a.topic.title.localeCompare(b.topic.title, "ja"))
    .slice(0, limit)
    .map((entry) => entry.topic);
}
