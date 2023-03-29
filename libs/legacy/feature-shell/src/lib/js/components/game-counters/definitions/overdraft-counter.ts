import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class OverdraftCounterDefinition implements CounterDefinition {
	readonly type = 'overdraft';
	readonly value: number | string;
	readonly valueImg: string;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly cardTooltips?: readonly string[];
	readonly standardCounter = true;

	static create(
		gameState: GameState,
		side: 'player' | 'opponent',
		allCards: CardsFacadeService,
		i18n: LocalizationFacadeService,
	): OverdraftCounterDefinition {
		const currentOverloaded = gameState.playerDeck.overloadedCrystals;
		const tooltip = i18n.translateString(`counters.overdraft.${side}`, {
			value: currentOverloaded,
		});
		return {
			type: 'overdraft',
			value: currentOverloaded,
			valueImg: null,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.Overdraft}.jpg`,
			cssClass: 'overdraft-counter',
			tooltip: tooltip,
			standardCounter: true,
		};
	}
}
