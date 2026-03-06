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
  photos?: string[];  // 写真URLリスト（Wikimedia Commons等）
  videos?: string[];  // YouTube埋め込みURLリスト（embed/〇〇 形式）
}

export interface Review {
  author: string;
  rating: number; // 1-5
  comment: string;
  date: string;
}

// interest ID → スポットID のマッピング（新診断ID対応）
export const INTEREST_SPOT_MAP: Record<string, number[]> = {
  sightseeing: [1, 2, 5, 10, 11, 12, 18, 19, 27], // 歴史的な場所・建物
  food:        [4, 22],                             // 郷土料理・食文化
  hands_on:    [6, 7, 8, 9, 14, 15, 20, 27],       // 伝統工芸・体験
  culture:     [6, 7, 8, 16, 20, 27],              // アイヌ・先住民族文化
  healing:     [3, 13, 24, 12, 28],                // 温泉・神社・祭り
};

// interest ID → おすすめカテゴリ（新診断ID対応）
export const INTEREST_CATEGORY_MAP: Record<string, { label: string; emoji: string }[]> = {
  sightseeing: [
    { label: "史跡・城・文化財", emoji: "🏯" },
    { label: "博物館・資料館", emoji: "🏛️" },
    { label: "運河・町並み", emoji: "🌆" },
  ],
  food: [
    { label: "郷土料理・食文化", emoji: "🍱" },
    { label: "市場・朝市", emoji: "🐟" },
    { label: "酒蔵・ワイナリー", emoji: "🍶" },
  ],
  hands_on: [
    { label: "伝統工芸・体験", emoji: "🎨" },
    { label: "ものづくり体験", emoji: "🏺" },
    { label: "アイヌ文化体験", emoji: "🪶" },
  ],
  culture: [
    { label: "アイヌ文化", emoji: "🪶" },
    { label: "世界遺産・縄文", emoji: "🗿" },
    { label: "博物館・資料館", emoji: "🏛️" },
  ],
  healing: [
    { label: "神社仏閣・教会", emoji: "⛩️" },
    { label: "温泉・湯治", emoji: "♨️" },
    { label: "パワースポット", emoji: "🌿" },
  ],
};

// interests配列からおすすめスポットIDを返す（重複除去・最大8件）
export function getRecommendedSpotIds(interests: string[]): number[] {
  const ids = new Set<number>();
  interests.forEach(interest => {
    (INTEREST_SPOT_MAP[interest] || []).forEach(id => ids.add(id));
  });
  // 足りない場合は人気スポットで補完（id:28 は動画付きデモスポットとして常に含める）
  if (ids.size < 5) {
    [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 28].forEach(id => ids.add(id));
  }
  return Array.from(ids).slice(0, 10);
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
      { author: "旅行者A", rating: 5, comment: "タワーからの眺めが最高でした！星形がはっきり見えます。", date: "2025-01-10" },
      { author: "観光客B", rating: 4, comment: "歴史を感じられる素晴らしい場所。春の桜がおすすめ。", date: "2024-12-20" },
    ],
    infos: [
      { type: "hours",   label: "営業時間", value: "8:00〜19:00（季節により変動）" },
      { type: "address", label: "住所",     value: "北海道函館市五稜郭町44" },
      { type: "phone",   label: "電話番号", value: "0138-31-5505" },
      { type: "access",  label: "アクセス", value: "函館市電「五稜郭公園前」停から徒歩約15分" },
      { type: "price",   label: "入場料",   value: "大人900円 / 中高生680円 / 小学生450円" },
      { type: "website", label: "Webサイト", value: "https://www.goryokaku-tower.co.jp/" },
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
      { author: "札幌市民", rating: 4, comment: "思ったより小さいけど、歴史を感じる建物です。", date: "2025-01-05" },
      { author: "初訪問者", rating: 3, comment: "写真で見るより周りにビルが多い。でも一度は見ておきたい。", date: "2024-11-15" },
    ],
    infos: [
      { type: "hours",      label: "営業時間", value: "8:45〜17:10（入館は17:00まで）" },
      { type: "address",    label: "住所",     value: "北海道札幌市中央区北1条西2丁目" },
      { type: "phone",      label: "電話番号", value: "011-231-0838" },
      { type: "access",     label: "アクセス", value: "地下鉄大通駅から徒歩約5分" },
      { type: "price",      label: "入場料",   value: "大人200円 / 高校生以下無料" },
      { type: "closedDays", label: "定休日",   value: "年末年始（12/29〜1/3）" },
      { type: "website",    label: "Webサイト", value: "http://sapporoshi-tokeidai.jp/" },
    ],
  },
  {
    id: 3,
    name: "阿寒湖温泉",
    lat: 43.4467,
    lng: 144.1042,
    description: "「阿寒湖温泉」は、100年以上の歴史を誇る道東の代表的な温泉地です。",
    category: "体験",
    reviews: [],
    infos: [
      { type: "hours",   label: "営業時間", value: "施設により異なる" },
      { type: "address", label: "住所",     value: "北海道釧路市阿寒町阿寒湖温泉" },
      { type: "phone",   label: "電話番号", value: "0154-67-3200（阿寒観光協会まちづくり推進機構）" },
      { type: "access",  label: "アクセス", value: "JR釧路駅から車で約80分 / 釧路空港から車で約60分" },
      { type: "parking", label: "駐車場",   value: "各施設または有料駐車場をご利用ください" },
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
      { author: "ビール好き", rating: 5, comment: "出来たてのビールとジンギスカンは最高の組み合わせ！", date: "2025-01-08" },
      { author: "観光客C",   rating: 5, comment: "雰囲気も味も最高。予約必須です。", date: "2024-12-25" },
    ],
    infos: [
      { type: "hours",       label: "営業時間", value: "11:30〜22:00（ラストオーダー21:30）" },
      { type: "address",     label: "住所",     value: "北海道札幌市東区北7条東9丁目2-10" },
      { type: "phone",       label: "電話番号", value: "0120-150-550" },
      { type: "access",      label: "アクセス", value: "地下鉄東豊線「東区役所前駅」から徒歩約10分" },
      { type: "parking",     label: "駐車場",   value: "あり・無料（約200台）" },
      { type: "website",     label: "Webサイト", value: "https://www.sapporo-bier-garten.jp/" },
      { type: "reservation", label: "予約",     value: "Web予約・電話予約可（予約推奨）" },
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
      { author: "歴史ファン", rating: 5, comment: "外観も内装も素晴らしい。無料で見学できるのが嬉しい。", date: "2025-01-03" },
      { author: "写真家",     rating: 4, comment: "四季折々の姿が美しい。特に雪景色がおすすめ。", date: "2024-11-30" },
    ],
    infos: [
      { type: "hours",   label: "営業時間", value: "8:45〜18:00" },
      { type: "address", label: "住所",     value: "北海道札幌市中央区北3条西6丁目" },
      { type: "phone",   label: "電話番号", value: "011-204-5019" },
      { type: "access",  label: "アクセス", value: "地下鉄大通駅から徒歩約5分" },
      { type: "price",   label: "入場料",   value: "無料" },
      { type: "website", label: "Webサイト", value: "https://www.pref.hokkaido.lg.jp/sm/sum/" },
    ],
  },
  {
    id: 6,
    name: "札幌市アイヌ文化交流センター",
    lat: 42.9847,
    lng: 141.2469,
    description: "アイヌ民族の生活や歴史、芸術を見て・触れて・体験して、楽しみながら学べる施設です。",
    category: "体験",
    reviews: [],
    infos: [
      { type: "hours",   label: "営業時間", value: "8:45〜22:00（展示室・屋外展示は9:00〜17:00）" },
      { type: "address", label: "住所",     value: "北海道札幌市南区小金湯27" },
      { type: "phone",   label: "電話番号", value: "011-596-5961" },
      { type: "access",  label: "アクセス", value: "じょうてつバス「小金湯」停下車、徒歩約6分 / 札幌市中心部から車で約40分" },
      { type: "parking", label: "駐車場",   value: "あり・無料" },
    ],
  },
  {
    id: 7,
    name: "ウポポイ（民族共生象徴空間）",
    lat: 42.5572,
    lng: 141.3608,
    description: "アイヌ文化の復興・発展の拠点として2020年に開設。国立アイヌ民族博物館や体験交流ホール、伝統的コタン（集落）などを通じてアイヌ文化を体感できます。",
    category: "体験",
    reviews: [],
    infos: [
      { type: "hours",   label: "営業時間", value: "9:00〜18:00（季節により変動）" },
      { type: "address", label: "住所",     value: "北海道白老郡白老町若草町2丁目3" },
      { type: "phone",   label: "電話番号", value: "0144-82-3914" },
      { type: "access",  label: "アクセス", value: "JR白老駅から徒歩約10分" },
      { type: "parking", label: "駐車場",   value: "あり（有料）" },
      { type: "price",   label: "入場料",   value: "一般1,200円 / 高校生600円 / 中学生以下無料" },
      { type: "website", label: "Webサイト", value: "https://upopoy.jp/" },
    ],
  },
  {
    id: 8,
    name: "二風谷アイヌ文化博物館",
    lat: 42.7356,
    lng: 142.1089,
    description: "北海道の歴史と文化の源泉でもあるアイヌ文化を守り、そして未来へと伝えていくことをコンセプトとした博物館です。「講話」「舞踊」「ムックリ演奏」「木彫・刺繍」などの体験ができます。",
    category: "体験",
    reviews: [
      { author: "traveler_A", rating: 5, comment: "アイヌ文化を深く学べる充実した博物館です。ムックリ演奏体験は初めてでしたがとても楽しかったです。", date: "2025-04-12" },
      { author: "culture_fan", rating: 4, comment: "館内の展示がとても丁寧にまとめられており、アイヌの歴史と文化への理解が深まりました。屋外展示も必見です。", date: "2024-09-05" },
      { author: "hokkaido_trip", rating: 4, comment: "二風谷の地でアイヌ文化に触れることができる貴重な施設です。木彫り体験も素晴らしかったです。", date: "2025-06-20" },
    ],
    photos: [
      "/spots/nibutani-1.jpg",
    ],
    videos: [
      "https://www.youtube.com/embed/TFK_gChvMlI",
    ],
    infos: [
      { type: "hours",      label: "営業時間", value: "9:00〜16:30（4月16日〜11月15日は無休）" },
      { type: "closedDays", label: "定休日",   value: "12月16日〜1月15日、その他期間の月曜日" },
      { type: "address",    label: "住所",     value: "北海道沙流郡平取町二風谷55" },
      { type: "phone",      label: "電話番号", value: "01457-2-2892" },
      { type: "price",      label: "入場料",   value: "大人400円 / 小中学生150円" },
      { type: "parking",    label: "駐車場",   value: "あり・無料" },
      { type: "access",     label: "アクセス", value: "日高自動車道 日高富川ICから車で約30分" },
      { type: "website",    label: "Webサイト", value: "https://nibutani-ainu-museum.com" },
      { type: "reservation", label: "団体予約シート", value: "https://nibutani-ainu-museum.com/pdf/group_reservation_2025.pdf" },
    ],
  },
  {
    id: 9,
    name: "北海道開拓の村",
    lat: 43.0411,
    lng: 141.5122,
    description: "明治〜昭和初期の建造物54棟を野外移築復元した歴史テーマパーク。開拓時代の町並みや農村・漁村の暮らしをリアルに体験できます。",
    category: "体験",
    reviews: [],
    infos: [
      { type: "hours",      label: "営業時間", value: "9:00〜17:00（冬季9:00〜16:30）" },
      { type: "address",    label: "住所",     value: "北海道札幌市厚別区厚別町小野幌50-1" },
      { type: "phone",      label: "電話番号", value: "011-898-2692" },
      { type: "access",     label: "アクセス", value: "JR新札幌駅からバスで約15分" },
      { type: "parking",    label: "駐車場",   value: "あり・無料" },
      { type: "price",      label: "入場料",   value: "大人800円 / 大学・高校生600円 / 中学生以下無料" },
      { type: "closedDays", label: "定休日",   value: "月曜日（祝日の場合は翌日）・年末年始" },
      { type: "website",    label: "Webサイト", value: "https://www.kaitaku.or.jp/" },
    ],
  },
  {
    id: 10,
    name: "松前城",
    lat: 41.4303,
    lng: 140.1094,
    description: "北海道唯一の日本式城郭。江戸時代の松前藩の歴史と文化を伝える資料館を併設。春には桜の名所としても有名で、1万本を超える桜が城を彩ります。",
    category: "観光",
    reviews: [],
    infos: [
      { type: "hours",      label: "営業時間", value: "9:00〜17:00（4月〜10月）" },
      { type: "address",    label: "住所",     value: "北海道松前郡松前町字松城144" },
      { type: "phone",      label: "電話番号", value: "0139-42-2216" },
      { type: "access",     label: "アクセス", value: "函館市内から車で約2時間" },
      { type: "parking",    label: "駐車場",   value: "あり・無料" },
      { type: "price",      label: "入場料",   value: "大人360円 / 小中高生240円" },
      { type: "closedDays", label: "定休日",   value: "11月〜3月は閉館" },
    ],
  },
  {
    id: 11,
    name: "旧函館区公会堂",
    lat: 41.7719,
    lng: 140.7118,
    description: "明治43年（1910年）建築の国指定重要文化財。コロニアル様式の美しい建物で、明治時代の衣装を着て記念撮影できる体験が人気です。",
    category: "体験",
    reviews: [],
    infos: [
      { type: "hours",   label: "営業時間", value: "9:00〜19:00（11〜3月は17:00まで）" },
      { type: "address", label: "住所",     value: "北海道函館市元町11-13" },
      { type: "phone",   label: "電話番号", value: "0138-22-1001" },
      { type: "access",  label: "アクセス", value: "函館市電「末広町」停から徒歩約5分" },
      { type: "parking", label: "駐車場",   value: "なし（近隣の有料駐車場を利用）" },
      { type: "price",   label: "入場料",   value: "大人300円 / 学生150円 / 小学生以下無料" },
      { type: "website", label: "Webサイト", value: "https://www.hakodate-jts-kosya.jp/facilities/ko-kaido" },
    ],
  },
  {
    id: 12,
    name: "函館ハリストス正教会",
    lat: 41.7722,
    lng: 140.7127,
    description: "ロシア正教会として1859年に創建。現在の建物は1916年再建で国の重要文化財に指定。鐘の音は「日本の音100選」にも選ばれています。",
    category: "観光",
    reviews: [],
    infos: [
      { type: "hours",      label: "営業時間", value: "10:00〜17:00（土・日・祝）" },
      { type: "address",    label: "住所",     value: "北海道函館市元町3-13" },
      { type: "phone",      label: "電話番号", value: "0138-23-7387" },
      { type: "access",     label: "アクセス", value: "函館市電「十字街」停から徒歩約10分" },
      { type: "price",      label: "入場料",   value: "大人200円" },
      { type: "closedDays", label: "定休日",   value: "月〜金曜日" },
    ],
  },
  {
    id: 13,
    name: "北海道神宮",
    lat: 43.0579,
    lng: 141.3025,
    description: "明治2年（1869年）創建の北海道の総鎮守。広大な円山公園に隣接し、四季を通じて参拝者が訪れます。6月の例大祭は北海道最大規模の祭りです。",
    category: "体験",
    reviews: [],
    infos: [
      { type: "hours",   label: "営業時間", value: "参拝自由（社務所6:00〜17:00）" },
      { type: "address", label: "住所",     value: "北海道札幌市中央区宮ヶ丘474" },
      { type: "phone",   label: "電話番号", value: "011-611-0261" },
      { type: "access",  label: "アクセス", value: "地下鉄東西線「円山公園駅」から徒歩約15分" },
      { type: "parking", label: "駐車場",   value: "あり・無料" },
      { type: "price",   label: "入場料",   value: "無料" },
      { type: "website", label: "Webサイト", value: "https://www.hokkaidojingu.or.jp/" },
    ],
  },
  {
    id: 14,
    name: "登別伊達時代村",
    lat: 42.4147,
    lng: 141.1011,
    description: "江戸時代の町並みを再現したテーマパーク。忍者ショーや大道芸、武士の衣装を着ての記念撮影など、江戸文化を体感できる体験型施設です。",
    category: "体験",
    reviews: [],
    infos: [
      { type: "hours",   label: "営業時間", value: "9:00〜17:00（季節により変動）" },
      { type: "address", label: "住所",     value: "北海道登別市中登別町53-1" },
      { type: "phone",   label: "電話番号", value: "0143-83-3311" },
      { type: "access",  label: "アクセス", value: "JR登別駅から車で約5分 / 道央自動車道 登別東ICから約5分" },
      { type: "parking", label: "駐車場",   value: "あり・無料" },
      { type: "price",   label: "入場料",   value: "大人2,900円 / 小人1,500円" },
      { type: "website", label: "Webサイト", value: "https://www.edo-kakuunji.jp/" },
    ],
  },
  {
    id: 15,
    name: "小樽芸術村",
    lat: 43.1907,
    lng: 140.9939,
    description: "明治・大正時代の歴史的建造物を活用した複合文化施設。ステンドグラス美術館や西洋美術館など、独自のアート体験ができます。",
    category: "体験",
    reviews: [],
    infos: [
      { type: "hours",      label: "営業時間", value: "9:30〜17:00（11〜4月は10:00〜16:00）" },
      { type: "address",    label: "住所",     value: "北海道小樽市色内1丁目3番1号" },
      { type: "phone",      label: "電話番号", value: "0134-31-1033" },
      { type: "access",     label: "アクセス", value: "JR小樽駅から徒歩約10分" },
      { type: "parking",    label: "駐車場",   value: "なし（近隣の有料駐車場を利用）" },
      { type: "price",      label: "入場料",   value: "共通入場券 大人2,900円〜" },
      { type: "closedDays", label: "定休日",   value: "不定休（要確認）" },
      { type: "website",    label: "Webサイト", value: "https://otaru-art-base.jp/" },
    ],
  },
  {
    id: 16,
    name: "北海道博物館",
    lat: 43.0442,
    lng: 141.5111,
    description: "北海道の自然・歴史・文化を総合的に学べる博物館。アイヌ文化の展示から開拓の歴史まで幅広くカバー。敷地内の野幌森林公園では自然散策も楽しめます。",
    category: "体験",
    reviews: [],
    infos: [
      { type: "hours",      label: "営業時間", value: "9:30〜17:00（入館は16:30まで）" },
      { type: "address",    label: "住所",     value: "北海道札幌市厚別区厚別町小野幌53-2" },
      { type: "phone",      label: "電話番号", value: "011-898-0456" },
      { type: "access",     label: "アクセス", value: "JR新札幌駅からバスで約15分" },
      { type: "parking",    label: "駐車場",   value: "あり・無料" },
      { type: "price",      label: "入場料",   value: "大人600円 / 学生300円 / 高校生以下無料" },
      { type: "closedDays", label: "定休日",   value: "月曜日（祝日の場合は翌日）・年末年始" },
      { type: "website",    label: "Webサイト", value: "https://www.hm.pref.hokkaido.lg.jp/" },
    ],
  },
  {
    id: 17,
    name: "博物館 網走監獄",
    lat: 44.0181,
    lng: 144.2825,
    description: "明治時代の刑務所建築を保存・公開する野外博物館。重要文化財に指定された建物が立ち並び、囚人たちが北海道開拓に果たした歴史を学べます。",
    category: "体験",
    reviews: [],
    infos: [
      { type: "hours",   label: "営業時間", value: "9:00〜17:00（季節により変動）" },
      { type: "address", label: "住所",     value: "北海道網走市字呼人1-1" },
      { type: "phone",   label: "電話番号", value: "0152-45-2411" },
      { type: "access",  label: "アクセス", value: "JR網走駅から車で約5分 / 路線バスあり" },
      { type: "parking", label: "駐車場",   value: "あり・無料" },
      { type: "price",   label: "入場料",   value: "大人1,100円 / 小中高生440〜550円" },
      { type: "website", label: "Webサイト", value: "https://www.kangoku.jp/" },
    ],
  },
  {
    id: 18,
    name: "豊平館",
    lat: 43.0497,
    lng: 141.3582,
    description: "明治14年（1881年）建築の国指定重要文化財。明治天皇も宿泊した北海道最古のホテル建築で、コバルトブルーの外壁が印象的な洋館です。",
    category: "観光",
    reviews: [],
    infos: [
      { type: "hours",      label: "営業時間", value: "9:00〜17:00（入館は16:30まで）" },
      { type: "address",    label: "住所",     value: "北海道札幌市中央区中島公園1-20" },
      { type: "phone",      label: "電話番号", value: "011-211-1951" },
      { type: "access",     label: "アクセス", value: "地下鉄南北線「中島公園駅」から徒歩約5分" },
      { type: "price",      label: "入場料",   value: "大人200円 / 中学生以下無料" },
      { type: "closedDays", label: "定休日",   value: "月曜日（祝日の場合は翌日）・年末年始" },
    ],
  },
  {
    id: 19,
    name: "函館市旧イギリス領事館",
    lat: 41.7725,
    lng: 140.7130,
    description: "幕末の開港時代から活躍したイギリス領事館を改修した施設。港町・函館の歴史を伝える展示と、ビクトリアンローズのカフェが楽しめます。",
    category: "体験",
    reviews: [],
    infos: [
      { type: "hours",   label: "営業時間", value: "9:00〜19:00（11〜3月は17:00まで）" },
      { type: "address", label: "住所",     value: "北海道函館市元町33-14" },
      { type: "phone",   label: "電話番号", value: "0138-27-8159" },
      { type: "access",  label: "アクセス", value: "函館市電「末広町」停から徒歩約5分" },
      { type: "price",   label: "入場料",   value: "大人300円 / 学生150円 / 小学生以下無料" },
    ],
  },
  {
    id: 20,
    name: "旭川市博物館",
    lat: 43.7708,
    lng: 142.3680,
    description: "旭川・上川地方の歴史と文化を紹介する博物館。アイヌ民族の暮らしや、北海道開拓の歴史に関する充実した展示が特徴です。",
    category: "体験",
    reviews: [],
    infos: [
      { type: "hours",      label: "営業時間", value: "9:30〜17:00（入館は16:30まで）" },
      { type: "address",    label: "住所",     value: "北海道旭川市常磐公園内" },
      { type: "phone",      label: "電話番号", value: "0166-69-2004" },
      { type: "access",     label: "アクセス", value: "JR旭川駅から徒歩約20分 / バスで約10分" },
      { type: "parking",    label: "駐車場",   value: "あり・無料" },
      { type: "price",      label: "入場料",   value: "大人300円 / 高校生以下無料" },
      { type: "closedDays", label: "定休日",   value: "月曜日（祝日の場合は翌日）・年末年始" },
    ],
  },
  {
    id: 21,
    name: "松前藩屋敷",
    lat: 41.4259,
    lng: 140.1042,
    description: "江戸時代の松前藩の武家屋敷を復元した施設。番所や廻船問屋、鍛冶屋など13棟が並び、当時の暮らしを体感できます。",
    category: "体験",
    reviews: [],
    infos: [
      { type: "hours",      label: "営業時間", value: "9:00〜17:00（4〜11月のみ開館）" },
      { type: "address",    label: "住所",     value: "北海道松前郡松前町字豊岡17" },
      { type: "phone",      label: "電話番号", value: "0139-43-2439" },
      { type: "access",     label: "アクセス", value: "函館市内から車で約2時間" },
      { type: "parking",    label: "駐車場",   value: "あり・無料" },
      { type: "price",      label: "入場料",   value: "大人360円 / 小中高生240円" },
      { type: "closedDays", label: "定休日",   value: "12月〜3月は閉館" },
    ],
  },
  {
    id: 22,
    name: "小樽市総合博物館",
    lat: 43.2064,
    lng: 140.9767,
    description: "鉄道と海運の歴史を通じて小樽・北海道の発展を紹介する博物館。北海道初の鉄道「官営幌内鉄道」の蒸気機関車など貴重な展示が充実しています。",
    category: "体験",
    reviews: [],
    infos: [
      { type: "hours",      label: "営業時間", value: "9:30〜17:00（入館は16:30まで）" },
      { type: "address",    label: "住所",     value: "北海道小樽市手宮1丁目3番6号" },
      { type: "phone",      label: "電話番号", value: "0134-33-2523" },
      { type: "access",     label: "アクセス", value: "JR小樽駅から徒歩約25分 / バス「手宮」停下車すぐ" },
      { type: "parking",    label: "駐車場",   value: "あり・無料" },
      { type: "price",      label: "入場料",   value: "大人400円 / 高校生200円 / 中学生以下無料" },
      { type: "closedDays", label: "定休日",   value: "月曜日（祝日の場合は翌日）・年末年始" },
      { type: "website",    label: "Webサイト", value: "https://www.city.otaru.lg.jp/simin/sisetu/museum/" },
    ],
  },
  {
    id: 23,
    name: "帯広百年記念館",
    lat: 42.9092,
    lng: 143.2164,
    description: "帯広と十勝地方の歴史・文化・自然を学べる総合博物館。開拓から現代までの歩みや、十勝の自然環境に関する展示が充実。緑豊かな緑ヶ丘公園内にあります。",
    category: "体験",
    reviews: [],
    infos: [
      { type: "hours",      label: "営業時間", value: "9:00〜17:00（入館は16:30まで）" },
      { type: "address",    label: "住所",     value: "北海道帯広市緑ケ丘2番地" },
      { type: "phone",      label: "電話番号", value: "0155-24-5352" },
      { type: "access",     label: "アクセス", value: "JR帯広駅からバスで約10分「緑ヶ丘公園前」停下車" },
      { type: "parking",    label: "駐車場",   value: "あり・無料" },
      { type: "price",      label: "入場料",   value: "大人360円 / 高校生以下無料" },
      { type: "closedDays", label: "定休日",   value: "月曜日（祝日の場合は翌日）・年末年始" },
    ],
  },
  {
    id: 24,
    name: "阿寒湖アイヌシアター「イコロ」",
    lat: 43.4472,
    lng: 144.1065,
    description: "阿寒湖温泉街にあるアイヌ文化のシアター。アイヌ古式舞踊の公演や、火の神に祈る神聖な儀式「カムイノミ」を見学できます。伝統工芸品の販売も充実。",
    category: "体験",
    reviews: [],
    infos: [
      { type: "hours",       label: "営業時間", value: "公演時間は要確認" },
      { type: "address",     label: "住所",     value: "北海道釧路市阿寒町阿寒湖温泉4-7-84" },
      { type: "phone",       label: "電話番号", value: "0154-67-2727" },
      { type: "access",      label: "アクセス", value: "JR釧路駅から車で約80分" },
      { type: "price",       label: "入場料",   value: "大人1,500円 / 高校生700円 / 小中学生500円" },
      { type: "website",     label: "Webサイト", value: "https://www.akanainu.jp/" },
      { type: "reservation", label: "予約",     value: "公演の事前確認を推奨" },
    ],
  },
  {
    id: 25,
    name: "北海道立近代美術館",
    lat: 43.0639,
    lng: 141.3390,
    description: "北海道ゆかりのアーティストの作品を中心に収蔵する美術館。アイヌ工芸品から現代美術まで幅広い作品を展示。道内最大級のコレクションを誇ります。",
    category: "体験",
    reviews: [],
    infos: [
      { type: "hours",      label: "営業時間", value: "9:30〜17:00（入館は16:30まで）" },
      { type: "address",    label: "住所",     value: "北海道札幌市中央区北1条西17丁目" },
      { type: "phone",      label: "電話番号", value: "011-644-6881" },
      { type: "access",     label: "アクセス", value: "地下鉄東西線「西18丁目駅」から徒歩約5分" },
      { type: "parking",    label: "駐車場",   value: "あり（有料）" },
      { type: "price",      label: "入場料",   value: "大人510円〜（展覧会により異なる）" },
      { type: "closedDays", label: "定休日",   value: "月曜日（祝日の場合は翌日）・年末年始" },
      { type: "website",    label: "Webサイト", value: "https://www.dokyoi.pref.hokkaido.lg.jp/hk/knb/" },
    ],
  },
  {
    id: 26,
    name: "有珠善光寺",
    lat: 42.5103,
    lng: 140.8675,
    description: "西暦807年建立とされる北海道最古の寺院。国宝の仏像を含む寺宝を所蔵しており、道内唯一の勅願所として歴史的に重要な場所です。",
    category: "体験",
    reviews: [],
    infos: [
      { type: "hours",   label: "営業時間", value: "9:00〜16:00（冬季は要確認）" },
      { type: "address", label: "住所",     value: "北海道伊達市有珠町124" },
      { type: "phone",   label: "電話番号", value: "0142-67-2947" },
      { type: "access",  label: "アクセス", value: "JR有珠駅から車で約5分" },
      { type: "parking", label: "駐車場",   value: "あり・無料" },
      { type: "price",   label: "入場料",   value: "無料" },
    ],
  },
  {
    id: 27,
    name: "函館市北方民族資料館",
    lat: 41.7717,
    lng: 140.7110,
    description: "アイヌ民族の歴史や北方民族の衣装、生活用品などが展示されています。館内ではアイヌ民族に古くから伝わる竹製の伝統楽器の制作・演奏体験や、北方民族文様というアイヌ民族が使っていた紋様の切り紙細工体験ができます。",
    category: "体験",
    reviews: [
      { author: "tomato", rating: 3, comment: "展示はこじんまりしていますが、ムックリ演奏体験が印象的でした。元町エリアの観光の合間に立ち寄れます。", date: "2025-12-03" },
      { author: "cheese", rating: 4, comment: "アイヌ民族の文化を身近に感じられる素敵な資料館でした。スタッフの方が丁寧に説明してくださいました。", date: "2022-08-27" },
      { author: "ham",    rating: 4, comment: "小さな施設ですが内容が充実しています。ムックリの音色は独特で感動しました。", date: "2024-03-03" },
    ],
    photos: [
      "/spots/hoppominzoku-1.jpg",
    ],
    videos: [
      "https://www.youtube.com/embed/2Pd4ctY3ICw",
    ],
    infos: [
      { type: "hours",      label: "営業時間", value: "4〜10月 9:00〜19:00　/ 11〜3月 9:00〜17:00" },
      { type: "closedDays", label: "定休日",   value: "年末年始（詳細は公式サイトをご確認ください）" },
      { type: "address",    label: "住所",     value: "北海道函館市末広町21-7" },
      { type: "phone",      label: "電話番号", value: "0138-22-4128" },
      { type: "price",      label: "入場料",   value: "大人300円 / 子ども150円" },
      { type: "parking",    label: "駐車場",   value: "なし（近隣の有料駐車場をご利用ください）" },
      { type: "access",     label: "アクセス", value: "市電「末広町停留所」下車 徒歩1分\n函館バス「公会堂前」下車 徒歩3分" },
      { type: "website",    label: "Webサイト", value: "https://www.zaidan-hakodate.com/hoppominzoku/index.html" },
      { type: "reservation", label: "体験予約", value: "ムックリ製作・演奏体験：1,000円\nムックリ演奏体験：1,000円\n※小学生以下無料\n※予約・お問い合わせは電話にて（0138-22-4128）" },
    ],
  },
  {
    id: 28,
    name: "千歳・支笏湖氷濤まつり",
    lat: 42.7449,
    lng: 141.3617,
    description: "1979年（昭和54年）に始まった、北海道千歳市の支笏湖温泉で開催される冬を代表するイベントです。層雲峡の「氷瀑まつり」を参考に、冬の集客不足解消を目指して、地元業者や市が湖水をスプリンクラーで凍らせたオブジェを作り始めたのが起源です。天然の青い氷「支笏湖ブルー」が作り出す幻想的な空間をお楽しみください。",
    category: "体験",
    reviews: [
      { author: "peanuts",   rating: 3, comment: "ライトアップされた氷のオブジェは綺麗でしたが、会場が少し小さめに感じました。", date: "2023-02-23" },
      { author: "chocolate", rating: 5, comment: "支笏湖ブルーの幻想的な光景に圧倒されました！夜のライトアップは本当に美しく、何度でも来たくなります。", date: "2025-01-31" },
      { author: "carrot",    rating: 4, comment: "冬の北海道を代表するイベントです。氷のトンネルをくぐる体験は特別でした。子どもも大喜びでした。", date: "2024-02-14" },
    ],
    photos: [
      "/spots/hyoutou-1.jpg",
    ],
    videos: [
      "https://www.youtube.com/embed/glEXnQMEDwc",
    ],
    infos: [
      { type: "hours",   label: "開催期間",  value: "1月下旬〜2月下旬（毎年開催）\n2026年：1月31日（土）〜2月23日（月・祝）" },
      { type: "address", label: "住所",      value: "北海道千歳市支笏湖温泉" },
      { type: "phone",   label: "電話番号",  value: "0123-23-8288" },
      { type: "price",   label: "入場料",    value: "中学生以上1,000円 / 小学生以下無料" },
      { type: "parking", label: "駐車場",    value: "支笏湖有料駐車場（開催期間中は無料開放）" },
      { type: "access",  label: "アクセス",  value: "車：新千歳空港から約40分\n予約制直行バス「氷濤BLUE LINER」：約65分（要予約）" },
      { type: "website", label: "Webサイト", value: "https://hyoutou-special.asia/#outline" },
      { type: "reservation", label: "直行バス予約", value: "直行バス「氷濤BLUE LINER」をご利用の場合は事前予約が必要です。\n入場自体の予約は不要です。" },
    ],
  },
];

