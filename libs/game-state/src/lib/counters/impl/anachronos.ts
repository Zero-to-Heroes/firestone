/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BattlegroundsState } from '../../models/_barrel';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

const relevantCardIds = [CardIds.Anachronos, CardIds.Anachronos_CORE_RLK_919];

export class AnachronosCounterDefinitionV2 extends CounterDefinitionV2<{
	entityId: number;
	cardId: string;
	turn: number;
	playerEntities: readonly number[];
	opponentEntities: readonly number[];
}> {
	public override id: CounterType = 'anachronos';
	public override image = CardIds.Anachronos;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [];

	readonly player = {
		pref: 'playerAnachronosCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState) => {
			// This won't work with multiple Anachronos, but it's a rather fringe case
			const allAnachronos = [...state.playerDeck.anachronos, ...state.opponentDeck.anachronos];
			const anachronos = allAnachronos[allAnachronos.length - 1];
			if (!anachronos) {
				return null;
			}
			const lastAnachronosTurn = anachronos.turn;
			const delta = 4 - (state.gameTagTurnNumber - lastAnachronosTurn);
			if (delta <= 0) {
				return null;
			}

			return {
				...anachronos,
				turn: Math.ceil(delta / 2),
			};
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.anachronos-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.anachronos-tooltip'),
		},
	};
	readonly opponent = {
		pref: 'opponentAnachronosCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState) => {
			// This won't work with multiple Anachronos, but it's a rather fringe case
			const allAnachronos = [...state.playerDeck.anachronos, ...state.opponentDeck.anachronos];
			const anachronos = allAnachronos[allAnachronos.length - 1];
			if (!anachronos) {
				return null;
			}
			const lastAnachronosTurn = anachronos.turn;
			const delta = 4 - (state.gameTagTurnNumber - lastAnachronosTurn);
			if (delta <= 0) {
				return null;
			}

			return {
				...anachronos,
				turn: Math.ceil(delta / 2),
			};
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.anachronos-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.anachronos-tooltip'),
		},
	};

	constructor(
		private readonly i18n: ILocalizationService,
		private readonly allCards: CardsFacadeService,
	) {
		super();
	}

	protected override formatValue(
		value:
			| {
					entityId: number;
					cardId: string;
					turn: number;
					playerEntities: readonly number[];
					opponentEntities: readonly number[];
			  }
			| null
			| undefined,
	): null | undefined | number | string {
		if (!value) {
			return null;
		}
		return value.turn;
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const value = this[side]?.value(gameState)?.turn ?? 0;
		return this.i18n.translateString(`counters.anachronos.player`, { value: value });
	}

	protected override cardTooltip(
		side: 'player' | 'opponent',
		gameState: GameState,
		bgState: BattlegroundsState,
		value:
			| {
					entityId: number;
					cardId: string;
					turn: number;
					playerEntities: readonly number[];
					opponentEntities: readonly number[];
			  }
			| null
			| undefined,
	): readonly string[] | undefined {
		if (!value) {
			return undefined;
		}
		const entities = side === 'player' ? value.playerEntities : value.opponentEntities;
		if (!entities?.length) {
			return undefined;
		}

		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return entities
			.map((entity) => deckState.findCard(entity)?.card?.cardId)
			.filter((cardId) => cardId) as readonly string[];
	}
}
