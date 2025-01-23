import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class NextStarshipLaunchCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'nextStarshipLaunch';
	public override image = CardIds.Colossus_SC_758;
	public override cards: readonly CardIds[] = [
		CardIds.SalvageTheBunker_SC_404,
		CardIds.Scv_SC_401,
		CardIds.LockOn_SC_407,
		CardIds.ConcussiveShells_SC_411,
	];

	readonly player = {
		pref: 'playerProtossSpellsCounter' as const,
		display: (state: GameState): boolean =>
			state.playerDeck
				?.getAllPotentialFutureCards()
				.some((c) => this.allCards.getCard(c.cardId)?.mechanics?.includes(GameTag[GameTag.STARSHIP_PIECE])),
		value: (state: GameState): number | null =>
			state.fullGameState?.Player?.PlayerEntity?.tags?.find(
				(t) => t.Name === GameTag.STARSHIP_LAUNCH_COST_DISCOUNT,
			)?.Value || null,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.next-starship-launch-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.next-starship-launch-tooltip'),
		},
	};

	readonly opponent = undefined;

	constructor(private readonly i18n: ILocalizationService, private readonly allCards: CardsFacadeService) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		return this.i18n.translateString(`counters.next-starship-launch.${side}`, {
			value: this[side]?.value(gameState) ?? 0,
		});
	}
}
