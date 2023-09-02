import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/decktracker/game-state';
import {
	DEFAULT_CTHUN_ATK,
	DEFAULT_CTHUN_HEALTH,
} from '../../../services/decktracker/event-parser/special-cases/cthun-parser';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class CthunCounterDefinition implements CounterDefinition<GameState, { atk: number; health: number }> {
	readonly type = 'cthun';
	readonly value: string;
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
	): CthunCounterDefinition {
		return new CthunCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): { atk: number; health: number } {
		const deck = this.side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return {
			atk: deck.cthunAtk || DEFAULT_CTHUN_ATK,
			health: deck.cthunHealth || DEFAULT_CTHUN_HEALTH,
		};
	}

	public emit(cthunSize: { atk: number; health: number }): NonFunctionProperties<CthunCounterDefinition> {
		return {
			type: 'cthun',
			value: `${cthunSize.atk}/${cthunSize.health}`,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/OG_280.jpg`,
			cssClass: 'cthun-counter',
			tooltip: this.i18n.translateString(`counters.cthun.${this.side}`, {
				atk: cthunSize.atk,
				health: cthunSize.health,
			}),
			standardCounter: true,
		};
	}
}
