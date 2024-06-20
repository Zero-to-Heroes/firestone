import { CardIds } from '@firestone-hs/reference-data';
import { BattlegroundsState, NumericTurnInfo } from '@firestone/battlegrounds/common';
import { GameState } from '@firestone/game-state';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class BgsMagmalocCounterDefinition
	implements
		CounterDefinition<
			{ deckState: GameState; bgState: BattlegroundsState },
			{
				minionsPlayedOverTurn: readonly NumericTurnInfo[];
				currentTurn: number;
			}
		>
{
	readonly type = 'bgsMagmaloc';
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
	): BgsMagmalocCounterDefinition {
		return new BgsMagmalocCounterDefinition(side, allCards, i18n);
	}

	public select(input: { deckState: GameState; bgState: BattlegroundsState }): {
		minionsPlayedOverTurn: readonly NumericTurnInfo[];
		currentTurn: number;
	} {
		return {
			minionsPlayedOverTurn: input?.bgState?.currentGame?.liveStats?.minionsPlayedOverTurn,
			currentTurn: input?.bgState?.currentGame?.currentTurn,
		};
	}

	public emit(input: {
		minionsPlayedOverTurn: readonly NumericTurnInfo[];
		currentTurn: number;
	}): NonFunctionProperties<BgsMagmalocCounterDefinition> {
		const minionsPlayedThisTurn =
			input.minionsPlayedOverTurn?.find((info) => info.turn === input.currentTurn)?.value ?? 0;
		return {
			type: 'bgsMagmaloc',
			value: 1 + minionsPlayedThisTurn,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.Magmaloc_BG25_046}.jpg`,
			cssClass: 'magmaloc-counter',
			tooltip: this.i18n.translateString(`counters.bgs-magmaloc.${this.side}`, {
				value: 1 + minionsPlayedThisTurn,
			}),
			standardCounter: true,
		};
	}
}
