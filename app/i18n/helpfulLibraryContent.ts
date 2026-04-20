import { sheetTipsTopicsEn, sheetTipsTopicsJa } from "./sheetTipsTopics";

/** お役立ち（マナーカテゴリ・項目・豆知識・旅ガイド）の本文。マナー項目の日本語本文の表示正本は `manners.ts` の `MANNER_ITEMS`（ja UI はそちら優先）。ここ ja の mannerItems は英訳・他言語との並走用のコピー。 */
export const helpfulLibraryJa = {
  mannerCategories: {
    meal: {
      label: "食事",
      description: "いただきます・箸使いなど、食卓や外食のときのマナーです。",
    },
    sightseeing: {
      label: "観光",
      description: "神社・温泉・着物など、観光の場面でのマナーです。",
    },
    mobility: {
      label: "移動",
      description: "電車・エスカレーターなど、移動中のマナーです。",
    },
    daily: {
      label: "生活",
      description: "買い物・公共の場・ゴミなど、日常の場面のマナーです。",
    },
    rules: {
      label: "ルール",
      description: "撮影・喫煙・私有地など、ルールや法律に関する注意です。",
    },
  },
  mannerItems: {
    "meal-before-greeting": {
      title: "食事の前のあいさつ",
      shortDescription:
        "食事の前後に感謝の言葉を伝える文化があります。食べ物や作ってくれた人への気持ちを表すものです。",
      details: ["食前は「いただきます」と言いましょう。", "食後は「ごちそうさまでした」と言いましょう。"],
    },
    "meal-quiet-eating": {
      title: "音を立てすぎない",
      shortDescription: "日本では静かに食事をする人が多く、周囲への配慮が大切にされています。",
      details: [
        "麺以外は音を立てないようにしましょう。",
        "できる限り静かに食べると安心です。",
        "周囲の雰囲気に合わせましょう。",
      ],
    },
    "meal-chopsticks-no-rice-plant": {
      title: "箸を食べ物に刺さない",
      shortDescription: "ご飯に箸を立てる行為は、お葬式などを連想させるため避けられています。",
      details: ["箸はご飯に立てないようにしましょう。", "使わないときは皿や箸置きに置きましょう。"],
    },
    "meal-chopsticks-no-pass": {
      title: "箸で渡さない",
      shortDescription: "箸から箸へ食べ物を渡す行為は、お葬式などの場面を連想させるため避けられています。",
      details: ["箸から箸へ渡さないようにしましょう。", "取り分けるときは一度他のお皿に移すと安心です。"],
    },
    "meal-restaurant-voice-level": {
      title: "店内では大声で話さない",
      shortDescription:
        "日本の飲食店では落ち着いた雰囲気が好まれますが、居酒屋などではにぎやかに過ごすこともあります。",
      details: ["店の雰囲気に合わせて声の大きさを調整しましょう。", "周囲の人の様子を見ると判断しやすいです。"],
    },
    "sightseeing-torii-bow": {
      title: "鳥居の前で一礼",
      shortDescription: "鳥居は神聖な場所への入口とされており、敬意を表す行動が大切にされています。",
      details: ["鳥居の前後で軽くお辞儀をしましょう。"],
    },
    "sightseeing-quiet-shrine": {
      title: "静かに行動する",
      shortDescription: "神社やお寺は静かな空間が大切にされており、落ち着いた行動が求められます。",
      details: ["大声を出さず静かに過ごしましょう。", "写真を撮るときも周囲に配慮しましょう。"],
    },
    "sightseeing-sando-center": {
      title: "参道の中央はなるべく避ける",
      shortDescription: "参道の中央は神様の通り道と考えられており、端を歩く人が多いです。",
      details: [
        "参道の中央はなるべく避けて歩きましょう。",
        "混雑時は無理に避けなくても大丈夫です。",
        "周囲の人の動きに合わせると安心です。",
      ],
    },
    "sightseeing-onsen-wash-first": {
      title: "入る前に体を洗う",
      shortDescription: "温泉は多くの人が共有して使うため、清潔に保つことがとても大切です。",
      details: [
        "入る前に体をしっかり洗いましょう。",
        "シャンプーや石けんは湯船に入る前に済ませましょう。",
        "洗い場は次の人のために軽く流しておきましょう。",
      ],
    },
    "sightseeing-onsen-no-towel-in-bath": {
      title: "タオルを湯船に入れない",
      shortDescription: "湯船の水を清潔に保つため、タオルを入れない習慣があります。",
      details: [
        "タオルは湯船に入れないようにしましょう。",
        "タオル置き場がある場合はそこを使いましょう。",
        "ない場合は濡れないようにし、人の邪魔にならない場所に置きましょう。",
      ],
    },
    "sightseeing-kimono-hem-walk": {
      title: "裾を踏まないように歩く",
      shortDescription: "着物は裾が長く動きにくいため、歩き方に少し注意が必要です。",
      details: ["裾を少し持って汚さないように歩きましょう。", "階段や段差では特に注意しましょう。"],
    },
    "transit-escalator-stand-aside": {
      title: "片側に寄る",
      shortDescription: "エスカレーターでは急ぐ人のために通路を空ける習慣があります。",
      details: ["片側に寄って立ちましょう。", "地域によって違うので周囲に合わせましょう。"],
    },
    "transit-elevator-yield-exit": {
      title: "降りる人を優先",
      shortDescription: "スムーズに移動するため、降りる人を優先するのが一般的です。",
      details: ["降りる人を先に通しましょう。", "ドア付近では少しよけるとスムーズです。"],
    },
    "transit-backpack-front-when-crowded": {
      title: "リュックは前に持つ",
      shortDescription: "混雑時は周囲との距離が近くなるため、荷物の持ち方に配慮が必要です。",
      details: ["混雑時はリュックを前に持ちましょう。", "周囲のスペースに気をつけましょう。"],
    },
    "transit-quiet-on-public-transport": {
      title: "公共の乗り物では静かにする",
      shortDescription: "電車やバスでは静かな環境が保たれており、周囲への配慮が重視されています。",
      details: ["音や声は控えめにしましょう。", "イヤホンの音漏れにも注意しましょう。"],
    },
    "life-no-open-before-payment": {
      title: "会計前の商品は使わない",
      shortDescription: "商品は購入するまで店のものであり、勝手に開封することはできません。",
      details: ["商品は会計前に開けないようにしましょう。"],
    },
    "life-queue-in-line": {
      title: "列に並ぶ",
      shortDescription: "日本では順番を守ることが大切にされており、列に並ぶ文化があります。",
      details: ["列に並んで順番を待ちましょう。", "最後尾の位置を確認すると安心です。"],
    },
    "life-quiet-in-public": {
      title: "公共の場では静かに話す",
      shortDescription: "公共の場では周囲に配慮した行動が求められ、静かに過ごす人が多いです。",
      details: ["声を抑えて話しましょう。", "周囲の人の様子を参考にすると安心です。"],
    },
    "life-phone-avoid-on-train": {
      title: "電車では通話を控える",
      shortDescription: "電車内では静かな環境を保つため、通話は控えることが一般的です。",
      details: ["通話は控えましょう。", "必要な場合は車外やデッキで話しましょう。"],
    },
    "life-trash-take-home": {
      title: "ゴミは持ち帰る",
      shortDescription: "日本ではゴミ箱が少ないため、自分で持ち帰ることが一般的です。",
      details: ["ゴミは持ち帰るようにしましょう。", "小さな袋を用意しておくと便利です。"],
    },
    "life-trash-sort": {
      title: "分別する",
      shortDescription: "ゴミは種類ごとに分けて処理されるため、分別が重要とされています。",
      details: ["ゴミは分別して捨てましょう。", "表示や案内を確認すると分かりやすいです。"],
    },
    "life-discreet-pda": {
      title: "人前でのスキンシップは控えめにする",
      shortDescription: "公共の場では控えめな行動が好まれ、スキンシップも控えめな傾向があります。",
      details: ["スキンシップは控えめにしましょう。"],
    },
    "rule-smoking-designated-only": {
      title: "タバコは指定場所で吸う",
      shortDescription: "喫煙場所は決められていることが多く、ルールを守ることが求められます。",
      details: ["タバコは決められた場所で吸いましょう。", "事前に喫煙所を確認しておくと安心です。"],
    },
    "rule-photo-consent": {
      title: "無断撮影に注意",
      shortDescription: "日本ではプライバシーが重視されており、無断撮影はトラブルになることがあります。",
      details: [
        "人物を撮影する前は一声かけましょう。",
        "店内では周囲のお客さんが写らないように配慮しましょう。",
        "料理等の写真は基本的に問題ないことが多いですが、迷ったら店の案内を確認しましょう。",
      ],
    },
    "rule-no-trespassing": {
      title: "私有地に入らない",
      shortDescription: "土地には所有者がいるため、無断で立ち入ることはできません。",
      details: ["許可なく立ち入らないようにしましょう。", "標識や表示を確認しましょう。"],
    },
    "rule-drinking-age-20": {
      title: "飲酒は年齢制限がある",
      shortDescription: "日本では法律で飲酒できる年齢が定められています。",
      details: ["20歳以上で飲みましょう。", "年齢確認を求められることがあります。"],
    },
    "rule-traffic-signals": {
      title: "信号を守る",
      shortDescription: "交通の安全を守るため、信号を守ることが重要です。",
      details: ["信号を守りましょう。", "徒歩の場合、横断歩道を使うと安全です。"],
    },
    "rule-no-graffiti": {
      title: "落書きをしない",
      shortDescription: "公共物はみんなで使うものであり、きれいに保つ意識が大切です。",
      details: ["落書きはしないようにしましょう。", "公共のものは大切に使いましょう。"],
    },
  },
  topics: {
    ...sheetTipsTopicsJa,
  },
} as const;

export const helpfulLibraryEn = {
  mannerCategories: {
    meal: {
      label: "Dining",
      description: "Table manners for meals out or at the table—greetings, chopsticks, and more.",
    },
    sightseeing: {
      label: "Sightseeing",
      description: "At shrines, hot springs, in kimono, and other travel moments.",
    },
    mobility: {
      label: "Getting around",
      description: "On trains, buses, escalators, and elevators.",
    },
    daily: {
      label: "Daily life",
      description: "Shopping lines, public spaces, trash, and everyday courtesy.",
    },
    rules: {
      label: "Rules",
      description: "Photos, smoking, private land, age limits, and posted rules.",
    },
  },
  mannerItems: {
    "meal-before-greeting": {
      title: "Say itadakimasu and gochisousama",
      shortDescription:
        "Before and after meals, short phrases express thanks to the food and the people who prepared it.",
      details: [
        "Before eating, say “itadakimasu.”",
        "After eating, say “gochisousama deshita.”",
      ],
    },
    "meal-quiet-eating": {
      title: "Keep eating sounds low",
      shortDescription: "Many diners in Japan eat quietly out of consideration for others nearby.",
      details: [
        "Except for noodles, try not to make loud eating sounds.",
        "Eat as quietly as you comfortably can.",
        "Match the noise level to the room.",
      ],
    },
    "meal-chopsticks-no-rice-plant": {
      title: "Do not stick chopsticks upright in rice",
      shortDescription: "Upright chopsticks in rice recall funeral imagery, so people avoid it.",
      details: [
        "Do not stand chopsticks vertically in a bowl of rice.",
        "When not in use, rest them on a chopstick rest or the edge of a plate.",
      ],
    },
    "meal-chopsticks-no-pass": {
      title: "Do not pass food chopstick-to-chopstick",
      shortDescription: "Passing food directly from one pair of chopsticks to another also recalls funeral customs.",
      details: [
        "Do not hand off food from chopsticks to chopsticks.",
        "To share, place food on a small plate first, then pick it up.",
      ],
    },
    "meal-restaurant-voice-level": {
      title: "Keep your voice down in restaurants",
      shortDescription:
        "Many restaurants value a calm mood, though izakaya pubs can be lively—read the room.",
      details: [
        "Adjust your volume to match the venue.",
        "Glancing at nearby tables helps you judge what feels right.",
      ],
    },
    "sightseeing-torii-bow": {
      title: "Bow lightly at a torii gate",
      shortDescription: "A torii marks the approach to a sacred area; a small bow shows respect.",
      details: ["Bow lightly once before and after passing through the torii."],
    },
    "sightseeing-quiet-shrine": {
      title: "Move calmly at shrines and temples",
      shortDescription: "Quiet behavior is valued so everyone can pray and reflect.",
      details: [
        "Avoid loud voices.",
        "When taking photos, be mindful of worshippers around you.",
      ],
    },
    "sightseeing-sando-center": {
      title: "Walk slightly off the center of the approach",
      shortDescription: "The middle of the path is often treated as reserved for the kami; many people walk to the side.",
      details: [
        "Try to walk a little to the side of the central line.",
        "When it is crowded, it is fine not to stress about it.",
        "Follow the flow of people around you.",
      ],
    },
    "sightseeing-onsen-wash-first": {
      title: "Wash thoroughly before entering the bath",
      shortDescription: "Shared hot springs stay clean only if everyone rinses before soaking.",
      details: [
        "Wash your body well before stepping into the tub.",
        "Finish shampoo and soap at the washing area, not in the tub.",
        "Rinse your space lightly for the next person.",
      ],
    },
    "sightseeing-onsen-no-towel-in-bath": {
      title: "Keep towels out of the bath water",
      shortDescription: "Towels stay out of the shared tub to keep the water clean.",
      details: [
        "Do not let towels soak in the bath.",
        "Use a towel rack or basket if provided.",
        "If none, keep the towel dry and out of others’ way.",
      ],
    },
    "sightseeing-kimono-hem-walk": {
      title: "Lift the hem slightly when walking in kimono",
      shortDescription: "Long hems can catch on steps; a little lift helps you move safely.",
      details: [
        "Hold the hem slightly so it does not drag or trip you.",
        "Be extra careful on stairs and uneven ground.",
      ],
    },
    "transit-escalator-stand-aside": {
      title: "Stand to one side on escalators",
      shortDescription: "One side is often left open so people in a hurry can pass.",
      details: [
        "Stand on one side and leave a lane free.",
        "Customs vary by region—watch what locals do.",
      ],
    },
    "transit-elevator-yield-exit": {
      title: "Let people off first",
      shortDescription: "Yielding to those exiting keeps elevators and trains moving smoothly.",
      details: [
        "Wait until people have stepped out before you enter.",
        "Step slightly aside near the doors.",
      ],
    },
    "transit-backpack-front-when-crowded": {
      title: "Wear backpacks on your front when crowded",
      shortDescription: "In tight spaces, turning your pack forward avoids bumping people behind you.",
      details: [
        "On crowded trains, move your backpack to your chest.",
        "Watch the space around you.",
      ],
    },
    "transit-quiet-on-public-transport": {
      title: "Stay quiet on trains and buses",
      shortDescription: "Public transit is usually kept low-noise out of respect for others.",
      details: [
        "Keep voices and device sounds low.",
        "Watch for headphone sound leaking.",
      ],
    },
    "life-no-open-before-payment": {
      title: "Do not open products before paying",
      shortDescription: "Until you buy it, merchandise still belongs to the shop.",
      details: ["Do not open packages before checkout unless staff say it is OK."],
    },
    "life-queue-in-line": {
      title: "Join the end of the line",
      shortDescription: "Waiting your turn in an orderly line is the usual custom.",
      details: [
        "Queue at the back and wait your turn.",
        "If you are unsure where the line ends, look for signs or ask quietly.",
      ],
    },
    "life-quiet-in-public": {
      title: "Speak softly in public spaces",
      shortDescription: "Many people keep conversations subdued in shared indoor and outdoor areas.",
      details: [
        "Lower your speaking volume.",
        "Take cues from people nearby.",
      ],
    },
    "life-phone-avoid-on-train": {
      title: "Avoid voice calls on trains",
      shortDescription: "Voice calls are uncommon inside train cars; people step out to talk when needed.",
      details: [
        "Skip calls inside the car when you can.",
        "If you must talk, use a vestibule or platform after you exit.",
      ],
    },
    "life-trash-take-home": {
      title: "Carry trash with you",
      shortDescription: "Public trash cans are scarce; carrying a small bag helps.",
      details: [
        "Plan to take your trash back to your lodging or the next bin.",
        "A small plastic bag in your daypack is handy.",
      ],
    },
    "life-trash-sort": {
      title: "Sort trash by category",
      shortDescription: "Local rules often require separating burnable, recyclables, and more.",
      details: [
        "Follow labels on bins and posters.",
        "When unsure, ask staff or look for pictograms.",
      ],
    },
    "life-discreet-pda": {
      title: "Keep public affection modest",
      shortDescription: "Bold physical affection in public is relatively uncommon in Japan.",
      details: ["Save larger gestures for private settings."],
    },
    "rule-smoking-designated-only": {
      title: "Smoke only where allowed",
      shortDescription: "Smoking is restricted to signed areas in many towns and buildings.",
      details: [
        "Use official smoking rooms or outdoor smoking zones.",
        "Check maps or signs before you light up.",
      ],
    },
    "rule-photo-consent": {
      title: "Ask before photographing people",
      shortDescription: "Privacy is taken seriously; candid portraits can cause trouble.",
      details: [
        "Get a quick OK before photographing strangers’ faces.",
        "In shops, avoid capturing other customers without care.",
        "Food shots are usually fine; when in doubt, check posted rules.",
      ],
    },
    "rule-no-trespassing": {
      title: "Do not enter private land",
      shortDescription: "Fields, yards, and paths may be private even if they look scenic.",
      details: [
        "Do not cross fences or “no entry” signs.",
        "When unsure, choose another route.",
      ],
    },
    "rule-drinking-age-20": {
      title: "Legal drinking age is 20",
      shortDescription: "Japanese law sets twenty as the age for alcohol.",
      details: [
        "Do not drink alcohol if you are under 20.",
        "Carry ID; shops may check ages.",
      ],
    },
    "rule-traffic-signals": {
      title: "Follow traffic lights and crosswalks",
      shortDescription: "Signals keep pedestrians and drivers safe.",
      details: [
        "Wait for the walk signal at crossings.",
        "Use marked crosswalks where they exist.",
      ],
    },
    "rule-no-graffiti": {
      title: "Do not mark public property",
      shortDescription: "Shared spaces stay pleasant when everyone avoids damage and graffiti.",
      details: [
        "Do not write or carve on structures.",
        "Treat public facilities with care.",
      ],
    },
  },
  topics: {
    ...sheetTipsTopicsEn,
  },
} as const;
