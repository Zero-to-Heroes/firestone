import { CardIds, GameType, SpellSchool } from '@firestone-hs/reference-data';
import { isBattlegrounds } from '../../services/battlegrounds/bgs-utils';
import { CardsFacadeService } from '../../services/cards-facade.service';
import { NonFunctionProperties } from '../../services/utils';
import { MatchInfo } from '../match-info';
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

	readonly matchInfo: MatchInfo;
	readonly playerDeck: DeckState = new DeckState();
	readonly opponentDeck: DeckState = new DeckState();
	readonly mulliganOver: boolean = false;
	readonly metadata: Metadata = new Metadata();
	readonly currentTurn: number | 'mulligan' = 'mulligan';
	readonly gameStarted: boolean;
	readonly matchStartTimestamp: number;
	readonly gameEnded: boolean;
	readonly spectating: boolean;
	readonly cardsPlayedThisMatch: readonly ShortCard[] = [];

	readonly reconnectOngoing: boolean;

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

	public lastBattlecryPlayedForMacaw(allCards: CardsFacadeService, side: 'player' | 'opponent'): string {
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

	public lastShadowSpellPlayed(allCards: CardsFacadeService, side: 'player' | 'opponent'): string {
		return this.cardsPlayedThisMatch
			.filter((card) => card.side === side)
			.filter((card) => {
				const ref = allCards.getCard(card.cardId);
				return ref.spellSchool === SpellSchool[SpellSchool.SHADOW];
			})
			.pop()?.cardId;
	}

	public getSpellsPlayedForPlayer(allCards: CardsFacadeService, side: 'player' | 'opponent'): readonly string[] {
		return this.cardsPlayedThisMatch
			.filter((card) => card.side === side)
			.filter((card) => {
				const ref = allCards.getCard(card.cardId);
				return ref.type?.toLowerCase() === 'spell';
			})
			.map((card) => card.cardId);
	}
}

export interface ShortCard {
	readonly entityId: number;
	readonly cardId: string;
	readonly side: 'player' | 'opponent';
}
