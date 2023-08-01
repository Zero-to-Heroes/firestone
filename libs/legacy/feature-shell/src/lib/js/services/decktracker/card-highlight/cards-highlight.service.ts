import { Injectable } from '@angular/core';
import { CardIds, CardType, GameTag, Race, ReferenceCard, SpellSchool } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { filter, map, takeUntil } from 'rxjs/operators';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { DeckZone } from '../../../models/decktracker/view/deck-zone';
import { VisualDeckCard } from '../../../models/decktracker/visual-deck-card';
import { AbstractSubscriptionService } from '../../abstract-subscription.service';
import { PreferencesService } from '../../preferences.service';
import { AppUiStoreFacadeService } from '../../ui-store/app-ui-store-facade.service';
import {
	and,
	arcane,
	attackGreaterThan,
	attackLessThan,
	baseCostEqual,
	battlecry,
	beast,
	cardIs,
	cardType,
	cardsPlayedThisMatch,
	chooseOne,
	combo,
	corrupt,
	corrupted,
	currentClass,
	damage as dealsDamage,
	deathrattle,
	demon,
	discover,
	divineShield,
	dragon,
	dredge,
	effectiveCostEqual,
	effectiveCostLess,
	effectiveCostLessThanRemainingMana,
	effectiveCostMore,
	elemental,
	fel,
	fire,
	freeze,
	frenzy,
	frost,
	generatesPlague,
	hasSpellSchool,
	healthBiggerThanAttack,
	holy,
	imp,
	inDeck,
	inGraveyard,
	inHand,
	inOther,
	inPlay,
	isSi7,
	lastAffectedByCardId,
	legendary,
	lifesteal,
	magnetic,
	mech,
	minion,
	minionPlayedThisMatch,
	minionsDeadSinceLastTurn,
	murloc,
	naga,
	nature,
	neutral,
	not,
	notInInitialDeck,
	opposingSide,
	or,
	outcast,
	overload,
	paladin,
	pirate,
	race,
	rush,
	secret,
	shadow,
	side,
	spell,
	spellPlayedThisMatch,
	spellSchool,
	summonsTreant,
	taunt,
	totem,
	tribeless,
	undead,
	weapon,
	whelp,
} from './selectors';

@Injectable()
export class CardsHighlightService extends AbstractSubscriptionService {
	private handlers: { [uniqueId: string]: Handler } = {};

	private gameState: GameState;
	private options: SelectorOptions;

	constructor(
		private readonly prefs: PreferencesService,
		protected readonly store: AppUiStoreFacadeService,
		private readonly allCards: CardsFacadeService,
	) {
		super(store);
		this.setup();
		window['cardsHighlightService'] = this;
	}

	private async setup() {
		await this.store.initComplete();
		const obs: Observable<GameState> = this.store
			.listenDeckState$((gameState) => gameState)
			.pipe(
				filter((gameState) => !!gameState),
				map(([gameState]) => gameState),
				takeUntil(this.destroyed$),
			);
		obs.pipe(takeUntil(this.destroyed$)).subscribe((gameState) => (this.gameState = gameState));
	}

	public async init(options?: SelectorOptions) {
		this.options = options;
		console.debug('init done', this.options, options);
	}

	// public shutDown() {
	// 	super.onDestroy();
	// }

	register(_uniqueId: string, handler: Handler, side: 'player' | 'opponent' | 'duels') {
		this.handlers[_uniqueId] = handler;
	}

	unregister(_uniqueId: string, side: 'player' | 'opponent' | 'duels') {
		delete this.handlers[_uniqueId];
	}

	async onMouseEnter(cardId: string, side: 'player' | 'opponent' | 'duels', card?: DeckCard) {
		// Happens when using the deck-list component outside of a game
		if (!this.options?.skipGameState && !this.gameState) {
			console.debug('no game state, skipping highlight');
			return;
		}

		const prefs = await this.prefs.getPreferences();
		if (!this.options?.skipPrefs && !prefs.overlayHighlightRelatedCards) {
			console.debug('highlighting disabled in prefs, skipping highlight');
			return;
		}

		const playerDeckProvider = () =>
			this.options?.skipGameState ? this.buildFakeDeckStateFromRegisteredHandlers() : this.gameState.playerDeck;
		const opponentDeckProvider = () => (this.options?.skipGameState ? null : this.gameState.opponentDeck);

		const cardsToHighlight = this.buildCardsToHighlight(
			side,
			cardId,
			card,
			playerDeckProvider,
			opponentDeckProvider,
		);
		// console.debug(
		// 	'cardsToHighlight',
		// 	cardsToHighlight,
		// 	cardId,
		// 	side,
		// 	card,
		// 	playerDeckProvider(),
		// 	this.options,
		// 	this.gameState,
		// );
		// console.debug(
		// 	'handlers',
		// 	Object.values(this.handlers).map((h) => h.deckCardProvider()),
		// 	Object.values(this.handlers)
		// 		.filter((h) => !h.deckCardProvider())
		// 		.map((h) => h.referenceCardProvider()),
		// );
		for (const card of cardsToHighlight) {
			const handler = Object.values(this.handlers).find((h) =>
				// Discovers don't have deck card providers
				h.deckCardProvider()?.internalEntityIds?.includes(card.internalEntityId),
			);
			if (!!handler) {
				// console.debug(
				// 	'DO HIGHLGIHT',
				// 	handler.referenceCardProvider()?.name,
				// 	handler,
				// 	handler.highlightCallback,
				// );
				handler.highlightCallback();
			}
		}
	}

	getHighlightedCards(
		cardId: string,
		side: 'player' | 'opponent' | 'duels',
		card?: DeckCard,
	): readonly { cardId: string; playTiming: number }[] {
		// Happens when using the deck-list component outside of a game
		if (!this.options?.skipGameState && !this.gameState) {
			return;
		}

		const playerDeckProvider = () =>
			this.options?.skipGameState ? this.buildFakeDeckStateFromRegisteredHandlers() : this.gameState.playerDeck;
		const opponentDeckProvider = () => (this.options?.skipGameState ? null : this.gameState.opponentDeck);

		const cardsToHighlight = this.buildCardsToHighlight(
			side,
			cardId,
			card,
			playerDeckProvider,
			opponentDeckProvider,
		);
		return cardsToHighlight.map((i) => ({
			cardId: i.cardId,
			playTiming: i.deckCard?.playTiming ?? 0,
		}));
	}

	private buildFakeDeckStateFromRegisteredHandlers(): DeckState {
		return DeckState.create({
			deck: Object.values(this.handlers).map((h) => {
				return !!h.deckCardProvider()
					? h.deckCardProvider()
					: DeckCard.create({
							cardId: h.referenceCardProvider()?.id,
					  });
			}),
		});
	}

	private buildCardsToHighlight(
		side: 'player' | 'opponent' | 'duels',
		cardId: string,
		card: DeckCard,
		playerDeckProvider: () => DeckState,
		opponentDeckProvider: () => DeckState,
	): readonly SelectorInput[] {
		const result: SelectorInput[] = [];
		const selector: Selector = this.buildSelector(cardId, card, side);
		// console.debug('selector', selector, cardId, card, side);

		const allPlayerCards = this.getAllCards(
			!!playerDeckProvider ? playerDeckProvider() : null,
			side === 'duels' ? side : 'player',
		);
		// console.debug('allPlayerCards', allPlayerCards);
		for (const card of allPlayerCards) {
			// console.debug('\t', 'considering card to highlight', card);
			if (selector(card)) {
				// console.debug('\t', 'will highlight', card);
				result.push(card);
			}
		}

		// const otherSideToCheck = side === 'player' ? 'opponent' : side === 'opponent' ? 'player' : side;
		const allOpponentCards = this.getAllCards(
			!!opponentDeckProvider ? opponentDeckProvider() : null,
			side === 'duels' ? side : 'opponent',
		);
		// console.debug('allOpponentCards', allOpponentCards);
		for (const card of allOpponentCards) {
			// console.debug('\t', 'considering card to highlight', card);
			if (selector(card)) {
				// console.debug('\t', 'will highlight', card);
				result.push(card);
			}
		}
		return result;
	}

	onMouseLeave(cardId: string) {
		Object.values(this.handlers).forEach((handler) => handler.unhighlightCallback());
	}

	private getAllCards(deckState: DeckState, side: 'player' | 'opponent' | 'duels'): readonly SelectorInput[] {
		if (!deckState) {
			return [];
		}
		const result: SelectorInput[] = [];
		for (const card of [...deckState.deck]) {
			result.push({
				cardId: card.cardId,
				entityId: card.entityId,
				internalEntityId: card.internalEntityId,
				card: !!card.cardId ? this.allCards.getCard(card.cardId) : null,
				zone: 'deck',
				side: side,
				deckCard: card,
				deckState: deckState,
				allCards: this.allCards,
			});
		}
		for (const card of [...deckState.hand]) {
			result.push({
				cardId: card.cardId,
				entityId: card.entityId,
				internalEntityId: card.internalEntityId,
				card: !!card.cardId ? this.allCards.getCard(card.cardId) : null,
				zone: 'hand',
				side: side,
				deckCard: card,
				deckState: deckState,
				allCards: this.allCards,
			});
		}
		for (const card of [...deckState.board]) {
			result.push({
				cardId: card.cardId,
				entityId: card.entityId,
				internalEntityId: card.internalEntityId,
				card: !!card.cardId ? this.allCards.getCard(card.cardId) : null,
				zone: 'other',
				side: side,
				deckCard: card,
				deckState: deckState,
				allCards: this.allCards,
			});
		}
		for (const card of [...deckState.otherZone]) {
			result.push({
				cardId: card.cardId,
				entityId: card.entityId,
				internalEntityId: card.internalEntityId,
				card: !!card.cardId ? this.allCards.getCard(card.cardId) : null,
				zone: card.zone === 'GRAVEYARD' ? 'graveyard' : 'other',
				side: side,
				deckCard: card,
				deckState: deckState,
				allCards: this.allCards,
			});
		}
		return result;
	}

	private buildSelector(cardId: string, card: DeckCard, inputSide: 'player' | 'opponent' | 'duels'): Selector {
		const cardIdSelector = this.buildCardIdSelector(cardId, card, inputSide);
		const cardContextSelector = this.buildCardContextSelector(card);
		return or(cardIdSelector, cardContextSelector);
	}

	private buildCardContextSelector(card: DeckCard): Selector {
		if (card?.dredged && !card.cardId && card.linkedEntityIds?.length) {
			return (input: SelectorInput): boolean => card.linkedEntityIds.includes(input.entityId);
		}
	}

	private buildCardIdSelector(cardId: string, card: DeckCard, inputSide: 'player' | 'opponent' | 'duels'): Selector {
		switch (cardId) {
			case CardIds.AbsorbentParasite:
				return and(side(inputSide), or(inDeck, inHand), minion, or(mech, beast));
			case CardIds.AbyssalBassist:
				return and(side(inputSide), or(inDeck, inHand), weapon);
			case CardIds.AbyssalDepths:
				return (input: SelectorInput): boolean => {
					const cheapestMinions = [...input.deckState.deck]
						.filter((c) => this.allCards.getCard(c.cardId).type === 'Minion')
						.sort((a, b) => a.manaCost - b.manaCost)
						.slice(0, 2);
					const secondCheapestMinionCost = (cheapestMinions[1] ?? cheapestMinions[0])?.manaCost ?? 0;
					return (
						side(inputSide)(input) &&
						minion(input) &&
						inDeck(input) &&
						input.deckCard?.getEffectiveManaCost() <= secondCheapestMinionCost
					);
				};
			case CardIds.AdvancedTargetingMonocle:
				return and(side(inputSide), inDeck, spell);
			case CardIds.AllianceBannerman:
				return and(side(inputSide), inDeck, minion);
			case CardIds.AllShallServeTavernBrawl:
				return and(side(inputSide), minion, demon);
			case CardIds.AllTogetherNowTavernBrawl:
				return and(side(inputSide), or(inDeck, inHand), battlecry);
			case CardIds.AmalgamOfTheDeep:
				return and(side(inputSide), or(inDeck, inHand), minion, not(tribeless));
			case CardIds.AmberWhelp:
				return and(side(inputSide), or(inDeck, inHand), minion, dragon);
			case CardIds.AmitusThePeacekeeper_ReinforcedToken:
				return and(side(inputSide), inDeck, minion);
			case CardIds.AmuletOfUndying:
				return and(side(inputSide), inGraveyard, minion, deathrattle);
			case CardIds.AnimateDead:
				return and(side(inputSide), inGraveyard, minion, effectiveCostLess(3));
			case CardIds.Ancharrr:
				return and(side(inputSide), inDeck, minion, pirate);
			case CardIds.Anubrekhan_RLK_659:
				return and(side(inputSide), or(inDeck, inHand), minion);
			case CardIds.ApexisBlast:
				return and(side(inputSide), inDeck, minion);
			case CardIds.AquaArchivist:
				return and(side(inputSide), inDeck, minion, elemental);
			case CardIds.ArcaneArtificer:
			case CardIds.ArcaneArtificerCore:
				return and(side(inputSide), or(inDeck, inHand), spell);
			case CardIds.ArcaneBrilliance:
				return and(
					side(inputSide),
					inDeck,
					spell,
					or(effectiveCostEqual(7), effectiveCostEqual(8), effectiveCostEqual(9), effectiveCostEqual(10)),
				);
			case CardIds.ArcaneFluxTavernBrawl:
				return and(side(inputSide), spell, arcane);
			case CardIds.ArcaneLuminary:
				return and(side(inputSide), inDeck, notInInitialDeck);
			case CardIds.ArcaneQuiver_RLK_817:
				return and(side(inputSide), inDeck, arcane);
			case CardIds.ArcaniteCrystalTavernBrawl:
				return and(side(inputSide), spell, arcane);
			case CardIds.Arcanologist:
				return and(side(inputSide), inDeck, spell, secret);
			case CardIds.ArcanologistCore:
				return and(side(inputSide), inDeck, spell, secret);
			case CardIds.ArcticArmorTavernBrawl:
				return and(side(inputSide), freeze);
			case CardIds.ArmsDealer_RLK_824:
				return and(side(inputSide), or(inDeck, inHand), undead);
			case CardIds.TheLichKing_ArmyOfTheFrozenThroneToken:
				return and(side(inputSide), inDeck, minion);
			case CardIds.Assembly:
			case CardIds.Assembly_Assembly:
				return and(side(inputSide), inDeck, minion);
			case CardIds.AwakenTheMakers:
				return and(side(inputSide), or(inDeck, inHand), minion, deathrattle);
			case CardIds.AxeBerserker:
				return and(side(inputSide), inDeck, weapon);
			case CardIds.AzsharanGardens_SunkenGardensToken:
				return and(side(inputSide), or(inDeck, inHand), minion);
			case CardIds.AzsharanSaber_SunkenSaberToken:
				return and(side(inputSide), inDeck, minion, beast);
			case CardIds.AzsharanScavenger_SunkenScavengerToken:
				return and(side(inputSide), minion, murloc);
			case CardIds.BabaNaga:
				return and(side(inputSide), or(inDeck, inHand), spell);
			case CardIds.BalindaStonehearth:
				return and(side(inputSide), inDeck, spell);
			case CardIds.BandOfBeesTavernBrawl:
				return and(side(inputSide), or(inDeck, inHand), minion, effectiveCostLess(3));
			case CardIds.Banjosaur:
				return and(side(inputSide), inDeck, beast, minion);
			case CardIds.BarakKodobane_BAR_551:
				return and(
					side(inputSide),
					inDeck,
					spell,
					or(effectiveCostEqual(1), effectiveCostEqual(2), effectiveCostEqual(3)),
				);
			case CardIds.BattleTotem_LOOTA_846:
				return and(side(inputSide), or(inDeck, inHand), battlecry);
			case CardIds.BeckoningBicornTavernBrawl:
				return and(side(inputSide), or(inDeck, inHand), pirate);
			case CardIds.BitterColdTavernBrawl:
				return and(side(inputSide), frost, dealsDamage);
			case CardIds.BlackrockNRoll:
				return and(side(inputSide), inDeck, minion);
			case CardIds.BlackwingCorruptor:
				return and(side(inputSide), or(inDeck, inHand), dragon);
			case CardIds.BladeOfQuickeningTavernBrawlToken:
				return and(side(inputSide), inDeck, outcast);
			case CardIds.BladeOfTheBurningSun:
				return and(side(inputSide), inDeck, minion);
			case CardIds.BloodCrusader:
				return and(side(inputSide), or(inDeck, inHand), minion, paladin);
			case CardIds.BloodOfGhuun:
				return and(side(inputSide), inDeck, minion);
			case CardIds.BloodreaverGuldan_CORE_ICC_831:
			case CardIds.BloodreaverGuldan_ICC_831:
				return and(side(inputSide), inGraveyard, minion, demon);
			case CardIds.Bolster:
				return and(side(inputSide), or(inDeck, inHand), minion, taunt);
			case CardIds.Bonecaller:
				return and(side(inputSide), inGraveyard, minion, undead);
			case CardIds.Boneshredder:
				return and(side(inputSide), inGraveyard, minion, deathrattle);
			case CardIds.BoogieDown:
				return and(side(inputSide), inDeck, minion, effectiveCostEqual(1));
			case CardIds.BookOfSpecters:
				return and(side(inputSide), inDeck, spell);
			case CardIds.BronzeSignetTavernBrawl:
				return and(side(inputSide), inDeck, minion);
			case CardIds.CagematchCustodian:
				return and(side(inputSide), inDeck, cardType(CardType.WEAPON));
			case CardIds.CannonBarrage:
				return and(side(inputSide), or(inDeck, inHand), pirate);
			case CardIds.CapturedFlag:
				return and(side(inputSide), or(inDeck, inHand), minion);
			case CardIds.CariaFelsoul:
				return and(side(inputSide), inDeck, demon);
			case CardIds.CastleKennels_REV_362:
			case CardIds.CastleKennels_REV_790:
				return and(side(inputSide), inDeck, minion, beast);
			case CardIds.CatrinaMuerteCore:
			case CardIds.CatrinaMuerte:
				return and(side(inputSide), inGraveyard, undead, minion);
			case CardIds.ChainedGuardian:
				return and(side(inputSide), or(inHand, inDeck), generatesPlague);
			case CardIds.ChampionOfStorms:
				return and(side(inputSide), or(inHand, inDeck), spell, nature);
			case CardIds.ChattyBartender:
				return and(side(inputSide), inDeck, secret);
			case CardIds.ChorusRiff:
				return and(side(inputSide), inDeck, minion);
			case CardIds.ClassActionLawyer:
				return and(side(inputSide), inDeck, neutral);
			case CardIds.ClickClocker:
				return and(side(inputSide), or(inDeck, inHand), minion, mech);
			case CardIds.ClockworkAssistant_GILA_907:
			case CardIds.ClockworkAssistant_ONY_005ta11:
			case CardIds.ClockworkAssistantTavernBrawl_PVPDR_SCH_Active48:
			case CardIds.ClockworkAssistantTavernBrawl_PVPDR_Toki_T5:
				return and(side(inputSide), inDeck, spell);
			case CardIds.ClockworkKnight:
				return and(side(inputSide), or(inDeck, inHand), minion, mech);
			case CardIds.CoilCastingTavernBrawl:
				return and(side(inputSide), or(inDeck, inHand), naga);
			case CardIds.CollectorsIreTavernBrawlToken:
				return and(side(inputSide), inDeck, minion, or(dragon, pirate, mech));
			case CardIds.ConchsCall:
				return and(side(inputSide), inDeck, or(naga, spell));
			case CardIds.ContrabandStash:
				return and(side(inputSide), cardsPlayedThisMatch, not(currentClass), not(neutral));
			case CardIds.CookiesLadleTavernBrawl:
				return and(side(inputSide), or(inDeck, inHand), murloc);
			case CardIds.Commencement:
				return and(side(inputSide), inDeck, minion);
			case CardIds.CosmicKeyboard:
				return and(side(inputSide), or(inDeck, inHand), spell);
			case CardIds.CostumedSinger:
				return and(side(inputSide), inDeck, secret);
			case CardIds.CorruptedFelstoneTavernBrawl:
				return and(side(inputSide), or(inDeck, inHand), spell, fel);
			case CardIds.CountessAshmore:
				return and(side(inputSide), inDeck, or(rush, lifesteal, deathrattle));
			case CardIds.CowardlyGrunt:
				return and(side(inputSide), inDeck, minion);
			case CardIds.CrashOfThunder:
				return and(side(inputSide), or(inHand, inDeck), spell, nature);
			case CardIds.CreationProtocol:
			case CardIds.CreationProtocol_CreationProtocolToken:
				return and(side(inputSide), inDeck, minion);
			case CardIds.CrushclawEnforcer:
				return and(side(inputSide), inDeck, naga);
			case CardIds.CrystalsmithCultist:
				return and(side(inputSide), or(inDeck, inHand), spell, shadow);
			case CardIds.Crystology:
				return and(side(inputSide), inDeck, minion, attackLessThan(2));
			case CardIds.Cultivation:
				return and(side(inputSide), or(inDeck, inHand), summonsTreant);
			case CardIds.CutlassCourier:
				return and(side(inputSide), inDeck, pirate);
			case CardIds.DaringDrake:
				return and(side(inputSide), or(inDeck, inHand), dragon);
			case CardIds.DarkInquisitorXanesh:
				return and(side(inputSide), or(inDeck, inHand), or(corrupt, corrupted));
			case CardIds.DaUndatakah:
				return and(side(inputSide), inGraveyard, minion, deathrattle);
			case CardIds.DeadRinger:
				return and(side(inputSide), inDeck, minion, deathrattle);
			case CardIds.DealWithADevil:
				return and(side(inputSide), inDeck, minion);
			case CardIds.DeathBlossomWhomper:
				return and(side(inputSide), inDeck, minion, deathrattle);
			case CardIds.DeathlyDeathTavernBrawl:
				return and(side(inputSide), minion, deathrattle);
			case CardIds.DeathstriderTavernBrawl:
				return and(side(inputSide), or(inDeck, inHand), minion, deathrattle);
			case CardIds.DeepwaterEvoker:
				return and(side(inputSide), inDeck, spell);
			case CardIds.DefenseAttorneyNathanos:
				return and(side(inputSide), inGraveyard, minion, deathrattle);
			case CardIds.DevoutBlessingsTavernBrawlToken:
				return and(side(inputSide), inGraveyard, minion, deathrattle, minionsDeadSinceLastTurn);
			case CardIds.DinnerPerformer:
				return and(side(inputSide), inDeck, minion, effectiveCostLessThanRemainingMana);
			case CardIds.DirgeOfDespair:
				return and(side(inputSide), inDeck, demon, minion);
			case CardIds.DiscoMaul:
				return and(side(inputSide), or(inDeck, inHand), minion);
			case CardIds.DisksOfLegendTavernBrawl:
				return and(side(inputSide), or(inDeck, inHand), minion, legendary);
			case CardIds.DivineIlluminationTavernBrawl:
				return and(side(inputSide), holy);
			case CardIds.DivingGryphon:
				return and(side(inputSide), inDeck, minion, rush);
			case CardIds.DoorOfShadows:
			case CardIds.DoorOfShadows_DoorOfShadowsToken:
				return and(side(inputSide), inDeck, spell);
			case CardIds.DoubleJump_SCH_422:
				return and(side(inputSide), inDeck, outcast);
			case CardIds.DoubleTime:
				return and(side(inputSide), or(inDeck, inHand), spell);
			case CardIds.DraconicDreamTavernBrawl:
				return and(side(inputSide), dragon);
			case CardIds.DragonAffinityTavernBrawl:
				return and(side(inputSide), dragon);
			case CardIds.DragonbloodTavernBrawl:
				return and(side(inputSide), dragon);
			case CardIds.DragonboneRitualTavernBrawl:
				return and(side(inputSide), dragon);
			case CardIds.Drekthar_AV_100:
				return !card
					? null
					: and(side(inputSide), inDeck, minion, effectiveCostLess(card.getEffectiveManaCost()));
			case CardIds.DrocomurchanicasTavernBrawlToken:
				return and(side(inputSide), inDeck, minion, or(dragon, murloc, mech));
			case CardIds.DunBaldarBunker:
				return and(side(inputSide), inDeck, secret);
			case CardIds.EdgeOfDredgeTavernBrawl:
				return and(side(inputSide), or(inDeck, inHand), dredge);
			case CardIds.EerieStoneTavernBrawl:
				return and(side(inputSide), spell, shadow);
			case CardIds.EerieStoneTavernBrawl:
				return and(side(inputSide), spell, shadow);
			case CardIds.ElementalEvocation:
				return and(side(inputSide), or(inHand, inDeck), elemental);
			case CardIds.ElitistSnob:
				return and(side(inputSide), inHand, paladin);
			case CardIds.ElixirOfVigorTavernBrawl:
				return and(side(inputSide), minion);
			case CardIds.Embiggen:
				return and(side(inputSide), inDeck, minion);
			case CardIds.EnduranceTrainingTavernBrawl:
				return and(side(inputSide), minion, taunt);
			case CardIds.EternalServitude_CORE_ICC_213:
			case CardIds.EternalServitude_ICC_213:
				return and(side(inputSide), inGraveyard, minion);
			case CardIds.ExpeditedBurialTavernBrawl:
				return and(side(inputSide), minion, deathrattle);
			case CardIds.FaithfulCompanions:
				return and(side(inputSide), inDeck, minion, beast);
			case CardIds.FandralStaghelm_CORE_OG_044:
			case CardIds.FandralStaghelm_OG_044:
				return and(side(inputSide), inDeck, chooseOne);
			case CardIds.FeldoreiWarband:
				return and(side(inputSide), inDeck, minion);
			case CardIds.FelfireInTheHole:
				return and(side(inputSide), inDeck, spell);
			case CardIds.Felgorger_SW_043:
				return and(side(inputSide), inDeck, spell, fel);
			case CardIds.FirekeepersIdolTavernBrawl:
				return and(side(inputSide), spell, fire);
			case CardIds.FirePlumesHeart:
				return and(side(inputSide), or(inDeck, inHand), minion, taunt);
			case CardIds.FiremancerFlurgl:
				return and(side(inputSide), race(Race.MURLOC), or(inDeck, inHand));
			case CardIds.FlamesOfTheKirinTorTavernBrawl:
				return and(side(inputSide), or(inDeck, inHand), spell, fire);
			case CardIds.FlameWavesTavernBrawl:
				return and(side(inputSide), or(inDeck, inHand), spell, fire);
			case CardIds.FleshBehemoth_RLK_830:
			case CardIds.FleshBehemoth_RLK_Prologue_RLK_830:
				return and(side(inputSide), inDeck, minion, undead, not(cardIs(CardIds.FleshBehemoth_RLK_830)));
			case CardIds.Flowrider:
				return and(side(inputSide), inDeck, spell);
			case CardIds.FossilFanatic:
				return and(side(inputSide), inDeck, spell, fel);
			case CardIds.FrequencyOscillator:
				return and(side(inputSide), or(inDeck, inHand), minion, mech);
			case CardIds.FrizzKindleroost:
				return and(side(inputSide), inDeck, dragon);
			case CardIds.FrostLichJaina_ICC_833:
			case CardIds.FrostLichJaina_CORE_ICC_833:
				return and(side(inputSide), or(inDeck, inHand), elemental);
			case CardIds.FrontLines_TID_949:
			case CardIds.FrontLines_Story_11_FrontLines:
				return and(side(inputSide), inDeck, minion);
			case CardIds.FrostweaveDungeoneer:
				return and(side(inputSide), inDeck, spell);
			case CardIds.FungalFortunes:
				return and(side(inputSide), inDeck, minion);
			case CardIds.GaiaTheTechtonic_TSC_029:
				return and(side(inputSide), or(inDeck, inHand), minion, mech);
			case CardIds.GatherYourParty:
				return and(side(inputSide), inDeck, minion);
			case CardIds.GhastlyGravedigger:
				return and(side(inputSide), or(inDeck, inHand), secret);
			case CardIds.GhoulishAlchemist:
				return and(
					side(inputSide),
					or(inDeck, inHand),
					cardIs(
						CardIds.GhoulishAlchemist_SlimyConcoctionToken,
						CardIds.GhoulishAlchemist_DreadfulConcoctionToken,
						CardIds.GhoulishAlchemist_BubblingConcoctionToken,
						CardIds.GhoulishAlchemist_HazyConcoctionToken,
						CardIds.GhoulishAlchemist_GleamingConcoctionToken,
						CardIds.Concoctor,
						CardIds.PotionBelt,
						CardIds.VileApothecary,
						CardIds.PotionmasterPutricide,
						CardIds.ContagionConcoctionTavernBrawl,
					),
				);
			case CardIds.Gigantotem:
				return and(side(inputSide), or(inDeck, inHand), totem);
			case CardIds.Glaivetar:
				return and(side(inputSide), inDeck, outcast);
			case CardIds.GlowflySwarm:
				return and(side(inputSide), or(inDeck, inHand), spell);
			case CardIds.GluthSicleTavernBrawl:
				return and(side(inputSide), inDeck, minion, undead);
			case CardIds.GluthTavernBrawl_PVPDR_Sai_T1:
				return and(side(inputSide), or(inDeck, inHand), minion, undead);
			case CardIds.GlacialDownpourTavernBrawl:
				return and(side(inputSide), or(inDeck, inHand), spell, frost);
			case CardIds.GorillabotA3:
			case CardIds.GorillabotA3Core:
				return and(side(inputSide), or(inDeck, inHand), minion, mech);
			case CardIds.GorlocRavager:
				return and(side(inputSide), inDeck, murloc);
			case CardIds.GrandMagisterRommath:
				return and(side(inputSide), cardsPlayedThisMatch, spell, notInInitialDeck);
			case CardIds.GraveDefiler:
				return and(side(inputSide), inDeck, spell, fel);
			case CardIds.GreedyGainsTavernBrawl:
				return and(side(inputSide), or(inDeck, inHand), minion);
			case CardIds.GreySageParrot:
				return and(side(inputSide), or(inDeck, inHand), spell, effectiveCostMore(5));
			case CardIds.GrimtotemBuzzkill:
				return and(side(inputSide), or(inDeck, inHand), weapon);
			case CardIds.GrommashsArmguardsTavernBrawl:
				return and(side(inputSide), weapon);
			case CardIds.GuardianAnimals:
				return and(side(inputSide), inDeck, minion, beast, effectiveCostLess(6));
			case CardIds.GuardianLightTavernBrawl:
				return and(side(inputSide), or(inDeck, inHand), spell, holy);
			case CardIds.GuessTheWeight_Less:
				return (input: SelectorInput): boolean => {
					if (!input.deckState.hand.length) {
						return null;
					}
					const lastDrawnCard = input.deckState.hand[input.deckState.hand.length - 1];
					return (
						side(inputSide)(input) &&
						inDeck(input) &&
						effectiveCostLess(lastDrawnCard?.getEffectiveManaCost() ?? 0)(input)
					);
				};
			case CardIds.GuessTheWeight_More:
				return (input: SelectorInput): boolean => {
					if (!input.deckState.hand.length) {
						return null;
					}
					const lastDrawnCard = input.deckState.hand[input.deckState.hand.length - 1];
					return (
						side(inputSide)(input) &&
						inDeck(input) &&
						effectiveCostMore(lastDrawnCard?.getEffectiveManaCost() ?? 0)(input)
					);
				};
			case CardIds.GuffRunetotem_BAR_720:
				return and(side(inputSide), spell, spellSchool(SpellSchool.NATURE));
			case CardIds.HabeasCorpses:
				return and(side(inputSide), inGraveyard, minion);
			case CardIds.HagathasEmbrace:
			case CardIds.HagathasEmbraceTavernBrawl:
				return and(side(inputSide), or(inDeck, inHand), minion);
			case CardIds.HalduronBrightwing:
				return and(side(inputSide), inDeck, spell, arcane);
			case CardIds.Hadronox_CORE_ICC_835:
			case CardIds.Hadronox_ICC_835:
				return and(side(inputSide), inGraveyard, minion, taunt);
			case CardIds.HarbingerOfWinterCore_RLK_511:
				return and(side(inputSide), inDeck, spell, frost);
			case CardIds.HarborScamp:
				return and(side(inputSide), inDeck, pirate);
			case CardIds.HarnessTheElementsTavernBrawl:
				return and(side(inputSide), inDeck, spell);
			case CardIds.HedgeMaze_REV_333:
			case CardIds.HedgeMaze_REV_792:
				return and(side(inputSide), inDeck, minion, deathrattle);
			case CardIds.HeraldOfLokholar:
				return and(side(inputSide), inDeck, spell, frost);
			case CardIds.HeraldOfNature:
				return and(side(inputSide), or(inDeck, inHand), spell, nature);
			case CardIds.HeraldOfShadows:
				return and(side(inputSide), inDeck, spell, shadow);
			case CardIds.HighAbbessAlura:
				return and(side(inputSide), inDeck, spell);
			case CardIds.HighCultistBasaleph:
				return and(side(inputSide), minionsDeadSinceLastTurn, undead);
			case CardIds.HoldTheLineTavernBrawl:
				return and(side(inputSide), taunt);
			case CardIds.HopeOfQuelthalas:
				return and(side(inputSide), or(inDeck, inHand, inPlay), minion);
			case CardIds.HotStreak:
				return and(side(inputSide), or(inDeck, inHand), spell, fire);
			case CardIds.Hullbreaker:
				return and(side(inputSide), inDeck, spell);
			case CardIds.IcebloodTower:
				return and(side(inputSide), inDeck, spell);
			case CardIds.IceFishing_CORE_ICC_089:
			case CardIds.IceFishing_ICC_089:
				return and(side(inputSide), inDeck, murloc);
			case CardIds.IceRevenant:
				return and(side(inputSide), inDeck, spell, frost);
			case CardIds.ImpCredibleTrousersTavernBrawl:
				return and(side(inputSide), or(inDeck, inHand), spell, fel);
			case CardIds.IncantersFlow:
				return and(side(inputSide), or(inDeck, inHand), spell);
			case CardIds.InfantryReanimator:
				return and(side(inputSide), inGraveyard, undead);
			case CardIds.Insight:
			case CardIds.Insight_InsightToken:
				return and(side(inputSide), inDeck, minion);
			case CardIds.InspiringPresenceTavernBrawl:
				return and(side(inputSide), minion, legendary);
			case CardIds.InstrumentTech:
				return and(side(inputSide), weapon);
			case CardIds.IntoTheFray:
				return and(side(inputSide), or(inDeck, inHand), minion, taunt);
			case CardIds.InventorsAura:
				return and(side(inputSide), or(inDeck, inHand), minion, mech);
			case CardIds.InvestmentOpportunity:
				return and(side(inputSide), inDeck, overload);
			case CardIds.InvigoratingLightTavernBrawl:
				return and(side(inputSide), spell, holy);
			case CardIds.InvigoratingSermon:
				return and(side(inputSide), or(inDeck, inHand), minion);
			case CardIds.IronRootsTavernBrawl:
				return and(side(inputSide), or(inDeck, inHand), spell, nature);
			case CardIds.ItsRainingFin:
				return and(side(inputSide), inDeck, murloc);
			case CardIds.JaceDarkweaver:
				return and(side(inputSide), spellPlayedThisMatch, spellSchool(SpellSchool.FEL));
			case CardIds.JerryRigCarpenter:
				return and(side(inputSide), inDeck, spell, chooseOne);
			case CardIds.JewelOfNzoth:
				return and(side(inputSide), minion, inGraveyard, deathrattle);
			case CardIds.JungleJammer:
				return and(side(inputSide), or(inHand, inDeck), spell);
			case CardIds.K90tron:
				return and(side(inputSide), inDeck, minion, effectiveCostEqual(1));
			case CardIds.KangorsEndlessArmy:
				return and(side(inputSide), inGraveyard, mech);
			case CardIds.KanrethadEbonlocke_KanrethadPrimeToken:
				return and(side(inputSide), demon, inGraveyard, minion);
			case CardIds.KathrenaWinterwisp:
				return and(side(inputSide), inDeck, minion, beast);
			case CardIds.Kazakusan_ONY_005:
				return and(side(inputSide), or(inDeck, cardsPlayedThisMatch), minion, dragon);
			case CardIds.KhadgarsScryingOrb:
				return and(side(inputSide), or(inDeck, inHand), spell);
			case CardIds.KelthuzadTheInevitable_REV_514:
			case CardIds.KelthuzadTheInevitable_REV_786:
				return and(
					side(inputSide),
					or(inDeck, inHand),
					cardIs(
						CardIds.VolatileSkeleton,
						CardIds.KelthuzadTheInevitable_REV_514,
						CardIds.KelthuzadTheInevitable_REV_786,
						CardIds.ColdCase,
						CardIds.Deathborne,
						CardIds.NightcloakSanctum_REV_602,
						CardIds.NightcloakSanctum_REV_796,
						CardIds.BrittleBonesTavernBrawl,
					),
				);
			case CardIds.Kindle_DALA_911:
			case CardIds.Kindle_ULDA_911:
				return and(side(inputSide), inDeck, spell);
			case CardIds.KindlingFlameTavernBrawl:
				return and(side(inputSide), spell, fire, dealsDamage);
			case CardIds.KnightOfAnointment:
				return and(side(inputSide), inDeck, spell, spellSchool(SpellSchool.HOLY));
			case CardIds.LadyAnacondra_WC_006:
				return and(side(inputSide), spell, spellSchool(SpellSchool.NATURE));
			case CardIds.LadyAshvane_TSC_943:
			case CardIds.LadyAshvane_Story_11_LadyAshvane:
				return and(side(inputSide), inDeck, weapon);
			case CardIds.LadyDeathwhisper_RLK_713:
				return and(side(inputSide), or(inHand, inDeck), spell, frost);
			case CardIds.LadyInWhite:
				return and(side(inputSide), inDeck, minion);
			case CardIds.LadyVashj_VashjPrimeToken:
				return and(side(inputSide), inDeck, spell);
			case CardIds.LastStand:
				return and(side(inputSide), inDeck, taunt);
			// case CardIds.LeadDancer:
			// 	return and(inDeck, minion, attackLessThan(card. ));
			case CardIds.LineHopper:
				return and(side(inputSide), outcast);
			case CardIds.LivingSeedRank1:
			case CardIds.LivingSeedRank1_LivingSeedRank2Token:
			case CardIds.LivingSeedRank1_LivingSeedRank3Token:
				return and(side(inputSide), inDeck, beast);
			case CardIds.LoveEverlasting:
				return and(side(inputSide), or(inDeck, inHand), spell);
			case CardIds.MagisterDawngrasp_AV_200:
				return and(side(inputSide), inOther, spell, hasSpellSchool, spellPlayedThisMatch);
			case CardIds.MagisterUnchainedTavernBrawlToken:
				return and(side(inputSide), inDeck, spell);
			case CardIds.MalygosTheSpellweaverCore:
				return and(side(inputSide), inDeck, spell);
			case CardIds.MagistersApprentice:
				return and(side(inputSide), inDeck, spell, arcane);
			case CardIds.MarkOfScorn:
				return and(side(inputSide), inDeck, not(minion));
			case CardIds.MaskedReveler:
				return and(side(inputSide), inDeck, minion);
			case CardIds.MassResurrection_DAL_724:
				return and(side(inputSide), inGraveyard, minion);
			case CardIds.MastersCall:
				return and(side(inputSide), inDeck, minion);
			case CardIds.MasterJouster:
				return and(side(inputSide), inDeck, minion);
			case CardIds.MeatGrinder_RLK_120:
				return and(side(inputSide), inDeck, minion);
			case CardIds.MechaShark_TSC_054:
				return and(side(inputSide), or(inDeck, inHand), minion, mech);
			case CardIds.MeekMasteryTavernBrawl:
				return and(side(inputSide), or(inDeck, inHand), minion, neutral);
			case CardIds.MendingPoolsTavernBrawl:
				return and(side(inputSide), spell, nature);
			case CardIds.Mixtape:
				return and(opposingSide(inputSide), cardsPlayedThisMatch);
			case CardIds.MulchMadnessTavernBrawl:
				return and(side(inputSide), minion, neutral);
			case CardIds.MummyMagic:
				return and(side(inputSide), or(inDeck, inHand), minion, deathrattle);
			case CardIds.NagaGiant:
				return and(side(inputSide), or(inDeck, inHand), spell);
			case CardIds.NaturalForceTavernBrawl:
				return and(side(inputSide), spell, nature, dealsDamage);
			case CardIds.NerubianVizier:
				return and(side(inputSide), or(inDeck, inHand), minion, undead);
			case CardIds.NzothGodOfTheDeep:
				return and(side(inputSide), inGraveyard, minion, (input: SelectorInput) => !!input.card?.races?.length);
			case CardIds.NzothTheCorruptor:
				return and(side(inputSide), inGraveyard, minion, deathrattle);
			case CardIds.OopsAllSpellsTavernBrawl:
				return and(side(inputSide), or(inDeck, inHand), spell);
			case CardIds.OpenTheDoorwaysTavernBrawl:
				return and(side(inputSide), discover);
			case CardIds.OptimizedPolarityTavernBrawl:
				return and(side(inputSide), or(inDeck, inHand), mech, not(magnetic));
			case CardIds.OracleOfElune:
				return and(side(inputSide), minion, effectiveCostLess(3));
			case CardIds.OrbOfRevelationTavernBrawl:
				return and(side(inputSide), or(inDeck, inHand), or(discover, and(spell, effectiveCostMore(2))));
			case CardIds.OverlordSaurfang_BAR_334:
				return and(side(inputSide), minion, inGraveyard, frenzy);
			case CardIds.OverseerFrigidaraCore_RLK_224:
			case CardIds.OverseerFrigidaraCore_RLK_Prologue_RLK_224:
				return and(side(inputSide), inDeck, spell);
			case CardIds.PartyPortalTavernBrawl_PVPDR_SCH_Active08:
				return and(side(inputSide), or(inDeck, inHand), spell);
			case CardIds.PeacefulPiper:
				return and(side(inputSide), inDeck, minion, beast);
			case CardIds.PetCollector:
				return and(side(inputSide), inDeck, minion, beast, effectiveCostLess(6));
			case CardIds.PileOnHeroic:
				return and(side(inputSide), inDeck, minion);
			case CardIds.PillageTheFallenTavernBrawl:
				return and(side(inputSide), weapon);
			case CardIds.PitCommander:
				return and(side(inputSide), inDeck, minion, demon);
			case CardIds.PitStop:
				return and(side(inputSide), inDeck, minion, mech);
			case CardIds.PlaguebringerTavernBrawl:
				return and(side(inputSide), spell, effectiveCostMore(1));
			case CardIds.Plunder:
				return and(side(inputSide), inDeck, weapon);
			case CardIds.PotionOfSparkingTavernBrawl:
				return and(side(inputSide), minion, rush);
			case CardIds.PredatoryInstincts:
				return and(side(inputSide), inDeck, minion, beast);
			case CardIds.Prescience:
				return and(side(inputSide), inDeck, minion);
			case CardIds.PrimalDungeoneer:
				return and(side(inputSide), inDeck, or(spell, elemental));
			case CardIds.PrimordialProtector_BAR_042:
				return and(side(inputSide), inDeck, spell);
			case CardIds.PrincessTavernBrawl:
				return and(side(inputSide), inDeck, minion, deathrattle);
			case CardIds.PrivateEye:
				return and(side(inputSide), inDeck, secret);
			case CardIds.ProvingGrounds:
				return and(side(inputSide), inDeck, minion);
			case CardIds.Psychopomp:
				return and(side(inputSide), inGraveyard, minion);
			case CardIds.RaiseDead_SCH_514:
				return and(side(inputSide), inGraveyard, minion);
			case CardIds.ImpendingCatastrophe:
				return and(side(inputSide), or(inDeck, inHand), minion, imp);
			case CardIds.ImpKingRafaam_REV_789:
			case CardIds.ImpKingRafaam_REV_835:
			case CardIds.ImpKingRafaam_ImpKingRafaamToken:
				return and(side(inputSide), or(inDeck, inHand, inGraveyard), minion, imp);
			case CardIds.RaDen:
				return and(side(inputSide), minionPlayedThisMatch, notInInitialDeck);
			case CardIds.RaidBossOnyxia_ONY_004:
				return and(side(inputSide), or(inDeck, inHand), minion, whelp);
			case CardIds.RaidingParty:
				return and(side(inputSide), or(inDeck, inHand), or(pirate, weapon));
			case CardIds.RaidTheDocks:
				return and(side(inputSide), inDeck, weapon);
			case CardIds.Rally:
				return and(side(inputSide), inGraveyard, minion, effectiveCostLess(4), effectiveCostMore(0));
			case CardIds.RallyTheTroopsTavernBrawl:
				return and(side(inputSide), or(inDeck, inHand), battlecry);
			case CardIds.RazormaneBattleguard:
				return and(side(inputSide), minion, taunt);
			case CardIds.RecordScratcher:
				return and(side(inputSide), or(inHand, inDeck), combo);
			case CardIds.RedscaleDragontamer:
				return and(side(inputSide), inDeck, dragon);
			case CardIds.RefreshingSpringWater:
				return and(side(inputSide), inDeck, spell);
			case CardIds.Resurrect_BRM_017:
				return and(side(inputSide), inGraveyard, minion);
			case CardIds.RevivePet:
				return and(side(inputSide), inGraveyard, minion, beast);
			case CardIds.Rewind_ETC_532:
				return and(side(inputSide), spellPlayedThisMatch, not(cardIs(CardIds.Rewind_ETC_532)));
			case CardIds.RhoninsScryingOrbTavernBrawl:
				return and(side(inputSide), or(inDeck, inHand), spell);
			case CardIds.RighteousReservesTavernBrawl:
				return and(side(inputSide), or(inDeck, inHand), minion, divineShield);
			case CardIds.RingmasterWhatley:
				return and(side(inputSide), inDeck, minion, or(dragon, mech, pirate));
			case CardIds.RingOfPhaseshiftingTavernBrawl:
				return and(side(inputSide), or(inDeck, inHand), minion, legendary);
			case CardIds.RingOfRefreshmentTavernBrawl:
				return and(side(inputSide), or(inDeck, inHand), spell);
			case CardIds.RivendareWarrider:
				return and(
					side(inputSide),
					inGraveyard,
					cardIs(
						CardIds.RivendareWarrider,
						CardIds.RivendareWarrider_BlaumeuxFamineriderToken,
						CardIds.RivendareWarrider_KorthazzDeathriderToken,
						CardIds.RivendareWarrider_ZeliekConquestriderToken,
					),
				);
			case CardIds.RobeOfTheApprenticeTavernBrawl:
				return and(side(inputSide), or(inDeck, inHand), spell, dealsDamage);
			case CardIds.RobeOfTheMagi:
				return and(side(inputSide), or(inDeck, inHand), spell, dealsDamage);
			case CardIds.RobesOfShrinkingTavernBrawl:
				return and(side(inputSide), or(inDeck, inHand), spell);
			case CardIds.RocketBackpacksTavernBrawl:
				return and(side(inputSide), or(inDeck, inHand), minion, not(rush));
			case CardIds.RottenRodent:
				return and(side(inputSide), inDeck, minion, deathrattle);
			case CardIds.RottingNecromancer:
				return and(side(inputSide), inDeck, minion, undead);
			case CardIds.RoyalGreatswordTavernBrawlToken:
				return and(side(inputSide), inDeck, minion, legendary);
			case CardIds.RuneforgingCore:
				return and(side(inputSide), inDeck, weapon);
			case CardIds.RunningWild:
			case CardIds.RunningWild_RunningWild:
				return and(side(inputSide), inDeck, minion);
			case CardIds.RushTheStage:
				return and(side(inputSide), inDeck, minion, rush);
			case CardIds.SalhetsPride:
				return and(side(inputSide), inDeck, minion, effectiveCostLess(2));
			case CardIds.ScavengersIngenuity:
				return and(side(inputSide), inDeck, beast);
			case CardIds.ScepterOfSummoning:
				return and(side(inputSide), or(inDeck, inHand), minion, effectiveCostMore(5));
			case CardIds.ScourgeIllusionist:
				return and(side(inputSide), inDeck, minion, deathrattle);
			case CardIds.ScrapShot:
				return and(side(inputSide), inDeck, beast);
			case CardIds.ScrollSavvy:
				return and(side(inputSide), inDeck, spell);
			case CardIds.SeafloorGateway_TSC_055:
				return and(side(inputSide), inDeck, minion, mech);
			case CardIds.SecurityAutomaton_TSC_928:
				return and(side(inputSide), or(inDeck, inHand), minion, mech);
			case CardIds.SenseDemonsLegacy_EX1_317:
			case CardIds.SenseDemonsVanilla_VAN_EX1_317:
				return and(side(inputSide), inDeck, minion, demon);
			case CardIds.SesselieOfTheFaeCourt_REV_319:
			case CardIds.SesselieOfTheFaeCourt_REV_782:
				return and(side(inputSide), inDeck, minion);
			case CardIds.SecretStudiesTavernBrawl:
				return and(side(inputSide), inDeck, secret);
			case CardIds.SelectiveBreederCore:
				return and(side(inputSide), inDeck, beast);
			case CardIds.ServiceBell:
				return and(side(inputSide), inDeck, not(neutral));
			case CardIds.Shadowborn:
				return and(side(inputSide), or(inDeck, inHand), spell, shadow);
			case CardIds.Shadowcasting101TavernBrawl:
				return and(side(inputSide), or(inDeck, inHand), minion);
			case CardIds.ShadowVisions:
				return and(side(inputSide), inDeck, spell);
			case CardIds.SharpEyedSeeker:
				return and(side(inputSide), inDeck, notInInitialDeck);
			case CardIds.SheldrasMoontree:
				return and(side(inputSide), inDeck, spell);
			case CardIds.ShipsCannon:
				return and(side(inputSide), or(inDeck, inHand), minion, pirate);
			case CardIds.Si7Assassin:
			case CardIds.Si7Informant:
			case CardIds.Si7Smuggler:
			case CardIds.FindTheImposter:
			case CardIds.FindTheImposter_LearnTheTruthToken:
			case CardIds.FindTheImposter_MarkedATraitorToken:
			case CardIds.JalTheSharpshot:
				return and(side(inputSide), or(inDeck, inHand), minion, isSi7);
			case CardIds.ShroudOfConcealment:
				return and(side(inputSide), inDeck, minion);
			case CardIds.Shudderwock_GIL_820:
				return and(side(inputSide), cardsPlayedThisMatch, minion, battlecry);
			case CardIds.SilvermoonFarstrider_RLK_826:
				return and(side(inputSide), or(inDeck, inHand), spell, arcane);
			case CardIds.SketchyInformation:
				return and(side(inputSide), inDeck, deathrattle, effectiveCostLess(5));
			case CardIds.SkulkingGeist_CORE_ICC_701:
			case CardIds.SkulkingGeist_ICC_701:
				return and(side(inputSide), or(inDeck, inHand), spell, baseCostEqual(1));
			case CardIds.Smokescreen:
				return and(side(inputSide), inDeck, deathrattle);
			case CardIds.Snapdragon:
				return and(side(inputSide), inDeck, minion, battlecry);
			case CardIds.SouleatersScythe_BoundSoulToken:
				return and(inOther, minion, lastAffectedByCardId(CardIds.SouleatersScythe));
			case CardIds.SowTheSeedsTavernBrawl:
				return and(side(inputSide), inDeck, minion);
			case CardIds.SpecialDeliveryTavernBrawl:
				return and(side(inputSide), or(inDeck, inHand), minion, rush);
			case CardIds.SpectralTrainee:
				return and(side(inputSide), or(inDeck, inHand), spell);
			case CardIds.SpiritGuide:
				return and(side(inputSide), inDeck, spell, or(shadow, holy));
			case CardIds.SplittingAxe:
				return and(side(inputSide), or(inDeck, inHand), totem);
			case CardIds.SpreadingSaplingsTavernBrawl:
				return and(side(inputSide), or(inDeck, inHand), spell, nature);
			case CardIds.SpringTheTrap:
				return and(side(inputSide), inDeck, secret);
			case CardIds.SrExcavatorTavernBrawl:
				return and(side(inputSide), inDeck, minion);
			case CardIds.SrTombDiver_ULDA_021:
			case CardIds.JrTombDiver:
			case CardIds.JrTombDiverTavernBrawl:
			case CardIds.SrTombDiverTavernBrawl:
				return and(
					side(inputSide),
					or(and(or(inDeck, inHand), spell, secret), and(inOther, cardsPlayedThisMatch, spell, secret)),
				);
			case CardIds.StaffOfPainTavernBrawl:
				return and(side(inputSide), or(inDeck, inHand), spell, shadow);
			case CardIds.StaffOfRenewal:
			case CardIds.StaffOfRenewalTavernBrawl:
				return (input: SelectorInput): boolean => {
					const deadMinions = [...input.deckState.otherZone]
						.filter((c) => this.allCards.getCard(c.cardId).type === 'Minion')
						.filter((c) => c.zone === 'GRAVEYARD');
					if (!deadMinions.length) {
						return false;
					}
					const numberToResurrect = cardId === CardIds.StaffOfRenewal ? 7 : 5;
					const mostExpensiveMinions = deadMinions
						.sort((a, b) => a.manaCost - b.manaCost)
						.reverse()
						.slice(0, numberToResurrect);
					const lastMinion = mostExpensiveMinions[mostExpensiveMinions.length - 1];
					return (
						side(inputSide)(input) &&
						minion(input) &&
						inGraveyard(input) &&
						input.deckCard?.getEffectiveManaCost() >= lastMinion.getEffectiveManaCost()
					);
				};
			case CardIds.StageDive:
			case CardIds.StageDive_StageDive:
				return and(side(inputSide), inDeck, minion, rush);
			case CardIds.StakingAClaimTavernBrawl:
				return and(side(inputSide), or(inDeck, inHand), discover);
			case CardIds.StarlightGroove:
				return and(side(inputSide), or(inDeck, inHand), holy, spell);
			case CardIds.StarvingTavernBrawl:
				return and(side(inputSide), minion, beast);
			case CardIds.StranglethornHeart:
				return and(side(inputSide), inGraveyard, beast, effectiveCostMore(4));
			case CardIds.StickyFingersTavernBrawl:
				return and(side(inputSide), or(inDeck, inHand), notInInitialDeck);
			case CardIds.StonehearthVindicator:
				return and(side(inputSide), inDeck, spell, effectiveCostLess(4));
			case CardIds.StormpikeBattleRam:
				return and(side(inputSide), or(inDeck, inHand), minion, beast);
			case CardIds.SummerFlowerchild:
				return and(side(inputSide), inDeck, effectiveCostMore(5));
			case CardIds.SunfuryChampion:
				return and(side(inputSide), or(inDeck, inHand), spell, fire);
			case CardIds.SunstridersCrownTavernBrawl:
				return and(side(inputSide), or(inDeck, inHand), spell);
			case CardIds.SwinetuskShank:
				return and(
					side(inputSide),
					or(inDeck, inHand),
					cardIs(
						CardIds.DeadlyPoisonCore,
						CardIds.DeadlyPoisonLegacy,
						CardIds.DeadlyPoisonVanilla,
						CardIds.LeechingPoison_CORE_ICC_221,
						CardIds.LeechingPoison_ICC_221,
						CardIds.NitroboostPoison,
						CardIds.NitroboostPoison_NitroboostPoisonToken,
						CardIds.ParalyticPoison,
						CardIds.SilverleafPoison,
					),
				);
			case CardIds.Switcheroo:
				return and(side(inputSide), inDeck, minion);
			case CardIds.Swordfish:
				return and(side(inputSide), inDeck, pirate);
			case CardIds.SwordOfTheFallen:
				return and(side(inputSide), inDeck, spell, secret);
			case CardIds.TamsinsPhylactery:
				return and(side(inputSide), minion, inGraveyard, deathrattle);
			case CardIds.TangledWrath:
				return and(side(inputSide), inDeck, spell);
			case CardIds.TopiorTheShrubbagazzor:
				return and(side(inputSide), or(inDeck, inHand), spell, nature);
			case CardIds.TerrorscaleStalker:
				return and(side(inputSide), or(inDeck, inHand), minion, deathrattle);
			case CardIds.TessGreymane_GIL_598:
			case CardIds.TessGreymaneCore:
				return and(side(inputSide), cardsPlayedThisMatch, and(not(currentClass), not(neutral)));
			case CardIds.TheCountess:
				return and(side(inputSide), inDeck, neutral);
			case CardIds.TheCurator_KAR_061:
				return and(side(inputSide), inDeck, minion, or(beast, dragon, murloc));
			case CardIds.TheFistOfRaDen:
				return and(side(inputSide), or(inDeck, inHand), spell);
			case CardIds.ThePurator:
				return and(side(inputSide), inDeck, minion, not(tribeless));
			case CardIds.TheStonewright:
				return and(side(inputSide), or(inDeck, inHand), totem);
			case CardIds.TheUpperHand:
				return and(side(inputSide), inDeck, spell);
			case CardIds.ThingFromBelow:
			case CardIds.ThingFromBelowCore:
				return and(side(inputSide), or(inDeck, inHand), totem);
			case CardIds.Thoribelore:
				return and(side(inputSide), or(inDeck, inHand), spell, fire);
			case CardIds.ThornmantleMusician:
				return and(side(inputSide), or(inDeck, inHand), beast);
			case CardIds.ThriveInTheShadowsCore:
				return and(side(inputSide), inDeck, spell);
			case CardIds.TimberTambourine:
				return and(side(inputSide), or(inDeck, inHand), effectiveCostMore(4));
			case CardIds.Timewarden:
				return and(side(inputSide), or(inDeck, inHand), minion, dragon);
			case CardIds.TortollanPilgrim:
				return and(side(inputSide), inDeck, spell);
			case CardIds.TotemicMightLegacy:
			case CardIds.TotemicMightVanilla:
			case CardIds.TotemicSurge:
				return and(side(inputSide), or(inDeck, inHand), minion, totem);
			case CardIds.TotemOfTheDead_LOOTA_845:
				return and(side(inputSide), deathrattle);
			case CardIds.TownCrier_GIL_580:
				return and(side(inputSide), inDeck, minion, rush);
			case CardIds.TramOperator:
				return and(side(inputSide), inDeck, minion, mech);
			case CardIds.TrenchSurveyor_TSC_642:
				return and(side(inputSide), inDeck, minion, mech);
			case CardIds.TrinketTracker:
				return and(side(inputSide), inDeck, spell, effectiveCostEqual(1));
			case CardIds.Tyr:
				return and(side(inputSide), inGraveyard, paladin, minion, attackGreaterThan(1), attackLessThan(5));
			case CardIds.TyrsTears:
			case CardIds.TyrsTears_TyrsTearsToken:
				return and(side(inputSide), inGraveyard, paladin, minion);
			case CardIds.Tuskpiercer:
				return and(side(inputSide), inDeck, deathrattle);
			case CardIds.TwilightDeceptor:
				return and(side(inputSide), inDeck, spell, shadow);
			case CardIds.TwilightsCall:
				return and(side(inputSide), inGraveyard, minion, deathrattle);
			case CardIds.TwistedTether:
				return and(side(inputSide), inHand, undead);
			case CardIds.UndyingAllies:
				return and(side(inputSide), or(inDeck, inHand), minion, undead);
			case CardIds.UnendingSwarm:
				return and(side(inputSide), inGraveyard, minion, effectiveCostLess(3));
			case CardIds.UnlockedPotential:
				return and(side(inputSide), or(inDeck, inHand), minion, healthBiggerThanAttack);
			case CardIds.UnstableMagicTavernBrawl:
				return and(side(inputSide), or(inDeck, inHand), spell, arcane);
			case CardIds.VanndarStormpike_AV_223:
				return !!card
					? and(side(inputSide), inDeck, minion, effectiveCostLess(card.getEffectiveManaCost() + 1))
					: null;
			case CardIds.VarianKingOfStormwind:
				return and(side(inputSide), inDeck, or(rush, taunt, divineShield));
			case CardIds.Vectus:
				return and(side(inputSide), inGraveyard, minion, deathrattle);
			case CardIds.VengefulSpirit_BAR_328:
				return and(side(inputSide), inDeck, minion, deathrattle);
			case CardIds.Vexallus:
				return and(side(inputSide), or(inDeck, inHand), spell, arcane);
			case CardIds.ViciousSlitherspear_TSC_827:
				return and(side(inputSide), or(inDeck, inHand), spell);
			case CardIds.VitalitySurge:
				return and(side(inputSide), inDeck, minion);
			case CardIds.VolumeUp:
				return and(side(inputSide), inDeck, spell);
			case CardIds.WarCommandsTavernBrawl:
				return and(side(inputSide), inDeck, minion, neutral, effectiveCostLess(4));
			case CardIds.WarsongWrangler:
				return and(side(inputSide), inDeck, beast);
			case CardIds.WarsongWrangler:
				return and(side(inputSide), inDeck, beast);
			case CardIds.WeaponsExpert:
				return and(side(inputSide), inDeck, weapon);
			case CardIds.WidowbloomSeedsman:
				return and(side(inputSide), inDeck, spell, nature);
			case CardIds.WildSpirits:
				return and(
					side(inputSide),
					or(inDeck, inHand),
					cardIs(
						CardIds.SpiritPoacher_FoxSpiritWildseedToken,
						CardIds.SpiritPoacher_BearSpiritWildseedToken,
						CardIds.SpiritPoacher_StagSpiritWildseedToken,
						CardIds.SpiritPoacher,
						CardIds.WildSpirits,
						CardIds.Aralon_REV_363,
						CardIds.Aralon_REV_780,
						CardIds.StagCharge,
					),
				);
			case CardIds.WingCommanderIchman_AV_336:
				return and(side(inputSide), inDeck, minion, beast);
			case CardIds.WitchingHour:
				return and(side(inputSide), inGraveyard, minion, beast);
			case CardIds.WitherTheWeakTavernBrawl:
				return and(side(inputSide), or(inDeck, inHand), spell, fel);
			case CardIds.WretchedExile:
				return and(side(inputSide), or(inDeck, inHand), outcast);
			case CardIds.XyrellaTheDevout:
				return and(side(inputSide), inGraveyard, minion, deathrattle);
			case CardIds.YshaarjTheDefiler:
				return and(side(inputSide), cardsPlayedThisMatch, corrupted);
		}

		// Mechanic-specific highlights
		if (this.allCards.getCard(cardId).mechanics?.includes(GameTag[GameTag.MODULAR])) {
			return and(side(inputSide), or(inDeck, inHand), minion, mech);
		}
	}
}

export interface Handler {
	readonly referenceCardProvider: () => ReferenceCard;
	readonly deckCardProvider: () => VisualDeckCard;
	readonly zoneProvider: () => DeckZone;
	readonly side: () => 'player' | 'opponent' | 'duels';
	readonly highlightCallback: () => void;
	readonly unhighlightCallback: () => void;
}

export interface SelectorOptions {
	readonly uniqueZone?: boolean;
	readonly skipGameState?: boolean;
	readonly skipPrefs?: boolean;
}

export interface SelectorInput {
	side: 'player' | 'opponent' | 'duels';
	entityId: number;
	internalEntityId: string;
	cardId: string;
	zone: string;
	card: ReferenceCard;
	deckState: DeckState;
	deckCard: DeckCard;
	allCards: CardsFacadeService;
}
export type Selector = (info: SelectorInput) => boolean;
