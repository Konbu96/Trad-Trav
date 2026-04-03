export const TRADITIONAL_GENRES = [
  {
    id: "performing",
    label: "伝統芸能",
    emoji: "🎭",
    heading: "受け継がれてきた芸能にふれる",
    description: "踊りや神楽、演舞など、人が演じる文化を体験する。",
  },
  {
    id: "festival",
    label: "祭り・行事",
    emoji: "🏮",
    heading: "地域に息づく祭礼や年中行事",
    description: "祭りや地域行事に参加したり、手を動かして行事文化を体験する。",
  },
  {
    id: "craft",
    label: "工芸・手しごと",
    emoji: "🏺",
    heading: "手を動かして学ぶものづくり",
    description: "こけし、木工、漆、箪笥など、手しごとの魅力を体験する。",
  },
  {
    id: "history",
    label: "歴史・郷土文化",
    emoji: "🏛️",
    heading: "地域の歴史や暮らしを知る",
    description: "展示や資料を通して、宮城の歴史や生活文化の背景を学ぶ。",
  },
] as const;

export type TraditionalGenreId = (typeof TRADITIONAL_GENRES)[number]["id"];

export type CuratedTraditionalPlace = {
  placeId: string;
  fallbackName: string;
  summary: string;
  experienceTitle?: string;
  officialSourceUrl?: string;
};

export const CURATED_TRADITIONAL_PLACES: Record<TraditionalGenreId, CuratedTraditionalPlace[]> = {
  performing: [
    {
      placeId: "ChIJ39CMxQEDiV8R7MPCYvlJl50",
      fallbackName: "伝統芸能伝承館 森舞台",
      summary: "登米に受け継がれてきた能や伝統芸能の背景にふれられる施設です。",
      experienceTitle: "登米能",
      officialSourceUrl: "https://www.miyagi-kankou.or.jp/kyouiku/taiken/tk5/277",
    },
    {
      placeId: "ChIJT_9iNM4pil8RJT9kWq0zcZE",
      fallbackName: "青葉山公園 仙臺緑彩館",
      summary: "仙台市の民俗芸能体験会などが行われる、伝統芸能に出会える拠点です。",
      experienceTitle: "民俗芸能",
      officialSourceUrl: "https://www.city.sendai.jp/bunkazai-kanri/kamiyagari_kenbai2.html",
    },
    {
      placeId: "ChIJhQlt_w0nil8RNWLGif7CaWc",
      fallbackName: "仙台市若林区六郷市民センター",
      summary: "仙台すずめ踊りの練習や地域活動につながる、参加型の芸能体験候補です。",
      experienceTitle: "すずめ踊り",
      officialSourceUrl: "https://65suzume-hp.com/",
    },
  ],
  festival: [
    {
      placeId: "ChIJ07XIHyYoil8Rq61cM2sFqAw",
      fallbackName: "仙台青葉まつり協賛会",
      summary: "仙台の代表的な祭りに参加し、すずめ踊りや武者行列などの行事文化にふれられます。",
      experienceTitle: "仙台・青葉まつり",
      officialSourceUrl: "https://www.aoba-matsuri.com/entry/",
    },
    {
      placeId: "ChIJH9bJV3Apil8Ro7uiKsbEheE",
      fallbackName: "仙台七夕まつり",
      summary: "七夕和紙を使ったワークショップなどを通して、仙台七夕の行事文化を体験できます。",
      experienceTitle: "仙台七夕和紙クラフト",
      officialSourceUrl: "https://www.sendaitanabata.com/event/1978/",
    },
    {
      placeId: "ChIJe04wJycoil8R3VNW4x9C6dc",
      fallbackName: "みちのくよさこいまつり事務局",
      summary: "衣装体験や総踊り体験を通して、祭りの一体感を味わえる参加型イベントです。",
      experienceTitle: "YOSAKOI総踊り",
      officialSourceUrl: "https://michinoku-yosakoi.net/data",
    },
    {
      placeId: "ChIJWbYjOPaHiV8RAT8lfcUoKfk",
      fallbackName: "榴岡公園",
      summary: "地域参加やボランティア募集のある、宮城野区の手づくりの祭り会場です。",
      experienceTitle: "みやぎの・まつり",
      officialSourceUrl: "https://www.city.sendai.jp/miyagino-katsudo/miyaginoku/machizukuri/kyogikai/miyaginomatsuri.html",
    },
  ],
  craft: [
    {
      placeId: "ChIJ33MHEkI4iV8RUiv69QxSqec",
      fallbackName: "日本こけし館",
      summary: "宮城伝統こけしの歴史や制作文化にふれられる代表的な施設です。",
      experienceTitle: "こけし絵付け",
      officialSourceUrl: "https://www.pref.miyagi.jp/soshiki/shinsan/01kokesi.html",
    },
    {
      placeId: "ChIJITXec_83il8Rb8xkdKypCWI",
      fallbackName: "みやぎ蔵王こけし館",
      summary: "遠刈田系こけしを中心に、宮城の伝統こけし文化を学べる施設です。",
      experienceTitle: "こけし絵付け",
      officialSourceUrl: "https://www.pref.miyagi.jp/soshiki/shinsan/01kokesi.html",
    },
    {
      placeId: "ChIJU7rK9yQoil8Rr6RHaZ40NzI",
      fallbackName: "仙臺箪笥歴史工芸館",
      summary: "仙台箪笥の歴史や製作工程を知ることができる伝統工芸の拠点です。",
      officialSourceUrl: "https://www.pref.miyagi.jp/soshiki/shinsan/18tansu.html",
    },
    {
      placeId: "ChIJqdpTltCtiV8RyhaEjiERcQ0",
      fallbackName: "雄勝硯伝統産業会館",
      summary: "雄勝硯の産地文化とものづくりの背景を学べる伝統工芸施設です。",
      experienceTitle: "雄勝硯の見学",
      officialSourceUrl: "https://www.pref.miyagi.jp/soshiki/shinsan/02suzuri.html",
    },
    {
      placeId: "ChIJFyM_uykoil8Rw9L1WtsM3-0",
      fallbackName: "東北工芸製作所 玉虫塗総本舗",
      summary: "玉虫塗の技法や魅力にふれられる、宮城の伝統工芸の拠点です。",
      experienceTitle: "玉虫塗の名入れ蒔絵",
      officialSourceUrl: "http://www.pref.miyagi.jp/soshiki/shinsan/16tamamusi.html",
    },
  ],
  history: [
    {
      placeId: "ChIJZ1RGBOyFiV8RlXhl315vLDM",
      fallbackName: "東北歴史博物館",
      summary: "宮城を含む東北の歴史文化を総合的に学べる県立の博物館です。",
      officialSourceUrl: "https://www.pref.miyagi.jp/soshiki/rekishi/index.html",
    },
    {
      placeId: "ChIJ_WJmEjUXil8RN--MWZzrEa8",
      fallbackName: "亘理町立郷土資料館",
      summary: "亘理の歴史・民俗・考古資料を通して地域文化を知ることができます。",
      officialSourceUrl: "https://www.town.watari.miyagi.jp/museum/facility/",
    },
    {
      placeId: "ChIJT64B55Vsil8RwW17dvofmqo",
      fallbackName: "角田市郷土資料館（旧氏家邸）",
      summary: "角田の暮らしや歴史を学べる郷土資料館です。",
      officialSourceUrl: "https://www.city.kakuda.lg.jp/soshiki/24/",
    },
    {
      placeId: "ChIJjYom4dwNiV8RrmV-9EoFur8",
      fallbackName: "美里町郷土資料館",
      summary: "地域資料を通して宮城の郷土文化を学べる公的施設です。",
    },
  ],
};
