/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds, CardType, GameTag, SpellSchool } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { AttackOnBoard } from './attack-on-board';
import { BoardSecret } from './board-secret';
import { DeckCard } from './deck-card';
import { ShortCard, ShortCardWithTurn } from './game-state';
import { HeroCard } from './hero-card';

export const POGO_CARD_IDS = [
	CardIds.PogoHopper_BOT_283,
	CardIds.PogoHopper_BGS_028,
	CardIds.PogoHopper_TB_BaconUps_077,
];

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
	readonly heroPower: DeckCard | null;
	readonly weapon: DeckCard | null;
	readonly deckList: readonly DeckCard[] = [];
	readonly archetypeId: number | null;
	readonly cardsInStartingHand: readonly DeckCard[] = [];
	readonly unknownRealCardsInDeck: boolean;
	// This is too cumbersome to compute for the opponent deck when the decklist is known,
	// so we just read it form the game entities
	readonly cardsLeftInDeck: number;
	readonly showDecklistWarning: boolean;

	readonly secrets: readonly BoardSecret[] = [];
	readonly secretHelperActive: boolean = true;

	readonly totalAttackOnBoard: AttackOnBoard;
	readonly galakrondInvokesCount: number = 0;
	readonly cthunAtk: number = 0;
	readonly cthunHealth: number = 0;
	readonly jadeGolemSize: number = 0;
	readonly pogoHopperSize: number = 0;
	readonly astralAutomatonsSummoned: number = 0;
	readonly earthenGolemsSummoned: number = 0;
	readonly treantsSummoned: number = 0;
	readonly dragonsSummoned: number = 0;
	readonly piratesSummoned: number = 0;
	readonly fatigue: number = 0;
	readonly overloadedCrystals: number = 0;
	readonly corpsesGainedThisGame: number = 0;
	readonly corpsesSpent: number = 0;
	readonly cardsShuffledIntoDeck: number = 0;
	readonly abyssalCurseHighestValue: number = 0;
	readonly spellsPlayedThisMatch: readonly DeckCard[] = [];
	readonly spellsPlayedOnFriendlyEntities: readonly DeckCard[] = [];
	readonly spellsPlayedOnFriendlyMinions: readonly DeckCard[] = [];
	readonly spellsPlayedOnEnemyEntities: readonly DeckCard[] = [];
	readonly uniqueSpellSchools: readonly string[] = [];
	readonly cardsPlayedThisMatch: readonly ShortCardWithTurn[] = [];
	readonly secretsTriggeredThisMatch: readonly ShortCardWithTurn[] = [];
	readonly manaSpentOnSpellsThisMatch: number = 0;
	readonly manaSpentOnHolySpellsThisMatch: number = 0;
	readonly watchpostsPlayedThisMatch: number = 0;
	readonly libramsPlayedThisMatch: number = 0;
	readonly chaoticTendrilsPlayedThisMatch: number = 0;
	readonly elementalsPlayedThisTurn: number = 0;
	readonly elementalsPlayedLastTurn: number = 0;
	readonly elwynnBoarsDeadThisMatch: number = 0;
	readonly volatileSkeletonsDeadThisMatch: number = 0;
	readonly relicsPlayedThisMatch: number = 0;
	readonly heroPowerDamageThisMatch: number = 0;
	readonly heroPowerUsed: number = 0;
	readonly heroAttacksThisMatch: number = 0;
	readonly minionsDeadSinceLastTurn: readonly ShortCard[] = [];
	readonly minionsDeadThisTurn: readonly ShortCard[] = [];
	readonly minionsDeadThisMatch: readonly ShortCard[] = [];
	readonly lastDeathrattleMinionDead: ShortCard;
	readonly anachronos: readonly {
		entityId: number;
		cardId: string;
		turn: number;
		playerEntities: readonly number[];
		opponentEntities: readonly number[];
	}[] = [];
	readonly bonelordFrostwhisperFirstTurnTrigger: number | null = null;
	readonly locationsUsed: number = 0;
	readonly plaguesShuffledIntoEnemyDeck: number = 0;
	readonly currentExcavateTier: number = 0;
	readonly maxExcavateTier: number = 0;
	readonly totalExcavates: number = 0;
	readonly wheelOfDeathCounter: number | undefined = undefined;
	// readonly secretHelperActiveHover: boolean = false;

	// Graveyard is not so easy in fact - we want to know the cards that
	// can be interacted with, which means dead minions for Priest, or
	// discarded cards for warlock (if the warlock decks contains specific
	// cards)
	// readonly graveyard: ReadonlyArray<DeckCard> = [];
	readonly hand: readonly DeckCard[] = [];
	readonly additionalKnownCardsInHand: readonly string[] = [];
	readonly deck: readonly DeckCard[] = [];
	readonly board: readonly DeckCard[] = [];
	readonly otherZone: readonly DeckCard[] = [];
	readonly globalEffects: readonly DeckCard[] = [];
	// readonly dynamicZones: readonly DynamicZone[] = [];

	readonly currentOptions: readonly CardOption[] = [];

	readonly cardsPlayedLastTurn: readonly DeckCard[] = [];
	readonly cardsPlayedThisTurn: readonly DeckCard[] = [];
	readonly cardsCounteredThisTurn: number = 0;
	readonly cardDrawnThisGame: number = 0;
	readonly discoversThisGame: number = 0;
	readonly lastDeathrattleTriggered?: string;
	readonly manaUsedThisTurn: number = 0;
	readonly manaLeft: number = 0;
	// readonly cardsPlayedThisMatch: readonly DeckCard[] = [];
	readonly damageTakenThisTurn: number;
	// Only accounts for damage taken on your turns
	readonly damageTakenOnYourTurns: readonly TurnDamage[] = [];
	readonly cardsPlayedFromInitialDeck: readonly { entityId: number; cardId: string }[] = [];
	readonly turnTimings: readonly TurnTiming[] = [];
	readonly turnDuration: number;
	readonly enchantments: readonly {
		entityId: number;
		cardId: string;
		creatorEntityId?: number;
		creatorCardId?: string;
		tags?: { [Name in GameTag]?: number };
	}[] = [];
	readonly burnedCards: readonly { entityId: number; cardId: string }[] = [];
	readonly destroyedCardsInDeck: readonly { entityId: number; cardId: string }[] = [];
	readonly starshipsLaunched: readonly number[] = [];

	public static create(value: Partial<NonFunctionProperties<DeckState>>): DeckState {
		return Object.assign(new DeckState(), value);
	}

	public update(value: Partial<NonFunctionProperties<DeckState>>): DeckState {
		return Object.assign(new DeckState(), this, value);
	}

	public updateSpellsPlayedThisMatch(
		spell: DeckCard,
		allCards: CardsFacadeService,
		cardCost: number,
		targetEntityId: number,
	): DeckState {
		if (!spell) {
			return this;
		}

		const refCard = allCards.getCard(spell.cardId);
		if (refCard.type?.toUpperCase() !== CardType[CardType.SPELL]) {
			return this;
		}

		const spellsPlayedThisMatch = [...(this.spellsPlayedThisMatch ?? []), spell];
		const uniqueSpellSchools = [
			...new Set(
				(spellsPlayedThisMatch ?? [])
					.map((card) => card.cardId)
					.map((cardId) => allCards.getCard(cardId).spellSchool)
					.filter((spellSchool) => !!spellSchool),
			),
		] as string[];

		let manaSpentOnSpellsThisMatch = this.manaSpentOnSpellsThisMatch;
		let manaSpentOnHolySpellsThisMatch = this.manaSpentOnHolySpellsThisMatch;
		const manaCost = cardCost ?? 0;
		manaSpentOnSpellsThisMatch += manaCost;
		if (refCard?.spellSchool?.includes(SpellSchool[SpellSchool.HOLY])) {
			manaSpentOnHolySpellsThisMatch += manaCost;
		}

		const allEntityIds = [...this.board, this.hero].map((card) => Math.abs(card?.entityId ?? 0));
		let spellsPlayedOnFriendlyEntities = this.spellsPlayedOnFriendlyEntities ?? [];
		let spellsPlayedOnFriendlyMinions = this.spellsPlayedOnFriendlyMinions ?? [];
		if (!!targetEntityId && allEntityIds.includes(targetEntityId)) {
			spellsPlayedOnFriendlyEntities = [...spellsPlayedOnFriendlyEntities, spell];
			if (this.board.map((card) => Math.abs(card.entityId)).includes(targetEntityId)) {
				spellsPlayedOnFriendlyMinions = [...spellsPlayedOnFriendlyMinions, spell];
			}
		}
		let spellsPlayedOnEnemyEntities = this.spellsPlayedOnEnemyEntities ?? [];
		if (!!targetEntityId && !allEntityIds.includes(targetEntityId)) {
			spellsPlayedOnEnemyEntities = [...spellsPlayedOnEnemyEntities, spell];
		}
		return this.update({
			spellsPlayedThisMatch: spellsPlayedThisMatch,
			uniqueSpellSchools: uniqueSpellSchools,
			manaSpentOnSpellsThisMatch: manaSpentOnSpellsThisMatch,
			manaSpentOnHolySpellsThisMatch: manaSpentOnHolySpellsThisMatch,
			spellsPlayedOnFriendlyEntities: spellsPlayedOnFriendlyEntities,
			spellsPlayedOnFriendlyMinions: spellsPlayedOnFriendlyMinions,
			spellsPlayedOnEnemyEntities: spellsPlayedOnEnemyEntities,
		});
	}

	public findCard(entityId: number): { zone: 'hand' | 'deck' | 'board' | 'other'; card: DeckCard } | null {
		const zones: { id: 'hand' | 'deck' | 'board' | 'other'; cards: readonly DeckCard[] }[] = [
			{ id: 'hand', cards: this.hand },
			{ id: 'deck', cards: this.deck },
			{ id: 'board', cards: this.board },
			{ id: 'other', cards: this.otherZone },
		];
		for (const zone of zones) {
			const result = zone.cards.find((card) => Math.abs(card.entityId) === Math.abs(entityId));
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

	public getAllCardsInDeckWithoutOptions(): readonly DeckCard[] {
		return [
			...this.deckList,
			...this.hand,
			...this.deck,
			...this.board,
			...this.otherZone.filter((card) => card.zone !== 'SETASIDE'),
		];
	}

	public getAllPotentialFutureCards(): readonly { entityId: number; cardId: string }[] {
		return [...this.hand, ...this.deck, ...this.board, ...this.currentOptions];
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

	public getAllCardsFromStarterDeck(): readonly DeckCard[] {
		return [...this.deckList, ...this.hand, ...this.deck, ...this.board, ...this.otherZone]
			.filter((c) => !!c)
			.filter((c) => !c.creatorCardId?.length && !c.stolenFromOpponent)
			.filter((c) => !c.temporaryCard);
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

	public containsCthun(allCards: CardsFacadeService): boolean {
		if (this.cthunAtk > 0 || this.cthunHealth > 0) {
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

	public hasRelevantCard(
		cardIds: readonly CardIds[] | ((cardId: string) => boolean),
		options?: {
			excludesDeckInLimited?: boolean;
			onlyLimited?: boolean;
			includesOtherZone?: boolean;
			includeBoard?: boolean;
		},
	) {
		let pool = [...this.hand, ...this.currentOptions].map((card) => card.cardId);
		if (options?.includeBoard) {
			pool = pool.concat(this.board.map((card) => card.cardId));
		}
		pool = pool.concat(this.deck.map((card) => card.cardId));
		return pool
			.concat(this.getCardsInSideboards())
			.filter((cardId: string) => !!cardId)
			.some((cardId) =>
				Array.isArray(cardIds)
					? cardIds.includes(cardId as CardIds)
					: (cardIds as (cardId: string) => boolean)(cardId),
			);
	}

	public hasRelevantMechanics(
		allCards: CardsFacadeService,
		mechanics: readonly GameTag[],
		options?: {
			excludesDeckInLimited?: boolean;
			onlyLimited?: boolean;
			includesOtherZone?: boolean;
			debug?: boolean;
		},
	) {
		if (
			this.hasRelevantMechanicsLimited(
				allCards,
				mechanics,
				options?.onlyLimited ? !options.excludesDeckInLimited : true,
			)
		) {
			return true;
		}

		if (options?.onlyLimited) {
			return false;
		}

		let updatedPool = [...this.deckList, ...this.board, this.weapon];
		if (options?.includesOtherZone) {
			updatedPool = updatedPool.concat(this.otherZone.filter((card) => card.zone !== 'SETASIDE'));
		}
		return updatedPool
			.map((card) => card?.cardId)
			.filter((cardId) => !!cardId)
			.concat(this.getCardsInSideboards())
			.map((card) => allCards.getCard(card!))
			.some((card) => card.mechanics?.some((mec) => mechanics.includes(GameTag[mec])));
	}

	private hasRelevantMechanicsLimited(
		allCards: CardsFacadeService,
		mechanics: readonly GameTag[],
		includesDeck = true,
	) {
		let pool = [...this.hand, ...this.currentOptions].map((card) => card.cardId);
		if (includesDeck) {
			pool = pool.concat(this.deck.map((card) => card.cardId));
		}
		// console.debug(
		// 	'checking for relevant card 2',
		// 	cardIds instanceof Array ? cardIds.join('') : cardIds,
		// 	// pool.join(', '),
		// 	excludesDeck,
		// 	cardIds instanceof Array,
		// 	pool.concat(!excludesDeck ? this.getCardsInSideboards() : []).join(', '),
		// );
		return pool
			.concat(includesDeck ? this.getCardsInSideboards() : [])
			.map((card) => allCards.getCard(card))
			.some((card) => card.mechanics?.some((mec) => mechanics.includes(GameTag[mec])));
	}

	public firstBattlecryPlayedThisTurn(allCards: CardsFacadeService): DeckCard | null {
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

	public getCardsInSideboards(): readonly string[] {
		return (this.sideboards ?? []).flatMap((s) => s.cards ?? []);
	}
}

export interface TurnTiming {
	readonly turn: number;
	readonly startTimestamp: number;
	readonly endTimestamp: number;
}
export const equalTurnTiming = (a: TurnTiming | null | undefined, b: TurnTiming | null | undefined): boolean => {
	if (!a && !b) {
		return true;
	}
	if (!a || !b) {
		return false;
	}
	if (a.turn !== b.turn) {
		return false;
	}
	if (a.startTimestamp !== b.startTimestamp) {
		return false;
	}
	if (a.endTimestamp !== b.endTimestamp) {
		return false;
	}
	return true;
};

export interface CardOption {
	readonly entityId: number;
	readonly cardId: string;
	readonly source: string;
	readonly context: /*ChoosingOptionsGameEvent['additionalData']['context'];*/ {
		readonly DataNum1: number;
	};
	readonly questDifficulty?: number;
	readonly questReward?: {
		readonly EntityId: number;
		readonly CardId: string;
	};
	readonly willBeActive?: boolean;
}
export const equalCardOption = (a: CardOption | null | undefined, b: CardOption | null | undefined): boolean => {
	if (!a && !b) {
		return true;
	}
	if (!a || !b) {
		return false;
	}
	if (a.entityId !== b.entityId) {
		return false;
	}
	if (a.cardId !== b.cardId) {
		return false;
	}
	if (a.source !== b.source) {
		return false;
	}
	if (a.context.DataNum1 !== b.context.DataNum1) {
		return false;
	}
	if (a.questDifficulty !== b.questDifficulty) {
		return false;
	}
	if (a.questReward?.EntityId !== b.questReward?.EntityId) {
		return false;
	}
	if (a.questReward?.CardId !== b.questReward?.CardId) {
		return false;
	}
	return true;
};

export interface DeckSideboard {
	readonly keyCardId: string;
	readonly cards: readonly string[];
}

export interface TurnDamage {
	readonly turn: number;
	readonly damage: readonly number[];
	readonly hits: readonly number[];
}
