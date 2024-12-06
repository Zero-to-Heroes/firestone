import { BnetRegion, CardIds, GameType, SpellSchool, isBattlegrounds } from '@firestone-hs/reference-data';
import { MatchInfo } from '@firestone/memory';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckState } from './deck-state';
import { FullGameState } from './full-game-state';
import { Metadata } from './metadata';

// The goal of this state is ultimately to store all the information linked to the live data
// (tracker, BG, constructed second screen, etc.)
export class GameState {
	// Clearly not a good pattern, but since all the objects are immutable, keeping a counter would mean either:
	// - mutating the object every time we add a card, and that's really cumbersome
	// - building a service for this, and that's also really cumbersome. Maybe it's still the preferred option?
	// - doing this :)
	public static playTiming = 0;

	readonly matchInfo: MatchInfo;
	readonly region: BnetRegion;
	readonly playerDeck: DeckState = new DeckState();
	readonly opponentDeck: DeckState = new DeckState();
	readonly mulliganOver: boolean = false;
	readonly metadata: Metadata = new Metadata();
	readonly currentTurn: number | 'mulligan' = 'mulligan';
	readonly gameTagTurnNumber: number = 0;
	readonly gameStarted: boolean;
	readonly matchStartTimestamp: number;
	readonly gameEnded: boolean;
	readonly spectating: boolean;
	readonly cardsPlayedThisMatch: readonly ShortCard[] = [];
	readonly miscCardsDestroyed: readonly string[] = [];

	// Can use this for non time-sensitive info, as it's only send back every now and then
	// (e.g. for counters)
	readonly fullGameState?: FullGameState;

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

	public isBattlegrounds(): boolean {
		return isBattlegrounds(this.metadata.gameType);
	}

	public isMercenaries(): boolean {
		return (
			this.metadata.gameType === GameType.GT_MERCENARIES_AI_VS_AI ||
			this.metadata.gameType === GameType.GT_MERCENARIES_FRIENDLY ||
			this.metadata.gameType === GameType.GT_MERCENARIES_PVP ||
			this.metadata.gameType === GameType.GT_MERCENARIES_PVE ||
			this.metadata.gameType === GameType.GT_MERCENARIES_PVE_COOP
		);
	}

	public lastBattlecryPlayedForMacaw(allCards: CardsFacadeService, side: 'player' | 'opponent'): string | undefined {
		return (
			this.cardsPlayedThisMatch
				.filter((card) => card.side === side)
				.filter((card) => {
					const ref = allCards.getCard(card.cardId);
					return !!ref.mechanics?.length && ref.mechanics.includes('BATTLECRY');
				})
				// Because we want to know what card the macaw copies, so if we play two macaws in a row we still
				// want the info
				.filter((card) => card.cardId !== CardIds.BrilliantMacaw)
				.pop()?.cardId
		);
	}

	public lastShadowSpellPlayed(allCards: CardsFacadeService, side: 'player' | 'opponent'): string | undefined {
		return this.cardsPlayedThisMatch
			.filter((card) => card.side === side)
			.filter((card) => {
				const ref = allCards.getCard(card.cardId);
				return ref.spellSchool === SpellSchool[SpellSchool.SHADOW];
			})
			.pop()?.cardId;
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
}
