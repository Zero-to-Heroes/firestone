import { BgsTavernUpgrade } from '../../../../models/battlegrounds/in-game/bgs-tavern-upgrade';
import { BgsTriple } from '../../../../models/battlegrounds/in-game/bgs-triple';

export interface TwitchBgsState {
	readonly leaderboard: readonly TwitchBgsPlayer[];
	readonly currentTurn: number;
}

export interface TwitchBgsPlayer {
	readonly cardId: string;
	readonly heroPowerCardId: string;
	readonly name: string;
	readonly isMainPlayer: boolean;
	readonly tavernUpgradeHistory: readonly BgsTavernUpgrade[];
	readonly tripleHistory: readonly BgsTriple[];
	readonly lastBoard: TwitchBgsBoard;
	readonly initialHealth: number;
	readonly damageTaken: number;
	readonly leaderboardPlace: number;
}

export interface TwitchBgsBoard {
	readonly turn: number;
	readonly board: readonly TwitchBgsBoardEntity[];
}

export interface TwitchBgsBoardEntity {
	readonly id: number;
	readonly cardID: string;
	readonly tags: readonly { [cardId: string]: number }[];
}
