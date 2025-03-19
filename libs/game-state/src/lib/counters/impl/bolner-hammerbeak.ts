/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds } from '@firestone-hs/reference-data';
import { BattlegroundsState } from '@firestone/battlegrounds/core';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class BolnerHammerbeakCounterDefinitionV2 extends CounterDefinitionV2<string | undefined> {
	public override id: CounterType = 'bolner';
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override image = (state: GameState) => state.playerDeck.firstBattlecryPlayedThisTurn(this.allCards)?.cardId;
	public override valueImg = CardIds.BolnerHammerbeak;
	public override cards: readonly CardIds[] = [CardIds.BolnerHammerbeak];

	readonly player = {
		pref: 'playerBolnerCounter' as const,
		display: (state: GameState): boolean => !!state?.playerDeck?.firstBattlecryPlayedThisTurn(this.allCards),
		value: (state: GameState) => {
			return state.playerDeck.firstBattlecryPlayedThisTurn(this.allCards)?.cardId;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.bolner-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.bolner-tooltip'),
		},
	};
	readonly opponent = undefined;

	constructor(private readonly i18n: ILocalizationService, private readonly allCards: CardsFacadeService) {
		super();
	}

	protected override cardTooltip(
		side: 'player' | 'opponent',
		gameState: GameState,
		bgState: BattlegroundsState,
		value: string | null | undefined,
	): readonly string[] | undefined {
		return value ? [value] : undefined;
	}

	protected override tooltip(
		side: 'player' | 'opponent',
		gameState: GameState,
		allCards: CardsFacadeService,
		bgState: BattlegroundsState,
		countersUseExpandedView: boolean,
	): string | null {
		const value = this[side]?.value(gameState);
		if (!value) {
			return null;
		}
		return this.i18n.translateString(`counters.bolner`, {
			value: this.allCards.getCard(value).name,
		});
	}
}
