import { DuelsDeckStat } from './duels-player-stats';

export class DuelsGroupedDecks {
	readonly header: string;
	readonly decks: readonly DuelsDeckStat[];

	public static create(base: DuelsGroupedDecks): DuelsGroupedDecks {
		return Object.assign(new DuelsGroupedDecks(), base);
	}
}
