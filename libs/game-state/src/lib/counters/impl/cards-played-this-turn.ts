import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class CardsPlayedThisTurnCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'cardsPlayedThisTurn';
	public override image = CardIds.PrizePlunderer;
	public override cards: readonly CardIds[] = [
		CardIds.EdwinVancleefLegacy,
		CardIds.EdwinVancleefVanilla,
		CardIds.Biteweed,
		CardIds.SpectralPillager_ICC_910,
		CardIds.SpectralPillager_CORE_ICC_910,
		CardIds.ShadowSculptor,
		CardIds.PrizePlunderer,
		CardIds.PrizePlunderer_DMF_519_COPY,
		CardIds.BristlingWyvern,
		CardIds.FrostwolfWarmaster,
		CardIds.NecrolordDraka_REV_785,
		CardIds.NecrolordDraka_REV_940,
		CardIds.NecrolordDraka_CORE_REV_940,
		CardIds.NecrolordDraka_MaldraxxusDaggerToken,
		CardIds.ScribblingStenographer,
		CardIds.ScribblingStenographer_CORE_MAW_020,
		CardIds.SinstoneGraveyard_REV_750,
		CardIds.SinstoneGraveyard_REV_795,
		CardIds.SinstoneGraveyard_CORE_REV_750,
	];

	readonly player = {
		pref: 'playerCardsPlayedThisTurnCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): number | null => state.playerDeck?.cardsPlayedThisTurn?.length ?? 0,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.cards-played-this-turn-label'),
			tooltip: (i18n: ILocalizationService, allCards: CardsFacadeService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.cards-played-this-turn-tooltip'),
		},
	};

	readonly opponent = undefined;

	constructor(private readonly i18n: ILocalizationService, private readonly allCards: CardsFacadeService) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		return this.i18n.translateString(`counters.cards-played-this-turn.${side}`, {
			value: this[side]?.value(gameState) ?? 0,
		});
	}
}
