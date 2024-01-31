import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BattlegroundsState } from '../../../models/battlegrounds/battlegrounds-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class BgsBloodGemCounterDefinition
	implements
		CounterDefinition<
			{ deckState: GameState; bgState: BattlegroundsState },
			{
				attack: number;
				health: number;
			}
		>
{
	readonly type = 'bgsBloodGem';
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
	): BgsBloodGemCounterDefinition {
		return new BgsBloodGemCounterDefinition(side, allCards, i18n);
	}

	public select(input: { deckState: GameState; bgState: BattlegroundsState }): {
		attack: number;
		health: number;
	} {
		return {
			attack: 1 + (input.bgState.currentGame.bloodGemAttackBuff ?? 0),
			health: 1 + (input.bgState.currentGame.bloodGemHealthBuff ?? 0),
		};
	}

	public emit(input: { attack: number; health: number }): NonFunctionProperties<BgsBloodGemCounterDefinition> {
		return {
			type: 'bgsBloodGem',
			value: `${input.attack}/${input.health}`,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.BloodGem}.jpg`,
			cssClass: 'blood-gem-counter',
			tooltip: this.i18n.translateString(`counters.bgs-blood-gem.${this.side}`, {
				cardName: this.allCards.getCard(CardIds.BloodGem).name,
				attack: input.attack,
				health: input.health,
			}),
			standardCounter: true,
		};
	}
}
