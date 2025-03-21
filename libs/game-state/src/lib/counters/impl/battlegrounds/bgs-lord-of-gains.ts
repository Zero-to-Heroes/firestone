import { CardIds, CardType } from '@firestone-hs/reference-data';
import { BattlegroundsState } from '@firestone/battlegrounds/core';
import { groupByFunction2 } from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { DeckCard } from '../../../models/deck-card';
import { GameState } from '../../../models/game-state';
import { CounterDefinitionV2 } from '../../_counter-definition-v2';
import { CounterType } from '../../_exports';

export class BgsLordOfGainsCounterDefinitionV2 extends CounterDefinitionV2<readonly string[]> {
	public override id: CounterType = 'bgsLordOfGains';
	public override image = CardIds.SlitherspearLordOfGains_BG27_083;
	public override type: 'hearthstone' | 'battlegrounds' = 'battlegrounds';
	public override cards: readonly CardIds[] = [];

	readonly player = {
		pref: 'playerBgsLordOfGainsCounter' as const,
		display: (state: GameState, bgState: BattlegroundsState | null | undefined): boolean =>
			bgState?.currentGame?.phase === 'recruit' &&
			(hasLordOfGains(state.playerDeck.hand) ||
				hasLordOfGains(state.playerDeck.board) ||
				hasLordOfGains(state.opponentDeck.board)),
		value: (state: GameState, bgState: BattlegroundsState | null | undefined) =>
			state.playerDeck.cardsPlayedThisTurn
				?.map((c) => c.cardId)
				?.filter(
					(c) =>
						this.allCards.getCard(c).type?.toUpperCase() === CardType[CardType.SPELL] ||
						this.allCards.getCard(c).type?.toUpperCase() === CardType[CardType.BATTLEGROUND_SPELL],
				),
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.battlegrounds.overlay.counter-lord-of-gains-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.battlegrounds.overlay.counter-lord-of-gains-tooltip'),
		},
	};
	readonly opponent = undefined;

	constructor(private readonly i18n: ILocalizationService, private readonly allCards: CardsFacadeService) {
		super();
	}

	protected override formatValue(value: readonly string[] | null | undefined): null | undefined | number | string {
		return new Set(value ?? []).size;
	}

	protected override tooltip(
		side: 'player' | 'opponent',
		gameState: GameState,
		allCards: CardsFacadeService,
		bgState: BattlegroundsState,
		countersUseExpandedView: boolean,
	): string {
		const value = this[side]?.value(gameState, bgState) ?? [];
		const groupedByCard = groupByFunction2(
			value,
			(cardId: string) =>
				this.allCards.getCard(cardId).battlegroundsNormalDbfId ?? this.allCards.getCard(cardId).dbfId,
		);
		const cardsStrArray = Object.keys(groupedByCard)
			.map((cardId) => this.allCards.getCard(cardId)?.name)
			.sort((a, b) => a.localeCompare(b));
		const cardsStr = countersUseExpandedView ? '<br/>' + cardsStrArray.join('<br/>') : cardsStrArray.join(', ');
		const numberOfDifferentSpells = Object.keys(groupedByCard).length;
		return this.i18n.translateString(`counters.bgs-lord-of-gains.${side}`, {
			value: numberOfDifferentSpells,
			cards: cardsStr,
		});
	}
}

const hasLordOfGains = (zone: readonly DeckCard[]): boolean => {
	return zone
		.filter((card) => card.cardId)
		.some((card) =>
			[CardIds.SlitherspearLordOfGains_BG27_083, CardIds.SlitherspearLordOfGains_BG27_083_G].includes(
				card.cardId as CardIds,
			),
		);
};
