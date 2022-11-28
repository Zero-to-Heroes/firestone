import { CardIds, Race } from '@firestone-hs/reference-data';
import { GameState } from '@models/decktracker/game-state';
import { CardsFacadeService } from '@services/cards-facade.service';
import { BattlegroundsState } from '../../../models/battlegrounds/battlegrounds-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class BgsMajordomoCounterDefinition implements CounterDefinition {
	readonly type = 'bgsMajordomo';
	readonly value: number;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly standardCounter = true;

	static create(
		gameState: BattlegroundsState,
		side: string,
		deckState: GameState,
		allCards: CardsFacadeService,
		i18n: LocalizationFacadeService,
	): BgsMajordomoCounterDefinition {
		const deck = side === 'player' ? deckState.playerDeck : deckState.opponentDeck;
		const value = deck.cardsPlayedThisTurn
			.map((card) => allCards.getCard(card.cardId).race)
			.filter((race) =>
				[Race.ELEMENTAL, Race.ALL].map((race) => Race[race].toLowerCase()).includes(race?.toLowerCase()),
			).length;
		return {
			type: 'bgsMajordomo',
			value: value,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.MajordomoExecutus_BGS_105}.jpg`,
			cssClass: 'majordomo-counter',
			tooltip: i18n.translateString(`counters.bgs-majordomo.${side}`, { value: value }),
			standardCounter: true,
		};
	}
}
