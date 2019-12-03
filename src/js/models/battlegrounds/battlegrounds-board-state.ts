import { Entity } from '@firestone-hs/replay-parser';

export class BattlegroundsBoardState {
	readonly turn: number;
	readonly minions: readonly Entity[] = [];
}
