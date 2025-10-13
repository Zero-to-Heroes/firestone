/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds } from '@firestone-hs/reference-data';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { isCardCreated } from '../../models/deck-card';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class GiftsPlayedCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'giftsPlayed';
	public override image = CardIds.ManaGiant;
	public override cards: readonly CardIds[] = [CardIds.ManaGiant, CardIds.Techysaurus_DINO_409];

	readonly opponent = undefined;
	readonly player = {
		pref: 'playerGiftsPlayedCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): number => {
			const cardsPlayed = state.playerDeck?.cardsPlayedThisMatch
				.map((c) => state.playerDeck.findCard(c.entityId)?.card)
				.filter((c) => isCardCreated(c))
				.map((c) => c!.cardId);
			return cardsPlayed.length;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.gifts-played-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.gifts-played-tooltip'),
		},
	};

	constructor(private readonly i18n: ILocalizationService) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		return this.i18n.translateString(`counters.gifts-played.${side}`, {
			value: side === 'player' ? (this.player.value(gameState) ?? 0) : null,
		});
	}
}
