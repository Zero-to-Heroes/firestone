/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/**
 * Kael'thas Sunstrider (THD_043 / REV_021 / CORE / BT_255): Every third spell you cast each turn costs (0).
 * Track spells played this turn as position in the 1/3 → 2/3 → 3/3 cycle.
 */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BattlegroundsState } from '../../models/_barrel';
import { DeckCard } from '../../models/deck-card';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../counter-type';

/** Position in the 3-spell cycle (0 = none / start of turn), shown as `p/3`. */
export function formatKaelthasSpellCycleLabel(spellCountThisTurn: number): string {
	const n = Math.max(0, Math.floor(spellCountThisTurn));
	const p = n === 0 ? 0 : ((n - 1) % 3) + 1;
	return `${p}/3`;
}

export function countSpellsPlayedThisTurnFromDeckCards(
	cards: readonly DeckCard[] | undefined,
	allCards: CardsFacadeService,
): number {
	if (!cards?.length) {
		return 0;
	}
	return cards.filter((c) => allCards.getCard(c.cardId).type?.toUpperCase() === CardType[CardType.SPELL]).length;
}

export class KaelthasSunstriderSpellCycleCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'kaelthasSpellCycle';
	public override image = CardIds.KaelthasSunstrider_BT_255;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [CardIds.KaelthasSunstrider_BT_255];

	readonly player = {
		pref: 'playerKaelthasSpellCycleCounter' as const,
		display: (state: GameState, _bgState?: BattlegroundsState | null | undefined): boolean =>
			state.playerDeck.board.some((c) => this.cards.includes(c.cardId as CardIds)),
		value: (state: GameState, _bgState?: BattlegroundsState | null | undefined): number =>
			countSpellsPlayedThisTurnFromDeckCards(state.playerDeck?.cardsPlayedThisTurn, this.allCards),
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.kaelthas-spell-cycle-label'),
			tooltip: (i18n: ILocalizationService, allCards: CardsFacadeService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.kaelthas-spell-cycle-tooltip', {
					cardName: allCards.getCard(CardIds.KaelthasSunstrider_BT_255)?.name ?? '',
				}),
		},
	};

	readonly opponent = undefined;

	constructor(
		private readonly i18n: ILocalizationService,
		protected override readonly allCards: CardsFacadeService,
	) {
		super(allCards);
	}

	protected override formatValue(value: number | null | undefined): null | undefined | number | string {
		if (value == null) {
			return null;
		}
		return formatKaelthasSpellCycleLabel(value);
	}

	protected override tooltip(
		side: 'player' | 'opponent',
		gameState: GameState,
		_allCards: CardsFacadeService,
		_bgState: BattlegroundsState,
		_countersUseExpandedView: boolean,
	): string | null {
		const spellCount = this.player.value(gameState) ?? 0;
		return this.i18n.translateString(`counters.kaelthas-spell-cycle.${side}`, {
			value: formatKaelthasSpellCycleLabel(spellCount),
			spellCount,
		});
	}
}
