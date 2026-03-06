import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

const BASE_URL = "https://www.visit-hokkaido.jp";

export interface SpotBasicInfo {
  name: string;
  address?: string;
  postalCode?: string;
  phone?: string;
  hours?: string;
  closedDays?: string;
  price?: string;
  parking?: string;
  access?: string;
  website?: string;
  sourceUrl?: string;
}

// HOKKAIDO LOVE! でスポット名を検索し、最初の詳細ページURLを返す
async function searchSpot(name: string): Promise<string | null> {
  const encoded = encodeURIComponent(name);
  const searchUrl = `${BASE_URL}/spot/index_1_2______${encoded}_.html`;

  const res = await fetch(searchUrl, {
    headers: { "Accept-Language": "ja", "User-Agent": "Mozilla/5.0" },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;

  const html = await res.text();
  const $ = cheerio.load(html);

  // 検索結果の最初の detail リンクを取得
  let detailPath: string | null = null;
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    if (!detailPath && /\/spot\/detail_\d+\.html/.test(href)) {
      detailPath = href.startsWith("http") ? href : `${BASE_URL}${href}`;
    }
  });

  return detailPath;
}

// 基本情報ラベルを正規化
const LABEL_MAP: Record<string, keyof SpotBasicInfo> = {
  郵便番号: "postalCode",
  所在地: "address",
  電話番号: "phone",
  営業時間: "hours",
  休業日: "closedDays",
  料金: "price",
  駐車場: "parking",
  アクセス: "access",
};

// 詳細ページをスクレイプして基本情報を返す
async function scrapeDetail(detailUrl: string): Promise<SpotBasicInfo | null> {
  const res = await fetch(detailUrl, {
    headers: { "Accept-Language": "ja", "User-Agent": "Mozilla/5.0" },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;

  const html = await res.text();
  const $ = cheerio.load(html);

  const info: SpotBasicInfo = { name: "", sourceUrl: detailUrl };

  // スポット名（titleタグの先頭部分が最も確実）
  const titleName = $("title").text().split("｜")[0].trim();
  info.name = titleName || $("h1").first().text().trim();

  // 基本情報テーブル / dl を探す
  // パターン1: dl > dt + dd
  $("dl dt, table th").each((_, el) => {
    const label = $(el).text().trim();
    const key = LABEL_MAP[label];
    if (!key) return;

    let value = "";
    const $el = $(el);

    if ($el.is("dt")) {
      value = $el.next("dd").text().trim();
    } else if ($el.is("th")) {
      value = $el.next("td").text().trim();
    }

    if (value) (info as Record<string, string>)[key] = value;
  });

  // パターン2: テーブルの行で th/td が横並びのケース
  $("tr").each((_, row) => {
    const $row = $(row);
    const th = $row.find("th").text().trim();
    const td = $row.find("td").text().trim();
    const key = LABEL_MAP[th];
    if (key && td) (info as Record<string, string>)[key] = td;
  });

  // 関連リンク（公式サイト）
  $("a").each((_, el) => {
    const text = $(el).text().trim();
    const href = $(el).attr("href") || "";
    if (!info.website && (text === "公式サイト" || text.includes("ホームページ")) && href.startsWith("http")) {
      info.website = href;
    }
  });

  return info;
}

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name");
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  try {
    const detailUrl = await searchSpot(name);
    if (!detailUrl) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    const info = await scrapeDetail(detailUrl);
    if (!info) {
      return NextResponse.json({ error: "scrape failed" }, { status: 500 });
    }

    return NextResponse.json(info);
  } catch (err) {
    console.error("spot-info API error:", err);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
