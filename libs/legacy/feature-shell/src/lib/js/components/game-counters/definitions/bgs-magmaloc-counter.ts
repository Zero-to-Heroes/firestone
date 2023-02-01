import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState } from '@models/decktracker/game-state';
import { BattlegroundsState } from '../../../models/battlegrounds/battlegrounds-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class BgsMagmalocCounterDefinition implements CounterDefinition {
	readonly type = 'bgsMagmaloc';
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
	): BgsMagmalocCounterDefinition {
		const minionsPlayedThisTurn =
			gameState.currentGame.liveStats.minionsPlayedOverTurn.find(
				(info) => info.turn === gameState.currentGame.currentTurn,
			)?.value ?? 0;
		return {
			type: 'bgsMagmaloc',
			value: 1 + minionsPlayedThisTurn,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.Magmaloc}.jpg`,
			cssClass: 'magmaloc-counter',
			tooltip: i18n.translateString(`counters.bgs-magmaloc.${side}`, { value: 1 + minionsPlayedThisTurn }),
			standardCounter: true,
		};
	}
}
