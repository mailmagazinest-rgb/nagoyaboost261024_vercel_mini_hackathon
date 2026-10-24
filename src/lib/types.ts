/** おみくじの運勢ランク */
export type FortuneRank =
	| '大吉'
	| '中吉'
	| '小吉'
	| '吉'
	| '末吉'
	| '凶'
	| '大凶';

/** 引いた結果そのもの（保存されない静的な内容も含む） */
export interface OmikujiResult {
	rank: FortuneRank;
	message: string;
	lucky: {
		color: string;
		item: string;
		number: number;
	};
}

/** Redis に積む 1 件の記録 */
export interface OmikujiRecord {
	id: string;
	userId: string;
	rank: FortuneRank;
	message: string;
	luckyColor: string;
	luckyItem: string;
	luckyNumber: number;
	/** ISO8601 */
	drawnAt: string;
}
