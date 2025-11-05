/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { DeckState } from '../../models/deck-state';
import { GameState } from '../../models/game-state';
import { timeRafaamFablePackage } from '../../services/card-utils';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class RafaamTimeCounterDefinitionV2 extends CounterDefinitionV2<{
	uniqueRafaams: number;
	totalRafaams: number;
	playedRafaams: readonly CardIds[];
}> {
	public override id: CounterType = 'rafaamTime';
	public override image = CardIds.TimethiefRafaam_TIME_005;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [];

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
		private readonly allCards: CardsFacadeService,
	) {
		super();
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

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const value = this[side]?.value(gameState);
		const header = this.i18n.translateString(`counters.rafaam-time.${side}`, {
			unique: value?.uniqueRafaams,
			total: value?.totalRafaams,
		});
		let body = `<div class="body">`;
		for (const rafaam of timeRafaamFablePackage) {
			const card = this.allCards.getCard(rafaam);
			const isPlayed = value?.playedRafaams.includes(rafaam);
			const playedClass = isPlayed ? 'played' : 'not-played';
			const emoji = isPlayed ? '✅' : '❌';
			body += `<div class="rafaam ${playedClass}">${emoji} ${card.name}</div>`;
		}
		body += `</div>`;
		return `
		<div class="time-rafaam">
			<div class="header">${header}</div>
			${body}
		</div>
		`;
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
