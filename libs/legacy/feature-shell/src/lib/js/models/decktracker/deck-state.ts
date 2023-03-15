import { CardIds, RELIC_IDS } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { ShortCard } from '@models/decktracker/game-state';
import { NonFunctionProperties } from '@services/utils';
import { ChoosingOptionsGameEvent } from '../mainwindow/game-events/choosing-options-game-event';
import { AttackOnBoard } from './attack-on-board';
import { BoardSecret } from './board-secret';
import { DeckCard } from './deck-card';
import { HeroCard } from './hero-card';
import { DynamicZone } from './view/dynamic-zone';

export class DeckState {
	private static readonly GALAKROND_CARD_IDS = [
		CardIds.GalakrondTheUnspeakable,
		CardIds.GalakrondTheUnspeakable_GalakrondTheApocalypseToken,
		CardIds.GalakrondTheUnspeakable_GalakrondAzerothsEndToken,
		CardIds.GalakrondTheNightmare,
		CardIds.GalakrondTheNightmare_GalakrondTheApocalypseToken,
		CardIds.GalakrondTheNightmare_GalakrondAzerothsEndToken,
		CardIds.GalakrondTheTempest,
		CardIds.GalakrondTheTempest_GalakrondTheApocalypseToken,
		CardIds.GalakrondTheTempest_GalakrondAzerothsEndToken,
		CardIds.GalakrondTheWretched,
		CardIds.GalakrondTheWretched_GalakrondTheApocalypseToken,
		CardIds.GalakrondTheWretched_GalakrondAzerothsEndToken,
		CardIds.GalakrondTheUnbreakable,
		CardIds.GalakrondTheUnbreakable_GalakrondTheApocalypseToken,
		CardIds.GalakrondTheUnbreakable_GalakrondAzerothsEndToken,
	];

	private static readonly POGO_CARD_IDS = [
		CardIds.PogoHopper_BOT_283,
		CardIds.PogoHopper_BGS_028,
		CardIds.PogoHopperBattlegrounds,
	];

	private static readonly HERO_POWER_DAMAGE_CARD_IDS = [CardIds.MordreshFireEye, CardIds.JanalaiTheDragonhawk];

	private static readonly SPELL_COUNTER_CARD_IDS = [CardIds.YoggSaronHopesEnd, CardIds.YoggSaronMasterOfFate];

	private static readonly NEW_CTHUN_CARD_IDS = [
		CardIds.CthunTheShattered,
		CardIds.CthunTheShattered_BodyOfCthunToken,
		CardIds.BodyOfCthun_CthunsBodyToken,
		CardIds.CthunTheShattered_EyeOfCthunToken,
		CardIds.CthunTheShattered_HeartOfCthunToken,
		CardIds.CthunTheShattered_MawOfCthunToken,
		CardIds.MaskOfCthun,
	];

	readonly isFirstPlayer: boolean;
	readonly isActivePlayer: boolean;
	readonly isOpponent: boolean;
	readonly deckstring?: string;
	readonly sideboards?: readonly DeckSideboard[];
	readonly name?: string;
	readonly hero?: HeroCard;
	readonly heroPower: DeckCard;
	readonly weapon: DeckCard;
	readonly deckList: readonly DeckCard[] = [];
	readonly unknownRealCardsInDeck: boolean;
	// This is too cumbersome to compute for the opponent deck when the decklist is known,
	// so we just read it form the game entities
	readonly cardsLeftInDeck: number;
	readonly showDecklistWarning: boolean;

	readonly secrets: readonly BoardSecret[] = [];
	readonly secretHelperActive: boolean = true;

	readonly totalAttackOnBoard: AttackOnBoard;
	readonly galakrondInvokesCount: number = 0;
	readonly cthunSize: number = 0;
	readonly jadeGolemSize: number = 0;
	readonly pogoHopperSize: number = 0;
	readonly fatigue: number = 0;
	readonly abyssalCurseHighestValue: number = 0;
	readonly spellsPlayedThisMatch: readonly DeckCard[] = [];
	readonly cardsPlayedThisMatch: readonly ShortCard[] = [];
	readonly watchpostsPlayedThisMatch: number = 0;
	readonly libramsPlayedThisMatch: number = 0;
	readonly elementalsPlayedThisTurn: number = 0;
	readonly elementalsPlayedLastTurn: number = 0;
	readonly elwynnBoarsDeadThisMatch: number = 0;
	readonly volatileSkeletonsDeadThisMatch: number = 0;
	readonly relicsPlayedThisMatch: number = 0;
	readonly heroPowerDamageThisMatch: number = 0;
	readonly heroAttacksThisMatch: number = 0;
	readonly minionsDeadSinceLastTurn: readonly ShortCard[] = [];
	readonly anachronosTurnsPlayed: readonly number[] = [];
	readonly bonelordFrostwhisperFirstTurnTrigger: number = null;
	// readonly secretHelperActiveHover: boolean = false;

	// Graveyard is not so easy in fact - we want to know the cards that
	// can be interacted with, which means dead minions for Priest, or
	// discarded cards for warlock (if the warlock decks contains specific
	// cards)
	// readonly graveyard: ReadonlyArray<DeckCard> = [];
	readonly hand: readonly DeckCard[] = [];
	readonly deck: readonly DeckCard[] = [];
	readonly board: readonly DeckCard[] = [];
	readonly otherZone: readonly DeckCard[] = [];
	readonly globalEffects: readonly DeckCard[] = [];
	readonly dynamicZones: readonly DynamicZone[] = [];

	readonly currentOptions?: readonly CardOption[] = [];

	readonly cardsPlayedLastTurn: readonly DeckCard[] = [];
	readonly cardsPlayedThisTurn: readonly DeckCard[] = [];
	readonly lastDeathrattleTriggered?: string;
	// readonly cardsPlayedThisMatch: readonly DeckCard[] = [];
	readonly damageTakenThisTurn: number;
	readonly cardsPlayedFromInitialDeck: readonly { entityId: number; cardId: string }[] = [];
	readonly turnTimings: readonly TurnTiming[] = [];
	readonly turnDuration: number;

	public static create(value: Partial<NonFunctionProperties<DeckState>>): DeckState {
		return Object.assign(new DeckState(), value);
	}

	public update(value: Partial<NonFunctionProperties<DeckState>>): DeckState {
		return Object.assign(new DeckState(), this, value);
	}

	public findCard(entityId: number): { zone: 'hand' | 'deck' | 'board' | 'other'; card: DeckCard } {
		const zones: { id: 'hand' | 'deck' | 'board' | 'other'; cards: readonly DeckCard[] }[] = [
			{ id: 'hand', cards: this.hand },
			{ id: 'deck', cards: this.deck },
			{ id: 'board', cards: this.board },
			{ id: 'other', cards: this.otherZone },
		];
		for (const zone of zones) {
			const result = zone.cards.find((card) => card.entityId === entityId);
			if (!!result) {
				return { zone: zone.id, card: result };
			}
		}

		return null;
	}

	public totalCardsInZones(): number {
		return (
			(this.deck?.length ?? 0) +
			(this.hand?.length ?? 0) +
			(this.board?.length ?? 0) +
			(this.otherZone?.length ?? 0)
		);
	}

	public getAllCardsInDeck(): readonly { entityId: number; cardId: string }[] {
		return [
			...this.deckList,
			...this.hand,
			...this.deck,
			...this.board,
			...this.currentOptions,
			...this.otherZone.filter((card) => card.zone !== 'SETASIDE'),
		];
	}

	// TODO: Probably not the place for these methods
	public containsGalakrond(allCards?: CardsFacadeService): boolean {
		if (this.galakrondInvokesCount > 0) {
			return true;
		}

		return this.getAllCardsInDeck()
			.filter((card) => card.cardId)
			.some(
				(card) =>
					DeckState.GALAKROND_CARD_IDS.indexOf(card.cardId as CardIds) !== -1 ||
					card.cardId === CardIds.KronxDragonhoof ||
					(allCards &&
						allCards.getCard(card.cardId)?.text &&
						allCards.getCard(card.cardId)?.text?.indexOf('Invoke Galakrond') !== -1),
			);
	}

	public containsHeroPowerDamageCard(allCards?: CardsFacadeService): boolean {
		return this.getAllCardsInDeck()
			.filter((card) => card.cardId)
			.some((card) => DeckState.HERO_POWER_DAMAGE_CARD_IDS.indexOf(card.cardId as CardIds) !== -1);
	}

	public containsCthun(allCards: CardsFacadeService): boolean {
		if (this.cthunSize > 0) {
			return true;
		}

		return this.getAllCardsInDeck()
			.filter((card) => card.cardId)
			.filter((card) => !DeckState.NEW_CTHUN_CARD_IDS.includes(card.cardId as CardIds))
			.some(
				(card) =>
					card.cardId === CardIds.Cthun_OG_280 ||
					(allCards &&
						allCards.getCard(card.cardId)?.text &&
						allCards.getCard(card.cardId)?.text?.indexOf("C'Thun") !== -1),
			);
	}

	public containsJade(allCards?: CardsFacadeService): boolean {
		if (this.jadeGolemSize > 0) {
			return true;
		}

		return this.getAllCardsInDeck()
			.filter((card) => card.cardId)
			.some(
				(card) =>
					allCards &&
					allCards.getCard(card.cardId)?.referencedTags &&
					allCards.getCard(card.cardId)?.referencedTags.includes('JADE_GOLEM'),
			);
	}

	public containsWatchpost(allCards?: CardsFacadeService, lookAtWatchpostsPlayed = false): boolean {
		return this.getAllCardsInDeck()
			.filter((card) => card.cardId)
			.some(
				(card) =>
					card.cardId === CardIds.KargalBattlescar_BAR_077 ||
					(lookAtWatchpostsPlayed &&
						allCards &&
						allCards.getCard(card.cardId)?.name &&
						allCards.getCard(card.cardId)?.name.toLowerCase().includes('watch post')),
			);
	}

	public containsLibram(allCards?: CardsFacadeService, lookAtLibramsPlayed = false): boolean {
		return this.getAllCardsInDeck()
			.filter((card) => card.cardId)
			.some(
				(card) =>
					card.cardId === CardIds.LadyLiadrin ||
					(lookAtLibramsPlayed &&
						allCards &&
						allCards.getCard(card.cardId)?.name &&
						allCards.getCard(card.cardId)?.name.toLowerCase().startsWith('libram')),
			);
	}

	public containsPogoHopper(): boolean {
		if (this.pogoHopperSize > 0) {
			return true;
		}

		return this.getAllCardsInDeck()
			.filter((card) => card.cardId)
			.some((card) => DeckState.POGO_CARD_IDS.indexOf(card.cardId as CardIds) !== -1);
	}

	public containsSpellCounterMinion(): boolean {
		return this.getAllCardsInDeck()
			.filter((card) => card.cardId)
			.some((card) => DeckState.SPELL_COUNTER_CARD_IDS.includes(card.cardId as CardIds));
	}

	public containsElwynnBoar(): boolean {
		if (this.elwynnBoarsDeadThisMatch > 0) {
			return true;
		}

		return this.getAllCardsInDeck()
			.filter((card) => card.cardId)
			.some((card) => card.cardId === CardIds.ElwynnBoar);
	}

	public containsVolatileSkeletonCards(): boolean {
		return this.getAllCardsInDeck()
			.filter((card) => card.cardId)
			.some((card) =>
				[CardIds.KelthuzadTheInevitable_REV_514, CardIds.KelthuzadTheInevitable_REV_786].includes(
					card.cardId as CardIds,
				),
			);
	}

	public hasSecondarySkeletonActivator(): boolean {
		return (
			this.volatileSkeletonsDeadThisMatch > 0 &&
			this.getAllCardsInDeck()
				.filter((card) => card.cardId)
				.some((card) => [CardIds.XyrellaTheDevout].includes(card.cardId as CardIds))
		);
	}

	public containsRelicCards(): boolean {
		if (this.relicsPlayedThisMatch > 0) {
			return true;
		}

		return this.getAllCardsInDeck()
			.filter((card) => card.cardId)
			.some((card) =>
				[
					CardIds.ArtificerXymox_REV_787,
					CardIds.ArtificerXymox_REV_937,
					CardIds.ArtificerXymox_ArtificerXymoxToken,
					...RELIC_IDS,
				].includes(card.cardId as CardIds),
			);
	}

	public hasBolner() {
		return [...this.hand, ...this.currentOptions]
			.filter((card) => card.cardId)
			.some((card) => card.cardId === CardIds.BolnerHammerbeak);
	}

	public hasBrilliantMacaw() {
		return [...this.hand, ...this.currentOptions]
			.filter((card) => card.cardId)
			.some((card) => card.cardId === CardIds.BrilliantMacaw);
	}

	public hasMonstrousParrot() {
		return [...this.hand, ...this.currentOptions]
			.filter((card) => card.cardId)
			.some((card) => card.cardId === CardIds.MonstrousParrot);
	}

	public hasVanessaVanCleef() {
		return [...this.hand, ...this.currentOptions]
			.filter((card) => card.cardId)
			.some((card) => card.cardId === CardIds.VanessaVancleefCore);
	}

	public hasAsvedon() {
		return [...this.hand, ...this.currentOptions]
			.filter((card) => card.cardId)
			.some((card) => card.cardId === CardIds.AsvedonTheGrandshield);
	}

	public hasMurozondTheInfinite() {
		return [...this.hand, ...this.currentOptions]
			.filter((card) => card.cardId)
			.some(
				(card) =>
					card.cardId === CardIds.MurozondTheInfinite || card.cardId === CardIds.MurozondTheInfiniteCore,
			);
	}

	public hasShockspitter() {
		return [...this.hand, ...this.deck, ...this.currentOptions]
			.filter((card) => card.cardId)
			.some((card) => card.cardId === CardIds.Shockspitter);
	}

	public hasParrotMascot() {
		return [...this.hand, ...this.currentOptions]
			.filter((card) => card.cardId)
			.some((card) => card.cardId === CardIds.ParrotMascot);
	}

	public hasQueensguard() {
		const cards = [...this.hand, ...this.currentOptions];
		return cards.filter((card) => card.cardId).some((card) => card.cardId === CardIds.Queensguard);
	}

	public hasSpectralPillager() {
		const cards = [...this.hand, ...this.currentOptions];
		return cards
			.filter((card) => card.cardId)
			.some((card) =>
				[CardIds.SpectralPillager_CORE_ICC_910, CardIds.SpectralPillager_ICC_910].includes(
					card.cardId as CardIds,
				),
			);
	}

	public hasLadyDarkvein() {
		return [...this.hand, ...this.currentOptions]
			.filter((card) => card.cardId)
			.some((card) => card.cardId === CardIds.LadyDarkvein);
	}

	public hasGreySageParrot() {
		return [...this.hand, ...this.currentOptions]
			.filter((card) => card.cardId)
			.some((card) => card.cardId === CardIds.GreySageParrot);
	}

	public firstBattlecryPlayedThisTurn(allCards: CardsFacadeService): DeckCard {
		if (!this.cardsPlayedThisTurn?.length) {
			return null;
		}

		const battlecryCards = this.cardsPlayedThisTurn.filter((card) => {
			const ref = allCards.getCard(card.cardId);
			return !!ref.mechanics?.length && ref.mechanics.includes('BATTLECRY');
		});
		if (!battlecryCards?.length) {
			return null;
		}

		return battlecryCards[0];
	}
}

export interface TurnTiming {
	readonly turn: number;
	readonly startTimestamp: number;
	readonly endTimestamp: number;
}

export interface CardOption {
	readonly entityId: number;
	readonly cardId: string;
	readonly source: string;
	readonly context: ChoosingOptionsGameEvent['additionalData']['context'];
}

export interface DeckSideboard {
	readonly keyCardId: string;
	readonly cards: readonly string[];
}
