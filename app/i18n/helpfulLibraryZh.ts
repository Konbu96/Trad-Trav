import { sheetTipsTopicsZh } from "./sheetTipsTopics";

/** 实用信息库（礼仪分类与正文）— 简体中文 */
export const helpfulLibraryZh = {
  mannerCategories: {
    meal: {
      label: "饮食",
      description: "用餐前后问候、筷子用法等餐桌与外出就餐礼仪。",
    },
    sightseeing: {
      label: "观光",
      description: "神社、温泉、和服等观光场景中的礼仪。",
    },
    mobility: {
      label: "移动",
      description: "电车、扶梯等移动途中的礼仪。",
    },
    daily: {
      label: "生活",
      description: "购物排队、公共场所、垃圾处理等日常礼仪。",
    },
    rules: {
      label: "规则",
      description: "拍摄、吸烟、私有地等与规定和法律相关的注意。",
    },
  },
  mannerItems: {
    "meal-before-greeting": {
      title: "用餐前后的问候",
      shortDescription: "用餐前后用简短话语表达感谢，是对食物与制作者的尊重。",
      details: ["用餐前说「いただきます」。", "用餐后说「ごちそうさまでした」。"],
    },
    "meal-quiet-eating": {
      title: "吃饭尽量小声",
      shortDescription: "在日本，许多人会安静进食以顾及周围。",
      details: ["除面条外尽量避免发出咀嚼声。", "尽量安静地进食。", "配合店内氛围调整音量。"],
    },
    "meal-chopsticks-no-rice-plant": {
      title: "筷子不要直立插在饭里",
      shortDescription: "饭上直立插筷容易让人联想到丧礼相关习俗，应避免。",
      details: ["不要把筷子垂直插在米饭上。", "不用时放在筷架或盘子边缘。"],
    },
    "meal-chopsticks-no-pass": {
      title: "不要用筷子互相递菜",
      shortDescription: "筷子对筷子递菜也容易联想到丧礼场景，应避免。",
      details: ["不要用筷子夹着食物直接传给另一双筷子。", "先放到小碟上再取食更稳妥。"],
    },
    "meal-restaurant-voice-level": {
      title: "餐厅里控制说话音量",
      shortDescription: "许多店重视安静氛围，居酒屋等也可能较热闹，请察言观色。",
      details: ["根据店内气氛调节音量。", "参考周围客人的状态更容易判断。"],
    },
    "sightseeing-torii-bow": {
      title: "鸟居前轻鞠躬",
      shortDescription: "鸟居被视为神圣空间的入口，轻鞠躬表示敬意。",
      details: ["穿过鸟居前后可轻轻鞠躬一次。"],
    },
    "sightseeing-quiet-shrine": {
      title: "神社与寺院保持安静",
      shortDescription: "神社与寺院重视安静空间，请保持从容举止。",
      details: ["不要大声喧哗。", "拍照时也请顾及参拜者。"],
    },
    "sightseeing-sando-center": {
      title: "参道尽量不走正中央",
      shortDescription: "参道中央常被视为神明通道，许多人靠两侧行走。",
      details: ["尽量避开参道正中央行走。", "人多时不必过于勉强。", "跟随人流更安全。"],
    },
    "sightseeing-onsen-wash-first": {
      title: "入浴前先洗净身体",
      shortDescription: "温泉为共用设施，入池前洗净身体十分重要。",
      details: ["入池前把身体冲洗干净。", "洗发沐浴请在进入浴池前完成。", "冲洗区使用后略冲一下方便下一位。"],
    },
    "sightseeing-onsen-no-towel-in-bath": {
      title: "不要把毛巾放进浴池",
      shortDescription: "为保持池水清洁，习惯上不把毛巾浸入池中。",
      details: ["毛巾不要浸入浴池。", "有毛巾架请使用。", "没有时请保持毛巾干燥并放在不妨碍他人的位置。"],
    },
    "sightseeing-kimono-hem-walk": {
      title: "穿和服时注意下摆",
      shortDescription: "和服下摆较长，行走时需稍加注意。",
      details: ["可轻提下摆以免拖地弄脏。", "楼梯与台阶处尤需注意。"],
    },
    "transit-escalator-stand-aside": {
      title: "扶梯靠一侧站立",
      shortDescription: "许多地方会空出一侧给赶时间的人通行。",
      details: ["靠一侧站立留出通道。", "各地习惯不同，可参考当地人做法。"],
    },
    "transit-elevator-yield-exit": {
      title: "先让里面的人出来",
      shortDescription: "先下后上能让电梯与门口通行更顺畅。",
      details: ["等里面的人走出后再进入。", "在门边略侧身让出空间。"],
    },
    "transit-backpack-front-when-crowded": {
      title: "拥挤时把背包背到胸前",
      shortDescription: "人多时背包背在前面可减少碰撞身后的人。",
      details: ["拥挤电车上可把双肩包转到胸前。", "留意周围空间。"],
    },
    "transit-quiet-on-public-transport": {
      title: "公共交通保持安静",
      shortDescription: "电车与巴士上通常保持低声，以尊重他人。",
      details: ["说话与设备音量尽量放低。", "注意耳机漏音。"],
    },
    "life-no-open-before-payment": {
      title: "付款前不要拆开商品",
      shortDescription: "付款前商品仍属店家，不可擅自开封。",
      details: ["结账前请不要拆开包装（除非店员同意）。"],
    },
    "life-queue-in-line": {
      title: "排队守秩序",
      shortDescription: "在日本排队守秩序是常见礼仪。",
      details: ["在队尾排队依序前进。", "不确定队尾时可观察标识或小声询问。"],
    },
    "life-quiet-in-public": {
      title: "公共空间轻声交谈",
      shortDescription: "在公共场所许多人会压低声音以顾及周围。",
      details: ["交谈时降低音量。", "可参考周围人的说话方式。"],
    },
    "life-phone-avoid-on-train": {
      title: "电车内尽量避免打电话",
      shortDescription: "车厢内通常保持安静，语音通话较少见。",
      details: ["尽量避免在车厢内通话。", "必要时可到车外或连接处再打。"],
    },
    "life-trash-take-home": {
      title: "垃圾自行带走",
      shortDescription: "日本街头垃圾桶较少，随身带小袋更方便。",
      details: ["垃圾尽量自行带回住宿或找到分类桶再丢。", "随身备小塑料袋很实用。"],
    },
    "life-trash-sort": {
      title: "垃圾分类丢弃",
      shortDescription: "垃圾常需按类别分开处理。",
      details: ["按标识分类丢弃。", "不确定时查看图示或询问工作人员。"],
    },
    "life-discreet-pda": {
      title: "公开场合亲密举止低调",
      shortDescription: "在公共场所过于亲密的举止相对少见。",
      details: ["亲密举动尽量低调，留给私人场合。"],
    },
    "rule-smoking-designated-only": {
      title: "在指定区域吸烟",
      shortDescription: "许多地区与建筑只能在规定场所吸烟。",
      details: ["在指定吸烟室或户外吸烟区吸烟。", "出发前可先查吸烟点。"],
    },
    "rule-photo-consent": {
      title: "拍人前先征得同意",
      shortDescription: "日本重视隐私，随意拍人可能引发纠纷。",
      details: [
        "拍摄他人面部前先征得同意。",
        "店内注意不要把其他客人拍进画面。",
        "拍食物多半问题不大，不确定时请看店内说明。",
      ],
    },
    "rule-no-trespassing": {
      title: "不擅入私有地",
      shortDescription: "田地、庭院等可能为私人土地，即使风景好也不可擅入。",
      details: ["不要翻越围栏或无视禁止进入标识。", "不确定时改走其他路线。"],
    },
    "rule-drinking-age-20": {
      title: "饮酒须满20岁",
      shortDescription: "日本法律规定年满20岁方可饮酒。",
      details: ["未满20岁请勿饮酒。", "购酒时可能被要求出示证件。"],
    },
    "rule-traffic-signals": {
      title: "遵守红绿灯与斑马线",
      shortDescription: "遵守信号与过街设施能保障行人安全。",
      details: ["按信号灯过街。", "尽量走人行横道。"],
    },
    "rule-no-graffiti": {
      title: "不要涂鸦公共设施",
      shortDescription: "公共设施供大家共用，请勿刻画或乱涂。",
      details: ["不要在建筑物上刻画或涂鸦。", "爱惜公共设施。"],
    },
  },
  topics: {
    ...sheetTipsTopicsZh,
  },
} as const;
