import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '../../../models/decktracker/game-state';
import { CardsFacadeService } from '../../../services/cards-facade.service';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class VanessaVanCleefCounterDefinition implements CounterDefinition {
	readonly type = 'vanessaVanCleef';
	readonly value: number | string;
	readonly valueImg: string;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly standardCounter = true;

	static create(
		gameState: GameState,
		side: 'player' | 'opponent',
		allCards: CardsFacadeService,
		i18n: LocalizationFacadeService,
	): VanessaVanCleefCounterDefinition {
		const counterOwnerDeck = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		const otherDeck = side === 'player' ? gameState.opponentDeck : gameState.playerDeck;
		if (!counterOwnerDeck || !otherDeck) {
			return null;
		}

		const lastPlayedCard: string = !!gameState.cardsPlayedThisMatch?.length
			? gameState.cardsPlayedThisMatch[gameState.cardsPlayedThisMatch.length - 1]?.cardId
			: null;
		if (!lastPlayedCard) {
			return null;
		}
		const tooltip = i18n.translateString(`counters.vanessa.${side}`, {
			value: allCards.getCard(lastPlayedCard).name,
		});
		return {
			type: 'vanessaVanCleef',
			value: null,
			valueImg: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.VanessaVancleefCore}.jpg`,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${lastPlayedCard}.jpg`,
			cssClass: 'vanessa-counter',
			tooltip: tooltip,
			standardCounter: true,
		};
	}
}
