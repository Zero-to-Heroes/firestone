import { ArenaDeckStat } from './arena-player-stats';

export class ArenaGroupedDecks {
	readonly header: string;
	readonly decks: readonly ArenaDeckStat[];

	public static create(base: ArenaGroupedDecks): ArenaGroupedDecks {
		return Object.assign(new ArenaGroupedDecks(), base);
	}
}
