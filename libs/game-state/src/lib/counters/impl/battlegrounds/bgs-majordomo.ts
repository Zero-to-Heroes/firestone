import { CardIds, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BattlegroundsState } from '../../../models/_barrel';
import { DeckCard } from '../../../models/deck-card';
import { GameState } from '../../../models/game-state';
import { CounterDefinitionV2 } from '../../_counter-definition-v2';
import { CounterType } from '../../_exports';

export class BgsMajordomoCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'bgsMajordomo';
	public override image = CardIds.MajordomoExecutus_BGS_105;
	public override type: 'hearthstone' | 'battlegrounds' = 'battlegrounds';
	public override cards: readonly CardIds[] = [];

	readonly player = {
		pref: 'playerBgsMajordomoCounter' as const,
		display: (state: GameState, bgState: BattlegroundsState | null | undefined): boolean =>
			bgState?.currentGame?.phase === 'recruit' &&
			(hasMajordomo(state.playerDeck.hand) || hasMajordomo(state.playerDeck.board)),
		value: (state: GameState, bgState: BattlegroundsState | null | undefined) =>
			state.playerDeck.cardsPlayedThisTurn.filter((card) =>
				hasCorrectTribe(this.allCards.getCard(card.cardId), Race.ELEMENTAL),
			).length,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.battlegrounds.overlay.counter-majordomo-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.battlegrounds.overlay.counter-majordomo-tooltip'),
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
		return this.i18n.translateString(`counters.bgs-majordomo.${side}`, { value: value });
	}
}

const hasMajordomo = (zone: readonly DeckCard[]): boolean => {
	return zone
		.filter((card) => card.cardId)
		.some((card) =>
			[CardIds.MajordomoExecutus_BGS_105, CardIds.MajordomoExecutus_TB_BaconUps_207].includes(
				card.cardId as CardIds,
			),
		);
};
