import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class ShockspitterCounterDefinition implements CounterDefinition {
	readonly type = 'shockspitter';
	readonly value: number;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly standardCounter = true;

	static create(gameState: GameState, side: string, i18n: LocalizationFacadeService): ShockspitterCounterDefinition {
		const deck = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		if (!deck) {
			return null;
		}

		const totalHeroAttacks = deck.heroAttacksThisMatch ?? 0;
		return {
			type: 'shockspitter',
			value: totalHeroAttacks + 1,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.Shockspitter}.jpg`,
			cssClass: 'shockspitter-counter',
			tooltip: i18n.translateString(`counters.shockspitter.${side}`, { value: totalHeroAttacks + 1 }),
			standardCounter: true,
		};
	}
}
