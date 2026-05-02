import type { SearchLocation } from "../components/SearchBar";
import type { TraditionalGenreId } from "./traditionalGenres";
import snapshot from "./traditionalInitialSnapshot.json";

/**
 * 体験発掘マップの初期表示（静的データ）。実行時は Google API を呼びません。
 *
 * 内容を Places と同じ状態に更新する手順:
 * 1. リポジトリ直下に `.env.local`（または `.env`）で `GOOGLE_MAPS_API_KEY` を設定する
 * 2. `npm run snapshot-traditional-initial` を実行する（`traditionalInitialSnapshot.json` と画像が上書きされる）
 * 3. `git diff app/data/traditionalInitialSnapshot.json` で差分を確認しコミットする
 * 4. 開発サーバを起動している場合は一度止めて `npm run dev` し直す（JSON の import を取り直すため）
 *
 * スナップショット取得では `editorialSummary` のほか `reviewSummary`・`generativeSummary`・評価件数などを結合して概要に使います（Places のフィールド課金に注意）。
 *
 * API を使わず手で直す場合は `traditionalInitialSnapshot.json` を直接編集すれば足ります。
 */
export const LOCAL_TRADITIONAL_LOCATIONS = snapshot as Record<TraditionalGenreId, SearchLocation[]>;
