import { CardIds, Race } from '@firestone-hs/reference-data';
import { BattlegroundsState, NumericTurnInfoWithCardIds } from '@firestone/battlegrounds/core';
import { GameState } from '@firestone/game-state';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class BgsSouthseaStrongarmCounterDefinition
	implements
		CounterDefinition<
			{ deckState: GameState; bgState: BattlegroundsState },
			{
				minionsBoughtOverTurn: readonly NumericTurnInfoWithCardIds[];
				currentTurn: number;
			}
		>
{
	readonly type = 'bgsSouthsea';
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
	): BgsSouthseaStrongarmCounterDefinition {
		return new BgsSouthseaStrongarmCounterDefinition(side, allCards, i18n);
	}

	public select(input: { deckState: GameState; bgState: BattlegroundsState }): {
		minionsBoughtOverTurn: readonly NumericTurnInfoWithCardIds[];
		currentTurn: number;
	} {
		return {
			minionsBoughtOverTurn: input.bgState.currentGame.liveStats.minionsBoughtOverTurn,
			currentTurn: input.bgState.currentGame.currentTurn,
		};
	}

	public emit(input: {
		minionsBoughtOverTurn: readonly NumericTurnInfoWithCardIds[];
		currentTurn: number;
	}): NonFunctionProperties<BgsSouthseaStrongarmCounterDefinition> {
		const boughtInfo = input.minionsBoughtOverTurn.find((info) => info.turn === input.currentTurn);
		const numberOfStrongarms = (boughtInfo?.cardIds ?? [])
			.flatMap((cardId) => this.allCards.getCard(cardId).races ?? [])
			.filter((race) =>
				[Race.PIRATE, Race.ALL].map((race) => Race[race].toLowerCase()).includes(race?.toLowerCase()),
			).length;
		return {
			type: 'bgsSouthsea',
			value: numberOfStrongarms,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.SouthseaStrongarm_BGS_048}.jpg`,
			cssClass: 'southsea-counter',
			tooltip: this.i18n.translateString(`counters.bgs-southsea.${this.side}`, { value: numberOfStrongarms }),
			standardCounter: true,
		};
	}
}
