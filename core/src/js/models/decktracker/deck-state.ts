import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
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

	private static readonly POGO_CARD_IDS = [CardIds.PogoHopper1, CardIds.PogoHopper2, CardIds.PogoHopperBattlegrounds];

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
	readonly spellsPlayedThisMatch: readonly DeckCard[] = [];
	readonly watchpostsPlayedThisMatch: number = 0;
	readonly libramsPlayedThisMatch: number = 0;
	readonly elementalsPlayedThisTurn: number = 0;
	readonly elementalsPlayedLastTurn: number = 0;
	readonly elwynnBoarsDeadThisMatch: number = 0;
	readonly heroPowerDamageThisMatch: number = 0;
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
	readonly cardsPlayedThisMatch: readonly DeckCard[] = [];
	readonly damageTakenThisTurn: number;
	readonly cardsPlayedFromInitialDeck: readonly { entityId: number; cardId: string }[] = [];

	public static create(value: DeckState): DeckState {
		return Object.assign(new DeckState(), value);
	}

	public update(value: DeckState): DeckState {
		return Object.assign(new DeckState(), this, value);
	}

	public findCard(entityId: number): DeckCard {
		const result = [...this.hand, ...this.deck, ...this.board, ...this.otherZone].find(
			(card) => card.entityId === entityId,
		);

		return result;
	}

	public totalCardsInZones(): number {
		return (
			(this.deck?.length ?? 0) +
			(this.hand?.length ?? 0) +
			(this.board?.length ?? 0) +
			(this.otherZone?.length ?? 0)
		);
	}

	public getAllCardsInDeck(): readonly DeckCard[] {
		return [
			...this.deckList,
			...this.hand,
			...this.deck,
			...this.board,
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
					card.cardId === CardIds.Cthun2 ||
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
					card.cardId === CardIds.KargalBattlescar1 ||
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

	public hasBolner() {
		return [...this.hand].filter((card) => card.cardId).some((card) => card.cardId === CardIds.BolnerHammerbeak);
	}

	public hasBrilliantMacaw() {
		return [...this.hand].filter((card) => card.cardId).some((card) => card.cardId === CardIds.BrilliantMacaw);
	}

	public lastBattlecryPlayedForMacaw(allCards: CardsFacadeService): DeckCard {
		console.debug('getting last card ', this.cardsPlayedThisMatch);
		return (
			this.cardsPlayedThisMatch
				.filter((card) => {
					const ref = allCards.getCard(card.cardId);
					return !!ref.mechanics?.length && ref.mechanics.includes('BATTLECRY');
				})
				// Because we want to know what card the macaw copies, so if we play two macaws in a row we still
				// want the info
				.filter((card) => card.cardId !== CardIds.BrilliantMacaw)
				.pop()
		);
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
