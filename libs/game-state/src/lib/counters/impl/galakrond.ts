/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardClass, CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { DeckState } from '../../models/deck-state';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class GalakrondCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'galakrond';
	public override image = (state: GameState, side: 'player' | 'opponent') =>
		side === 'player' ? getGalakrondCard(state.playerDeck) : getGalakrondCard(state.opponentDeck);
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [];

	readonly player = {
		pref: 'playerGalakrondCounter' as const,
		display: (state: GameState): boolean => !!state.playerDeck?.containsGalakrond(this.allCards),
		value: (state: GameState) => {
			return state.playerDeck.galakrondInvokesCount ?? 0;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.galakrond-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.galakrond-tooltip'),
		},
	};
	readonly opponent = {
		pref: 'opponentGalakrondCounter' as const,
		display: (state: GameState): boolean => !!state.opponentDeck?.containsGalakrond(this.allCards),
		value: (state: GameState) => {
			return state.opponentDeck.galakrondInvokesCount ?? 0;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.galakrond-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.galakrond-tooltip'),
		},
	};

	constructor(private readonly i18n: ILocalizationService, private readonly allCards: CardsFacadeService) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const value = this[side]?.value(gameState) ?? 0;
		return this.i18n.translateString(`counters.galakrond.${side}`, { value: value });
	}
}

const getGalakrondCard = (deck: DeckState): string => {
	const heroClass = deck.hero?.classes?.[0] ?? CardClass.PRIEST;
	return getGalakrondCardFor(heroClass, 0)!;
};

export const getGalakrondCardFor = (cardClass: CardClass, invokeCount: number): string | null => {
	switch (cardClass) {
		case CardClass.PRIEST:
			if (invokeCount >= 4) {
				return CardIds.GalakrondTheUnspeakable_GalakrondAzerothsEndToken;
			} else if (invokeCount >= 2) {
				return CardIds.GalakrondTheUnspeakable_GalakrondTheApocalypseToken;
			}
			return CardIds.GalakrondTheUnspeakable;
		case CardClass.ROGUE:
			if (invokeCount >= 4) {
				return CardIds.GalakrondTheNightmare_GalakrondAzerothsEndToken;
			} else if (invokeCount >= 2) {
				return CardIds.GalakrondTheNightmare_GalakrondTheApocalypseToken;
			}
			return CardIds.GalakrondTheNightmare;
		case CardClass.SHAMAN:
			if (invokeCount >= 4) {
				return CardIds.GalakrondTheTempest_GalakrondAzerothsEndToken;
			} else if (invokeCount >= 2) {
				return CardIds.GalakrondTheTempest_GalakrondTheApocalypseToken;
			}
			return CardIds.GalakrondTheTempest;
		case CardClass.WARLOCK:
			if (invokeCount >= 4) {
				return CardIds.GalakrondTheWretched_GalakrondAzerothsEndToken;
			} else if (invokeCount >= 2) {
				return CardIds.GalakrondTheWretched_GalakrondTheApocalypseToken;
			}
			return CardIds.GalakrondTheWretched;
		case CardClass.WARRIOR:
			if (invokeCount >= 4) {
				return CardIds.GalakrondTheUnbreakable_GalakrondAzerothsEndToken;
			} else if (invokeCount >= 2) {
				return CardIds.GalakrondTheUnbreakable_GalakrondTheApocalypseToken;
			}
			return CardIds.GalakrondTheUnbreakable;
	}
	return null;
};
