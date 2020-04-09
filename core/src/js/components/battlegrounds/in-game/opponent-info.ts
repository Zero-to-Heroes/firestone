import { Entity } from '@firestone-hs/replay-parser';
import { BgsTavernUpgrade } from '../../../models/battlegrounds/in-game/bgs-tavern-upgrade';
import { BgsTriple } from '../../../models/battlegrounds/in-game/bgs-triple';

export interface OpponentInfo {
	id: string;
	heroPowerCardId: string;
	icon: string;
	name: string;
	tavernTier: string;
	boardMinions: readonly Entity[];
	boardTurn: number;
	tavernUpgrades: readonly BgsTavernUpgrade[];
	triples: readonly BgsTriple[];
	isNextOpponent: boolean;
	nextBattle: BattleResult;
	battleSimulationStatus: 'empty' | 'waiting-for-result' | 'done';
	health: number;
	maxHealth: number;
}

export interface BattleResult {
	wonPercent: number;
	tiedPercent: number;
	lostPercent: number;
	averageDamageWon: number;
	averageDamageLost: number;
}
