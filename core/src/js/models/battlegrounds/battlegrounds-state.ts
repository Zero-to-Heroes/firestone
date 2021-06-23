import { Race } from '@firestone-hs/reference-data';
import { VisualAchievement } from '../visual-achievement';
import { BgsGame } from './bgs-game';
import { BgsPanel } from './bgs-panel';
import { BgsPanelId } from './bgs-panel-id.type';
import { BgsPostMatchStats } from './post-match/bgs-post-match-stats';
import { BgsStats } from './stats/bgs-stats';

export class BattlegroundsState {
	readonly inGame: boolean;
	readonly reconnectOngoing: boolean;
	readonly spectating: boolean;
	readonly heroSelectionDone: boolean;
	readonly panels: readonly BgsPanel[] = [];
	readonly currentPanelId: BgsPanelId;
	readonly globalStats: BgsStats;
	readonly currentGame: BgsGame;
	// readonly gameEnded: boolean; // Flag useful mostly for twitch to know when to hide the overlay
	readonly forceOpen: boolean;
	readonly postMatchStats: BgsPostMatchStats;

	readonly highlightedTribes: readonly Race[] = [];
	readonly highlightedMinions: readonly string[] = [];

	readonly heroAchievements: readonly VisualAchievement[];

	public static create(base: BattlegroundsState): BattlegroundsState {
		return Object.assign(new BattlegroundsState(), base);
	}

	public update(base: BattlegroundsState): BattlegroundsState {
		return Object.assign(new BattlegroundsState(), this, base);
	}
}
