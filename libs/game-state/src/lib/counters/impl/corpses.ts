/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardClass, CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { initialHeroClassIs } from '../../models/hero-card';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class CorpsesCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'corpses';
	// Trying to find something that looks like a corpse
	public override image = CardIds.Corpsicle_VAC_427;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [];

	readonly player = undefined;
	readonly opponent = {
		pref: 'opponentCorpsesCounter' as const,
		display: (state: GameState): boolean => {
			// When the opponent is a DK or Tourist DK, the corpse counter is shown by default in the game
			if (initialHeroClassIs(state.opponentDeck.hero, [CardClass.DEATHKNIGHT])) {
				this.debug && console.debug(this.type, 'opponent is a DK');
				return false;
			}

			// When the opponent has a corpse-spending card on board, the counter appears by default
			if (
				state.opponentDeck.board.some((c) =>
					this.allCards.getCard(c.cardId).mechanics?.includes(GameTag[GameTag.SPEND_CORPSE]),
				)
			) {
				this.debug &&
					console.debug(
						this.type,
						'opponent has a corpse-spending card on board',
						state.opponentDeck.board.filter((c) =>
							this.allCards.getCard(c.cardId).mechanics?.includes(GameTag[GameTag.SPEND_CORPSE]),
						),
					);
				return false;
			}

			const hasRelevantCards = state.opponentDeck
				.getAllPotentialFutureCards()
				.some((c) => this.allCards.getCard(c.cardId).mechanics?.includes(GameTag[GameTag.SPEND_CORPSE]));

			return hasRelevantCards;
		},
		value: (state: GameState) => {
			return (state.opponentDeck.corpsesGainedThisGame ?? 0) - (state.opponentDeck.corpsesSpent ?? 0);
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.corpses-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.corpses-tooltip'),
		},
	};

	constructor(
		private readonly i18n: ILocalizationService,
		private readonly allCards: CardsFacadeService,
	) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const value = this[side]?.value(gameState) ?? 0;
		return this.i18n.translateString(`counters.corpses.${side}`, { value: value });
	}
}
