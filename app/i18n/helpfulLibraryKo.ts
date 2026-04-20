import { sheetTipsTopicsKo } from "./sheetTipsTopics";

/** 유용 정보 라이브러리(매너 분류·본문) — 한국어 */
export const helpfulLibraryKo = {
  mannerCategories: {
    meal: {
      label: "식사",
      description: "잇다다키마스·젓가락 등 식탁·외식 때의 매너입니다.",
    },
    sightseeing: {
      label: "관광",
      description: "신사·온천·기모노 등 관광 상황에서의 매너입니다.",
    },
    mobility: {
      label: "이동",
      description: "전철·에스컬레이터 등 이동 중의 매너입니다.",
    },
    daily: {
      label: "생활",
      description: "쇼핑·공공장소·쓰레기 등 일상 장면의 매너입니다.",
    },
    rules: {
      label: "규칙",
      description: "촬영·흡연·사유지 등 규칙·법률 관련 주의입니다.",
    },
  },
  mannerItems: {
    "meal-before-greeting": {
      title: "식사 전후 인사",
      shortDescription: "식사 전후에 감사를 짧게 전하는 문화가 있으며, 음식과 준비한 사람에 대한 마음을 나타냅니다.",
      details: ["식전에는 「잇다다키마스」라고 말합니다.", "식후에는 「고치소사마데시타」라고 말합니다."],
    },
    "meal-quiet-eating": {
      title: "너무 큰 소리 내지 않기",
      shortDescription: "일본에서는 주변을 배려해 조용히 먹는 사람이 많습니다.",
      details: ["면류를 제외하고는 씹는 소리를 내지 않도록 합니다.", "가능한 한 조용히 먹습니다.", "주변 분위기에 맞춥니다."],
    },
    "meal-chopsticks-no-rice-plant": {
      title: "밥에 젓가락을 세우지 않기",
      shortDescription: "밥 위에 젓가락을 세우는 행동은 장례 등을 연상시켜 피합니다.",
      details: ["젓가락을 밥에 세우지 않습니다.", "쓰지 않을 때는 받침이나 접시 가에 둡니다."],
    },
    "meal-chopsticks-no-pass": {
      title: "젓가락으로 건네받지 않기",
      shortDescription: "젓가락에서 젓가락으로 음식을 넘기는 것도 장례 풍습을 떠올리게 해 피합니다.",
      details: ["젓가락끼리 음식을 직접 넘기지 않습니다.", "나눌 때는 작은 접시에 한번 옮긴 뒤 집습니다."],
    },
    "meal-restaurant-voice-level": {
      title: "가게 안에서는 큰 소리로 말하지 않기",
      shortDescription: "일본 음식점은 차분한 분위기를 좋아하는 경우가 많고, 이자카야 등은 활기찰 수도 있습니다.",
      details: ["가게 분위기에 맞춰 목소리 크기를 조절합니다.", "주변 사람들의 모습을 보면 판단하기 쉽습니다."],
    },
    "sightseeing-torii-bow": {
      title: "도리이 앞에서 가볍게 인사",
      shortDescription: "도리이는 신성한 공간으로 들어가는 입구로 여겨져 가벼운 인사가 중요합니다.",
      details: ["도리이 앞뒤로 가볍게 절합니다."],
    },
    "sightseeing-quiet-shrine": {
      title: "조용히 행동하기",
      shortDescription: "신사와 사찰은 조용한 공간이 중시되어 차분한 행동이 요구됩니다.",
      details: ["큰 소리를 내지 않고 조용히 지냅니다.", "사진을 찍을 때도 주변을 배려합니다."],
    },
    "sightseeing-sando-center": {
      title: "참로 가운데는 되도록 피하기",
      shortDescription: "참로 가운데는 신이 다니는 길로 여겨져 옆을 걷는 사람이 많습니다.",
      details: ["가운데는 되도록 피해 걷습니다.", "혼잡할 때는 무리하지 않아도 됩니다.", "주변 사람의 움직임에 맞추면 안심입니다."],
    },
    "sightseeing-onsen-wash-first": {
      title: "들어가기 전에 몸을 씻기",
      shortDescription: "온천은 여러 사람이 함께 쓰므로 깨끗이 유지하는 것이 매우 중요합니다.",
      details: ["들어가기 전에 몸을 충분히 씻습니다.", "샴푸와 비누는 욕조에 들어가기 전에 끝냅니다.", "씻는 자리는 다음 사람을 위해 살짝 헹굽니다."],
    },
    "sightseeing-onsen-no-towel-in-bath": {
      title: "수건을 욕조에 넣지 않기",
      shortDescription: "욕조 물을 깨끗이 하기 위해 수건을 물에 넣지 않는 습관이 있습니다.",
      details: ["수건은 욕조에 넣지 않습니다.", "수건 걸이가 있으면 그곳을 씁니다.", "없으면 젖지 않게 하고 사람에게 방해되지 않는 곳에 둡니다."],
    },
    "sightseeing-kimono-hem-walk": {
      title: "치마자락을 밟지 않게 걷기",
      shortDescription: "기모노는 자락이 길어 걸음에 약간의 주의가 필요합니다.",
      details: ["자락을 살짝 들어 더러워지지 않게 걷습니다.", "계단과 단차에서는 특히 주의합니다."],
    },
    "transit-escalator-stand-aside": {
      title: "한쪽으로 붙어 서기",
      shortDescription: "에스컬레이터에서는 급한 사람을 위해 통로를 비우는 습관이 있습니다.",
      details: ["한쪽에 붙어 섭니다.", "지역마다 다르므로 주변에 맞춥니다."],
    },
    "transit-elevator-yield-exit": {
      title: "내리는 사람을 먼저",
      shortDescription: "부드럽게 이동하려면 먼저 내리는 사람을 우선합니다.",
      details: ["먼저 내리는 사람을 통과시킵니다.", "문 근처에서는 살짝 비켜 서면 수월합니다."],
    },
    "transit-backpack-front-when-crowded": {
      title: "혼잡할 때 배낭은 앞으로",
      shortDescription: "혼잡할 때는 주변과 거리가 가까워지므로 짐 드는 방식에 배려가 필요합니다.",
      details: ["혼잡할 때는 배낭을 앞으로 메습니다.", "주변 공간을 살핍니다."],
    },
    "transit-quiet-on-public-transport": {
      title: "대중교통에서는 조용히",
      shortDescription: "전철과 버스에서는 조용한 환경이 유지되고 주변 배려가 중시됩니다.",
      details: ["소리와 말소리는 작게 합니다.", "이어폰 소리 새는 것도 주의합니다."],
    },
    "life-no-open-before-payment": {
      title: "계산 전 상품은 열지 않기",
      shortDescription: "상품은 구매할 때까지 가게 것이며 임의로 개봉할 수 없습니다.",
      details: ["계산 전에는 상품을 열지 않습니다."],
    },
    "life-queue-in-line": {
      title: "줄 서기",
      shortDescription: "일본에서는 순서를 지키는 것이 중시되며 줄을 서는 문화가 있습니다.",
      details: ["줄의 맨 끝에 서서 차례를 기다립니다.", "맨끝 위치를 확인하면 안심입니다."],
    },
    "life-quiet-in-public": {
      title: "공공장소에서는 조용히 말하기",
      shortDescription: "공공장소에서는 주변 배려가 요구되며 조용히 지내는 사람이 많습니다.",
      details: ["목소리를 낮춰 말합니다.", "주변 사람의 모습을 참고하면 안심입니다."],
    },
    "life-phone-avoid-on-train": {
      title: "전철에서는 통화 자제",
      shortDescription: "칸 안에서는 조용한 환경을 지키기 위해 통화를 자제하는 것이 일반적입니다.",
      details: ["통화는 자제합니다.", "필요하면 칸 밖이나 데크에서 말합니다."],
    },
    "life-trash-take-home": {
      title: "쓰레기는 가져가기",
      shortDescription: "일본은 길가 쓰레기통이 적어 스스로 가져가는 경우가 일반적입니다.",
      details: ["쓰레기는 가져가도록 합니다.", "작은 봉투를 준비해 두면 편리합니다."],
    },
    "life-trash-sort": {
      title: "분리배출",
      shortDescription: "쓰레기는 종류별로 나눠 처리되므로 분리가 중요합니다.",
      details: ["쓰레기는 분리해서 버립니다.", "표지와 안내를 보면 이해하기 쉽습니다."],
    },
    "life-discreet-pda": {
      title: "사람 앞에서는 스킨십은 절제",
      shortDescription: "공공장소에서는 절제된 행동이 좋아지며 스킨십도 절제되는 경향이 있습니다.",
      details: ["스킨십은 절제합니다."],
    },
    "rule-smoking-designated-only": {
      title: "담배는 지정 장소에서",
      shortDescription: "흡연 장소가 정해져 있는 경우가 많고 규칙을 지키는 것이 요구됩니다.",
      details: ["정해진 장소에서 피웁니다.", "미리 흡연소를 확인해 두면 안심입니다."],
    },
    "rule-photo-consent": {
      title: "무단 촬영 주의",
      shortDescription: "일본에서는 사생활이 중시되어 무단 촬영은 문제가 될 수 있습니다.",
      details: [
        "사람을 찍기 전에 한마디 물어봅니다.",
        "가게 안에서는 다른 손님이 찍히지 않게 배려합니다.",
        "음식 사진은 대체로 문제없는 경우가 많지만 헷갈리면 가게 안내를 확인합니다.",
      ],
    },
    "rule-no-trespassing": {
      title: "사유지에 들어가지 않기",
      shortDescription: "땅에는 소유자가 있어 무단으로 들어갈 수 없습니다.",
      details: ["허가 없이 들어가지 않습니다.", "표지와 안내를 확인합니다."],
    },
    "rule-drinking-age-20": {
      title: "음주는 나이 제한이 있다",
      shortDescription: "일본에서는 법으로 음주 가능 연령이 정해져 있습니다.",
      details: ["20세 이상에서 마십니다.", "연령 확인을 요구받을 수 있습니다."],
    },
    "rule-traffic-signals": {
      title: "신호를 지키기",
      shortDescription: "교통 안전을 위해 신호를 지키는 것이 중요합니다.",
      details: ["신호를 지킵니다.", "보행 시 횡단보도를 쓰면 안전합니다."],
    },
    "rule-no-graffiti": {
      title: "낙서하지 않기",
      shortDescription: "공공물은 모두가 쓰는 것이므로 깨끗이 지키는 의식이 중요합니다.",
      details: ["낙서는 하지 않습니다.", "공공물을 소중히 씁니다."],
    },
  },
  topics: {
    ...sheetTipsTopicsKo,
  },
} as const;
