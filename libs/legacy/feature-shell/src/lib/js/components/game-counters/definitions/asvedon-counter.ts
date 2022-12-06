import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '../../../models/decktracker/game-state';
import { CardsFacadeService } from '../../../services/cards-facade.service';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class AsvedonCounterDefinition implements CounterDefinition {
	readonly type = 'asvedon';
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
	): AsvedonCounterDefinition {
		const counterOwnerDeck = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		const otherDeck = side === 'player' ? gameState.opponentDeck : gameState.playerDeck;
		if (!counterOwnerDeck || !otherDeck) {
			return null;
		}

		const spells = otherDeck.spellsPlayedThisMatch;
		const lastPlayedSpell: string = !!spells?.length ? spells[spells.length - 1]?.cardId : null;
		if (!lastPlayedSpell) {
			return null;
		}
		const tooltip = i18n.translateString(`counters.asvedon.${side}`, {
			value: allCards.getCard(lastPlayedSpell).name,
		});
		return {
			type: 'asvedon',
			value: null,
			valueImg: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.AsvedonTheGrandshield}.jpg`,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${lastPlayedSpell}.jpg`,
			cssClass: 'asvedon-counter',
			tooltip: tooltip,
			cardTooltips: [lastPlayedSpell],
			standardCounter: true,
		};
	}
}
