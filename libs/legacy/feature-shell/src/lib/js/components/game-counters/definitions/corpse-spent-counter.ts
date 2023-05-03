import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class CorpseSpentCounterDefinition implements CounterDefinition {
	readonly type = 'corpseSpent';
	readonly value: number | string;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly standardCounter = true;

	static create(
		gameState: GameState,
		side: 'player' | 'opponent',
		allCards: CardsFacadeService,
		i18n: LocalizationFacadeService,
	): CorpseSpentCounterDefinition {
		const counterOwnerDeck = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		const tooltip = i18n.translateString(`counters.corpse.${side}`, {
			value: counterOwnerDeck.corpsesSpent,
		});
		return {
			type: 'corpseSpent',
			value: counterOwnerDeck.corpsesSpent,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.ClimacticNecroticExplosion}.jpg`,
			cssClass: 'corpse-counter',
			tooltip: tooltip,
			standardCounter: true,
		};
	}
}
