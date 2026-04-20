export type MannerCategoryId = "meal" | "sightseeing" | "mobility" | "daily" | "rules";

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
  meal: "食事のマナーで気を付けることは？",
  sightseeing: "観光のマナーで気を付けることは？",
  mobility: "移動中のマナーで気を付けることは？",
  daily: "暮らし・公共の場のマナーで気を付けることは？",
  rules: "ルールや法律で気を付けることは？",
};

/** 原稿シートの区分（食事・観光・移動・生活・ルール）に合わせたカテゴリ */
export const MANNER_CATEGORIES: MannerCategory[] = [
  {
    id: "meal",
    label: "食事",
    emoji: "🍽️",
    description: "いただきます・箸使いなど、食卓や外食のときのマナーです。",
  },
  {
    id: "sightseeing",
    label: "観光",
    emoji: "⛩️",
    description: "神社・温泉・着物など、観光の場面でのマナーです。",
  },
  {
    id: "mobility",
    label: "移動",
    emoji: "🚃",
    description: "電車・エスカレーターなど、移動中のマナーです。",
  },
  {
    id: "daily",
    label: "生活",
    emoji: "🏙️",
    description: "買い物・公共の場・ゴミなど、日常の場面のマナーです。",
  },
  {
    id: "rules",
    label: "ルール",
    emoji: "📋",
    description: "撮影・喫煙・私有地など、ルールや法律に関する注意です。",
  },
];

/** 原稿: `docs/content-sheets/マナー情報 - マナー情報.csv` から取り込み */
export const MANNER_ITEMS: MannerItem[] = [
  {
    id: "meal-before-greeting",
    categoryId: "meal",
    title: "食事の前のあいさつ",
    shortDescription: "食事の前後に感謝の言葉を伝える文化があります。食べ物や作ってくれた人への気持ちを表すものです。",
    details: [
      "食前は「いただきます」と言いましょう 。",
      "食後は「ごちそうさまでした」と言いましょう。",
    ],
    keywords: ["挨拶", "文化"],
    scenes: ["facility"],
  },
  {
    id: "meal-quiet-eating",
    categoryId: "meal",
    title: "音を立てすぎない",
    shortDescription: "日本では静かに食事をする人が多く、周囲への配慮が大切にされています。",
    details: [
      "麺以外は音を立てないようにしましょう。",
      "できる限り静かに食べると安心です 。",
      "周囲の雰囲気に合わせましょう。",
    ],
    keywords: ["食事", "音", "マナー"],
    scenes: ["facility"],
  },
  {
    id: "meal-chopsticks-no-rice-plant",
    categoryId: "meal",
    title: "箸を食べ物に刺さない",
    shortDescription: "ご飯に箸を立てる行為は、お葬式などを連想させるため避けられています。",
    details: [
      "箸はご飯に立てないようにしましょう。",
      "使わないときは皿や箸置きに置きましょう。",
    ],
    keywords: ["箸", "マナー"],
    scenes: ["facility"],
  },
  {
    id: "meal-chopsticks-no-pass",
    categoryId: "meal",
    title: "箸で渡さない",
    shortDescription: "箸から箸へ食べ物を渡す行為は、お葬式などの場面を連想させるため避けられています。",
    details: [
      "箸から箸へ渡さないようにしましょう。",
      "取り分けるときは一度他のお皿に移すと安心です。",
    ],
    keywords: ["箸", "マナー"],
    scenes: ["facility"],
  },
  {
    id: "meal-restaurant-voice-level",
    categoryId: "meal",
    title: "店内では大声で話さない",
    shortDescription: "日本の飲食店では落ち着いた雰囲気が好まれますが、居酒屋などではにぎやかに過ごすこともあります。",
    details: [
      "店の雰囲気に合わせて声の大きさを調整しましょう。",
      "周囲の人の様子を見ると判断しやすいです。",
    ],
    keywords: ["会話", "レストラン"],
    scenes: ["facility"],
  },
  {
    id: "sightseeing-torii-bow",
    categoryId: "sightseeing",
    title: "鳥居の前で一礼",
    shortDescription: "鳥居は神聖な場所への入口とされており、敬意を表す行動が大切にされています。",
    details: [
      "鳥居の前後で軽くお辞儀をしましょう。",
    ],
    keywords: ["神社", "礼儀", "文化"],
    scenes: ["facility", "museum"],
  },
  {
    id: "sightseeing-quiet-shrine",
    categoryId: "sightseeing",
    title: "静かに行動する",
    shortDescription: "神社やお寺は静かな空間が大切にされており、落ち着いた行動が求められます。",
    details: [
      "大声を出さず静かに過ごしましょう。",
      "写真を撮るときも周囲に配慮しましょう。",
    ],
    keywords: ["寺", "マナー"],
    scenes: ["facility", "museum"],
  },
  {
    id: "sightseeing-sando-center",
    categoryId: "sightseeing",
    title: "参道の中央はなるべく避ける",
    shortDescription: "参道の中央は神様の通り道と考えられており、端を歩く人が多いです。",
    details: [
      "参道の中央はなるべく避けて歩きましょう。",
      "混雑時は無理に避けなくても大丈夫です。 ・周囲の人の動きに合わせると安心です。",
    ],
    keywords: ["神社", "文化"],
    scenes: ["facility", "museum"],
  },
  {
    id: "sightseeing-onsen-wash-first",
    categoryId: "sightseeing",
    title: "入る前に体を洗う",
    shortDescription: "温泉は多くの人が共有して使うため、清潔に保つことがとても大切です。",
    details: [
      "入る前に体をしっかり洗いましょう。",
      "シャンプーや石けんは湯船に入る前に済ませましょう。",
      "洗い場は次の人のために軽く流しておきましょう。",
    ],
    keywords: ["温泉", "清潔", "入浴"],
    scenes: ["facility"],
  },
  {
    id: "sightseeing-onsen-no-towel-in-bath",
    categoryId: "sightseeing",
    title: "タオルを湯船に入れない",
    shortDescription: "湯船の水を清潔に保つため、タオルを入れない習慣があります。",
    details: [
      "タオルは湯船に入れないようにしましょう。",
      "タオル置き場がある場合はそこを使いましょう。",
      "ない場合は濡れないようにし、人の邪魔にならない場所に置きましょう。",
    ],
    keywords: ["温泉", "タオル", "マナー"],
    scenes: ["facility"],
  },
  {
    id: "sightseeing-kimono-hem-walk",
    categoryId: "sightseeing",
    title: "裾を踏まないように歩く",
    shortDescription: "着物は裾が長く動きにくいため、歩き方に少し注意が必要です。",
    details: [
      "裾を少し持って汚さないように歩きましょう。",
      "階段や段差では特に注意しましょう。",
    ],
    keywords: ["着物", "歩き方"],
    scenes: ["facility", "walking"],
  },
  {
    id: "transit-escalator-stand-aside",
    categoryId: "mobility",
    title: "片側に寄る",
    shortDescription: "エスカレーターでは急ぐ人のために通路を空ける習慣があります。",
    details: [
      "片側に寄って立ちましょう。",
      "地域によって違うので周囲に合わせましょう。",
    ],
    keywords: ["エスカレーター", "マナー"],
    scenes: ["train", "walking"],
  },
  {
    id: "transit-elevator-yield-exit",
    categoryId: "mobility",
    title: "降りる人を優先",
    shortDescription: "電車やエレベーターではスムーズに移動するため、降りる人を優先するのが一般的です。",
    details: [
      "降りる人を先に通しましょう。",
      "ドア付近では少しよけるとスムーズです。",
    ],
    keywords: ["エレベーター", "マナー"],
    scenes: ["train", "walking"],
  },
  {
    id: "transit-backpack-front-when-crowded",
    categoryId: "mobility",
    title: "リュックは前に持つ",
    shortDescription: "混雑時は周囲との距離が近くなるため、荷物の持ち方に配慮が必要です。",
    details: [
      "混雑時はリュックを前に持ちましょう。",
      "周囲のスペースに気をつけましょう。",
    ],
    keywords: ["電車", "混雑", "荷物"],
    scenes: ["train", "bus"],
  },
  {
    id: "transit-quiet-on-public-transport",
    categoryId: "mobility",
    title: "公共の乗り物では静かにする",
    shortDescription: "電車やバスでは静かな環境が保たれており、周囲への配慮が重視されています。",
    details: [
      "音や声は控えめにしましょう。",
      "イヤホンの音漏れにも注意しましょう。",
    ],
    keywords: ["電車", "静か", "マナー"],
    scenes: ["train", "bus"],
  },
  {
    id: "life-no-open-before-payment",
    categoryId: "daily",
    title: "会計前の商品は使わない",
    shortDescription: "商品は購入するまで店のものであり、勝手に開封することはできません。",
    details: [
      "商品は会計前に開けないようにしましょう。",
    ],
    keywords: ["買い物", "ルール", "商品"],
    scenes: ["facility"],
  },
  {
    id: "life-queue-in-line",
    categoryId: "daily",
    title: "列に並ぶ",
    shortDescription: "日本では順番を守ることが大切にされており、列に並ぶ文化があります。",
    details: [
      "列に並んで順番を待ちましょう。",
      "最後尾の位置を確認すると安心です。",
    ],
    keywords: ["列", "順番", "マナー"],
    scenes: ["facility"],
  },
  {
    id: "life-quiet-in-public",
    categoryId: "daily",
    title: "公共の場では静かに話す",
    shortDescription: "公共の場では周囲に配慮した行動が求められ、静かに過ごす人が多いです。",
    details: [
      "声を抑えて話しましょう。",
      "周囲の人の様子を参考にすると安心です。",
    ],
    keywords: ["会話", "静か", "公共"],
    scenes: ["walking", "facility"],
  },
  {
    id: "life-phone-avoid-on-train",
    categoryId: "daily",
    title: "電車では通話を控える",
    shortDescription: "電車内では静かな環境を保つため、通話は控えることが一般的です。",
    details: [
      "通話は控えましょう。",
      "必要な場合は車外やデッキで話しましょう。",
    ],
    keywords: ["電車", "電話", "マナー"],
    scenes: ["train"],
  },
  {
    id: "life-trash-take-home",
    categoryId: "daily",
    title: "ゴミは持ち帰る",
    shortDescription: "日本ではゴミ箱が少ないため、自分で持ち帰ることが一般的です。",
    details: [
      "ゴミは持ち帰るようにしましょう。",
      "小さな袋を用意しておくと便利です。",
    ],
    keywords: ["ゴミ", "持ち帰り", "外出"],
    scenes: ["walking", "facility"],
  },
  {
    id: "life-trash-sort",
    categoryId: "daily",
    title: "分別する",
    shortDescription: "ゴミは種類ごとに分けて処理されるため、分別が重要とされています。",
    details: [
      "ゴミは分別して捨てましょう。",
      "表示や案内を確認すると分かりやすいです。",
    ],
    keywords: ["ゴミ", "分別", "ルール"],
    scenes: ["walking", "facility"],
  },
  {
    id: "life-discreet-pda",
    categoryId: "daily",
    title: "人前でのスキンシップは控えめにする",
    shortDescription: "公共の場では控えめな行動が好まれ、スキンシップも控えめな傾向があります。",
    details: [
      "スキンシップは控えめにしましょう。",
    ],
    keywords: ["愛情", "公共", "文化差"],
    scenes: ["walking", "facility"],
  },
  {
    id: "rule-smoking-designated-only",
    categoryId: "rules",
    title: "タバコは指定場所で吸う",
    shortDescription: "喫煙場所は決められていることが多く、ルールを守ることが求められます。",
    details: [
      "タバコは決められた場所で吸いましょう。",
      "事前に喫煙所を確認しておくと安心です。",
    ],
    keywords: ["喫煙", "ルール", "場所"],
    scenes: ["walking", "facility"],
  },
  {
    id: "rule-photo-consent",
    categoryId: "rules",
    title: "無断撮影に注意",
    shortDescription: "日本ではプライバシーが重視されており、無断撮影はトラブルになることがあります。",
    details: [
      "人物を撮影する前は一声かけましょう。",
      "店内では周囲のお客さんが写らないように配慮しましょう。 ・料理等の写真は基本的に問題ないことが多いですが、迷ったら店の案内を確認しましょう。",
    ],
    keywords: ["撮影", "注意", "ルール"],
    scenes: ["walking", "facility"],
  },
  {
    id: "rule-no-trespassing",
    categoryId: "rules",
    title: "私有地に入らない",
    shortDescription: "土地には所有者がいるため、無断で立ち入ることはできません。",
    details: [
      "許可なく立ち入らないようにしましょう。",
      "標識や表示を確認しましょう。",
    ],
    keywords: ["立入禁止", "ルール", "土地"],
    scenes: ["walking"],
  },
  {
    id: "rule-drinking-age-20",
    categoryId: "rules",
    title: "飲酒は年齢制限がある",
    shortDescription: "日本では法律で飲酒できる年齢が定められています。",
    details: [
      "20歳以上で飲みましょう。",
      "年齢確認を求められることがあります。",
    ],
    keywords: ["飲酒", "ルール", "年齢", "法律"],
    scenes: ["facility"],
  },
  {
    id: "rule-traffic-signals",
    categoryId: "rules",
    title: "信号を守る",
    shortDescription: "交通の安全を守るため、信号を守ることが重要です。",
    details: [
      "信号を守りましょう。",
      "徒歩の場合、横断歩道を使うと安全です。",
    ],
    keywords: ["信号", "交通", "安全"],
    scenes: ["walking"],
  },
  {
    id: "rule-no-graffiti",
    categoryId: "rules",
    title: "落書きをしない",
    shortDescription: "公共物はみんなで使うものであり、きれいに保つ意識が大切です。",
    details: [
      "落書きはしないようにしましょう。",
      "公共のものは大切に使いましょう。",
    ],
    keywords: ["落書き", "ルール", "公共"],
    scenes: ["walking", "facility"],
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
  "sightseeing-quiet-shrine",
  "transit-quiet-on-public-transport",
  "meal-before-greeting",
] as const;

function getDefaultMannerItems(limit: number) {
  return MANNER_ITEMS.filter((item) =>
    DEFAULT_MANNER_ITEM_IDS.includes(item.id as (typeof DEFAULT_MANNER_ITEM_IDS)[number])
  ).slice(0, limit);
}

export function getRecommendedMannerItemsByScenes(scenes: string[], limit: number = 3) {
  const normalizedScenes = Array.from(new Set(scenes.filter(Boolean)));
  if (normalizedScenes.length === 0) {
    return getDefaultMannerItems(limit);
  }

  const scoredItems = MANNER_ITEMS.map((item) => {
    const matchedScenes = item.scenes.filter((scene) => normalizedScenes.includes(scene)).length;
    let score = matchedScenes * 100;

    if (normalizedScenes.includes("museum") && item.categoryId === "sightseeing") score += 18;
    if (normalizedScenes.includes("workshop") && item.categoryId === "sightseeing") score += 18;
    if (normalizedScenes.includes("craft") && item.categoryId === "sightseeing") score += 14;
    if (normalizedScenes.includes("festival") && item.categoryId === "daily") score += 18;
    if (normalizedScenes.includes("festival") && item.categoryId === "rules") score += 12;
    if ((normalizedScenes.includes("train") || normalizedScenes.includes("bus")) && item.categoryId === "mobility") score += 18;
    if (normalizedScenes.includes("walking") && item.categoryId === "daily") score += 8;

    return { item, score };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title, "ja"));

  if (scoredItems.length === 0) {
    return getDefaultMannerItems(limit);
  }

  return scoredItems.slice(0, limit).map((entry) => entry.item);
}
