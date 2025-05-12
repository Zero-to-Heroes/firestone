import { CardIds, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BattlegroundsState } from '../../../models/_barrel';
import { DeckCard } from '../../../models/deck-card';
import { GameState } from '../../../models/game-state';
import { CounterDefinitionV2 } from '../../_counter-definition-v2';
import { CounterType } from '../../_exports';

export class BgsSouthseaStrongarmCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'bgsSouthseaStrongarm';
	public override image = CardIds.SouthseaStrongarm_BGS_048;
	public override type: 'hearthstone' | 'battlegrounds' = 'battlegrounds';
	public override cards: readonly CardIds[] = [];

	readonly player = {
		pref: 'playerBgsSouthseaCounter' as const,
		display: (state: GameState, bgState: BattlegroundsState | null | undefined): boolean =>
			bgState?.currentGame?.phase === 'recruit' &&
			(hasSouthseaStrongarm(state.playerDeck.hand) || hasSouthseaStrongarm(state.opponentDeck.board)),
		value: (state: GameState, bgState: BattlegroundsState | null | undefined) => {
			if (!bgState) {
				return null;
			}

			return (
				bgState.currentGame.liveStats.minionsBoughtOverTurn
					.find((info) => info.turn === bgState.currentGame.currentTurn)
					?.cardIds.filter((cardId) => hasCorrectTribe(this.allCards.getCard(cardId), Race.PIRATE)).length ??
				0
			);
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.battlegrounds.overlay.counter-soutshsea-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.battlegrounds.overlay.counter-soutshsea-tooltip'),
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
		return this.i18n.translateString(`counters.bgs-southsea.${side}`, { value: value });
	}
}

const hasSouthseaStrongarm = (zone: readonly DeckCard[]): boolean => {
	return zone
		.filter((card) => card.cardId)
		.some((card) =>
			[CardIds.SouthseaStrongarm_BGS_048, CardIds.SouthseaStrongarm_TB_BaconUps_140].includes(
				card.cardId as CardIds,
			),
		);
};
