/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BattlegroundsState } from '../../models/_barrel';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../counter-type';

export class RuniTemporalGuardianCounterDefinitionV2 extends CounterDefinitionV2<{
	cards: readonly string[];
	turn: number;
}> {
	public override id: CounterType = 'runiTemporalGuardian';
	public override image = CardIds.RuniTemporalGuardian_TIME_EVENT_998;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [];

	readonly player = {
		pref: 'playerRuniTemporalGuardianCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState) => {
			const runis = [...state.playerDeck.board, ...state.playerDeck.otherZone].filter(
				(c) =>
					c.cardId === CardIds.RuniTemporalGuardian_TIME_EVENT_998 &&
					c.storedInformation?.gameTagTurnNumberPlayed != null,
			);
			if (runis.length === 0) {
				return null;
			}

			// Sort by turn played
			const sorted = runis.sort(
				(a, b) => b.storedInformation!.gameTagTurnNumberPlayed! - a.storedInformation!.gameTagTurnNumberPlayed!,
			);
			const lastRuni = sorted[0];
			if (!lastRuni) {
				return null;
			}

			if (!lastRuni.storedInformation!.cards?.length) {
				return null;
			}

			const delta = state.gameTagTurnNumber - lastRuni.storedInformation!.gameTagTurnNumberPlayed!;
			const turn = 2 - Math.ceil(delta / 2);
			if (turn <= 0) {
				return null;
			}

			return {
				cards: lastRuni
					.storedInformation!.cards!.map((c) => c.cardId)
					.filter((c) => c !== CardIds.RuniTemporalGuardian_TIME_EVENT_998)
					.filter((c) => this.allCards.getCard(c).type?.toUpperCase() === CardType[CardType.MINION]),
				turn: turn,
			};
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.runi-label', {
					cardName: this.allCards.getCard(CardIds.RuniTemporalGuardian_TIME_EVENT_998).name,
				}),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.runi-tooltip', {
					cardName: this.allCards.getCard(CardIds.RuniTemporalGuardian_TIME_EVENT_998).name,
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

	protected override formatValue(
		value: { cards: readonly string[]; turn: number } | null | undefined,
	): null | undefined | number | string {
		return value?.turn;
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const value = this[side]?.value(gameState)?.turn ?? 0;
		return this.i18n.translateString(`counters.runi.player`, { value: value });
	}

	protected override cardTooltip(
		side: 'player' | 'opponent',
		gameState: GameState,
		bgState: BattlegroundsState,
		value: { cards: readonly string[]; turn: number } | null | undefined,
	): readonly string[] | undefined {
		return value?.cards;
	}
}
