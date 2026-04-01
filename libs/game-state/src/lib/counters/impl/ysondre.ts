/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds } from '@firestone-hs/reference-data';
import { Preferences } from '@firestone/shared/common/service';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BattlegroundsState } from '../../models/_barrel';
import { DeckState } from '../../models/deck-state';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

/*
 * Ysondre (EDR_465): Taunt. Deathrattle: Summon a random Dragon for each time Ysondre has died this game.
 * The counter value is game-wide (all Ysondre deaths); visibility is per side (you vs opponent).
 */
const relevantCardIds = [CardIds.Ysondre_EDR_465];

export class YsondreCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'ysondre';
	public override image = CardIds.Ysondre_EDR_465;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [];

	readonly player = {
		pref: 'playerYsondreCounter' as keyof Preferences,
		display: (state: GameState, _bgState?: BattlegroundsState | null | undefined): boolean =>
			this.sideShouldShowYsondre(state.playerDeck),
		value: (state: GameState, _bgState?: BattlegroundsState | null | undefined): number =>
			this.globalYsondreDeaths(state),
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.ysondre-label'),
			tooltip: (i18n: ILocalizationService, _allCards: CardsFacadeService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.ysondre-tooltip'),
		},
	};

	readonly opponent = {
		pref: 'opponentYsondreCounter' as keyof Preferences,
		display: (state: GameState, _bgState?: BattlegroundsState | null | undefined): boolean =>
			this.sideShouldShowYsondre(state.opponentDeck),
		value: (state: GameState, _bgState?: BattlegroundsState | null | undefined): number =>
			this.globalYsondreDeaths(state),
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.ysondre-label'),
			tooltip: (i18n: ILocalizationService, _allCards: CardsFacadeService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.ysondre-tooltip'),
		},
	};

	constructor(
		private readonly i18n: ILocalizationService,
		protected override readonly allCards: CardsFacadeService,
	) {
		super(allCards);
	}

	private globalYsondreDeaths(state: GameState): number {
		return (
			state.playerDeck.minionsDeadThisMatch.filter((entity) => entity.cardId === CardIds.Ysondre_EDR_465).length +
			state.opponentDeck.minionsDeadThisMatch.filter((entity) => entity.cardId === CardIds.Ysondre_EDR_465).length
		);
	}

	/** That side runs Ysondre or has had a copy die this match (stay visible after it leaves play). */
	private sideShouldShowYsondre(deck: DeckState): boolean {
		return (
			deck.hasRelevantCard(relevantCardIds, {
				includeBoard: true,
			}) || deck.minionsDeadThisMatch.some((entity) => entity.cardId === CardIds.Ysondre_EDR_465)
		);
	}

	protected override tooltip(
		side: 'player' | 'opponent',
		gameState: GameState,
		_allCards: CardsFacadeService,
		_bgState: BattlegroundsState,
		_countersUseExpandedView: boolean,
	): string | null {
		const value = this[side]?.value(gameState) ?? 0;
		return this.i18n.translateString(`counters.ysondre.player`, { value: value });
	}
}
