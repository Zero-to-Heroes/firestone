import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class SecretsTriggeredCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'secretsTriggered';
	public override image = CardIds.StarstrungBow;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [
		// Starstrung Bow: Costs (1) less for each friendly Secret that has triggered this game.
		CardIds.StarstrungBow,
		// Sayge, Seer of Darkmoon: Battlecry: Draw 1 card. (Upgraded for each friendly Secret that has triggered this game!)
		CardIds.SaygeSeerOfDarkmoon,
	];

	readonly player = {
		pref: 'playerSecretsTriggeredCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): number => state.playerDeck.secretsTriggeredThisMatch?.length ?? 0,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.secrets-triggered-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.secrets-triggered-tooltip'),
		},
	};
	readonly opponent = undefined;

	constructor(
		private readonly i18n: ILocalizationService,
		protected override readonly allCards: CardsFacadeService,
	) {
		super(allCards);
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const value = this[side]?.value(gameState) ?? 0;
		return this.i18n.translateString(`counters.secrets-triggered.${side}`, { value: value });
	}
}
