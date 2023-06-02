import { CardIds } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BattlegroundsState } from '../../../models/battlegrounds/battlegrounds-state';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class BgsPogoCounterDefinition
	implements CounterDefinition<{ deckState: GameState; bgState: BattlegroundsState }, number>
{
	readonly type = 'bgsPogo';
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
	): BgsPogoCounterDefinition {
		return new BgsPogoCounterDefinition(side, allCards, i18n);
	}

	public select(input: { deckState: GameState; bgState: BattlegroundsState }): number {
		return input.bgState.currentGame.pogoHoppersCount;
	}

	public emit(pogoHopperSize: number): NonFunctionProperties<BgsPogoCounterDefinition> {
		return {
			type: 'bgsPogo',
			value: pogoHopperSize,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.PogoHopper_BGS_028}.jpg`,
			cssClass: 'pogo-counter',
			tooltip: this.i18n.translateString(`counters.pogo.${this.side}`, { value: pogoHopperSize }),
			standardCounter: true,
		};
	}
}
