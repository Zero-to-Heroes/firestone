import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { AttackOnBoard } from './attack-on-board';
import { BoardSecret } from './board-secret';
import { DeckCard } from './deck-card';
import { HeroCard } from './hero-card';
import { DynamicZone } from './view/dynamic-zone';

export class DeckState {
	private static readonly GALAKROND_CARD_IDS = [
		CardIds.Collectible.Priest.GalakrondTheUnspeakable,
		CardIds.NonCollectible.Priest.GalakrondTheUnspeakable_GalakrondTheApocalypseToken,
		CardIds.NonCollectible.Priest.GalakrondTheUnspeakable_GalakrondAzerothsEndToken,
		CardIds.Collectible.Rogue.GalakrondTheNightmare,
		CardIds.NonCollectible.Rogue.GalakrondTheNightmare_GalakrondTheApocalypseToken,
		CardIds.NonCollectible.Rogue.GalakrondTheNightmare_GalakrondAzerothsEndToken,
		CardIds.Collectible.Shaman.GalakrondTheTempest,
		CardIds.NonCollectible.Shaman.GalakrondTheTempest_GalakrondTheApocalypseToken,
		CardIds.NonCollectible.Shaman.GalakrondTheTempest_GalakrondAzerothsEndToken,
		CardIds.Collectible.Warlock.GalakrondTheWretched,
		CardIds.NonCollectible.Warlock.GalakrondTheWretched_GalakrondTheApocalypseToken,
		CardIds.NonCollectible.Warlock.GalakrondTheWretched_GalakrondAzerothsEndToken,
		CardIds.Collectible.Warrior.GalakrondTheUnbreakable,
		CardIds.NonCollectible.Warrior.GalakrondTheUnbreakable_GalakrondTheApocalypseToken,
		CardIds.NonCollectible.Warrior.GalakrondTheUnbreakable_GalakrondAzerothsEndToken,
	];

	private static readonly POGO_CARD_IDS = [
		CardIds.Collectible.Rogue.PogoHopper1,
		CardIds.NonCollectible.Rogue.PogoHopper2,
		CardIds.NonCollectible.Rogue.PogoHopperBattlegrounds,
	];

	private static readonly SPELL_COUNTER_CARD_IDS = [
		CardIds.Collectible.Neutral.YoggSaronHopesEnd,
		CardIds.Collectible.Neutral.YoggSaronMasterOfFate,
	];

	private static readonly NEW_CTHUN_CARD_IDS = [
		CardIds.Collectible.Neutral.CthunTheShattered,
		CardIds.NonCollectible.Neutral.CthunTheShattered_BodyOfCthunToken,
		CardIds.NonCollectible.Neutral.BodyOfCthun_CthunsBodyToken,
		CardIds.NonCollectible.Neutral.CthunTheShattered_EyeOfCthunToken,
		CardIds.NonCollectible.Neutral.CthunTheShattered_HeartOfCthunToken,
		CardIds.NonCollectible.Neutral.CthunTheShattered_MawOfCthunToken,
		CardIds.Collectible.Mage.MaskOfCthun,
	];

	readonly isFirstPlayer: boolean;
	readonly isActivePlayer: boolean;
	readonly isOpponent: boolean;
	readonly deckstring?: string;
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
	readonly spellsPlayedThisMatch: number = 0;
	readonly watchpostsPlayedThisMatch: number = 0;
	readonly libramsPlayedThisMatch: number = 0;
	readonly elementalsPlayedThisTurn: number = 0;
	readonly elementalsPlayedLastTurn: number = 0;
	readonly elwynnBoarsDeadThisMatch: number = 0;
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

	readonly cardsPlayedThisTurn: readonly DeckCard[] = [];
	readonly damageTakenThisTurn: number;
	readonly cardsPlayedFromInitialDeck: readonly { entityId: number; cardId: string }[] = [];

	public static create(value: DeckState): DeckState {
		return Object.assign(new DeckState(), value);
	}

	public update(value: DeckState): DeckState {
		return Object.assign(new DeckState(), this, value);
	}

	public findCard(entityId: number): DeckCard {
		return [...this.hand, ...this.deck, ...this.board, ...this.otherZone].find(
			(card) => card.entityId === entityId,
		);
	}

	// TODO: Probably not the place for these methods
	public containsGalakrond(allCards?: CardsFacadeService): boolean {
		if (this.galakrondInvokesCount > 0) {
			return true;
		}

		const allCardsInDeck = [...this.deckList, ...this.hand, ...this.deck, ...this.board, ...this.otherZone];
		return allCardsInDeck
			.filter((card) => card.cardId)
			.some(
				(card) =>
					DeckState.GALAKROND_CARD_IDS.indexOf(card.cardId) !== -1 ||
					card.cardId === CardIds.Collectible.Neutral.KronxDragonhoof ||
					(allCards &&
						allCards.getCard(card.cardId)?.text &&
						allCards.getCard(card.cardId)?.text?.indexOf('Invoke Galakrond') !== -1),
			);
	}

	public containsCthun(allCards: CardsFacadeService): boolean {
		if (this.cthunSize > 0) {
			return true;
		}

		const allCardsInDeck = [...this.deckList, ...this.hand, ...this.deck, ...this.board, ...this.otherZone];
		return allCardsInDeck
			.filter((card) => card.cardId)
			.filter((card) => !DeckState.NEW_CTHUN_CARD_IDS.includes(card.cardId))
			.some(
				(card) =>
					card.cardId === CardIds.Collectible.Neutral.Cthun2 ||
					(allCards &&
						allCards.getCard(card.cardId)?.text &&
						allCards.getCard(card.cardId)?.text?.indexOf("C'Thun") !== -1),
			);
	}

	public containsJade(allCards?: CardsFacadeService): boolean {
		if (this.jadeGolemSize > 0) {
			return true;
		}

		const allCardsInDeck = [...this.deckList, ...this.hand, ...this.deck, ...this.board, ...this.otherZone];
		return allCardsInDeck
			.filter((card) => card.cardId)
			.some(
				(card) =>
					allCards &&
					allCards.getCard(card.cardId)?.referencedTags &&
					allCards.getCard(card.cardId)?.referencedTags.includes('JADE_GOLEM'),
			);
	}

	public containsWatchpost(allCards?: CardsFacadeService, lookAtWatchpostsPlayed = false): boolean {
		const allCardsInDeck = [...this.deckList, ...this.hand, ...this.deck, ...this.board, ...this.otherZone];
		return allCardsInDeck
			.filter((card) => card.cardId)
			.some(
				(card) =>
					card.cardId === CardIds.Collectible.Neutral.KargalBattlescar1 ||
					(lookAtWatchpostsPlayed &&
						allCards &&
						allCards.getCard(card.cardId)?.name &&
						allCards.getCard(card.cardId)?.name.toLowerCase().includes('watch post')),
			);
	}

	public containsLibram(allCards?: CardsFacadeService, lookAtLibramsPlayed = false): boolean {
		const allCardsInDeck = [...this.deckList, ...this.hand, ...this.deck, ...this.board, ...this.otherZone];
		return allCardsInDeck
			.filter((card) => card.cardId)
			.some(
				(card) =>
					card.cardId === CardIds.Collectible.Paladin.LadyLiadrin ||
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

		const allCardsInDeck = [...this.deckList, ...this.hand, ...this.deck, ...this.board, ...this.otherZone];
		return allCardsInDeck
			.filter((card) => card.cardId)
			.some((card) => DeckState.POGO_CARD_IDS.indexOf(card.cardId) !== -1);
	}

	public containsSpellCounterMinion(): boolean {
		const allCardsInDeck = [...this.deckList, ...this.hand, ...this.deck, ...this.board, ...this.otherZone];
		const result = allCardsInDeck
			.filter((card) => card.cardId)
			.some((card) => DeckState.SPELL_COUNTER_CARD_IDS.includes(card.cardId));
		// console.log('spell counter', 'has', result, allCardsInDeck, DeckState.SPELL_COUNTER_CARD_IDS);
		return result;
	}

	public containsElwynnBoar(): boolean {
		if (this.elwynnBoarsDeadThisMatch > 0) {
			return true;
		}

		const allCardsInDeck = [...this.deckList, ...this.hand, ...this.deck, ...this.board, ...this.otherZone];
		return allCardsInDeck
			.filter((card) => card.cardId)
			.some((card) => card.cardId === CardIds.Collectible.Neutral.ElwynnBoar);
	}
}
