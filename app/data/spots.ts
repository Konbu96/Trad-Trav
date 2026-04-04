// 情報の種類
export type SpotInfoType = 
  | "hours"       // 営業時間
  | "address"     // 住所
  | "website"     // Webサイト
  | "phone"       // 電話番号
  | "price"       // 料金
  | "parking"     // 駐車場
  | "access"      // アクセス
  | "closedDays"  // 定休日
  | "reservation" // 予約
  | "other";      // その他

// スポット情報の型
export interface SpotInfo {
  type: SpotInfoType;
  label: string;
  value: string;
}

// おすすめスポットの型定義
export interface Spot {
  id: number;
  name: string;
  lat: number;
  lng: number;
  description: string;
  category: string;
  reviews: Review[];
  infos: SpotInfo[];  // 情報をリストで管理
  photos?: string[];
  videos?: string[];
}

export interface Review {
  author: string;
  rating: number; // 1-5
  comment: string;
  date: string;
}

// おすすめスポットデータ
export const recommendedSpots: Spot[] = [
  {
    id: 1,
    name: "五稜郭",
    lat: 41.7987,
    lng: 140.7539,
    description: "日本初の西洋式城郭。星形の美しい形状が特徴で、桜の名所としても有名。五稜郭タワーからは城郭全体を見渡すことができます。",
    category: "観光",
    reviews: [
      {
        author: "旅行者A",
        rating: 5,
        comment: "タワーからの眺めが最高でした！星形がはっきり見えます。",
        date: "2025-01-10",
      },
      {
        author: "観光客B",
        rating: 4,
        comment: "歴史を感じられる素晴らしい場所。春の桜がおすすめ。",
        date: "2024-12-20",
      },
    ],
    infos: [
      { type: "hours", label: "営業時間", value: "8:00〜19:00（季節により変動）" },
      { type: "address", label: "住所", value: "北海道函館市五稜郭町44" },
      { type: "website", label: "Webサイト", value: "https://www.goryokaku-tower.co.jp/" },
      { type: "phone", label: "電話番号", value: "0138-31-5505" },
      { type: "price", label: "入場料", value: "大人900円 / 中高生680円 / 小学生450円" },
      { type: "reservation", label: "予約", value: "予約不要（団体は要予約）" },
    ],
  },
  {
    id: 2,
    name: "札幌市時計台",
    lat: 43.0629,
    lng: 141.3537,
    description: "札幌のシンボルとして親しまれる歴史的建造物。1878年に建てられ、現在も時を刻み続けています。内部は資料館として公開中。",
    category: "観光",
    reviews: [
      {
        author: "札幌市民",
        rating: 4,
        comment: "思ったより小さいけど、歴史を感じる建物です。",
        date: "2025-01-05",
      },
      {
        author: "初訪問者",
        rating: 3,
        comment: "写真で見るより周りにビルが多い。でも一度は見ておきたい。",
        date: "2024-11-15",
      },
    ],
    infos: [
      { type: "hours", label: "営業時間", value: "8:45〜17:10（入館は17:00まで）" },
      { type: "address", label: "住所", value: "北海道札幌市中央区北1条西2丁目" },
      { type: "website", label: "Webサイト", value: "http://sapporoshi-tokeidai.jp/" },
      { type: "phone", label: "電話番号", value: "011-231-0838" },
      { type: "price", label: "入場料", value: "大人200円 / 高校生以下無料" },
      { type: "reservation", label: "予約", value: "予約不要" },
    ],
  },
  {
    id: 3,
    name: "円山動物園",
    lat: 43.0505,
    lng: 141.3088,
    description: "北海道を代表する動物園。ホッキョクグマやレッサーパンダなど約170種の動物を飼育。四季折々の自然の中で動物たちを観察できます。",
    category: "レジャー",
    reviews: [
      {
        author: "家族連れ",
        rating: 5,
        comment: "子供たちが大喜び！ホッキョクグマが可愛かった。",
        date: "2025-01-12",
      },
      {
        author: "動物好き",
        rating: 4,
        comment: "広くて見応えがある。冬でも楽しめました。",
        date: "2024-12-28",
      },
    ],
    infos: [
      { type: "hours", label: "営業時間", value: "9:30〜16:30（季節により変動）" },
      { type: "address", label: "住所", value: "北海道札幌市中央区宮ヶ丘3番地1" },
      { type: "website", label: "Webサイト", value: "https://www.city.sapporo.jp/zoo/" },
      { type: "phone", label: "電話番号", value: "011-621-1426" },
      { type: "price", label: "入場料", value: "大人800円 / 高校生400円 / 中学生以下無料" },
      { type: "parking", label: "駐車場", value: "あり（有料：普通車700円）" },
      { type: "reservation", label: "予約", value: "予約不要（当日入場可）" },
    ],
  },
  {
    id: 4,
    name: "サッポロビール園",
    lat: 43.0703,
    lng: 141.3677,
    description: "歴史ある赤レンガの建物でジンギスカンと生ビールを楽しめる人気スポット。サッポロビールの歴史を学べる博物館も併設。",
    category: "グルメ",
    reviews: [
      {
        author: "ビール好き",
        rating: 5,
        comment: "出来たてのビールとジンギスカンは最高の組み合わせ！",
        date: "2025-01-08",
      },
      {
        author: "観光客C",
        rating: 5,
        comment: "雰囲気も味も最高。予約必須です。",
        date: "2024-12-25",
      },
    ],
    infos: [
      { type: "hours", label: "営業時間", value: "11:30〜22:00（ラストオーダー21:30）" },
      { type: "address", label: "住所", value: "北海道札幌市東区北7条東9丁目2-10" },
      { type: "website", label: "Webサイト", value: "https://www.sapporo-bier-garten.jp/" },
      { type: "phone", label: "電話番号", value: "0120-150-550" },
      { type: "parking", label: "駐車場", value: "あり（無料・約200台）" },
      { type: "access", label: "アクセス", value: "地下鉄東豊線「東区役所前駅」から徒歩10分" },
      { type: "reservation", label: "予約", value: "Web予約・電話予約可（予約推奨）" },
    ],
  },
  {
    id: 5,
    name: "赤レンガ庁舎",
    lat: 43.0641,
    lng: 141.3479,
    description: "正式名称は北海道庁旧本庁舎。1888年に建てられたネオ・バロック様式の美しい建物。国の重要文化財に指定されています。",
    category: "観光",
    reviews: [
      {
        author: "歴史ファン",
        rating: 5,
        comment: "外観も内装も素晴らしい。無料で見学できるのが嬉しい。",
        date: "2025-01-03",
      },
      {
        author: "写真家",
        rating: 4,
        comment: "四季折々の姿が美しい。特に雪景色がおすすめ。",
        date: "2024-11-30",
      },
    ],
    infos: [
      { type: "hours", label: "営業時間", value: "8:45〜18:00" },
      { type: "address", label: "住所", value: "北海道札幌市中央区北3条西6丁目" },
      { type: "website", label: "Webサイト", value: "https://www.pref.hokkaido.lg.jp/sm/sum/" },
      { type: "phone", label: "電話番号", value: "011-204-5019" },
      { type: "price", label: "入場料", value: "無料" },
      { type: "reservation", label: "予約", value: "予約不要（自由見学）" },
    ],
  },
  {
    id: 6,
    name: "札幌ドーム",
    lat: 43.0152,
    lng: 141.4097,
    description: "北海道最大級の全天候型ドーム施設。サッカーや野球の試合、コンサートなど多彩なイベントが開催されます。展望台からは札幌市街を一望。",
    category: "レジャー",
    reviews: [
      {
        author: "スポーツファン",
        rating: 4,
        comment: "設備が整っていて快適に観戦できる。アクセスも便利。",
        date: "2025-01-15",
      },
      {
        author: "コンサート参加者",
        rating: 5,
        comment: "音響が良くて最高のライブ体験でした！",
        date: "2024-12-10",
      },
    ],
    infos: [
      { type: "hours", label: "営業時間", value: "イベントにより異なる" },
      { type: "address", label: "住所", value: "北海道札幌市豊平区羊ケ丘1番地" },
      { type: "website", label: "Webサイト", value: "https://www.sapporo-dome.co.jp/" },
      { type: "phone", label: "電話番号", value: "011-850-1000" },
      { type: "parking", label: "駐車場", value: "あり（有料：1台1,000円〜）" },
      { type: "access", label: "アクセス", value: "地下鉄東豊線「福住駅」から徒歩10分" },
      { type: "reservation", label: "予約", value: "イベントによる（チケット購入が必要な場合あり）" },
    ],
  },
];

export type InterestCategory = {
  label: string;
  emoji: string;
};

export const INTEREST_CATEGORY_MAP: Record<string, InterestCategory[]> = {
  performing_arts: [
    { label: "伝統芸能・踊り", emoji: "🎭" },
    { label: "祭り・行事", emoji: "🎪" },
  ],
  crafts: [
    { label: "伝統工芸・ものづくり", emoji: "🏺" },
    { label: "体験・ワークショップ", emoji: "🛠️" },
  ],
};

const INTEREST_SPOT_ID_MAP: Record<string, number[]> = {
  performing_arts: [1, 2, 5],
  crafts: [3, 4, 6],
};

export function getRecommendedSpotIds(interests: string[]) {
  if (!Array.isArray(interests) || interests.length === 0) {
    return recommendedSpots.map((spot) => spot.id);
  }

  const ids = Array.from(new Set(interests.flatMap((interest) => INTEREST_SPOT_ID_MAP[interest] || [])));
  return ids.length > 0 ? ids : recommendedSpots.map((spot) => spot.id);
}

