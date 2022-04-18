import { CardIds, Race } from '@firestone-hs/reference-data';
import { GameState } from '@models/decktracker/game-state';
import { CardsFacadeService } from '@services/cards-facade.service';
import { BattlegroundsState } from '../../../models/battlegrounds/battlegrounds-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class BgsSouthseaStrongarmCounterDefinition implements CounterDefinition {
	readonly type = 'bgsSouthsea';
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
	): BgsSouthseaStrongarmCounterDefinition {
		const boughtInfo = gameState.currentGame.liveStats.minionsBoughtOverTurn.find(
			(info) => info.turn === gameState.currentGame.currentTurn,
		);
		const numberOfStrongarms =
			1 +
			(boughtInfo?.cardIds ?? [])
				.map((cardId) => allCards.getCard(cardId).race)
				.filter((race) =>
					[Race.PIRATE, Race.ALL].map((race) => Race[race].toLowerCase()).includes(race?.toLowerCase()),
				).length;
		return {
			type: 'bgsSouthsea',
			value: numberOfStrongarms,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.SouthseaStrongarm}.jpg`,
			cssClass: 'southsea-counter',
			tooltip: i18n.translateString(`counters.bgs-southsea.${side}`, { value: numberOfStrongarms }),
			standardCounter: true,
		};
	}
}
