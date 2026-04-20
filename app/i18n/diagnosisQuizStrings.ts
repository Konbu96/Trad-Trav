/** 旅タイプ診断（3問）＋プランタブの診断バナー用。ja / en は型の基準、zh / ko は言語切替時に丸ごと差し替え。 */
export type DiagnosisTravelTypeKey = "performing_arts" | "crafts" | "allround";

export type TraditionalQuizTypeBundle = {
  emoji: string;
  travelTypeLabel: string;
  description: string;
  tips: readonly [string, string, string, string];
  spots: readonly [string, string, string, string, string];
  categories: readonly [
    { readonly emoji: string; readonly label: string },
    { readonly emoji: string; readonly label: string },
    { readonly emoji: string; readonly label: string },
  ];
  planTitle: string;
  planDescription: string;
};

export type TraditionalQuizContent = {
  subtitleDuring: string;
  subtitleResult: string;
  progressQ1: string;
  progressQ2: string;
  progressQ3: string;
  q1Title: string;
  q1MultiHint: string;
  q2Title: string;
  q3Title: string;
  interests: { performing_arts: string; crafts: string };
  durations: {
    short: { label: string; description: string };
    medium: { label: string; description: string };
    long: { label: string; description: string };
    extended: { label: string; description: string };
  };
  companions: { solo: string; couple: string; family: string; friends: string };
  resultTypeIntro: string;
  recommendedCategoriesTitle: string;
  mapSpotsSectionTitle: string;
  travelTipsTitle: string;
  completeNote: string;
  showOnMap: string;
  planBannerRetake: string;
  planBannerStart: string;
  /** `{style}` を現在のタイプ名（または planBannerDiagnosedFallback）に置換 */
  planBannerWithType: string;
  planBannerIntro: string;
  planBannerDiagnosedFallback: string;
  types: Record<DiagnosisTravelTypeKey, TraditionalQuizTypeBundle>;
};

const ja: TraditionalQuizContent = {
  subtitleDuring: "伝統文化の旅をご提案します",
  subtitleResult: "あなたにぴったりの旅スタイル",
  progressQ1: "Q1 / 3",
  progressQ2: "Q2 / 3",
  progressQ3: "Q3 / 3",
  q1Title: "伝統文化の旅でしたいことは？",
  q1MultiHint: "複数選択できます",
  q2Title: "何泊の旅行ですか？",
  q3Title: "誰と行きますか？",
  interests: {
    performing_arts: "伝統芸能・踊り・祭りに参加したい",
    crafts: "伝統工芸・ものづくりを体験したい",
  },
  durations: {
    short: { label: "1〜2泊", description: "短期滞在" },
    medium: { label: "3〜4泊", description: "ゆっくり主要スポットを回る" },
    long: { label: "5〜6泊", description: "じっくり東北を満喫" },
    extended: { label: "1週間以上", description: "深く探訪・体験重視" },
  },
  companions: {
    solo: "一人旅",
    couple: "恋人・夫婦",
    family: "家族（子連れ）",
    friends: "友人グループ",
  },
  resultTypeIntro: "あなたの旅行タイプは",
  recommendedCategoriesTitle: "🗂 おすすめカテゴリ",
  mapSpotsSectionTitle: "おすすめスポット",
  travelTipsTitle: "💡 旅のヒント",
  completeNote: "✨ あなたのタイプに合わせたスポットを地図に表示します",
  showOnMap: "地図でスポットを見る",
  planBannerRetake: "診断をやり直す",
  planBannerStart: "旅タイプ診断を受ける",
  planBannerWithType: "現在のタイプ：{style} → 条件に自動反映されます",
  planBannerIntro: "3問の診断で条件が自動入力されます",
  planBannerDiagnosedFallback: "診断済み",
  types: {
    performing_arts: {
      emoji: "🎭",
      travelTypeLabel: "伝統芸能参加者",
      description:
        "踊り・祭り・芸能の中に飛び込みたいあなた。700年続く盆踊りの輪に加わり、鬼の面をつけて舞い、太鼓の音に体を委ねる。東北の伝統芸能は参加してこそ本物の感動があります。",
      tips: [
        "夏の祭り（7〜8月）は参加型イベントが多く、最もおすすめです",
        "跳ね人・踊り連への参加は事前申込が必要な場合があります",
        "竿燈や鬼剣舞などの体験コーナーは開場直後が混みにくいです",
        "衣装レンタルができる祭りも多いので気軽に参加してみましょう",
      ],
      spots: [
        "青森ねぶた祭（跳ね人参加）",
        "盛岡さんさ踊り（参加型）",
        "秋田竿燈まつり（竿燈体験）",
        "鬼剣舞（体験ワークショップ）",
        "西馬音内盆踊り（飛び入り参加）",
      ],
      categories: [
        { emoji: "🎭", label: "伝統芸能・踊り" },
        { emoji: "🎪", label: "祭り・行列" },
        { emoji: "🎑", label: "能・神楽" },
      ],
      planTitle: "東北伝統芸能参加プラン",
      planDescription: "踊り・祭り・芸能の輪に自ら加わり、東北の生きた伝統を体全体で感じる旅。",
    },
    crafts: {
      emoji: "🏺",
      travelTypeLabel: "伝統工芸体験家",
      description:
        "作ること・手を動かすことに喜びを感じるあなた。南部鉄器・曲げわっぱ・会津漆器など、東北の職人が何百年と守り続けてきた技に触れ、自分だけの一品を生み出しましょう。",
      tips: [
        "工芸体験はほとんどの場所で事前予約が必要です",
        "完成品の発送に対応している工房も多いのでお土産にもなります",
        "所要時間は1〜3時間が多いので、日程に余裕を持って計画を",
        "職人さんへの質問は積極的に。技術の背景を教えてもらえます",
      ],
      spots: [
        "南部鉄器体験（岩鋳鉄器館）",
        "曲げわっぱ体験（大館）",
        "樺細工体験（角館）",
        "会津本郷焼（陶芸体験）",
        "会津漆器（蒔絵体験）",
      ],
      categories: [
        { emoji: "🏺", label: "伝統工芸・体験" },
        { emoji: "🎨", label: "ものづくり・陶芸" },
        { emoji: "🧵", label: "染め・織り・漆器" },
      ],
      planTitle: "東北伝統工芸体験プラン",
      planDescription: "鉄器・木工・漆器・陶芸など、東北の職人技を手と心で感じる創作の旅。",
    },
    allround: {
      emoji: "🌸",
      travelTypeLabel: "東北文化全体験者",
      description:
        "踊りも工芸も両方体験したい欲張りなあなた。祭りの熱気に包まれながら職人の技にも触れる、東北の伝統文化を余すことなく楽しむ贅沢な旅をしましょう。",
      tips: [
        "夏（7〜8月）は祭りシーズン。工芸体験と組み合わせると最高です",
        "東北新幹線を使えば複数県のはしごも可能",
        "祭り参加と工芸体験の予約を事前にセットで入れておくと安心",
        "国重要無形民俗文化財に指定された本物の伝統を選びましょう",
      ],
      spots: [
        "青森ねぶた祭（跳ね人参加）",
        "南部鉄器体験（岩鋳鉄器館）",
        "黒川能（体験・鑑賞）",
        "こけし絵付け体験（鳴子温泉郷）",
        "西馬音内盆踊り（飛び入り参加）",
      ],
      categories: [
        { emoji: "🎭", label: "伝統芸能・踊り" },
        { emoji: "🏺", label: "伝統工芸・体験" },
        { emoji: "🎑", label: "祭り・能・民俗芸能" },
      ],
      planTitle: "東北伝統文化フルコースプラン",
      planDescription: "芸能・工芸・祭り・能楽など、東北が誇る本物の伝統文化を全て体験する旅。",
    },
  },
};

const en: TraditionalQuizContent = {
  subtitleDuring: "We’ll suggest a trip rooted in traditional culture",
  subtitleResult: "A travel style that fits you",
  progressQ1: "Q1 / 3",
  progressQ2: "Q2 / 3",
  progressQ3: "Q3 / 3",
  q1Title: "What do you want to do on a traditional-culture trip?",
  q1MultiHint: "You can select more than one",
  q2Title: "How many nights are you staying?",
  q3Title: "Who are you traveling with?",
  interests: {
    performing_arts: "Join traditional performing arts, dance, and festivals",
    crafts: "Try traditional crafts and hands-on making",
  },
  durations: {
    short: { label: "1–2 nights", description: "Short stay" },
    medium: { label: "3–4 nights", description: "Main sights at a relaxed pace" },
    long: { label: "5–6 nights", description: "Take time to enjoy Tohoku" },
    extended: { label: "A week or more", description: "Deep travel, experience-focused" },
  },
  companions: {
    solo: "Solo",
    couple: "Partner / spouse",
    family: "Family (with kids)",
    friends: "Friends",
  },
  resultTypeIntro: "Your travel type",
  recommendedCategoriesTitle: "🗂 Suggested categories",
  mapSpotsSectionTitle: "Suggested spots",
  travelTipsTitle: "💡 Trip tips",
  completeNote: "✨ We’ll highlight spots on the map that match your type",
  showOnMap: "View spots on the map",
  planBannerRetake: "Retake the quiz",
  planBannerStart: "Take the travel-style quiz",
  planBannerWithType: "Current type: {style} — your plan filters update automatically",
  planBannerIntro: "Three quick questions auto-fill your plan filters",
  planBannerDiagnosedFallback: "Completed",
  types: {
    performing_arts: {
      emoji: "🎭",
      travelTypeLabel: "Traditional performing-arts joiner",
      description:
        "You want to step into dance, festivals, and performing arts. Join a bon-odori circle that has lasted for centuries, move with a demon mask, and feel the drums in your body. In Tohoku, the real emotion often comes from taking part, not just watching.",
      tips: [
        "Summer festivals (Jul–Aug) offer the most participatory events",
        "Haneto dancers or parade slots may need advance signup",
        "Hands-on corners for Kanto or onikenbai are quieter right after opening",
        "Many festivals rent costumes so you can join more easily",
      ],
      spots: [
        "Aomori Nebuta Festival (haneto participation)",
        "Morioka Sansa Odori (join-in dance)",
        "Akita Kanto Festival (pole-lantern experience)",
        "Onikenbai (workshop)",
        "Nishimonai Bon Odori (drop-in dance)",
      ],
      categories: [
        { emoji: "🎭", label: "Performing arts & dance" },
        { emoji: "🎪", label: "Festivals & parades" },
        { emoji: "🎑", label: "Noh & kagura" },
      ],
      planTitle: "Tohoku performing-arts participation plan",
      planDescription: "Join the circle of dance, festivals, and performing arts and feel living Tohoku tradition with your whole body.",
    },
    crafts: {
      emoji: "🏺",
      travelTypeLabel: "Traditional craft maker",
      description:
        "You love making things and using your hands. Nambu ironware, magewappa, Aizu lacquerware—meet skills Tohoku craftspeople have refined for generations and create something uniquely yours.",
      tips: [
        "Most craft workshops require a reservation",
        "Many studios can ship finished pieces—great as souvenirs",
        "Sessions often run 1–3 hours, so leave slack in your day",
        "Ask artisans questions—they’ll often share the story behind the technique",
      ],
      spots: [
        "Nambu ironware workshop (Iwachu)",
        "Magewappa workshop (Odate)",
        "Kabazaiku workshop (Kakunodate)",
        "Aizu Hongyoyaki pottery experience",
        "Aizu lacquerware (makie experience)",
      ],
      categories: [
        { emoji: "🏺", label: "Traditional crafts & workshops" },
        { emoji: "🎨", label: "Making & pottery" },
        { emoji: "🧵", label: "Dyeing, weaving & lacquer" },
      ],
      planTitle: "Tohoku traditional craft plan",
      planDescription: "Iron, wood, lacquer, clay—feel Tohoku craftsmanship with your hands and heart.",
    },
    allround: {
      emoji: "🌸",
      travelTypeLabel: "Tohoku culture all-rounder",
      description:
        "You want both dance and crafts. Soak up festival energy and still touch artisan skills—a generous trip that samples Tohoku’s traditions without missing the highlights.",
      tips: [
        "Summer (Jul–Aug) is festival season—pair it with a craft workshop",
        "The Tohoku Shinkansen makes multi-prefecture hops realistic",
        "Book festival slots and craft sessions together in advance",
        "Pick experiences recognized as important intangible folk culture when you can",
      ],
      spots: [
        "Aomori Nebuta Festival (haneto participation)",
        "Nambu ironware workshop (Iwachu)",
        "Kurokawa Noh (experience & viewing)",
        "Kokeshi painting (Naruko Onsen)",
        "Nishimonai Bon Odori (drop-in dance)",
      ],
      categories: [
        { emoji: "🎭", label: "Performing arts & dance" },
        { emoji: "🏺", label: "Traditional crafts & workshops" },
        { emoji: "🎑", label: "Festivals, noh & folk performance" },
      ],
      planTitle: "Tohoku traditional culture full course",
      planDescription: "Performing arts, crafts, festivals, and noh—experience the traditions Tohoku is proud of.",
    },
  },
};

const zh: TraditionalQuizContent = {
  subtitleDuring: "为你推荐扎根传统文化的旅程",
  subtitleResult: "适合你的旅行风格",
  progressQ1: "第 1 问 / 共 3 问",
  progressQ2: "第 2 问 / 共 3 问",
  progressQ3: "第 3 问 / 共 3 问",
  q1Title: "在传统文化的旅程中你想做什么？",
  q1MultiHint: "可多选",
  q2Title: "计划停留几晚？",
  q3Title: "和谁一起去？",
  interests: {
    performing_arts: "想参与传统演艺、舞蹈与祭典",
    crafts: "想体验传统工艺与动手制作",
  },
  durations: {
    short: { label: "1–2 晚", description: "短途停留" },
    medium: { label: "3–4 晚", description: "从容走访主要景点" },
    long: { label: "5–6 晚", description: "慢慢享受东北" },
    extended: { label: "一周以上", description: "深度探访、重视体验" },
  },
  companions: {
    solo: "独自旅行",
    couple: "恋人 / 夫妻",
    family: "家庭（带娃）",
    friends: "朋友结伴",
  },
  resultTypeIntro: "你的旅行类型是",
  recommendedCategoriesTitle: "🗂 推荐类别",
  mapSpotsSectionTitle: "推荐地点",
  travelTipsTitle: "💡 旅行提示",
  completeNote: "✨ 将在地图上突出符合你类型的地点",
  showOnMap: "在地图上查看地点",
  planBannerRetake: "重新测评",
  planBannerStart: "参加旅行风格测评",
  planBannerWithType: "当前类型：{style} — 下方条件会自动同步",
  planBannerIntro: "三个问题即可自动填入计划条件",
  planBannerDiagnosedFallback: "已完成",
  types: {
    performing_arts: {
      emoji: "🎭",
      travelTypeLabel: "传统演艺参与者",
      description:
        "你想走进舞蹈、祭典与演艺的世界。加入延续数百年的盂兰盆舞圈、戴着鬼面起舞，让身体感受鼓点。在东北，许多感动来自亲身参与，而不只是旁观。",
      tips: [
        "夏季祭典（7–8 月）参与型活动最多，最值得安排",
        "跳人、游行等名额有时需提前预约",
        "竿灯、鬼剑舞等体验角在刚开场时往往较空",
        "不少祭典可租服装，更容易融入参与",
      ],
      spots: [
        "青森睡魔祭（跳人参与）",
        "盛冈三飒舞（可加入舞蹈）",
        "秋田竿灯祭（竿灯体验）",
        "鬼剑舞（工作坊）",
        "西马音内盆踊（即兴加入）",
      ],
      categories: [
        { emoji: "🎭", label: "传统演艺・舞蹈" },
        { emoji: "🎪", label: "祭典・游行" },
        { emoji: "🎑", label: "能乐・神乐" },
      ],
      planTitle: "东北传统演艺参与行程",
      planDescription: "加入舞蹈、祭典与演艺的圈子，用全身感受鲜活的东北传统。",
    },
    crafts: {
      emoji: "🏺",
      travelTypeLabel: "传统工艺体验者",
      description:
        "你喜欢动手制作。南部铁器、曲木盒、会津漆器——触摸东北匠人世代打磨的技艺，做出只属于你的作品。",
      tips: [
        "多数工艺体验需提前预约",
        "不少工房可邮寄成品，很适合当伴手礼",
        "单次体验常见 1–3 小时，日程请留余裕",
        "多向匠人提问，常能了解技法背后的故事",
      ],
      spots: [
        "南部铁器体验（岩铸铁器馆）",
        "曲木盒体验（大馆）",
        "桦细工体验（角馆）",
        "会津本乡烧陶艺体验",
        "会津漆器（莳绘体验）",
      ],
      categories: [
        { emoji: "🏺", label: "传统工艺・体验" },
        { emoji: "🎨", label: "制作・陶艺" },
        { emoji: "🧵", label: "染织・漆器" },
      ],
      planTitle: "东北传统工艺体验行程",
      planDescription: "铁、木、漆、陶——用手与心感受东北匠艺。",
    },
    allround: {
      emoji: "🌸",
      travelTypeLabel: "东北文化全能体验者",
      description:
        "舞蹈与工艺你都想试。在祭典热气里沉浸，也触摸匠人技艺——把东北传统一次收齐的贪心又充实的旅程。",
      tips: [
        "夏季（7–8 月）祭典季，可与工艺体验组合",
        "利用东北新干线可跨县串联",
        "祭典名额与工艺体验建议一并提前预约",
        "尽量选择列入重要无形民俗文化财等“本物”体验",
      ],
      spots: [
        "青森睡魔祭（跳人参与）",
        "南部铁器体验（岩铸铁器馆）",
        "黑川能（体验与观赏）",
        "木芥子彩绘（鸣子温泉乡）",
        "西马音内盆踊（即兴加入）",
      ],
      categories: [
        { emoji: "🎭", label: "传统演艺・舞蹈" },
        { emoji: "🏺", label: "传统工艺・体验" },
        { emoji: "🎑", label: "祭典・能・民俗艺能" },
      ],
      planTitle: "东北传统文化全套行程",
      planDescription: "演艺、工艺、祭典与能乐——体验东北引以为傲的传统。",
    },
  },
};

const ko: TraditionalQuizContent = {
  subtitleDuring: "전통 문화 여행을 제안합니다",
  subtitleResult: "당신에게 맞는 여행 스타일",
  progressQ1: "1번 질문 / 총 3문항",
  progressQ2: "2번 질문 / 총 3문항",
  progressQ3: "3번 질문 / 총 3문항",
  q1Title: "전통 문화 여행에서 무엇을 하고 싶나요?",
  q1MultiHint: "복수 선택 가능",
  q2Title: "며칠 묵는 여행인가요?",
  q3Title: "누구와 함께 가나요?",
  interests: {
    performing_arts: "전통 예능·춤·축제에 참여하고 싶다",
    crafts: "전통 공예·만들기 체험을 하고 싶다",
  },
  durations: {
    short: { label: "1–2박", description: "짧은 체류" },
    medium: { label: "3–4박", description: "주요 스포트를 여유 있게" },
    long: { label: "5–6박", description: "동북을 천천히 만끽" },
    extended: { label: "1주 이상", description: "깊이 있는 탐방·체험 중심" },
  },
  companions: {
    solo: "혼자 여행",
    couple: "연인·부부",
    family: "가족(아이 동반)",
    friends: "친구 그룹",
  },
  resultTypeIntro: "당신의 여행 타입은",
  recommendedCategoriesTitle: "🗂 추천 카테고리",
  mapSpotsSectionTitle: "추천 스팟",
  travelTipsTitle: "💡 여행 팁",
  completeNote: "✨ 타입에 맞는 스팟을 지도에서 강조합니다",
  showOnMap: "지도에서 스팟 보기",
  planBannerRetake: "진단 다시 하기",
  planBannerStart: "여행 스타일 진단 받기",
  planBannerWithType: "현재 타입: {style} — 아래 조건에 자동 반영됩니다",
  planBannerIntro: "질문 3개로 조건이 자동 입력됩니다",
  planBannerDiagnosedFallback: "진단 완료",
  types: {
    performing_arts: {
      emoji: "🎭",
      travelTypeLabel: "전통 예능 참여형",
      description:
        "춤·축제·예능 속으로 뛰어들고 싶은 당신. 수백 년 이어진 봉오도리의 원에 합류하고, 탈을 쓰고 춤추며 북 소리에 몸을 맡겨 보세요. 도호쿠의 전통 예능은 ‘참여’할 때 진가가 살아납니다.",
      tips: [
        "여름 축제(7~8월)는 참가형 이벤트가 많아 추천",
        "하네토·행렬 참가는 사전 신청이 필요할 수 있음",
        "간토·오니켄바이 체험 코너는 개장 직후가 한산한 편",
        "의상 대여가 있는 축제도 많아 부담 없이 참여 가능",
      ],
      spots: [
        "아오모리 네부타 마츠리(하네토 참가)",
        "모리오카 산사 오도리(참여형)",
        "아키타 간토 마츠리(간토 체험)",
        "오니켄바이(워크숍)",
        "니시모나이 본오도리(즉흥 참가)",
      ],
      categories: [
        { emoji: "🎭", label: "전통 예능·춤" },
        { emoji: "🎪", label: "축제·행렬" },
        { emoji: "🎑", label: "노·가구라" },
      ],
      planTitle: "도호쿠 전통 예능 참여 플랜",
      planDescription: "춤·축제·예능의 한가운데에 서서, 살아 있는 도호쿠 전통을 온몸으로 느끼는 여행.",
    },
    crafts: {
      emoji: "🏺",
      travelTypeLabel: "전통 공예 체험가",
      description:
        "만들고 손을 움직이는 것을 좋아하는 당신. 난부 철기·마게와파·아이즈 칠기 등 도호쿠 장인이 지켜 온 기술에 닿고, 나만의 한 점을 남겨 보세요.",
      tips: [
        "공예 체험은 대부분 예약 필수",
        "완성품 택배를 해 주는 공방도 많아 기념품으로 좋음",
        "소요 1~3시간인 경우가 많아 일정에 여유를",
        "장인에게 질문을 나누면 기술의 배경도 들을 수 있음",
      ],
      spots: [
        "난부 철기 체험(이와주 주물관)",
        "마게와파 체험(오다테)",
        "가바자이쿠 체험(가쿠노다테)",
        "아이즈 혼고요야키 도예 체험",
        "아이즈 칠기(마키에 체험)",
      ],
      categories: [
        { emoji: "🏺", label: "전통 공예·체험" },
        { emoji: "🎨", label: "만들기·도예" },
        { emoji: "🧵", label: "염색·직조·칠기" },
      ],
      planTitle: "도호쿠 전통 공예 체험 플랜",
      planDescription: "철·목·칠·도자기—도호쿠 장인의 솜씨를 손과 마음으로 느끼는 창작 여행.",
    },
    allround: {
      emoji: "🌸",
      travelTypeLabel: "도호쿠 문화 올라운더",
      description:
        "춤도 공예도 둘 다 욕심 내는 당신. 축제의 열기 속에서 장인의 손길에도 닿는, 도호쿠 전통을 빠짐없이 즐기는 여유로운 여행.",
      tips: [
        "여름(7~8월)은 축제 시즌—공예 체험과 조합하면 최고",
        "도호쿠 신칸센으로 여러 현을 잇기 쉬움",
        "축지 참가와 공예 예약은 미리 세트로 잡아 두면 안심",
        "가능하면 중요무형민속문화재 등 ‘본物’ 체험을 선택",
      ],
      spots: [
        "아오모리 네부타 마츠리(하네토 참가)",
        "난부 철기 체험(이와주 주물관)",
        "구로카와 노(체험·관람)",
        "고케시 채색 체험(나루코 온천)",
        "니시모나이 본오도리(즉흥 참가)",
      ],
      categories: [
        { emoji: "🎭", label: "전통 예능·춤" },
        { emoji: "🏺", label: "전통 공예·체험" },
        { emoji: "🎑", label: "축제·노·민속 예능" },
      ],
      planTitle: "도호쿠 전통 문화 풀코스 플랜",
      planDescription: "예능·공예·축제·노가쿠—도호쿠가 자랑하는 전통을 모두 경험하는 여행.",
    },
  },
};

export const traditionalQuizJa = ja;
export const traditionalQuizEn = en;
export const traditionalQuizZh = zh;
export const traditionalQuizKo = ko;
