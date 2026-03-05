/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardClass, CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

const CATACLYSM_COLOSSAL_BY_CLASS: Partial<Record<CardClass, string>> = {
	[CardClass.DEATHKNIGHT]: CardIds.ArisenOnyxia_CATA_155,
	[CardClass.DEMONHUNTER]: CardIds.AzsharaOceanLord_CATA_151,
	[CardClass.DRUID]: CardIds.Wickerfang_CATA_139,
	[CardClass.MAGE]: CardIds.ArchmageKalec_CATA_458,
	[CardClass.HUNTER]: CardIds.Magmaw_CATA_550,
	[CardClass.PALADIN]: CardIds.Chromatus_CATA_432,
	[CardClass.PRIEST]: CardIds.TheBlackBlood_CATA_300,
	[CardClass.ROGUE]: CardIds.Sinestra_CATA_154,
	[CardClass.SHAMAN]: CardIds.AlakirLordOfStorms_CATA_153,
	[CardClass.WARLOCK]: CardIds.ChogallMastermind_CATA_726,
	[CardClass.WARRIOR]: CardIds.RagnarosTheGreatFire_CATA_150,
};

const getColossalForSide = (gameState: GameState, side: 'player' | 'opponent'): string | undefined => {
	const deck = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
	const playerClass = deck?.hero?.classes?.[0];
	return playerClass != null ? CATACLYSM_COLOSSAL_BY_CLASS[playerClass] : undefined;
};

const getHeraldAmount = (gameState: GameState, side: 'player' | 'opponent'): number | null => {
	if (!getColossalForSide(gameState, side)) {
		return null;
	}
	const playerState = side === 'player' ? gameState.fullGameState?.Player : gameState.fullGameState?.Opponent;
	const amount = playerState?.PlayerEntity?.tags?.find((t) => t.Name === GameTag.HERALD_COLOSSAL_AMOUNT)?.Value;
	return amount && amount > 0 ? amount : null;
};

// Cataclysm Herald counter: tracks how many times each player has Heralded their class Colossal.
// Image shows the class-specific Cataclysm Colossal.
export class HeraldCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'herald';
	public override image = (gameState: GameState, side: 'player' | 'opponent'): string | undefined =>
		getColossalForSide(gameState, side);
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [];

	readonly player = {
		pref: 'playerHeraldCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): number | null => getHeraldAmount(state, 'player'),
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.herald-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.herald-tooltip'),
		},
	};
	readonly opponent = {
		pref: 'opponentHeraldCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): number | null => getHeraldAmount(state, 'opponent'),
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.herald-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.herald-tooltip'),
		},
	};

	constructor(
		private readonly i18n: ILocalizationService,
		protected override readonly allCards: CardsFacadeService,
	) {
		super(allCards);
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const value = this[side]?.value(gameState) ?? 0;
		return this.i18n.translateString(`counters.herald.${side}`, { value: value });
	}
}
