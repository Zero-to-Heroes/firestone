/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BattlegroundsState } from '../../models/_barrel';
import { DeckState } from '../../models/deck-state';
import { GameState } from '../../models/game-state';
import { timeRafaamFablePackage } from '../../services/card-utils';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';
import { CheckOffCard, CheckOffCardsListComponent, CheckOffCardsListConfig } from '../check-off-cards-list.component';

export class RafaamTimeCounterDefinitionV2 extends CounterDefinitionV2<{
	uniqueRafaams: number;
	totalRafaams: number;
	playedRafaams: readonly CardIds[];
}> {
	public override id: CounterType = 'rafaamTime';
	public override image = CardIds.TimethiefRafaam_TIME_005;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [];

	protected override advancedTooltipType = CheckOffCardsListComponent;

	readonly player = {
		pref: 'playerRafaamTimeCounter' as const,
		display: (state: GameState): boolean => {
			if (this.player.value(state)) {
				return true;
			}
			return false;
		},
		value: (state: GameState) => {
			return buildValue(state.playerDeck);
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.rafaam-time-label', {
					cardName: this.allCards.getCard(CardIds.TimethiefRafaam_TIME_005).name,
				}),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.rafaam-time-tooltip'),
		},
	};
	readonly opponent = {
		pref: 'opponentRafaamTimeCounter' as const,
		display: (state: GameState): boolean => {
			if (this.opponent.value(state)) {
				return true;
			}
			return false;
		},
		value: (state: GameState) => {
			return buildValue(state.opponentDeck);
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.rafaam-time-label', {
					cardName: this.allCards.getCard(CardIds.TimethiefRafaam_TIME_005).name,
				}),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.rafaam-time-tooltip'),
		},
	};

	constructor(
		private readonly i18n: ILocalizationService,
		protected override readonly allCards: CardsFacadeService,
	) {
		super(allCards);
	}

	protected override formatValue(
		value: { uniqueRafaams: number; totalRafaams: number } | null | undefined,
	): null | undefined | number | string {
		if (!value) {
			return `0`;
		}

		if (value.uniqueRafaams === value.totalRafaams) {
			return `${value.uniqueRafaams}`;
		}
		return `${value.uniqueRafaams} | ${value.totalRafaams}`;
	}

	protected override advancedTooltipInput(
		side: 'player' | 'opponent',
		gameState: GameState,
		bgState: BattlegroundsState,
		value: { uniqueRafaams: number; totalRafaams: number; playedRafaams: readonly CardIds[] } | null | undefined,
	): any {
		const sortedRafaams = timeRafaamFablePackage.sort((a, b) => {
			const aCard = this.allCards.getCard(a);
			const bCard = this.allCards.getCard(b);
			return (aCard.cost ?? 0) - (bCard.cost ?? 0);
		});
		const config: CheckOffCardsListConfig = {
			title: this.i18n.translateString('counters.rafaam-time.title'),
			text: this.i18n.translateString(`counters.rafaam-time.${side}`, {
				unique: value?.uniqueRafaams,
				total: value?.totalRafaams,
			}),
			cards:
				sortedRafaams?.map((c) => {
					const checkOffCard: CheckOffCard = {
						cardId: c,
						checked: value?.playedRafaams.includes(c) ?? false,
						quantity: 1,
					};
					return checkOffCard;
				}) ?? [],
		};
		return config;
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string | null {
		return null;
	}
}

const buildValue = (
	deck: DeckState,
): { uniqueRafaams: number; totalRafaams: number; playedRafaams: readonly CardIds[] } | null => {
	const rafaams = deck.cardsPlayedThisMatch.filter((c) => timeRafaamFablePackage.includes(c.cardId as CardIds));
	const uniqueRafaams = new Set(rafaams.map((c) => c.cardId)).size;
	const totalRafaams = rafaams.length;
	if (!uniqueRafaams && !totalRafaams) {
		return null;
	}
	return { uniqueRafaams, totalRafaams, playedRafaams: rafaams.map((c) => c.cardId as CardIds) };
};
