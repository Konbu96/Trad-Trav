import { TIPS_TOPICS } from "../data/helpfulInfo";
import type { Language } from "../i18n/translations";

const JA_BY_ID = Object.fromEntries(TIPS_TOPICS.map((topic) => [topic.id, topic.keywords])) as Record<string, string[]>;

/** 豆知識・旅ガイドトピックのキーワードチップ（日本語は `helpfulInfo` の正本） */
const EN: Record<string, string[]> = {
  "tipping-customs": ["Tipping", "Payment", "Culture"],
  "simple-japanese-phrases": ["Japanese", "Conversation", "Communication"],
  "convenience-stores": ["Convenience store", "Shopping", "Handy"],
  "vending-machines": ["Vending machine", "Drinks", "Purchase"],
  "english-support": ["English", "Help", "Sightseeing"],
  "train-punctuality": ["Trains", "On time", "Transit"],
  "cash-payment": ["Cash", "Payment", "Shops"],
  "free-water-tea": ["Water", "Free", "Restaurants"],
  "seasonal-enjoyment": ["Seasons", "Culture", "Food"],
  "four-seasons": ["Four seasons", "Nature", "Travel"],
  "regional-specialties": ["Local food", "Specialties", "Souvenirs"],
  "menu-photos": ["Menu", "Photos", "Ordering"],
  "toilets-japan": ["Restrooms", "Facilities", "Clean"],
  "onsen-bathing": ["Hot springs", "Bathing", "Etiquette"],
  "shoes-off-indoors": ["Shoes", "Indoors", "Etiquette"],
  "oshibori": ["Hand towel", "Dining", "Etiquette"],
  "service-politeness": ["Service", "Staff", "Hospitality"],
  "product-quality": ["Quality", "Shopping", "Trust"],
  "ic-card-transport": ["IC card", "Transit", "Tap to pay"],
  "asking-for-help": ["Questions", "Help", "Reassurance"],
  "dining-reservation-guide": ["Booking", "Dining", "Workshops", "Venues", "Hotels", "English"],
  "payment-guide": ["Payment", "Checkout", "Register", "Receipt", "Staff", "Bag"],
  "public-transit-guide": ["Trains", "Tickets", "Fare", "Gates", "Japan Transit Planner"],
  "toilet-guide": ["Restrooms", "Station", "Accessible", "Bidet"],
  "experience-flow": ["Workshop", "Booking", "Day-of", "Flow", "Prep"],
};

const ZH: Record<string, string[]> = {
  "tipping-customs": ["小费", "支付", "文化"],
  "simple-japanese-phrases": ["日语", "会话", "沟通"],
  "convenience-stores": ["便利店", "购物", "便利"],
  "vending-machines": ["自动售货机", "饮料", "购买"],
  "english-support": ["英语", "服务", "观光"],
  "train-punctuality": ["电车", "准点", "交通"],
  "cash-payment": ["现金", "支付", "店铺"],
  "free-water-tea": ["水", "免费", "餐饮店"],
  "seasonal-enjoyment": ["季节", "文化", "饮食"],
  "four-seasons": ["四季", "自然", "观光"],
  "regional-specialties": ["名产", "料理", "伴手礼"],
  "menu-photos": ["菜单", "照片", "点餐"],
  "toilets-japan": ["厕所", "设施", "卫生"],
  "onsen-bathing": ["温泉", "入浴", "礼仪"],
  "shoes-off-indoors": ["脱鞋", "室内", "习惯"],
  "oshibori": ["湿巾", "餐饮店", "礼仪"],
  "service-politeness": ["服务", "接待", "日本"],
  "product-quality": ["品质", "购物", "安心"],
  "ic-card-transport": ["IC卡", "交通", "支付"],
  "asking-for-help": ["询问", "帮助", "安心"],
  "dining-reservation-guide": ["预约", "餐厅", "体验", "设施", "酒店", "英语"],
  "payment-guide": ["支付", "结账", "收银", "小票", "店员", "袋子"],
  "public-transit-guide": ["电车", "车票", "票价", "闸机", "换乘应用"],
  "toilet-guide": ["厕所", "车站", "无障碍", "温水洗净"],
  "experience-flow": ["体验", "预约", "当天", "流程", "准备"],
};

const KO: Record<string, string[]> = {
  "tipping-customs": ["팁", "결제", "문화"],
  "simple-japanese-phrases": ["일본어", "대화", "소통"],
  "convenience-stores": ["편의점", "쇼핑", "편리"],
  "vending-machines": ["자판기", "음료", "구매"],
  "english-support": ["영어", "안내", "관광"],
  "train-punctuality": ["전철", "정시", "교통"],
  "cash-payment": ["현금", "결제", "가게"],
  "free-water-tea": ["물", "무료", "음식점"],
  "seasonal-enjoyment": ["계절", "문화", "음식"],
  "four-seasons": ["사계", "자연", "관광"],
  "regional-specialties": ["명물", "요리", "기념품"],
  "menu-photos": ["메뉴", "사진", "주문"],
  "toilets-japan": ["화장실", "시설", "청결"],
  "onsen-bathing": ["온천", "입욕", "에티켓"],
  "shoes-off-indoors": ["실내화", "실내", "습관"],
  "oshibori": ["물수건", "음식점", "매너"],
  "service-politeness": ["서비스", "접객", "일본"],
  "product-quality": ["품질", "쇼핑", "안심"],
  "ic-card-transport": ["IC카드", "교통", "결제"],
  "asking-for-help": ["질문", "도움", "안심"],
  "dining-reservation-guide": ["예약", "레스토랑", "체험", "시설", "호텔", "영어"],
  "payment-guide": ["결제", "계산대", "계산원", "영수증", "봉투"],
  "public-transit-guide": ["전철", "승차권", "요금", "개찰구", "Japan Transit Planner"],
  "toilet-guide": ["화장실", "역", "다목적", "비데"],
  "experience-flow": ["체험", "예약", "당일", "흐름", "준비"],
};

export function getHelpfulTopicKeywords(topicId: string, language: Language): string[] {
  if (language === "ja") return JA_BY_ID[topicId] ?? [];
  const map = language === "en" ? EN : language === "zh" ? ZH : KO;
  return map[topicId] ?? JA_BY_ID[topicId] ?? [];
}
