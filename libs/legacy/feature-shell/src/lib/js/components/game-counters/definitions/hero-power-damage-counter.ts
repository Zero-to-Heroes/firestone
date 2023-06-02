import { CardIds } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class HeroPowerDamageCounterDefinition implements CounterDefinition<GameState, number> {
	readonly type = 'heroPowerDamage';
	readonly value: number;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly standardCounter = true;

	constructor(
		private readonly side: 'player' | 'opponent',
		private readonly allCards,
		private readonly i18n: LocalizationFacadeService,
	) {}

	public static create(
		side: 'player' | 'opponent',
		allCards: CardsFacadeService,
		i18n: LocalizationFacadeService,
	): HeroPowerDamageCounterDefinition {
		return new HeroPowerDamageCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): number {
		const deck = this.side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deck.heroPowerDamageThisMatch ?? 0;
	}

	public emit(heroPowerDamage: number): NonFunctionProperties<HeroPowerDamageCounterDefinition> {
		return {
			type: 'heroPowerDamage',
			value: heroPowerDamage,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.MordreshFireEye}.jpg`,
			cssClass: 'hero-power-damage-counter',
			tooltip: this.i18n.translateString(`counters.hero-power-damage.${this.side}`, { value: heroPowerDamage }),
			standardCounter: true,
		};
	}
}
