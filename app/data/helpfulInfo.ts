import { MANNER_CATEGORIES, MANNER_ITEMS, type MannerCategoryId } from "./manners";

export type HelpfulTabId = "manner" | "trivia" | "guide";

export interface HelpfulTab {
  id: HelpfulTabId;
  label: string;
}

/** 豆知識タブ vs 旅ガイドタブ（お役立ち内の分割） */
export type HelpfulTopicTabId = "trivia" | "guide";

/** 旅ガイド用の手順ブロック（番号付きステップ表示） */
export type GuideStepBlock = {
  heading: string;
  body: string;
  bullets: string[];
};

export interface HelpfulTopic {
  id: string;
  tabId: HelpfulTopicTabId;
  title: string;
  subtitle: string;
  description: string;
  emoji: string;
  details: string[];
  keywords: string[];
  scenes: string[];
  aiPrompt: string;
  /** ある場合は一覧では畳み、「もっと見る」で全画面の手順ページへ遷移 */
  guideSteps?: GuideStepBlock[];
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
      kind: "mannerItem";
      key: string;
      itemId: string;
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
  { id: "guide", label: "旅ガイド" },
];

/** 豆知識・旅ガイド（`docs/content-sheets/豆知識 - 豆知識.csv` + 予約導線用 `experience-flow` は `tabId: "guide"`） */
export const TIPS_TOPICS: HelpfulTopic[] = [
  {
    id: "tipping-customs",
    tabId: "trivia",
    title: "チップの習慣",
    subtitle: "豆知識",
    description: "日本では基本的にチップの習慣はなく、支払う必要はありません。サービス料は料金に含まれていることが多いです。",
    emoji: "💴",
    details: [
      "チップを渡されると、店員さんが困ってしまいます。",
      "会計は表示された金額だけ支払えば大丈夫です。",
    ],
    keywords: ["チップ", "支払い", "文化"],
    scenes: ["facility"],
    aiPrompt: "チップの習慣について、旅行者向けに短く教えて",
  },
  {
    id: "simple-japanese-phrases",
    tabId: "trivia",
    title: "簡単な日本語",
    subtitle: "豆知識",
    description: "簡単な日本語を使うと喜ばれることが多く、コミュニケーションがスムーズになります。",
    emoji: "💬",
    details: [
      "「ありがとうございます」や「すみません」を使ってみましょう。",
      "うまく話せなくても気持ちは伝わります。",
    ],
    keywords: ["日本語", "会話", "コミュニケーション"],
    scenes: ["walking", "facility"],
    aiPrompt: "簡単な日本語について、旅行者向けに短く教えて",
  },
  {
    id: "convenience-stores",
    tabId: "trivia",
    title: "コンビニ",
    subtitle: "豆知識",
    description: "日本のコンビニは24時間営業が多く、食事や日用品など幅広くそろっています。",
    emoji: "🏪",
    details: [
      "食べ物や飲み物を手軽に購入できます。",
      "ATMやチケットサービスも利用できます。",
    ],
    keywords: ["コンビニ", "買い物", "便利"],
    scenes: ["facility", "walking"],
    aiPrompt: "コンビニについて、旅行者向けに短く教えて",
  },
  {
    id: "vending-machines",
    tabId: "trivia",
    title: "自動販売機",
    subtitle: "豆知識",
    description: "日本には多くの自動販売機があり、飲み物などを簡単に購入できます。",
    emoji: "🥤",
    details: [
      "街中でよく見かけます。",
      "現金だけでなく、電子マネーが使えるものもあります。",
    ],
    keywords: ["自販機", "飲み物", "購入"],
    scenes: ["walking"],
    aiPrompt: "自動販売機について、旅行者向けに短く教えて",
  },
  {
    id: "english-support",
    tabId: "trivia",
    title: "英語対応",
    subtitle: "豆知識",
    description: "観光地や駅では英語対応が進んでおり、簡単な英語なら通じることが多いです。",
    emoji: "🌐",
    details: [
      "困ったときは簡単な英語で話してみましょう。",
      "翻訳アプリも便利です。",
    ],
    keywords: ["英語", "対応", "観光"],
    scenes: ["walking", "facility", "museum"],
    aiPrompt: "英語対応について、旅行者向けに短く教えて",
  },
  {
    id: "train-punctuality",
    tabId: "trivia",
    title: "電車の時間",
    subtitle: "豆知識",
    description: "日本の電車は時間に正確で、数分単位で運行されています。",
    emoji: "🚃",
    details: [
      "時間通りに行動すると安心です。",
      "電車が時間に遅れることはほぼほぼです。",
    ],
    keywords: ["電車", "時間", "交通"],
    scenes: ["train", "bus", "walking"],
    aiPrompt: "電車の時間について、旅行者向けに短く教えて",
  },
  {
    id: "cash-payment",
    tabId: "trivia",
    title: "現金の利用",
    subtitle: "豆知識",
    description: "日本では現金を使う場面もまだ多く、カードが使えない店もあります。",
    emoji: "💴",
    details: [
      "ある程度のの現金を持っておくと安心です。",
      "昔ながらの店では現金のみの場合があります。",
    ],
    keywords: ["現金", "支払い", "店舗"],
    scenes: ["facility", "walking"],
    aiPrompt: "現金の利用について、旅行者向けに短く教えて",
  },
  {
    id: "free-water-tea",
    tabId: "trivia",
    title: "無料の水やお茶",
    subtitle: "豆知識",
    description: "多くの店では水やお茶が無料で提供されることがあります。",
    emoji: "🍵",
    details: [
      "注文しなくても出されることがあります。",
      "セルフサービスの場合もあります。",
    ],
    keywords: ["水", "無料", "飲食店"],
    scenes: ["facility"],
    aiPrompt: "無料の水やお茶について、旅行者向けに短く教えて",
  },
  {
    id: "seasonal-enjoyment",
    tabId: "trivia",
    title: "季節の楽しみ",
    subtitle: "豆知識",
    description: "日本では季節ごとに食べ物や行事が変わり、季節感を大切にする文化があります。",
    emoji: "🌸",
    details: [
      "季節限定の商品を探してみましょう。",
      "旬の食べ物を楽しむのもおすすめです。",
    ],
    keywords: ["季節", "文化", "食べ物"],
    scenes: ["walking"],
    aiPrompt: "季節の楽しみについて、旅行者向けに短く教えて",
  },
  {
    id: "four-seasons",
    tabId: "trivia",
    title: "四季の風景",
    subtitle: "豆知識",
    description: "日本では四季がはっきりしており、季節ごとに景色や楽しみ方が変わります。",
    emoji: "🍁",
    details: [
      "春は桜、秋は紅葉が有名です。",
      "季節に合わせて旅行計画を立ててみるといいかもしれません。",
    ],
    keywords: ["四季", "自然", "観光"],
    scenes: ["walking", "facility", "museum"],
    aiPrompt: "四季の風景について、旅行者向けに短く教えて",
  },
  {
    id: "regional-specialties",
    tabId: "trivia",
    title: "地域の名物",
    subtitle: "豆知識",
    description: "日本では地域ごとに名物料理や特産品があり、食文化が豊かです。",
    emoji: "🍜",
    details: [
      "その土地ならではの料理を楽しみましょう。",
      "お土産選びの参考にもなります。",
    ],
    keywords: ["名物", "料理", "地域"],
    scenes: ["facility"],
    aiPrompt: "地域の名物について、旅行者向けに短く教えて",
  },
  {
    id: "menu-photos",
    tabId: "trivia",
    title: "メニューの工夫",
    subtitle: "豆知識",
    description: "日本では飲食店のメニューに写真やサンプルがあり、注文しやすい工夫がされています。",
    emoji: "📋",
    details: [
      "写真を見て選ぶことができます。",
      "指差しでも注文できます。",
    ],
    keywords: ["メニュー", "写真", "注文"],
    scenes: ["facility"],
    aiPrompt: "メニューの工夫について、旅行者向けに短く教えて",
  },
  {
    id: "toilets-japan",
    tabId: "trivia",
    title: "トイレの設備",
    subtitle: "豆知識",
    description: "日本のトイレは清潔で設備が整っていることが多いです。",
    emoji: "🚻",
    details: [
      "公共施設でもきれいなことが多いです。",
      "使い方の案内を確認しましょう。",
    ],
    keywords: ["トイレ", "設備", "清潔"],
    scenes: ["walking"],
    aiPrompt: "トイレの設備について、旅行者向けに短く教えて",
  },
  {
    id: "onsen-bathing",
    tabId: "trivia",
    title: "温泉の入り方",
    subtitle: "豆知識",
    description: "温泉や銭湯では裸で入るのが一般的です。",
    emoji: "♨️",
    details: [
      "水着は着用しません。",
      "最初は戸惑っても問題ありません。",
    ],
    keywords: ["温泉", "入浴", "文化"],
    scenes: ["workshop", "craft", "facility"],
    aiPrompt: "温泉の入り方について、旅行者向けに短く教えて",
  },
  {
    id: "shoes-off-indoors",
    tabId: "trivia",
    title: "靴を脱ぐ文化",
    subtitle: "豆知識",
    description: "日本では靴を脱ぐ場所が多く、室内では靴を履きません。",
    emoji: "👟",
    details: [
      "玄関で靴を脱ぎましょう。",
      "スリッパが用意されていることもあります。",
    ],
    keywords: ["靴", "室内", "習慣"],
    scenes: ["facility"],
    aiPrompt: "靴を脱ぐ文化について、旅行者向けに短く教えて",
  },
  {
    id: "oshibori",
    tabId: "trivia",
    title: "おしぼり",
    subtitle: "豆知識",
    description: "多くの飲食店ではおしぼりが提供されます。",
    emoji: "🧻",
    details: [
      "基本は手を拭くために使いましょう。",
    ],
    keywords: ["おしぼり", "飲食店", "マナー"],
    scenes: ["facility"],
    aiPrompt: "おしぼりについて、旅行者向けに短く教えて",
  },
  {
    id: "service-politeness",
    tabId: "trivia",
    title: "サービスの丁寧さ",
    subtitle: "豆知識",
    description: "日本のサービスは丁寧で、店員の対応がとても親切です。",
    emoji: "🙏",
    details: [
      "特別なお礼は必要ありません。",
      "笑顔で「ありがとうございます」と返すとよいです。",
    ],
    keywords: ["サービス", "接客", "日本"],
    scenes: ["facility"],
    aiPrompt: "サービスの丁寧さについて、旅行者向けに短く教えて",
  },
  {
    id: "product-quality",
    tabId: "trivia",
    title: "商品の品質",
    subtitle: "豆知識",
    description: "日本では商品の品質が高く、安心して購入できることが多いです。",
    emoji: "✨",
    details: [
      "食品も安心して選べます。",
      "表示を確認するとより安心です。",
      "アレルギーがある場合は、遠慮せずに店員さんに聞いてみましょう。",
    ],
    keywords: ["品質", "買い物", "安心"],
    scenes: ["facility", "walking"],
    aiPrompt: "商品の品質について、旅行者向けに短く教えて",
  },
  {
    id: "ic-card-transport",
    tabId: "trivia",
    title: "ICカード",
    subtitle: "豆知識",
    description: "日本では交通系ICカードを使うと電車やバスの支払いが簡単になります。",
    emoji: "💳",
    details: [
      "ICカードを作ると移動がスムーズです。",
      "コンビニなどでも使えることがあります。",
    ],
    keywords: ["ICカード", "交通", "支払い"],
    scenes: ["train", "bus", "walking"],
    aiPrompt: "ICカードについて、旅行者向けに短く教えて",
  },
  {
    id: "asking-for-help",
    tabId: "trivia",
    title: "困ったときの対処",
    subtitle: "豆知識",
    description: "分からないことがあったときは、周りの人に聞いても大丈夫です。親切に教えてくれることが多いです。",
    emoji: "❓",
    details: [
      "困ったときは無理せず聞いてみましょう。",
      "通行人より店員さんに聞くと安心です。",
    ],
    keywords: ["質問", "サポート", "安心"],
    scenes: ["facility", "walking"],
    aiPrompt: "困ったときの対処について、旅行者向けに短く教えて",
  },
  {
    id: "dining-reservation-guide",
    tabId: "guide",
    title: "予約のガイド",
    subtitle: "旅ガイド",
    description:
      "レストランや体験、見学など、施設やお店によって予約の要否が変わります。迷ったときの確認から当日の受付まで、流れをステップで整理しました。",
    emoji: "📅",
    details: [],
    keywords: ["予約", "レストラン", "体験", "施設", "ホテル", "英語"],
    scenes: ["facility", "walking", "reservation"],
    aiPrompt: "日本で施設やお店の予約をするときのコツについて、旅行者向けに短く教えて",
    guideSteps: [
      {
        heading: "予約が必要か確認する",
        body: "人気のお店・体験・見学など、週末や夜の枠は予約が必要なことが多いです。昼の枠やカフェなど、当日受付だけの場合もあります。",
        bullets: ["迷ったら予約しておくと安心です。", "Googleマップや公式サイトで混雑や受付方法を確認しましょう。"],
      },
      {
        heading: "英語対応の予約方法を使う",
        body: "日本語が不安な場合は、英語表記の予約ページや英語対応のチャネルを選ぶとスムーズです。",
        bullets: ["予約サイトやGoogle予約、英語の公式予約を使いましょう。", "案内やメニューに英語がある施設を選ぶと安心です。"],
      },
      {
        heading: "ホテルに予約を頼む",
        body: "ホテルのフロントでは、近くのお店や体験施設の予約を代行してくれることがあります。",
        bullets: ["フロントでお願いしてみましょう。", "施設名・店名と希望日時を伝えるとスムーズです。"],
      },
      {
        heading: "電話予約しかない場合の対応",
        body: "電話のみの施設・店もありますが、無理に自分で電話する必要はありません。",
        bullets: ["ホテルスタッフに頼むと安心です。", "窓口に直接行って予約・当日券を確認することもできます。"],
      },
      {
        heading: "当日の対応",
        body: "受付や入り口で予約していることを伝えます。名前で確認されることが多いです。",
        bullets: ["「I have a reservation」と伝えてみましょう。", "名前を聞かれたら予約名を伝えましょう。"],
      },
    ],
  },
  {
    id: "payment-guide",
    tabId: "guide",
    title: "支払いのガイド",
    subtitle: "旅ガイド",
    description:
      "コンビニやお店の会計は、レジで店員とやりとりする場面が多いです。身振り手振りでも基本は伝わります。よくある質問への返しかたも整理しました。",
    emoji: "💰",
    details: [],
    keywords: ["支払い", "会計", "レジ", "レシート", "店員", "袋"],
    scenes: ["facility", "walking", "train"],
    aiPrompt: "日本の店で会計するとき、店員とのやりとりのコツについて、旅行者向けに短く教えて",
    guideSteps: [
      {
        heading: "身振り手振りでだいたい伝わります",
        body: "無理に日本語を話さなくても、指さし・頷き・手でバッテン、金額をスマホに打つなどで意図は通じることが多いです。店員の手まねやレジ画面に合わせれば大丈夫です。",
        bullets: ["焦らず、言われた金額や画面をよく見ましょう。", "日本にチップ文化は基本的にありません。"],
      },
      {
        heading: "袋・レシートなどよく聞かれること",
        body: "「袋はいりますか？」「レシートはいりますか？」のように短く聞かれることがあります。ポイントカードやアプリの提示を求められることもあります。",
        bullets: [
          "必要なら「はい」や頷き、不要なら「いいえ」や首を横に・手を振り。英語の \"Yes, please\" / \"No, thank you\" でも通じることが多いです。",
          "ポイントカードを持っていなければ、手を振るかバッテンで「持っていない」旨を伝えれば大丈夫です。",
        ],
      },
      {
        heading: "金額を確認して支払う",
        body: "合計はディスプレーやレジの声かけで分かります。現金はコンビニなどでよく使われるお会計トレーに置き、釣銭もトレーで受け取ります。",
        bullets: ["カードのときはカードを見せるか、カードマークを指さすとスムーズです。", "表示価格は税込であることが多いです。"],
      },
      {
        heading: "伝わらない・聞き返されたら",
        body: "スマホの電卓に金額を打つ、商品を指さす、「receipt」とメモするなど、手段はいくつでも構いません。",
        bullets: ["手のひらを見せて少し待つジェスチャーも使えます。", "行列のときは一旦脇に寄って相談すると周りにも配慮できます。"],
      },
      {
        heading: "現金だけの店や困ったとき",
        body: "小さな店では現金のみのこともあります。少額の円を持ち歩いておくと安心です。",
        bullets: ["ATMは駅・空港・コンビニが多く、場所は駅員やホテルに聞くと早いです。", "海外カードが使えない機械もあるので、事前に両替や引き出しを済ませておきましょう。"],
      },
    ],
  },
  {
    id: "public-transit-guide",
    tabId: "guide",
    title: "交通・切符のガイド",
    subtitle: "旅ガイド",
    description:
      "路線や区間によって少しずつ違いますが、このガイドは電車の切符を買って乗る流れに絞って整理しています。乗り換え検索にはアプリ「Japan Transit Planner」の利用もおすすめです。",
    emoji: "🎫",
    details: [],
    keywords: ["電車", "切符", "運賃", "券売機", "改札", "Japan Transit Planner"],
    scenes: ["train", "walking"],
    aiPrompt: "日本の電車で切符を買い改札を通る流れについて、旅行者向けに短く教えて",
    guideSteps: [
      {
        heading: "行き先と運賃を確認する",
        body: "アプリや駅の路線図で乗り換えとざっくり運賃を把握しておくと安心です。分からなければ駅のみどりの窓口や案内所に聞けます。",
        bullets: [
          "乗り換え・路線検索にはアプリ「Japan Transit Planner」の利用もおすすめです。",
          "Googleマップなどで駅名と路線を確認しましょう。",
          "きっぷうりばで「この駅まで」と紙に書いて見せる方法もあります。",
        ],
      },
      {
        heading: "切符を買う（券売機）",
        body: "画面上部の路線図で運賃を調べ、「きっぷ」から金額を選ぶのが一般的です。英語表示ボタンがある機械も多いです。",
        bullets: ["現金が使える機械が多いです（カード対応は機械によります）。", "おつりと切符を忘れずに受け取りましょう。"],
      },
      {
        heading: "改札を通って乗る",
        body: "乗る駅の改札で切符を入れると、通ったあと改札から切符が戻ってくるので、そのとき必ず取り出してください。降りる駅の改札では同じ切符を入れると回収され、戻ってきません。乗車から降車まで、切符は常に所持しておきましょう。",
        bullets: [
          "戻ってきた切符は財布やパスケースに入れ、紛失しないよう注意しましょう。",
          "乗り越した場合は、降りる駅の「精算機」や駅員の窓口で不足分を支払います。",
          "分からなければ改札付近の駅員に見せながら相談しましょう。",
        ],
      },
      {
        heading: "乗り越しや降りる駅を間違えたら",
        body: "精算機や駅員の窓口で調整できます。無理に改札を出ず、近くの駅員に相談すると安心です。",
        bullets: ["「乗り越しました」と伝えてみましょう。", "きっぷを見せながら伝えるとスムーズです。"],
      },
    ],
  },
  {
    id: "toilet-guide",
    tabId: "guide",
    title: "トイレのガイド",
    subtitle: "旅ガイド",
    description:
      "駅・商業施設・公園などに多く、観光中も比較的見つけやすいです。探し方から設備・マナーまでステップで整理しました。より詳しい案内は JAPAN TOILET INFORMATION（NIPPON UTSUKUSHI TOILET） https://www.sanitary-net.com/utsukushitoilet/ も参照できます。",
    emoji: "🚻",
    details: [],
    keywords: ["トイレ", "駅", "多目的", "ウォシュレット"],
    scenes: ["facility", "train", "walking", "bus"],
    aiPrompt: "日本の公衆トイレの探し方と使い方について、旅行者向けに短く教えて",
    guideSteps: [
      {
        heading: "どこにあるか",
        body: "駅では「トイレ」のピクトサインや案内板を目印にします。商業施設・公園・道の駅などにも多くあります。",
        bullets: ["駅構内のトイレは改札の内外どちらにもあることがあります。", "一部のコンビニは店内トイレの利用を断ることがあります。"],
      },
      {
        heading: "無料・有料・営業時間",
        body: "多くは無料です。高速道路のサービスエリアや観光地などでは有料（100円程度）のことがあります。",
        bullets: ["深夜は駅ビル側が閉まる場合があります。", "多目的トイレは必要な人を優先して使いましょう。"],
      },
      {
        heading: "洋式・和式・多目的トイレ",
        body: "洋式はそのまま座って使います。和式は入口を下げ、フード側を正面にしてしゃがみます（靴を便座に乗せない）。",
        bullets: ["多目的トイレは車いす・おむつ替え・性別に関わらず利用できる個室です。", "迷ったら入口の説明図やピクトを確認しましょう。"],
      },
      {
        heading: "設備とマナー",
        body: "トイレットペーパーは流せます。生理用品などは流さず、個室の専用ゴミ箱へ捨てます。音姫や流水音ボタンは周囲への配慮です。",
        bullets: ["ウォシュレットは便座に座ったまま操作します。", "手洗い後は水滴を流し、使った紙タオルは指定の場所へ。"],
      },
      {
        heading: "持ち歩くと安心なもの",
        body: "一部の公園トイレでは紙がない場合があります。ティッシュやハンカチ、携帯用ハンドソープがあると安心です。",
        bullets: ["乾式（消毒のみ）の手洗い場もあります。", "子ども連れの場合は多目的トイレの位置を先に確認しておくとよいです。"],
      },
    ],
  },
  {
    id: "experience-flow",
    tabId: "guide",
    title: "体験前の流れ",
    subtitle: "予約から当日までの確認",
    description:
      "工芸体験やワークショップは、予約確認と到着前の準備をしておくと当日がかなりスムーズです。",
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
];

/** スポット詳細などから「予約・当日の流れ」ガイドへ遷移するときの `guideDetail` 値 */
export const EXPERIENCE_RESERVATION_GUIDE_DETAIL_KEY = "tips:experience-flow" as const;

const HELPFUL_TOPIC_MAP = new Map<string, HelpfulTopic>(TIPS_TOPICS.map((topic) => [topic.id, topic]));

/** 旧URL `trivia:` / `travel:` 用。`tips:` に正規化する */
export function normalizeGuideDetailKey(detailKey: string): string {
  if (detailKey.startsWith("trivia:") || detailKey.startsWith("travel:")) {
    const id = detailKey.split(":")[1];
    return id ? `tips:${id}` : detailKey;
  }
  return detailKey;
}

/** お役立ちお気に入り用。`manner:` / `mannerItem:` はそのまま、豆知識・旅ガイドのキーは `tips:` に揃える */
export function normalizeHelpfulFavoriteKey(key: string): string {
  const k = key.trim();
  if (k.startsWith("manner:") || k.startsWith("mannerItem:")) return k;
  return normalizeGuideDetailKey(k);
}

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

  return TIPS_TOPICS.filter((topic) => topic.tabId === tabId).map((topic) => ({
    key: `tips:${topic.id}`,
    title: topic.title,
    subtitle: topic.subtitle,
    description: topic.description,
    emoji: topic.emoji,
  }));
}

export function getHelpfulDetail(detailKey: string | null): HelpfulDetail | null {
  if (!detailKey) return null;

  const normalized = normalizeGuideDetailKey(detailKey);
  const colonIdx = normalized.indexOf(":");
  if (colonIdx < 0) return null;
  const kind = normalized.slice(0, colonIdx);
  const id = normalized.slice(colonIdx + 1);
  if (!id) return null;

  if (kind === "mannerItem") {
    const item = MANNER_ITEMS.find((entry) => entry.id === id);
    if (!item) return null;
    const category = MANNER_CATEGORIES.find((c) => c.id === item.categoryId);
    if (!category) return null;
    return {
      kind: "mannerItem",
      key: normalized,
      itemId: item.id,
      title: item.title,
      description: item.shortDescription,
      emoji: category.emoji,
      categoryId: item.categoryId,
    };
  }

  if (kind === "manner") {
    const category = MANNER_CATEGORIES.find((entry) => entry.id === id);
    if (!category) return null;
    return {
      kind: "manner",
      key: normalized,
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
    key: normalized,
    title: topic.title,
    description: topic.description,
    emoji: topic.emoji,
    topic,
  };
}

export function getRecommendedHelpfulTopicsByScenes(scenes: string[], limit: number = 3) {
  const normalizedScenes = Array.from(new Set(scenes.filter(Boolean)));
  const topics = TIPS_TOPICS;

  if (normalizedScenes.length === 0) {
    return [];
  }

  return topics
    .map((topic) => {
      const matchedScenes = topic.scenes.filter((scene) => normalizedScenes.includes(scene)).length;
      let score = matchedScenes * 100;

      if (normalizedScenes.includes("museum") && topic.id === "english-support") score += 18;
      if (normalizedScenes.includes("festival") && topic.id === "seasonal-enjoyment") score += 18;
      if (normalizedScenes.includes("workshop") && topic.id === "experience-flow") score += 24;
      if (normalizedScenes.includes("craft") && topic.id === "onsen-bathing") score += 18;
      if (normalizedScenes.includes("walking") && topic.id === "asking-for-help") score += 12;
      if (normalizedScenes.includes("facility") && topic.id === "dining-reservation-guide") score += 14;
      if (normalizedScenes.includes("reservation") && topic.id === "dining-reservation-guide") score += 20;
      if (normalizedScenes.includes("train") && topic.id === "public-transit-guide") score += 22;
      if (normalizedScenes.includes("facility") && topic.id === "payment-guide") score += 12;
      if (normalizedScenes.includes("train") && topic.id === "payment-guide") score += 8;
      if (normalizedScenes.includes("train") && topic.id === "toilet-guide") score += 10;
      if (normalizedScenes.includes("facility") && topic.id === "toilet-guide") score += 10;

      return { topic, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.topic.title.localeCompare(b.topic.title, "ja"))
    .slice(0, limit)
    .map((entry) => entry.topic);
}
