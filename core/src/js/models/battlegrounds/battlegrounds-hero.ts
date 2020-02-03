import { BgsHeroDifficultyLevel } from './bgs-hero-difficulty-level';
import { BgsHeroPowerLevel } from './bgs-hero-power-level';

export class BattlegroundsHero {
	readonly cardId: string;
	readonly heroName: string;
	readonly numberOfGamesPlayed: number;
	readonly averageRank: number;
	readonly powerLevel: BgsHeroPowerLevel;
	readonly difficulty: BgsHeroDifficultyLevel;
	readonly strategy: string;

	public static create(base: BattlegroundsHero): BattlegroundsHero {
		return Object.assign(new BattlegroundsHero(), base);
	}
}
