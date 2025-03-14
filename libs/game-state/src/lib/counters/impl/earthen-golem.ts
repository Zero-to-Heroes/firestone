/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class EarthenGolemCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'earthenGolem';
	public override image = CardIds.StoneheartKing_EarthenGolemToken;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [
		CardIds.DiscipleOfAmitus,
		CardIds.StoneheartKing,
		CardIds.StoneheartKing_EarthenGolemToken,
	];

	readonly player = {
		pref: 'playerEarthenGolemCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState) => {
			return state.playerDeck.earthenGolemsSummoned ?? 0;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.earthen-golem-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.earthen-golem-tooltip'),
		},
	};
	readonly opponent = {
		pref: 'opponentEarthenGolemCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState) => {
			return state.opponentDeck.earthenGolemsSummoned ?? 0;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.earthen-golem-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.earthen-golem-tooltip'),
		},
	};

	constructor(private readonly i18n: ILocalizationService, private readonly allCards: CardsFacadeService) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const value = this[side].value(gameState)!;
		return this.i18n.translateString(`counters.specific-summons.${side}`, {
			value: value,
			cardName: this.allCards.getCard(CardIds.StoneheartKing_EarthenGolemToken).name,
		});
	}
}
