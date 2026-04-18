export type MannerCategoryId = "transit" | "facility" | "experience" | "community";

export interface MannerCategory {
  id: MannerCategoryId;
  label: string;
  emoji: string;
  description: string;
}

export interface MannerItem {
  id: string;
  categoryId: MannerCategoryId;
  title: string;
  shortDescription: string;
  details: string[];
  keywords: string[];
  scenes: string[];
}

/** AI 検索用の定型クエリ（データ側キーワードは日本語のまま） */
export const MANNER_CATEGORY_AI_QUERY: Record<MannerCategoryId, string> = {
  transit: "移動中で気を付けることは？",
  facility: "施設内で気を付けることは？",
  experience: "体験中で気を付けることは？",
  community: "地域文化で気を付けることは？",
};

export const MANNER_CATEGORIES: MannerCategory[] = [
  {
    id: "transit",
    label: "移動中",
    emoji: "🚃",
    description: "電車やバス、徒歩での移動中に気を付けたいマナーです。",
  },
  {
    id: "facility",
    label: "施設内",
    emoji: "🏛️",
    description: "展示施設や観光施設の中で守りたい基本のふるまいです。",
  },
  {
    id: "experience",
    label: "体験中",
    emoji: "🛠️",
    description: "工芸体験やワークショップに参加するときのマナーです。",
  },
  {
    id: "community",
    label: "地域文化",
    emoji: "🌸",
    description: "祭りや地域の方と接するときに意識したい配慮です。",
  },
] as const;

export const MANNER_ITEMS: MannerItem[] = [
  {
    id: "transit-phone",
    categoryId: "transit",
    title: "車内では通話を控える",
    shortDescription: "日本の電車やバスでは、車内通話を控えるのが一般的です。",
    details: [
      "着信に出るときは短く済ませ、すぐに切るようにします。",
      "周囲の人との距離が近いときは、音量や話し声に特に気を付けます。",
      "混雑時はスマートフォンの操作も最小限にすると安心です。",
    ],
    keywords: ["電車", "バス", "通話", "電話", "移動", "車内"],
    scenes: ["train", "bus"],
  },
  {
    id: "transit-bag",
    categoryId: "transit",
    title: "荷物は小さくまとめる",
    shortDescription: "混雑した車内では、荷物の持ち方が周囲への印象を大きく左右します。",
    details: [
      "通路やドア付近では、荷物が人に当たりやすいので位置に注意します。",
      "濡れた傘や大きな買い物袋は足元に寄せると安心です。",
    ],
    keywords: ["荷物", "リュック", "傘", "移動", "混雑"],
    scenes: ["train", "bus", "walking"],
  },
  {
    id: "facility-photo",
    categoryId: "facility",
    title: "撮影可否を最初に確認する",
    shortDescription: "日本では撮影できそうに見える場所でも、展示や人の写り込みに配慮が求められます。",
    details: [
      "フラッシュ禁止や動画禁止の表示がある場合は必ず従います。",
      "他のお客さんが写るときは、撮影場所や角度を配慮します。",
      "わからないときはスタッフに一言確認するのが安全です。",
    ],
    keywords: ["写真", "撮影", "動画", "展示", "施設"],
    scenes: ["museum", "facility"],
  },
  {
    id: "facility-voice",
    categoryId: "facility",
    title: "解説中や展示前では私語を控える",
    shortDescription: "静かな展示空間では、周囲も落ち着いて見学できるよう声量に気を配ります。",
    details: [
      "展示の前で長時間立ち止まるときは、後ろの人の視界も意識します。",
      "飲食禁止エリアでは、ペットボトルやガムも控えると安心です。",
    ],
    keywords: ["声", "静か", "展示", "博物館", "資料館", "飲食"],
    scenes: ["museum", "facility"],
  },
  {
    id: "facility-ask-staff",
    categoryId: "facility",
    title: "困ったときはスタッフに確認する",
    shortDescription: "資料館や展示施設は場所ごとにルールが違うため、迷ったらスタッフに聞くのがいちばん安全です。",
    details: [
      "撮影、見学ルート、立入可否などは自己判断せずに確認します。",
      "展示の近くで不安なことがあるときは、小さな声でスタッフに相談します。",
    ],
    keywords: ["スタッフ", "確認", "質問", "資料館", "博物館", "案内"],
    scenes: ["museum", "facility"],
  },
  {
    id: "experience-instruction",
    categoryId: "experience",
    title: "最初の説明をよく聞く",
    shortDescription: "体験施設では最初の説明が安全面や進行の基準になることが多いです。",
    details: [
      "わからないまま進めず、スタッフに早めに確認します。",
      "作業スペースの外に道具を持ち出さないようにします。",
      "完成品の持ち帰り方法や乾燥時間も最後に確認すると安心です。",
    ],
    keywords: ["体験", "工芸", "説明", "道具", "ワークショップ"],
    scenes: ["workshop", "craft"],
  },
  {
    id: "experience-time",
    categoryId: "experience",
    title: "遅刻やキャンセルは早めに連絡する",
    shortDescription: "日本の体験予約は事前準備で動いていることが多く、遅刻連絡が特に大切です。",
    details: [
      "到着が遅れそうなときは、開始前に電話や予約先へ連絡します。",
      "キャンセル規定がある場合は、事前に確認しておきます。",
    ],
    keywords: ["予約", "遅刻", "キャンセル", "体験", "連絡"],
    scenes: ["workshop", "reservation"],
  },
  {
    id: "community-respect",
    categoryId: "community",
    title: "地域の人や参加者の流れを優先する",
    shortDescription: "祭りでは観光客よりも地域の進行が優先されるため、流れを止めない配慮が大切です。",
    details: [
      "進行ルートや規制線の中には入らないようにします。",
      "参加したいときは、主催やスタッフの案内に従います。",
      "衣装や道具に無断で触れないようにします。",
    ],
    keywords: ["祭り", "行事", "地域", "参加", "進行", "見学"],
    scenes: ["festival", "community"],
  },
  {
    id: "community-trash",
    categoryId: "community",
    title: "ゴミは持ち帰るか指定場所へ",
    shortDescription: "日本は街中のゴミ箱が少ないため、イベント会場でも持ち帰り前提の場面があります。",
    details: [
      "屋台やイベント会場で出たゴミは分別ルールを確認します。",
      "地域の方の生活道路をふさがないように移動します。",
    ],
    keywords: ["ゴミ", "屋台", "祭り", "会場", "地域"],
    scenes: ["festival", "walking", "community"],
  },
];

export const MANNER_QUICK_QUESTIONS = [
  "写真は撮っていい？",
  "電車で気を付けることは？",
  "体験に遅れそうなときは？",
  "祭りで参加するときの注意は？",
] as const;

export function searchMannerItems(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  return MANNER_ITEMS.filter((item) => {
    const haystacks = [
      item.title,
      item.shortDescription,
      ...item.details,
      ...item.keywords,
    ].map((value) => value.toLowerCase());

    return haystacks.some((value) => value.includes(normalized));
  });
}

const DEFAULT_MANNER_ITEM_IDS = [
  "facility-photo",
  "facility-voice",
  "experience-instruction",
] as const;

function getDefaultMannerItems(limit: number) {
  return MANNER_ITEMS.filter((item) => DEFAULT_MANNER_ITEM_IDS.includes(item.id as (typeof DEFAULT_MANNER_ITEM_IDS)[number]))
    .slice(0, limit);
}

export function getRecommendedMannerItemsByScenes(scenes: string[], limit: number = 3) {
  const normalizedScenes = Array.from(new Set(scenes.filter(Boolean)));
  if (normalizedScenes.length === 0) {
    return getDefaultMannerItems(limit);
  }

  const scoredItems = MANNER_ITEMS.map((item) => {
    const matchedScenes = item.scenes.filter((scene) => normalizedScenes.includes(scene)).length;
    let score = matchedScenes * 100;

    if (normalizedScenes.includes("museum") && item.categoryId === "facility") score += 18;
    if (normalizedScenes.includes("workshop") && item.categoryId === "experience") score += 18;
    if (normalizedScenes.includes("craft") && item.categoryId === "experience") score += 14;
    if (normalizedScenes.includes("festival") && item.categoryId === "community") score += 18;
    if ((normalizedScenes.includes("train") || normalizedScenes.includes("bus")) && item.categoryId === "transit") score += 18;
    if (normalizedScenes.includes("walking") && item.categoryId === "community") score += 8;

    return { item, score };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title, "ja"));

  if (scoredItems.length === 0) {
    return getDefaultMannerItems(limit);
  }

  return scoredItems.slice(0, limit).map((entry) => entry.item);
}
