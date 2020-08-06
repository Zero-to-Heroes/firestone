import { GameStat } from './game-stat';

export class GameStats {
	// Ordered from newest (index 0) to oldest
	readonly stats: readonly GameStat[] = [];

	public update(base: GameStats): GameStats {
		return Object.assign(new GameStats(), this, base);
	}
}
