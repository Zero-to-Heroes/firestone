import { ArenaCardData, PlayerClass } from '@firestone-hs/arena-stats';

export interface ArenaCombinedCardStats {
	lastUpdated: Date;
	context: 'global' | PlayerClass;
	stats: ArenaCombinedCardStat[];
}

export interface ArenaCombinedCardStat {
	cardId: string;
	matchStats: ArenaCardData;
	draftStats: ArenaDraftCardStat | null;
}

export interface ArenaDraftCardStat {
	pickRateImpact: number | null;
	totalOffered: number;
	totalPicked: number;
	pickRate: number;
	totalOfferedHighWins: number;
	totalPickedHighWins: number;
	pickRateHighWins: number | null;
}
