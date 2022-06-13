import { CardIds } from '@firestone-hs/reference-data';
import { sumOnArray } from '@services/utils';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class AbyssalCurseCounterDefinition implements CounterDefinition {
	readonly type = 'abyssalCurse';
	readonly value: number | string;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly standardCounter = true;

	static create(gameState: GameState, side: string, i18n: LocalizationFacadeService): AbyssalCurseCounterDefinition {
		const deck = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		if (!deck) {
			return null;
		}

		const lastCurseDamage = deck.abyssalCurseHighestValue ?? 0;
		const totalDamageFromCursesInHand = sumOnArray(
			deck.hand.filter((c) => c.cardId == CardIds.SirakessCultist_AbyssalCurseToken),
			(c) => c.mainAttributeChange + 1,
		);
		return {
			type: 'abyssalCurse',
			value: `${lastCurseDamage}/${totalDamageFromCursesInHand}`,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.SirakessCultist_AbyssalCurseToken}.jpg`,
			cssClass: 'abyssal-curse-counter',
			tooltip: i18n.translateString(`counters.abyssal-curse-2.${side}`, {
				value: lastCurseDamage,
				totalDamageFromCursesInHand: totalDamageFromCursesInHand,
			}),
			standardCounter: true,
		};
	}
}
