import type { Language } from "../i18n/translations";

export type AiKeywordChip = {
  label: string;
  /** API に送る質問文 */
  query: string;
};

const JA: AiKeywordChip[] = [
  { label: "写真・撮影", query: "日本で観光地や飲食店などで写真を撮るときのマナーと注意点を教えてください。" },
  { label: "電車・バス", query: "電車やバスで気をつけるマナーを教えてください。" },
  { label: "温泉", query: "温泉や銭湯に入るときの基本的な流れとマナーを教えてください。" },
  { label: "神社・お寺", query: "神社やお寺を参拝するときのマナーを教えてください。" },
  { label: "支払い", query: "店やレストランでスムーズに会計するときのコツとマナーを教えてください。" },
  { label: "ゴミ", query: "街中や観光地でのゴミの持ち帰りや分別の基本を教えてください。" },
  { label: "電車内の過ごし方", query: "電車内で通話や荷物、優先席について気をつけることを教えてください。" },
  { label: "体験・予約", query: "伝統工芸の体験やワークショップに遅れそうなときや当日の心得を教えてください。" },
];

const EN: AiKeywordChip[] = [
  { label: "Photos", query: "What manners and tips should I know when taking photos at sights or restaurants in Japan?" },
  { label: "Trains & buses", query: "What manners should I follow on trains and buses in Japan?" },
  { label: "Hot springs", query: "What is the basic flow and etiquette for visiting an onsen or sento in Japan?" },
  { label: "Shrines & temples", query: "What manners should I follow when visiting shrines and temples in Japan?" },
  { label: "Paying", query: "How can I pay smoothly at shops and restaurants in Japan? Any etiquette tips?" },
  { label: "Trash", query: "How should I handle trash while walking or sightseeing in Japan?" },
  { label: "On board", query: "What should I watch for on trains about phone calls, luggage, and priority seats in Japan?" },
  { label: "Workshops", query: "Any tips if I might be late for a craft workshop or hands-on experience in Japan?" },
];

const ZH: AiKeywordChip[] = [
  { label: "拍照", query: "在日本观光或餐饮场所拍照时，有哪些礼仪和注意事项？" },
  { label: "电车·巴士", query: "在日本乘坐电车或巴士时需要注意哪些礼仪？" },
  { label: "温泉", query: "在日本泡温泉或钱汤的基本流程与礼仪是什么？" },
  { label: "神社·寺庙", query: "在日本参拜神社或寺庙时有哪些礼仪？" },
  { label: "付款", query: "在日本店铺或餐厅结账时有什么顺畅又得体的方式？" },
  { label: "垃圾", query: "在日本街头或观光时垃圾应如何处理？" },
  { label: "车内", query: "在日本电车内打电话、行李和爱心座方面要注意什么？" },
  { label: "体验·预约", query: "参加传统工艺体验或工作坊可能迟到时该怎么办？" },
];

const KO: AiKeywordChip[] = [
  { label: "사진", query: "일본에서 관광지나 음식점 등에서 사진을 찍을 때 지켜야 할 매너와 주의점을 알려 주세요." },
  { label: "전철·버스", query: "일본에서 전철이나 버스를 이용할 때의 매너를 알려 주세요." },
  { label: "온천", query: "일본의 온천이나 센토에 들 때 기본적인 순서와 매너를 알려 주세요." },
  { label: "신사·사찰", query: "일본의 신사나 사찰을 참배할 때의 매너를 알려 주세요." },
  { label: "결제", query: "일본의 가게나 레스토랑에서 매끄럽게 계산할 때의 팁과 매너를 알려 주세요." },
  { label: "쓰레기", query: "일본에서 길이나 관광지에서 쓰레기를 처리하는 기본을 알려 주세요." },
  { label: "차내", query: "일본 전철 안에서 통화·짐·우선석에 관해 주의할 점을 알려 주세요." },
  { label: "체험·예약", query: "일본의 전통 공예 체험이나 워크숍에 늦을 것 같을 때의 대처를 알려 주세요." },
];

export function getAiKeywordChips(language: Language): AiKeywordChip[] {
  switch (language) {
    case "en":
      return EN;
    case "zh":
      return ZH;
    case "ko":
      return KO;
    default:
      return JA;
  }
}
