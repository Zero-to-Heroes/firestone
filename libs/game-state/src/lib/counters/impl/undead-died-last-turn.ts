import { CardIds, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class UndeadDiedLastTurnCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'undeadDiedLastTurn';
	public override image = CardIds.UnlivingChampion;
	public override cards: readonly CardIds[] = [
		CardIds.NecroticMortician,
		CardIds.NecroticMortician_CORE_RLK_116,
		CardIds.BoneFlinger,
		CardIds.ShadowWordUndeath,
		CardIds.GraveDigging,
		CardIds.NerubianVizier,
		CardIds.NerubianFlyer,
		CardIds.UnlivingChampion,
	];
	protected override showOnlyInDiscovers = true;

	readonly player = {
		pref: 'playerUndeadDiedLastTurnCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): number | null =>
			state.playerDeck.minionsDeadSinceLastTurn.filter((c) =>
				hasCorrectTribe(this.allCards.getCard(c.cardId), Race.UNDEAD),
			).length,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.undead-died-since-last-turn-label'),
			tooltip: (i18n: ILocalizationService, allCards: CardsFacadeService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.undead-died-since-last-turn-tooltip'),
		},
	};

	readonly opponent = undefined;

	constructor(
		private readonly i18n: ILocalizationService,
		private readonly allCards: CardsFacadeService,
	) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		return this.i18n.translateString(`counters.undead-died-since-last-turn.${side}`, {
			value: this[side]?.value(gameState) ?? 0,
		});
	}
}
