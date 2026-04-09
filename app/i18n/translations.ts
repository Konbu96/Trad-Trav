export type Language = "ja" | "en";

export const translations = {
  ja: {
    // 共通
    common: {
      loading: "読み込み中...",
      preparing: "準備中...",
      next: "次へ",
      back: "戻る",
      close: "閉じる",
      save: "保存",
      cancel: "キャンセル",
      search: "検索",
      searchPlaceholder: "場所を検索...",
    },

    // ナビゲーション
    nav: {
      mypage: "マイページ",
      reservations: "予約一覧",
      map: "体験予約",
      now: "なう情報",
      posts: "投稿",
      manner: "お役立ち",
    },

    // スプラッシュ
    splash: {
      appName: "Trad Trav",
    },

    // 診断
    diagnosis: {
      title: "旅の好み診断",
      subtitle: "あなたにぴったりの旅をご提案",
      resultTitle: "診断結果",
      resultSubtitle: "あなたにぴったりのプラン",
      
      // 興味
      interestTitle: "興味のあるジャンルは？",
      interestSubtitle: "複数選択できます",
      interests: {
        gourmet: "グルメ",
        sightseeing: "観光スポット",
        nature: "自然・絶景",
        onsen: "温泉",
        history: "歴史・文化",
        outdoor: "アウトドア",
        shopping: "ショッピング",
        animals: "動物",
      },

      // 期間
      durationTitle: "何日間の旅行？",
      durations: {
        day: "日帰り",
        dayDesc: "サクッと楽しむ",
        "1night": "1泊2日",
        "1nightDesc": "週末旅行に",
        "2nights": "2泊3日",
        "2nightsDesc": "ゆったり満喫",
        "3nights": "3泊以上",
        "3nightsDesc": "じっくり堪能",
      },

      // 同行者
      companionTitle: "誰と行く？",
      companions: {
        solo: "一人旅",
        couple: "カップル",
        family: "家族",
        friends: "友人",
      },

      // 予算
      budgetTitle: "旅行の予算は？",
      budgets: {
        budget: "リーズナブル",
        budgetDesc: "〜3万円",
        standard: "スタンダード",
        standardDesc: "3〜5万円",
        luxury: "ちょっと贅沢",
        luxuryDesc: "5〜10万円",
        premium: "プレミアム",
        premiumDesc: "10万円〜",
      },

      // 結果
      yourType: "あなたの旅行タイプは...",
      recommendedSpots: "おすすめスポット",
      travelTips: "旅のヒント",
      startTrip: "旅を始める 🌸",

      // 旅行タイプ
      travelStyles: {
        gourmet: "グルメ探求派",
        active: "アクティブ派",
        relaxGourmet: "癒し＆グルメ派",
        sightseeing: "観光満喫派",
        balanced: "バランス派",
      },
    },

    // マイページ
    mypage: {
      title: "マイページ",
      editName: "タップして名前を編集",
      guest: "ゲスト",
      
      travelType: "あなたの旅行タイプ",
      viewHistory: "閲覧履歴",
      noHistory: "まだ履歴がありません",
      
      settings: "設定",
      notifications: "通知",
      darkMode: "ダークモード",
      language: "言語",
      japanese: "日本語",
      english: "English",
      
      others: "その他",
      about: "アプリについて",
      contact: "お問い合わせ",
      terms: "利用規約",
      privacy: "プライバシーポリシー",
      logout: "ログアウト",
    },

    // 言語ヘルパー
    translation: {
      title: "言語ヘルパー",
      subtitle: "旅先で言葉の壁をなくそう",
      inputPlaceholder: "翻訳したいテキストを入力...",
      translateButton: "翻訳する",
      translating: "翻訳中...",
      clear: "クリア",
      copy: "コピー",
      copied: "コピーしました",
      characters: "文字",
      quickPhrases: "よく使うフレーズ",
      errorMessage: "翻訳できませんでした。もう一度お試しください。",
    },

    // マップ
    map: {
      loading: "マップを読み込み中...",
      locationNotFound: "場所が見つかりませんでした",
    },

    // スポット詳細
    spot: {
      overview: "概要",
      reviews: "口コミ",
      photos: "写真",
      reservation: "予約",
      
      introduction: "スポット紹介",
      aboutReservation: "予約について",
      noReservationInfo: "予約情報はありません",
      goToReservation: "予約サイトへ",
      
      reviewCount: "件の口コミ",
      photoPreparing: "の写真（準備中）",

      // 情報ラベル
      hours: "営業時間",
      address: "住所",
      website: "Webサイト",
      phone: "電話番号",
      price: "料金",
      parking: "駐車場",
      access: "アクセス",
      closedDays: "定休日",
    },
  },

  en: {
    // Common
    common: {
      loading: "Loading...",
      preparing: "Coming soon...",
      next: "Next",
      back: "Back",
      close: "Close",
      save: "Save",
      cancel: "Cancel",
      search: "Search",
      searchPlaceholder: "Search places...",
    },

    // Navigation
    nav: {
      mypage: "My Page",
      reservations: "Reservations",
      map: "Experiences",
      now: "Now",
      posts: "Posts",
      manner: "Tips",
    },

    // Splash
    splash: {
      appName: "Trad Trav",
    },

    // Diagnosis
    diagnosis: {
      title: "Travel Preference Quiz",
      subtitle: "Find your perfect trip",
      resultTitle: "Your Result",
      resultSubtitle: "Your perfect plan",
      
      // Interests
      interestTitle: "What interests you?",
      interestSubtitle: "Select multiple",
      interests: {
        gourmet: "Food & Dining",
        sightseeing: "Sightseeing",
        nature: "Nature & Scenery",
        onsen: "Hot Springs",
        history: "History & Culture",
        outdoor: "Outdoor Activities",
        shopping: "Shopping",
        animals: "Animals",
      },

      // Duration
      durationTitle: "How long is your trip?",
      durations: {
        day: "Day Trip",
        dayDesc: "Quick getaway",
        "1night": "1 Night",
        "1nightDesc": "Weekend trip",
        "2nights": "2 Nights",
        "2nightsDesc": "Relaxing stay",
        "3nights": "3+ Nights",
        "3nightsDesc": "Extended vacation",
      },

      // Companion
      companionTitle: "Who are you traveling with?",
      companions: {
        solo: "Solo",
        couple: "Couple",
        family: "Family",
        friends: "Friends",
      },

      // Budget
      budgetTitle: "What's your budget?",
      budgets: {
        budget: "Budget",
        budgetDesc: "Under ¥30,000",
        standard: "Standard",
        standardDesc: "¥30,000-50,000",
        luxury: "Luxury",
        luxuryDesc: "¥50,000-100,000",
        premium: "Premium",
        premiumDesc: "¥100,000+",
      },

      // Result
      yourType: "Your travel type is...",
      recommendedSpots: "Recommended Spots",
      travelTips: "Travel Tips",
      startTrip: "Start Your Trip 🌸",

      // Travel styles
      travelStyles: {
        gourmet: "Gourmet Explorer",
        active: "Active Adventurer",
        relaxGourmet: "Relaxation & Food Lover",
        sightseeing: "Sightseeing Enthusiast",
        balanced: "Balanced Traveler",
      },
    },

    // My Page
    mypage: {
      title: "My Page",
      editName: "Tap to edit name",
      guest: "Guest",
      
      travelType: "Your Travel Type",
      viewHistory: "View History",
      noHistory: "No history yet",
      
      settings: "Settings",
      notifications: "Notifications",
      darkMode: "Dark Mode",
      language: "Language",
      japanese: "日本語",
      english: "English",
      
      others: "Others",
      about: "About App",
      contact: "Contact Us",
      terms: "Terms of Service",
      privacy: "Privacy Policy",
      logout: "Log Out",
    },

    // Language Helper
    translation: {
      title: "Language Helper",
      subtitle: "Break language barriers while you travel",
      inputPlaceholder: "Enter text to translate...",
      translateButton: "Translate",
      translating: "Translating...",
      clear: "Clear",
      copy: "Copy",
      copied: "Copied",
      characters: "chars",
      quickPhrases: "Quick Phrases",
      errorMessage: "Translation failed. Please try again.",
    },

    // Map
    map: {
      loading: "Loading map...",
      locationNotFound: "Location not found",
    },

    // Spot details
    spot: {
      overview: "Overview",
      reviews: "Reviews",
      photos: "Photos",
      reservation: "Reservation",
      
      introduction: "About",
      aboutReservation: "Reservation Info",
      noReservationInfo: "No reservation info available",
      goToReservation: "Go to Reservation Site",
      
      reviewCount: " reviews",
      photoPreparing: " photos (coming soon)",

      // Info labels
      hours: "Hours",
      address: "Address",
      website: "Website",
      phone: "Phone",
      price: "Price",
      parking: "Parking",
      access: "Access",
      closedDays: "Closed",
    },
  },
} as const;

export type Translations = (typeof translations)[Language];

