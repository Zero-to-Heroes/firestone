import { CardIds, Race } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BattlegroundsState } from '../../../models/_barrel';
import { DeckCard } from '../../../models/deck-card';
import { GameState } from '../../../models/game-state';
import { CounterDefinitionV2 } from '../../_counter-definition-v2';
import { CounterType } from '../../_exports';

export class BgsTuskarrRaiderCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'bgsTuskarrRaider';
	public override image = CardIds.TuskarrRaider_TB_BaconShop_HERO_18_Buddy;
	public override type: 'hearthstone' | 'battlegrounds' = 'battlegrounds';
	public override cards: readonly CardIds[] = [];

	readonly player = {
		pref: 'playerBgsTuskarrRaiderCounter' as const,
		display: (state: GameState, bgState: BattlegroundsState | null | undefined): boolean =>
			bgState?.currentGame?.phase === 'recruit' &&
			((bgState.currentGame.hasBuddies &&
				state.playerDeck.hero?.cardId === CardIds.PatchesThePirate_TB_BaconShop_HERO_18) ||
				hasTuskarrRaider(state.playerDeck.hand) ||
				hasTuskarrRaider(state.opponentDeck.board)),
		value: (state: GameState, bgState: BattlegroundsState | null | undefined) =>
			state.playerDeck.cardsPlayedThisMatch
				?.map((c) => c.cardId)
				?.filter(
					(c) =>
						this.allCards.getCard(c).races?.includes(Race[Race.PIRATE]) ||
						this.allCards.getCard(c).races?.includes(Race[Race.ALL]),
				).length ?? 0,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.battlegrounds.overlay.counter-tuskarr-raider-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.battlegrounds.overlay.counter-tuskarr-raider-tooltip'),
		},
	};
	readonly opponent = undefined;

	constructor(private readonly i18n: ILocalizationService, private readonly allCards: CardsFacadeService) {
		super();
	}

	protected override tooltip(
		side: 'player' | 'opponent',
		gameState: GameState,
		allCards: CardsFacadeService,
		bgState: BattlegroundsState,
	): string {
		const value = this[side]?.value(gameState, bgState) ?? 0;
		return this.i18n.translateString(`counters.bgs-tuskarr-raider.${side}`, {
			value: value,
		});
	}
}

const hasTuskarrRaider = (zone: readonly DeckCard[]): boolean => {
	return zone
		.filter((card) => card.cardId)
		.some((card) =>
			[
				CardIds.TuskarrRaider_TB_BaconShop_HERO_18_Buddy,
				CardIds.TuskarrRaider_TB_BaconShop_HERO_18_Buddy_G,
			].includes(card.cardId as CardIds),
		);
};
