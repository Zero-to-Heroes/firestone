import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { DeckCard } from '../../../models/deck-card';
import { GameState } from '../../../models/game-state';
import { CounterDefinitionV2 } from '../../_counter-definition-v2';
import { CounterType } from '../../_exports';

export class BgsMagmalocCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'bgsMagmaloc';
	public override image = CardIds.Magmaloc_BG25_046;
	public override type: 'hearthstone' | 'battlegrounds' = 'battlegrounds';
	public override cards: readonly CardIds[] = [];

	readonly player = {
		pref: 'playerBgsMagmalocCounter' as const,
		display: (state: GameState): boolean =>
			state.bgState.currentGame?.phase === 'recruit' &&
			(hasMagmaloc(state.playerDeck.hand) ||
				hasMagmaloc(state.playerDeck.board) ||
				hasMagmaloc(state.opponentDeck.board)),
		value: (state: GameState) => {
			if (!state.bgState.currentGame) {
				return null;
			}

			return (
				state.bgState.currentGame.liveStats.minionsPlayedOverTurn.find(
					(info) => info.turn === state.currentTurn,
				)?.value ?? 0
			);
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.battlegrounds.overlay.counter-magmaloc-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.battlegrounds.overlay.counter-magmaloc-tooltip'),
		},
	};
	readonly opponent = undefined;

	constructor(private readonly i18n: ILocalizationService, private readonly allCards: CardsFacadeService) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const value = this[side]?.value(gameState) ?? 0;
		return this.i18n.translateString(`counters.bgs-magmaloc.${side}`, { value: 1 + value });
	}
}

const hasMagmaloc = (zone: readonly DeckCard[]): boolean => {
	return zone
		.filter((card) => card.cardId)
		.some((card) => [CardIds.Magmaloc_BG25_046, CardIds.Magmaloc_BG25_046_G].includes(card.cardId as CardIds));
};
