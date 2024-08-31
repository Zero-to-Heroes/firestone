import { CardIds, Race } from '@firestone-hs/reference-data';
import { BattlegroundsState } from '@firestone/battlegrounds/core';
import { GameState } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class BgsTuskarrRaiderCounterDefinition
	implements CounterDefinition<{ deckState: GameState; bgState: BattlegroundsState }, readonly string[], boolean>
{
	readonly type = 'bgsTuskarrRaider';
	readonly value: string;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly standardCounter = true;

	constructor(
		private readonly side: 'player' | 'opponent',
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {}

	public static async create(
		side: 'player' | 'opponent',
		allCards: CardsFacadeService,
		i18n: LocalizationFacadeService,
		prefs: PreferencesService,
	): Promise<BgsTuskarrRaiderCounterDefinition> {
		await prefs.isReady();
		const result = new BgsTuskarrRaiderCounterDefinition(side, allCards, i18n);
		return result;
	}

	public select(input: { deckState: GameState; bgState: BattlegroundsState }): readonly string[] {
		return input.deckState.playerDeck.cardsPlayedThisMatch
			?.map((c) => c.cardId)
			?.filter(
				(c) =>
					this.allCards.getCard(c).races?.includes(Race[Race.PIRATE]) ||
					this.allCards.getCard(c).races?.includes(Race[Race.ALL]),
			);
	}

	public emit(
		piratesPlayedThisMatch: readonly string[],
		countersUseExpandedView: boolean,
	): NonFunctionProperties<BgsTuskarrRaiderCounterDefinition> {
		return {
			type: 'bgsTuskarrRaider',
			value: `${piratesPlayedThisMatch.length}`,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.TuskarrRaider_TB_BaconShop_HERO_18_Buddy}.jpg`,
			cssClass: 'bgs-tuskarr-raider',
			tooltip: this.i18n.translateString(`counters.bgs-tuskarr-raider.${this.side}`, {
				value: piratesPlayedThisMatch.length,
			}),
			standardCounter: true,
		};
	}
}
