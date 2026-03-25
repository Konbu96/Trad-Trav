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
  infos: SpotInfo[];
  photos?: string[];
  videos?: string[];
}

export interface Review {
  author: string;
  rating: number; // 1-5
  comment: string;
  date: string;
}

// interest ID → スポットID のマッピング
export const INTEREST_SPOT_MAP: Record<string, number[]> = {
  performing_arts: [1, 2, 3, 4, 5, 6, 7, 8, 9],   // 伝統芸能・踊り・祭り
  crafts:          [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], // 伝統工芸・ものづくり
};

// interest ID → おすすめカテゴリ
export const INTEREST_CATEGORY_MAP: Record<string, { label: string; emoji: string }[]> = {
  performing_arts: [
    { label: "伝統芸能・踊り", emoji: "🎭" },
    { label: "祭り・行列", emoji: "🎪" },
    { label: "能・神楽", emoji: "🎑" },
  ],
  crafts: [
    { label: "伝統工芸・体験", emoji: "🏺" },
    { label: "ものづくり・陶芸", emoji: "🎨" },
    { label: "染め・織り・漆器", emoji: "🧵" },
  ],
};

// interests配列からおすすめスポットIDを返す（重複除去・最大10件）
export function getRecommendedSpotIds(interests: string[]): number[] {
  const ids = new Set<number>();
  interests.forEach(interest => {
    (INTEREST_SPOT_MAP[interest] || []).forEach(id => ids.add(id));
  });
  // 足りない場合は人気スポットで補完
  if (ids.size < 5) {
    [1, 3, 5, 6, 10, 13, 14, 16, 18, 20].forEach(id => ids.add(id));
  }
  return Array.from(ids).slice(0, 10);
}

// 東北・伝統文化体験スポットデータ
export const recommendedSpots: Spot[] = [
  // ── 伝統芸能・踊り・祭り ──────────────────────────────────────
  {
    id: 1,
    name: "青森ねぶた祭（跳ね人参加）",
    lat: 40.8246,
    lng: 140.7401,
    description: "毎年8月2〜7日に開催される青森を代表する夏祭り。巨大な武者絵の山車「ねぶた」が夜の街を練り歩く中、「ラッセラー」のかけ声とともに跳ね人として踊りに参加できます。江戸時代の七夕行事が起源とされ、国の重要無形民俗文化財にも指定されています。",
    category: "伝統芸能",
    reviews: [
      { author: "festival_lover", rating: 5, comment: "跳ね人として参加しました。沿道の声援と熱気が最高でした。", date: "2025-08-05" },
      { author: "tohoku_travel", rating: 5, comment: "ねぶたの迫力は圧倒的。参加できて一生の思い出になりました。", date: "2024-08-03" },
      { author: "aomori_fan", rating: 4, comment: "衣装を借りて踊りました。地元の方が優しく教えてくれました。", date: "2024-08-06" },
    ],
    infos: [
      { type: "hours",      label: "開催期間",  value: "毎年8月2日〜7日（跳ね人参加は前夜祭以外の日程）" },
      { type: "address",    label: "住所",      value: "青森県青森市（市内中心部・ねぶた大通り周辺）" },
      { type: "price",      label: "参加費",    value: "跳ね人参加：有料（ハネト衣装レンタル含む団体プランあり）" },
      { type: "access",     label: "アクセス",  value: "JR青森駅から徒歩約10分" },
      { type: "website",    label: "公式サイト", value: "https://www.nebuta.or.jp/" },
      { type: "reservation", label: "参加予約", value: "跳ね人参加は主催団体への事前申し込みが必要な場合あり" },
    ],
  },
  {
    id: 2,
    name: "黒石よされ（飛び入り参加）",
    lat: 40.6448,
    lng: 140.5940,
    description: "青森県黒石市に伝わる盆踊り。国の重要無形民俗文化財に指定されており、毎年8月に開催されます。独特の節回しと衣装が特徴で、輪踊りへの飛び入り参加が可能。「よされ節」「甚句」「大の坂」の三段踊りが伝統として受け継がれています。",
    category: "伝統芸能",
    reviews: [
      { author: "dance_japan", rating: 5, comment: "地元の方に混ざって踊れました。300年以上続く踊りに感動。", date: "2025-08-14" },
      { author: "folk_art_fan", rating: 4, comment: "飛び入りしやすい雰囲気で、外国人でも温かく迎えてもらえました。", date: "2024-08-15" },
      { author: "aomori_culture", rating: 5, comment: "本物の民俗芸能を体で感じました。", date: "2024-08-13" },
    ],
    infos: [
      { type: "hours",      label: "開催期間",  value: "毎年8月中旬（よされ踊り流し：夜間）" },
      { type: "address",    label: "住所",      value: "青森県黒石市（中町こみせ通り周辺）" },
      { type: "price",      label: "参加費",    value: "観覧・飛び入り参加無料" },
      { type: "access",     label: "アクセス",  value: "弘南鉄道黒石駅から徒歩約5分" },
      { type: "website",    label: "公式サイト", value: "https://kuroishi.or.jp/" },
    ],
  },
  {
    id: 3,
    name: "盛岡さんさ踊り（参加型）",
    lat: 39.7036,
    lng: 141.1527,
    description: "岩手県盛岡市の夏祭り。毎年8月1〜4日に開催され、太鼓と踊りの祭典として世界一の太鼓パレードとしてギネス世界記録に認定されています。一般参加の「市民踊り連」として誰でも参加可能。約300年前から伝わるとされる伝統的な踊りで、南部藩の鬼退治伝説が起源です。",
    category: "伝統芸能",
    reviews: [
      { author: "sansa_dancer", rating: 5, comment: "市民踊り連に参加しました。練習会から参加できて、本番は最高の体験でした。", date: "2025-08-02" },
      { author: "iwate_trip", rating: 5, comment: "太鼓の音が体に響きます。ギネス認定の迫力を肌で感じました。", date: "2024-08-03" },
      { author: "morioka_visit", rating: 4, comment: "飛び入り参加枠もあり、観光客も一緒に踊れました。", date: "2024-08-04" },
    ],
    infos: [
      { type: "hours",      label: "開催期間",  value: "毎年8月1日〜4日（18:00〜21:00頃）" },
      { type: "address",    label: "住所",      value: "岩手県盛岡市（中央通・肴町周辺）" },
      { type: "price",      label: "参加費",    value: "市民踊り連参加：無料（事前登録制）" },
      { type: "access",     label: "アクセス",  value: "JR盛岡駅から徒歩約15分" },
      { type: "website",    label: "公式サイト", value: "https://www.sansa.ne.jp/" },
      { type: "reservation", label: "参加予約", value: "市民踊り連への事前登録が必要。公式サイトから申込可能" },
    ],
  },
  {
    id: 4,
    name: "鬼剣舞（体験ワークショップ）",
    lat: 39.2833,
    lng: 141.1132,
    description: "岩手県北上市に伝わる国重要無形民俗文化財の仮面舞踊。約1300年前、仏教伝来とともに生まれたとされ、鬼の面をつけた舞い手が念仏を唱えながら勇壮に舞います。北上市では体験ワークショップが開催されており、実際に面をつけて基本的な動きを学べます。",
    category: "伝統芸能",
    reviews: [
      { author: "traditional_arts", rating: 5, comment: "鬼の面をつけて舞いを体験。1300年の伝統の重みを感じました。", date: "2025-06-20" },
      { author: "folk_dance_fan", rating: 4, comment: "指導者の方が丁寧に教えてくれます。仏教的な意味合いも学べました。", date: "2024-09-15" },
      { author: "iwate_culture", rating: 5, comment: "他では絶対体験できない本物の芸能。忘れられない体験です。", date: "2024-07-08" },
    ],
    infos: [
      { type: "hours",      label: "体験時間",  value: "不定期開催（要事前確認）" },
      { type: "address",    label: "住所",      value: "岩手県北上市（北上市立鬼の館 周辺）" },
      { type: "phone",      label: "電話番号",  value: "0197-63-5588（北上市立鬼の館）" },
      { type: "price",      label: "体験料",    value: "ワークショップにより異なる（要確認）" },
      { type: "parking",    label: "駐車場",    value: "あり（無料）" },
      { type: "access",     label: "アクセス",  value: "JR北上駅からバスまたはタクシーで約15分" },
      { type: "website",    label: "公式サイト", value: "https://www.oninoyakata.jp/" },
      { type: "reservation", label: "体験予約", value: "事前予約推奨。電話またはWebにて" },
    ],
  },
  {
    id: 5,
    name: "仙台すずめ踊り（参加型）",
    lat: 38.2682,
    lng: 140.8694,
    description: "仙台城築城の際に踊り出した石工たちの踊りが起源とされる、宮城・仙台の伝統芸能。スズメが羽ばたく姿をモチーフにした軽快な踊りで、仙台七夕まつり期間中に市内各所で披露されます。多くの踊り連が一般参加者を歓迎しており、当日飛び入り参加も可能です。",
    category: "伝統芸能",
    reviews: [
      { author: "sendai_dance", rating: 4, comment: "地元の踊り連に飛び入り参加しました。リズムが楽しくてすぐ覚えられます。", date: "2025-08-07" },
      { author: "miyagi_trip", rating: 4, comment: "仙台の人たちの誇りが感じられる踊りです。", date: "2024-08-06" },
      { author: "folk_culture", rating: 5, comment: "400年の歴史ある踊りを一緒に踊れたことが感動的でした。", date: "2024-08-08" },
    ],
    infos: [
      { type: "hours",      label: "開催期間",  value: "主に8月（仙台七夕期間中）・春祭りなど年数回" },
      { type: "address",    label: "住所",      value: "宮城県仙台市青葉区（勾当台公園・定禅寺通周辺）" },
      { type: "price",      label: "参加費",    value: "無料（飛び入り参加可）" },
      { type: "access",     label: "アクセス",  value: "地下鉄勾当台公園駅から徒歩すぐ" },
      { type: "website",    label: "公式サイト", value: "https://www.suzumeoddori.com/" },
    ],
  },
  {
    id: 6,
    name: "秋田竿燈まつり（竿燈体験）",
    lat: 39.7200,
    lng: 140.1024,
    description: "毎年8月3〜6日に開催される秋田を代表する夏祭り。稲穂に見立てた提灯の灯る竿燈を、額・肩・腰・手のひらで操る妙技は江戸時代から続く伝統芸。翌朝の「竿燈妙技大会」では実際に竿燈を操る体験コーナーが設けられ、観光客でも挑戦できます。",
    category: "伝統芸能",
    reviews: [
      { author: "kanto_experience", rating: 5, comment: "体験コーナーで実際に持ってみたら全然バランスが取れない！職人技の凄さがよくわかりました。", date: "2025-08-04" },
      { author: "akita_festival", rating: 5, comment: "夜の本番は幻想的で息をのむ美しさ。体験も含めて最高の一日でした。", date: "2024-08-05" },
      { author: "tohoku_summer", rating: 4, comment: "妙技大会の体験コーナーは朝早いですが並ぶ価値あります。", date: "2024-08-06" },
    ],
    infos: [
      { type: "hours",      label: "開催期間",  value: "毎年8月3日〜6日（竿燈夜まつり：19:10〜20:50）" },
      { type: "address",    label: "住所",      value: "秋田県秋田市（竿燈大通り）" },
      { type: "price",      label: "参加費",    value: "竿燈体験コーナー：無料（妙技大会翌朝）" },
      { type: "access",     label: "アクセス",  value: "JR秋田駅から徒歩約10分" },
      { type: "website",    label: "公式サイト", value: "https://www.kantou.gr.jp/" },
    ],
  },
  {
    id: 7,
    name: "西馬音内盆踊り（飛び入り参加）",
    lat: 39.2167,
    lng: 140.5167,
    description: "秋田県羽後町に700年以上伝わる日本三大盆踊りの一つ。国の重要無形民俗文化財。編み笠や端縫い衣装をまとった踊り手が独特の足さばきで幽玄に踊る様は「東北一の美しい踊り」とも称されます。踊り手への飛び入り参加が認められており、衣装の貸し出しもあります。",
    category: "伝統芸能",
    reviews: [
      { author: "bon_dance_fan", rating: 5, comment: "700年の歴史を肌で感じました。衣装を借りて踊りに参加できたのが最高の思い出です。", date: "2025-08-22" },
      { author: "akita_culture", rating: 5, comment: "幽玄な踊りに魅了されました。世界に誇れる文化遺産だと思います。", date: "2024-08-23" },
      { author: "japan_folk_art", rating: 4, comment: "地元の方々の踊りへの誇りと情熱が伝わってきます。", date: "2024-08-21" },
    ],
    infos: [
      { type: "hours",      label: "開催期間",  value: "毎年8月16日〜18日（夜間開催）" },
      { type: "address",    label: "住所",      value: "秋田県雄勝郡羽後町西馬音内本町" },
      { type: "price",      label: "参加費",    value: "観覧無料・飛び入り参加無料（衣装レンタルあり）" },
      { type: "access",     label: "アクセス",  value: "JR湯沢駅からバスで約40分" },
      { type: "website",    label: "公式サイト", value: "https://www.nishimonai.com/" },
    ],
  },
  {
    id: 8,
    name: "黒川能（体験・鑑賞）",
    lat: 38.7290,
    lng: 139.8560,
    description: "山形県鶴岡市黒川地区に室町時代から500年以上伝わる農村の能楽。国の重要無形民俗文化財。プロの能楽師ではなく農民が代々受け継いできた点が世界的にも稀有で、「王祇祭」では松明の炎の中で幽玄の世界が繰り広げられます。能楽体験ワークショップも不定期で開催されます。",
    category: "伝統芸能",
    reviews: [
      { author: "noh_experience", rating: 5, comment: "松明の炎に照らされた能舞台は幻想的。農民が500年守り続けた文化の深さに感動しました。", date: "2025-02-02" },
      { author: "yamagata_culture", rating: 5, comment: "能楽体験で所作を教えていただきました。シンプルな動きの難しさと奥深さを体感。", date: "2024-11-03" },
      { author: "traditional_japan", rating: 5, comment: "世界遺産に登録されてもおかしくないレベルの文化財です。", date: "2024-02-01" },
    ],
    infos: [
      { type: "hours",      label: "開催情報",  value: "王祇祭：毎年2月1〜2日。体験ワークショップ：不定期" },
      { type: "address",    label: "住所",      value: "山形県鶴岡市黒川（春日神社）" },
      { type: "phone",      label: "電話番号",  value: "0235-57-2270（黒川能保存会）" },
      { type: "price",      label: "料金",      value: "王祇祭観覧：無料。体験ワークショップ：要確認" },
      { type: "access",     label: "アクセス",  value: "JR鶴岡駅からバスで約30分" },
      { type: "reservation", label: "体験予約", value: "体験ワークショップは事前予約が必要" },
    ],
  },
  {
    id: 9,
    name: "相馬野馬追（観覧・騎馬体験）",
    lat: 37.7910,
    lng: 140.9233,
    description: "福島県相馬地方に平将門の時代から約1000年続く国重要無形民俗文化財の騎馬武者行列。甲冑に身を包んだ数百騎の武者が野原を駆け抜ける「甲冑競馬」「神旗争奪戦」は圧巻。地元の乗馬クラブでは体験乗馬プログラムが提供されており、武者気分を味わえます。",
    category: "伝統芸能",
    reviews: [
      { author: "samurai_culture", rating: 5, comment: "甲冑姿の騎馬武者が走り抜ける光景は映画のよう。1000年の歴史の重みを感じます。", date: "2025-07-27" },
      { author: "fukushima_trip", rating: 4, comment: "体験乗馬も合わせて楽しみました。武者の迫力ある行列は圧巻です。", date: "2024-07-28" },
      { author: "tohoku_culture", rating: 5, comment: "これだけ本格的な武者行列は他では見られません。一生に一度は見るべき。", date: "2024-07-26" },
    ],
    infos: [
      { type: "hours",      label: "開催期間",  value: "毎年7月下旬（3日間開催）" },
      { type: "address",    label: "住所",      value: "福島県南相馬市・相馬市（雲雀ヶ原祭場地）" },
      { type: "phone",      label: "電話番号",  value: "0244-35-2656（相馬野馬追執行委員会）" },
      { type: "price",      label: "観覧料",    value: "無料（一部有料観覧席あり）" },
      { type: "access",     label: "アクセス",  value: "JR原ノ町駅からシャトルバスあり" },
      { type: "website",    label: "公式サイト", value: "https://www.soma-nomaoi.or.jp/" },
    ],
  },

  // ── 伝統工芸・ものづくり体験 ────────────────────────────────────
  {
    id: 10,
    name: "南部鉄器体験（岩鋳鉄器館）",
    lat: 39.7020,
    lng: 141.1441,
    description: "平安時代に盛岡藩主の支援のもと発展した岩手を代表する伝統工芸・南部鉄器。岩鋳鉄器館では実際に鋳物づくりを体験できます。鉄瓶・風鈴・アクセサリーなど様々な作品を自分の手で制作でき、職人の技術と鉄の美しさを間近で学べます。",
    category: "伝統工芸",
    reviews: [
      { author: "craft_maker", rating: 5, comment: "職人さんに教わりながら作った風鈴は最高の土産になりました。", date: "2025-05-10" },
      { author: "iron_art_fan", rating: 4, comment: "鋳物の工程を見学しながら体験できます。南部鉄器の奥深さに驚きました。", date: "2024-09-20" },
      { author: "morioka_craft", rating: 5, comment: "1000年以上続く技術を自分で体験できる貴重な機会です。", date: "2024-06-15" },
    ],
    infos: [
      { type: "hours",      label: "体験受付",  value: "9:00〜17:00（最終受付16:00）" },
      { type: "closedDays", label: "定休日",    value: "年末年始" },
      { type: "address",    label: "住所",      value: "岩手県盛岡市南仙北2丁目23-9" },
      { type: "phone",      label: "電話番号",  value: "019-635-2501" },
      { type: "price",      label: "体験料",    value: "風鈴制作：2,200円〜 / 鉄瓶制作：要問合せ" },
      { type: "parking",    label: "駐車場",    value: "あり（無料）" },
      { type: "access",     label: "アクセス",  value: "JR盛岡駅からバスで約15分" },
      { type: "website",    label: "公式サイト", value: "https://www.iwachu.co.jp/" },
      { type: "reservation", label: "体験予約", value: "事前予約推奨。電話またはWebにて" },
    ],
  },
  {
    id: 11,
    name: "南部菱刺し（刺繍体験）",
    lat: 40.2073,
    lng: 141.3094,
    description: "岩手県二戸地方に江戸時代から伝わる伝統刺繍「南部菱刺し」。木綿の布に幾何学的な菱形文様を刺繍するもので、もともとは農民の女性たちが衣類を補強するために施したのが始まりです。現在は体験教室で誰でも学ぶことができ、コースターやポーチなどを制作できます。",
    category: "伝統工芸",
    reviews: [
      { author: "embroidery_fan", rating: 4, comment: "細かい作業ですが、完成したときの達成感は格別です。", date: "2025-04-18" },
      { author: "ninohe_craft", rating: 5, comment: "江戸時代の農民女性が生み出した文様の美しさに感動しました。", date: "2024-10-05" },
      { author: "needle_art", rating: 4, comment: "丁寧な指導で初心者でも楽しめます。コースターが完成しました。", date: "2024-07-22" },
    ],
    infos: [
      { type: "hours",      label: "体験時間",  value: "要事前予約（各教室による）" },
      { type: "address",    label: "住所",      value: "岩手県二戸市（二戸市立図書館・各工芸教室）" },
      { type: "phone",      label: "電話番号",  value: "0195-23-3000（二戸市観光協会）" },
      { type: "price",      label: "体験料",    value: "2,000〜3,000円程度（材料費込み）" },
      { type: "access",     label: "アクセス",  value: "IGRいわて銀河鉄道二戸駅から徒歩またはタクシー" },
      { type: "reservation", label: "体験予約", value: "事前予約必須。観光協会を通じて申込可能" },
    ],
  },
  {
    id: 12,
    name: "南部裂き織り体験",
    lat: 39.9500,
    lng: 141.1167,
    description: "岩手県に伝わる「裂き織り」は、古い布を細く裂いて横糸として織り込む伝統的な織物技法。江戸時代のもったいない精神から生まれたもので、使い古した着物や布が美しい布地へと生まれ変わります。岩手各地の工房で体験教室が開催されており、コースターやテーブルランナーを制作できます。",
    category: "伝統工芸",
    reviews: [
      { author: "weaving_art", rating: 4, comment: "古布を使って新しいものを作る感覚が面白い。江戸時代の知恵を体感できます。", date: "2025-03-12" },
      { author: "iwate_craft", rating: 5, comment: "リズムよく織れると楽しくなります。完成品は実際に使えて嬉しい。", date: "2024-11-08" },
      { author: "textile_lover", rating: 4, comment: "体験時間は約1〜2時間。集中して取り組める良い体験でした。", date: "2024-06-30" },
    ],
    infos: [
      { type: "hours",      label: "体験時間",  value: "各工房により異なる（要事前確認）" },
      { type: "address",    label: "住所",      value: "岩手県各地（盛岡・花巻・遠野地域の工芸工房）" },
      { type: "phone",      label: "電話番号",  value: "019-651-1111（岩手県観光協会）" },
      { type: "price",      label: "体験料",    value: "1,500〜3,000円程度（工房により異なる）" },
      { type: "access",     label: "アクセス",  value: "各工房へ直接お問い合わせください" },
      { type: "reservation", label: "体験予約", value: "事前予約が必要な場合が多い。各工房に直接連絡を" },
    ],
  },
  {
    id: 13,
    name: "こけし絵付け体験（鳴子温泉郷）",
    lat: 38.7361,
    lng: 140.7283,
    description: "江戸時代末期に東北の温泉地で生まれた木製人形・こけし。宮城県鳴子地区は日本最大のこけし産地で、独特の工人文化が今も息づいています。鳴子では工人の工房を訪ね、実際にろくろ引きや絵付けを体験できます。各工人が代々受け継ぐ文様と色使いは、職人の個性の表れです。",
    category: "伝統工芸",
    reviews: [
      { author: "kokeshi_fan", rating: 5, comment: "工人の方が手作りした白木に自分で絵付け。世界に一つだけのこけしができました。", date: "2025-05-22" },
      { author: "naruko_visit", rating: 4, comment: "何種類もの絵具から自分で色を選べます。子どもも大人も楽しめます。", date: "2024-08-17" },
      { author: "miyagi_craft", rating: 5, comment: "江戸時代から続く工人文化を直接体験できる貴重な場所です。", date: "2024-04-29" },
    ],
    infos: [
      { type: "hours",      label: "体験時間",  value: "9:00〜16:00（工房により異なる）" },
      { type: "closedDays", label: "定休日",    value: "不定休（各工房による）" },
      { type: "address",    label: "住所",      value: "宮城県大崎市鳴子温泉（鳴子温泉郷各工房）" },
      { type: "phone",      label: "電話番号",  value: "0229-83-3441（鳴子温泉観光案内所）" },
      { type: "price",      label: "体験料",    value: "絵付け体験：1,000〜2,000円程度" },
      { type: "parking",    label: "駐車場",    value: "各工房に駐車場あり" },
      { type: "access",     label: "アクセス",  value: "JR鳴子温泉駅から徒歩圏内" },
      { type: "reservation", label: "体験予約", value: "当日参加可能な工房もあり。事前確認推奨" },
    ],
  },
  {
    id: 14,
    name: "曲げわっぱ体験（大館）",
    lat: 40.2720,
    lng: 140.5614,
    description: "秋田県大館市に400年以上伝わる伝統工芸・大館曲げわっぱ。秋田杉を薄く曲げて作る木製の弁当箱・器で、国の伝統的工芸品に指定されています。大館では職人の工房で実際の制作工程を見学し、木を曲げる・削る作業を体験できます。木の温かみと香りが印象的な体験です。",
    category: "伝統工芸",
    reviews: [
      { author: "woodcraft_fan", rating: 5, comment: "薄い木を曲げる作業は難しいですが、職人技の一端を体験できます。秋田杉の香りが最高。", date: "2025-06-08" },
      { author: "odate_visit", rating: 4, comment: "完成した小物入れを持ち帰りました。丁寧な指導でとても楽しめました。", date: "2024-10-12" },
      { author: "akita_craft", rating: 5, comment: "400年続く技術の継承に感動。自分で作ったわっぱはお気に入りの一品になりました。", date: "2024-05-19" },
    ],
    infos: [
      { type: "hours",      label: "体験時間",  value: "要事前予約（各工房による）" },
      { type: "address",    label: "住所",      value: "秋田県大館市（各曲げわっぱ工房）" },
      { type: "phone",      label: "電話番号",  value: "0186-42-6215（大館市観光交流施設）" },
      { type: "price",      label: "体験料",    value: "3,000〜5,000円程度（材料費込み）" },
      { type: "parking",    label: "駐車場",    value: "各工房に駐車場あり" },
      { type: "access",     label: "アクセス",  value: "JR大館駅からタクシーまたはバス" },
      { type: "reservation", label: "体験予約", value: "事前予約必須。各工房または観光協会へ" },
    ],
  },
  {
    id: 15,
    name: "樺細工体験（角館）",
    lat: 39.5953,
    lng: 140.5640,
    description: "秋田県仙北市角館に200年以上伝わる国の伝統的工芸品・樺細工。山桜の樹皮を素材に、茶筒・菓子器・アクセサリーなどを作る独特の工芸技法です。日本で角館にしか伝わらない唯一無二の技術で、体験工房では樹皮を貼り付けて小物を作る体験ができます。",
    category: "伝統工芸",
    reviews: [
      { author: "birch_craft", rating: 5, comment: "樹皮を使った工芸は世界でここだけ。手触りと艶感が素晴らしい。", date: "2025-04-25" },
      { author: "kakunodate_trip", rating: 4, comment: "名刺入れを作りました。使うたびに角館を思い出せます。", date: "2024-09-07" },
      { author: "akita_tradition", rating: 5, comment: "200年間受け継がれてきた唯一の技法を体験できる貴重な場所です。", date: "2024-06-14" },
    ],
    infos: [
      { type: "hours",      label: "体験時間",  value: "9:00〜16:00（要事前予約）" },
      { type: "closedDays", label: "定休日",    value: "不定休（要確認）" },
      { type: "address",    label: "住所",      value: "秋田県仙北市角館町（各樺細工工房）" },
      { type: "phone",      label: "電話番号",  value: "0187-54-2700（角館観光協会）" },
      { type: "price",      label: "体験料",    value: "2,000〜4,000円程度（作品による）" },
      { type: "parking",    label: "駐車場",    value: "近隣に有料駐車場あり" },
      { type: "access",     label: "アクセス",  value: "JR角館駅から徒歩約15分" },
      { type: "reservation", label: "体験予約", value: "事前予約推奨" },
    ],
  },
  {
    id: 16,
    name: "津軽塗体験（弘前）",
    lat: 40.6030,
    lng: 140.4641,
    description: "青森県弘前地方に約400年伝わる国の伝統的工芸品・津軽塗。何十回も漆を塗り重ねては研ぎ出す独特の技法で作られ、複雑な文様が生まれます。弘前市内の工房では漆塗りの下地作りや仕上げ磨きなど、制作工程の一部を実際に体験できます。",
    category: "伝統工芸",
    reviews: [
      { author: "lacquer_art", rating: 5, comment: "何十層も重ねた漆を研ぎ出す体験は感動的。気が遠くなるような手間が美しさを生むとわかりました。", date: "2025-07-03" },
      { author: "hirosaki_craft", rating: 4, comment: "箸の仕上げ磨きを体験しました。自分で磨いた箸は特別な一品です。", date: "2024-10-19" },
      { author: "aomori_tradition", rating: 5, comment: "400年の技術の奥深さを少しだけ体感できます。工房の職人さんの丁寧な説明も素晴らしい。", date: "2024-05-28" },
    ],
    infos: [
      { type: "hours",      label: "体験時間",  value: "要事前予約（各工房による）" },
      { type: "address",    label: "住所",      value: "青森県弘前市（弘前市内各漆器工房）" },
      { type: "phone",      label: "電話番号",  value: "0172-35-3131（弘前観光コンベンション協会）" },
      { type: "price",      label: "体験料",    value: "2,000〜5,000円程度（体験内容による）" },
      { type: "parking",    label: "駐車場",    value: "各工房に駐車場あり" },
      { type: "access",     label: "アクセス",  value: "JR弘前駅からバスまたはタクシー" },
      { type: "reservation", label: "体験予約", value: "事前予約必須。各工房に直接連絡を" },
    ],
  },
  {
    id: 17,
    name: "天童将棋駒製作体験",
    lat: 38.3619,
    lng: 140.3773,
    description: "山形県天童市は全国の将棋駒の95%以上を生産する将棋駒の聖地。江戸時代に天童藩が財政難の藩士に内職として奨励したのが始まりで、今も職人が一つ一つ手彫り・手書きで制作しています。天童市では将棋駒への文字書き（書き駒）体験や、彫り駒の彫刻体験ができます。",
    category: "伝統工芸",
    reviews: [
      { author: "shogi_craft", rating: 4, comment: "将棋駒に筆で文字を書く体験は難しくも楽しい。職人技の凄さをあらためて実感しました。", date: "2025-09-14" },
      { author: "tendo_visit", rating: 4, comment: "自分で書いた駒を持ち帰れます。将棋好きには特別な体験です。", date: "2024-08-25" },
      { author: "yamagata_craft", rating: 5, comment: "全国シェア95%の産地で体験できる貴重な機会。丁寧に教えていただきました。", date: "2024-06-10" },
    ],
    infos: [
      { type: "hours",      label: "体験時間",  value: "9:00〜16:00（要事前予約）" },
      { type: "closedDays", label: "定休日",    value: "月曜日・年末年始" },
      { type: "address",    label: "住所",      value: "山形県天童市（天童市将棋資料館・各工房）" },
      { type: "phone",      label: "電話番号",  value: "023-654-1117（天童市観光情報センター）" },
      { type: "price",      label: "体験料",    value: "書き駒体験：1,000〜2,000円程度" },
      { type: "parking",    label: "駐車場",    value: "あり（無料）" },
      { type: "access",     label: "アクセス",  value: "JR天童駅から徒歩約10分" },
      { type: "reservation", label: "体験予約", value: "事前予約推奨。観光案内所を通じて申込可能" },
    ],
  },
  {
    id: 18,
    name: "会津本郷焼（陶芸体験）",
    lat: 37.5344,
    lng: 139.8291,
    description: "東北最古の焼き物として約400年の歴史を持つ福島県の伝統工芸・会津本郷焼。江戸時代初期に始まり、会津の土と釉薬が生み出す素朴な風合いが特徴です。窯元では電動ろくろや手びねりによる陶芸体験ができ、自分だけの茶碗や皿を制作できます。",
    category: "伝統工芸",
    reviews: [
      { author: "pottery_fun", rating: 4, comment: "丁寧に教えていただき、初心者でも楽しめました。完成品が届くのが楽しみです。", date: "2025-07-15" },
      { author: "aizu_craft", rating: 4, comment: "会津ならではの焼物文化を体験できました。土の感触が心地よかったです。", date: "2024-09-28" },
      { author: "tohoku_pottery", rating: 5, comment: "400年続く東北最古の窯元で体験できる贅沢さ。素朴な風合いが大好きになりました。", date: "2024-05-03" },
    ],
    infos: [
      { type: "hours",      label: "体験受付",  value: "9:00〜16:00（要事前予約）" },
      { type: "closedDays", label: "定休日",    value: "不定休（要確認）" },
      { type: "address",    label: "住所",      value: "福島県大沼郡会津美里町字本郷上甲" },
      { type: "phone",      label: "電話番号",  value: "0242-56-3007（会津本郷陶磁器工業協同組合）" },
      { type: "price",      label: "体験料",    value: "陶芸体験：2,000〜3,000円程度（窯元による）" },
      { type: "parking",    label: "駐車場",    value: "各窯元に駐車場あり" },
      { type: "access",     label: "アクセス",  value: "会津若松市内から車で約20分" },
      { type: "reservation", label: "体験予約", value: "事前予約必須。各窯元に直接ご連絡ください。" },
    ],
  },
  {
    id: 19,
    name: "会津漆器（蒔絵体験）",
    lat: 37.4902,
    lng: 139.9300,
    description: "福島県会津若松市に1000年以上伝わる会津漆器。国の伝統的工芸品で、金粉や銀粉を漆で描く「蒔絵」技法が特徴です。会津では蒔絵体験教室が開催されており、箸・お盆・アクセサリーなどに伝統文様を描く体験ができます。工人の技を間近で見ながら本格的な蒔絵を学べます。",
    category: "伝統工芸",
    reviews: [
      { author: "makie_art", rating: 5, comment: "金粉を使った蒔絵体験は特別感があります。繊細な作業ですが職人さんが丁寧に指導してくれました。", date: "2025-10-02" },
      { author: "aizu_lacquer", rating: 4, comment: "1000年以上続く技術の一端を体験できます。完成した箸は大切に使っています。", date: "2024-11-15" },
      { author: "fukushima_craft", rating: 5, comment: "会津の漆器文化の深さを体感。蒔絵の細かさと美しさに魅了されました。", date: "2024-07-20" },
    ],
    infos: [
      { type: "hours",      label: "体験時間",  value: "要事前予約（各工房・体験施設による）" },
      { type: "address",    label: "住所",      value: "福島県会津若松市（漆器工房・体験施設各所）" },
      { type: "phone",      label: "電話番号",  value: "0242-27-2917（会津若松市観光課）" },
      { type: "price",      label: "体験料",    value: "2,000〜4,000円程度（作品により異なる）" },
      { type: "parking",    label: "駐車場",    value: "各施設に駐車場あり" },
      { type: "access",     label: "アクセス",  value: "JR会津若松駅からバスで約10分" },
      { type: "reservation", label: "体験予約", value: "事前予約が必要。観光協会を通じて申込可能" },
    ],
  },
  {
    id: 20,
    name: "仙台箪笥（指物体験）",
    lat: 38.2609,
    lng: 140.8824,
    description: "宮城県仙台市に江戸時代から伝わる国の伝統的工芸品・仙台箪笥。ケヤキ材を使い、精巧な指物（くぎを使わず木を組む技法）と金具装飾が特徴の家具工芸です。仙台市内の工房では指物の基本技法を学び、小物入れや箸箱などを制作する体験教室が開催されています。",
    category: "伝統工芸",
    reviews: [
      { author: "woodwork_japan", rating: 5, comment: "釘を使わず木だけで組む指物技法は驚異的。職人さんの技術への尊敬が深まりました。", date: "2025-08-30" },
      { author: "sendai_craft", rating: 4, comment: "江戸時代から続く技法を体験できます。難しいですが出来上がった時の喜びは格別です。", date: "2024-09-22" },
      { author: "miyagi_tradition", rating: 4, comment: "仙台の伝統工芸を直接体験できる貴重な機会。土産物として販売されていない本物の技を学べます。", date: "2024-04-11" },
    ],
    infos: [
      { type: "hours",      label: "体験時間",  value: "要事前予約（各工房による）" },
      { type: "address",    label: "住所",      value: "宮城県仙台市（仙台箪笥工房・各職人工房）" },
      { type: "phone",      label: "電話番号",  value: "022-224-1111（仙台市観光情報センター）" },
      { type: "price",      label: "体験料",    value: "3,000〜6,000円程度（体験内容による）" },
      { type: "parking",    label: "駐車場",    value: "近隣に有料駐車場あり" },
      { type: "access",     label: "アクセス",  value: "JR仙台駅からバスまたはタクシー" },
      { type: "reservation", label: "体験予約", value: "事前予約必須。工房に直接お問い合わせください" },
    ],
  },
];
