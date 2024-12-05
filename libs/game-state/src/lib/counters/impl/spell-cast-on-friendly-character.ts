import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class SpellCastOnFriendlyCharacterCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'spellsOnFriendly';
	public override image = CardIds.DevoutPupil;
	protected override cards: readonly CardIds[] = [CardIds.DevoutPupil];

	readonly player = {
		pref: 'playerSpellsOnFriendlyCharactersCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): number => state.playerDeck?.spellsPlayedOnFriendlyEntities?.length ?? 0,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.spells-on-friendly-characters-label'),
			tooltip: (i18n: ILocalizationService, allCards: CardsFacadeService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.spells-on-friendly-characters-tooltip'),
		},
	};

	readonly opponent = undefined;

	constructor(private readonly i18n: ILocalizationService) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		return this.i18n.translateString(`counters.spells-on-friendly-characters.${side}`, {
			value: side === 'player' ? this.player.value(gameState) : 0,
		});
	}
}
