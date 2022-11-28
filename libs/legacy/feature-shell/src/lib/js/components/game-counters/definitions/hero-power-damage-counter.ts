import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class HeroPowerDamageCounterDefinition implements CounterDefinition {
	readonly type = 'heroPowerDamage';
	readonly value: number;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly standardCounter = true;

	static create(
		gameState: GameState,
		side: string,
		i18n: LocalizationFacadeService,
	): HeroPowerDamageCounterDefinition {
		const deck = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		if (!deck) {
			return null;
		}

		const heroPowerDamage = deck.heroPowerDamageThisMatch ?? 0;
		return {
			type: 'heroPowerDamage',
			value: heroPowerDamage,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.MordreshFireEye}.jpg`,
			cssClass: 'hero-power-damage-counter',
			tooltip: i18n.translateString(`counters.hero-power-damage.${side}`, { value: heroPowerDamage }),
			standardCounter: true,
		};
	}
}
