import { BnetRegion, GameType } from '@firestone-hs/reference-data';
import { MatchInfo } from '@firestone/memory';
import { ParserGameStateLite } from '@firestone/power-log-parser';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { BattlegroundsState } from './_barrel';
import { DeckState } from './deck-state';
import { Metadata } from './metadata';

// The goal of this state is ultimately to store all the information linked to the live data
// (tracker, BG, constructed second screen, etc.)
export class GameState {
	// Clearly not a good pattern, but since all the objects are immutable, keeping a counter would mean either:
	// - mutating the object every time we add a card, and that's really cumbersome
	// - building a service for this, and that's also really cumbersome. Maybe it's still the preferred option?
	// - doing this :)
	public static playTiming = 0;

	readonly reviewId: string;
	readonly matchInfo: MatchInfo;
	readonly region: BnetRegion;
	readonly playerDeck: DeckState = new DeckState();
	readonly opponentDeck: DeckState = new DeckState();
	readonly mulliganOver: boolean = false;
	readonly metadata: Metadata = new Metadata();
	readonly currentTurn: number | 'mulligan' = 'mulligan';
	get currentTurnNumeric(): number {
		return this.currentTurn === 'mulligan' ? 0 : this.currentTurn;
	}
	readonly gameTagTurnNumber: number = 0;
	readonly gameStarted: boolean;
	readonly matchStartTimestamp: number;
	readonly gameEnded: boolean;
	readonly spectating: boolean;
	readonly doingGameReset: boolean;
	readonly miscCardsDestroyed: readonly string[] = [];

	readonly bgState: BattlegroundsState = new BattlegroundsState();

	readonly parserState?: ParserGameStateLite;
	readonly localPlayerId?: number;
	readonly opponentPlayerId?: number;

	readonly reconnectOngoing: boolean;
	readonly hasReconnected: boolean;

	readonly playerTrackerClosedByUser: boolean;
	readonly opponentTrackerClosedByUser: boolean;

	// When adding new stuff, don't forget to clean them in twitch-auth.service.ts
	public static create(base?: Partial<NonFunctionProperties<GameState>>): GameState {
		return Object.assign(new GameState(), base);
	}

	public update(value: Partial<NonFunctionProperties<GameState>>): GameState {
		return Object.assign(new GameState(), this, value);
	}

	/** @deprecated DO NOT USE IN COMPONENTS (because of electron serialization) */
	public isMercenaries(): boolean {
		return (
			this.metadata.gameType === GameType.GT_MERCENARIES_AI_VS_AI ||
			this.metadata.gameType === GameType.GT_MERCENARIES_FRIENDLY ||
			this.metadata.gameType === GameType.GT_MERCENARIES_PVP ||
			this.metadata.gameType === GameType.GT_MERCENARIES_PVE ||
			this.metadata.gameType === GameType.GT_MERCENARIES_PVE_COOP
		);
	}

	// Not all players finish their battles at the same time. So you might still be in battle, but
	// another player might have already gone back to the tavern and levelled up for instance
	public getCurrentTurnAdjustedForAsyncPlay(): number {
		const currentTurn = this.currentTurn === 'mulligan' ? 0 : this.currentTurn;
		if (this.bgState.currentGame?.phase === 'combat') {
			return currentTurn + 1;
		}
		return currentTurn;
	}
}

export interface ShortCard {
	readonly entityId: number;
	readonly cardId: string;
	readonly side?: 'player' | 'opponent';
	readonly effectiveCost?: number;
}
export interface ShortCardWithTurn extends ShortCard {
	readonly turn: number;
	readonly timestamp?: number;
}
