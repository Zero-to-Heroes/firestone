/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BattlegroundsState } from '../../models/_barrel';
import { DeckState } from '../../models/deck-state';
import { GameState } from '../../models/game-state';
import { windrunnerSistersFablePackage } from '../../services/card-utils';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class WindrunnerSistersCounterDefinitionV2 extends CounterDefinitionV2<readonly CardIds[]> {
	public override id: CounterType = 'windrunnerSisters';
	public override image = CardIds.RangerGeneralSylvanas_TIME_609;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [];
	public override keywords: readonly string[] = windrunnerSistersFablePackage.map((c) => this.allCards.getCard(c)?.name).filter(name => !!name);

	protected override advancedTooltipType = 'CheckOffCardsListComponent';

	readonly player = {
		pref: 'playerWindrunnerSistersCounter' as const,
		display: (state: GameState): boolean => {
			if (this.player.value(state)) {
				return true;
			}
			return state.playerDeck.hasRelevantCard(windrunnerSistersFablePackage);
		},
		value: (state: GameState) => {
			return buildValue(state.playerDeck);
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.windrunner-sisters-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.windrunner-sisters-tooltip'),
		},
	};
	readonly opponent = {
		pref: 'opponentWindrunnerSistersCounter' as const,
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
				i18n.translateString('settings.decktracker.your-deck.counters.windrunner-sisters-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.windrunner-sisters-tooltip'),
		},
	};

	constructor(
		private readonly i18n: ILocalizationService,
		protected override readonly allCards: CardsFacadeService,
	) {
		super(allCards);
	}

	protected override formatValue(
		value: readonly CardIds[] | null | undefined,
	): null | undefined | number | string {
		if (!value) {
			return `0`;
		}

		return `${value.length}`;
	}

	protected override advancedTooltipInput(
		side: 'player' | 'opponent',
		gameState: GameState,
		bgState: BattlegroundsState,
		value: readonly CardIds[] | null | undefined,
	): any {
		const sortedWindrunnerSisters = windrunnerSistersFablePackage.sort((a, b) => {
			const aCard = this.allCards.getCard(a);
			const bCard = this.allCards.getCard(b);
			return (aCard.cost ?? 0) - (bCard.cost ?? 0);
		});
		const config: any /*CheckOffCardsListConfig*/ = {
			title: this.i18n.translateString('counters.windrunner-sisters.title'),
			text: this.i18n.translateString(`counters.windrunner-sisters.${side}`),
			cards:
				sortedWindrunnerSisters.map((c) => {
					return {
						cardId: c,
						checked: !value?.includes(c),
						quantity: 1,
					};
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
): readonly CardIds[] | null => {
	const windrunnerSisters = deck.cardsPlayedThisMatch.filter((c) => windrunnerSistersFablePackage.includes(c.cardId as CardIds));
	if (!windrunnerSisters.length) {
		return null;
	}
	return Array.from(new Set(windrunnerSisters.map((c) => c.cardId as CardIds)));
};
