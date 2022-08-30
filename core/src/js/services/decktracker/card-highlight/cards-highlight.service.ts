import { Injectable } from '@angular/core';
import { CardIds, CardType, Race, ReferenceCard, SpellSchool } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
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
	baseCostEqual,
	battlecry,
	beast,
	cardIs,
	cardsPlayedThisMatch,
	cardType,
	chooseOne,
	corrupt,
	corrupted,
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
	fel,
	fire,
	freeze,
	frenzy,
	frost,
	hasSpellSchool,
	healthBiggerThanAttack,
	holy,
	imp,
	inDeck,
	inGraveyard,
	inHand,
	inOther,
	legendary,
	magnetic,
	mech,
	minion,
	murloc,
	naga,
	nature,
	neutral,
	not,
	notInInitialDeck,
	or,
	outcast,
	overload,
	pirate,
	race,
	rogue,
	rush,
	secret,
	shadow,
	spell,
	spellPlayedThisMatch,
	spellSchool,
	taunt,
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
	}

	// public shutDown() {
	// 	super.onDestroy();
	// }

	register(_uniqueId: string, handler: Handler, side: 'player' | 'opponent' | 'duels') {
		this.handlers[side + _uniqueId] = handler;
	}

	unregister(_uniqueId: string, side: 'player' | 'opponent' | 'duels') {
		delete this.handlers[side + _uniqueId];
	}

	async onMouseEnter(cardId: string, side: 'player' | 'opponent' | 'duels', card?: DeckCard) {
		// console.debug('onMouseEnter', cardId, side, this.gameState, this.options);
		// Happens when using the deck-list component outside of a game
		if (!this.options?.skipGameState && !this.gameState) {
			return;
		}

		const prefs = await this.prefs.getPreferences();
		if (!this.options?.skipPrefs && !prefs.overlayHighlightRelatedCards) {
			return;
		}

		// if (!side) {
		// 	console.warn('no side provided', cardId, side);
		// }

		const selector: (
			handler: Handler,
			deckState?: DeckState,
			options?: SelectorOptions,
			gameState?: GameState,
		) => boolean = this.buildSelector(cardId, card);
		// console.debug('built selector', selector);
		if (selector) {
			// console.debug(
			// 	'highlighting',
			// 	this.handlers,
			// 	Object.keys(this.handlers).filter((key) => key.startsWith(side)),
			// 	Object.keys(this.handlers)
			// 		.filter((key) => key.startsWith(side))
			// 		.map((key) => this.handlers[key]),
			// );
			Object.keys(this.handlers)
				.filter((key) => key.startsWith(side))
				.map((key) => this.handlers[key])
				.filter((handler) => {
					return selector(
						handler,
						side === 'player' ? this.gameState?.playerDeck : this.gameState?.opponentDeck,
						this.options,
						this.gameState,
					);
				})
				.forEach((handler) => {
					// console.debug('handler', handler);
					handler.highlightCallback();
				});
		}
	}

	onMouseLeave(cardId: string) {
		Object.values(this.handlers).forEach((handler) => handler.unhighlightCallback());
	}

	private buildSelector(
		cardId: string,
		card?: DeckCard,
	): (handler: Handler, deckState?: DeckState, options?: SelectorOptions) => boolean {
		const cardIdSelector = this.buildCardIdSelector(cardId, card);
		const cardContextSelector = this.buildCardContextSelector(card);
		return or(cardIdSelector, cardContextSelector);
	}

	private buildCardContextSelector(
		card: DeckCard,
	): (handler: Handler, deckState?: DeckState, options?: SelectorOptions) => boolean {
		if (card?.dredged && !card.cardId && card.linkedEntityIds?.length) {
			return (handler, deckState, options) => card.linkedEntityIds.includes(handler.deckCardProvider().entityId);
		}
	}

	private buildCardIdSelector(
		cardId: string,
		card: DeckCard,
	): (handler: Handler, deckState?: DeckState, options?: SelectorOptions) => boolean {
		switch (cardId) {
			case CardIds.AbyssalDepths:
				return (handler: Handler, deckState?: DeckState, options?: SelectorOptions): boolean => {
					const cheapestMinions = [...deckState.deck]
						.filter((c) => this.allCards.getCard(c.cardId).type === 'Minion')
						.sort((a, b) => a.manaCost - b.manaCost)
						.slice(0, 2);
					const secondCheapestMinionCost = (cheapestMinions[1] ?? cheapestMinions[0])?.manaCost ?? 0;
					return (
						minion(handler) &&
						inDeck(handler) &&
						handler.deckCardProvider()?.getEffectiveManaCost() <= secondCheapestMinionCost
					);
				};
			case CardIds.AllianceBannerman:
				return and(inDeck, minion);
			case CardIds.AmuletOfUndying:
				return and(inGraveyard, minion, deathrattle);
			case CardIds.AllShallServeTavernBrawl:
				return and(minion, demon);
			case CardIds.AllTogetherNowTavernBrawl:
				return and(or(inDeck, inHand), battlecry);
			case CardIds.ArcaneBrilliance:
				return and(
					inDeck,
					spell,
					or(effectiveCostEqual(7), effectiveCostEqual(8), effectiveCostEqual(9), effectiveCostEqual(10)),
				);
			case CardIds.ArcaneFluxTavernBrawl:
				return and(spell, arcane);
			case CardIds.ArcaneLuminary:
				return and(inDeck, notInInitialDeck);
			case CardIds.ArcaniteCrystalTavernBrawl:
				return and(spell, arcane);
			case CardIds.Arcanologist:
				return and(inDeck, spell, secret);
			case CardIds.ArcanologistCore:
				return and(inDeck, spell, secret);
			case CardIds.ArcticArmorTavernBrawl:
				return and(freeze);
			case CardIds.Assembly:
			case CardIds.Assembly_Assembly:
				return and(inDeck, minion);
			case CardIds.AwakenTheMakers:
				return and(or(inDeck, inHand), minion, deathrattle);
			case CardIds.AxeBerserker:
				return and(inDeck, weapon);
			case CardIds.AzsharanGardens_SunkenGardensToken:
				return and(or(inDeck, inHand), minion);
			case CardIds.AzsharanSaber_SunkenSaberToken:
				return and(inDeck, minion, beast);
			case CardIds.AzsharanScavenger_SunkenScavengerToken:
				return and(minion, murloc);
			case CardIds.BalindaStonehearth:
				return and(inDeck, spell);
			case CardIds.BandOfBeesTavernBrawl:
				return and(or(inDeck, inHand), minion, effectiveCostLess(3));
			case CardIds.BarakKodobane_BAR_551:
				return and(inDeck, spell, or(effectiveCostEqual(1), effectiveCostEqual(2), effectiveCostEqual(3)));
			case CardIds.BattleTotem_LOOTA_846:
				return and(or(inDeck, inHand), battlecry);
			case CardIds.BeckoningBicornTavernBrawl:
				return and(or(inDeck, inHand), pirate);
			case CardIds.BitterColdTavernBrawl:
				return and(frost, dealsDamage);
			case CardIds.BladeOfQuickeningTavernBrawlToken:
				return and(inDeck, outcast);
			case CardIds.BladeOfTheBurningSun:
				return and(inDeck, minion);
			case CardIds.BloodreaverGuldan:
				return and(inGraveyard, minion, demon);
			case CardIds.BookOfSpecters:
				return and(inDeck, spell);
			case CardIds.BronzeSignetTavernBrawl:
				return and(inDeck, minion);
			case CardIds.CagematchCustodian:
				return and(inDeck, cardType(CardType.WEAPON));
			case CardIds.CapturedFlag:
				return and(or(inDeck, inHand), minion);
			case CardIds.CariaFelsoul:
				return and(inDeck, demon);
			case CardIds.CastleKennels:
				return and(inDeck, minion, beast);
			case CardIds.ChattyBartender:
				return and(inDeck, secret);
			case CardIds.ClickClocker:
				return and(inDeck, minion, mech);
			case CardIds.ClockworkAssistant_GILA_907:
			case CardIds.ClockworkAssistant_ONY_005ta11:
			case CardIds.ClockworkAssistantTavernBrawl_PVPDR_SCH_Active48:
			case CardIds.ClockworkAssistantTavernBrawl_PVPDR_Toki_T5:
				return and(inDeck, spell);
			case CardIds.CoilCastingTavernBrawl:
				return and(or(inDeck, inHand), naga);
			case CardIds.ConchsCall:
				return and(inDeck, or(naga, spell));
			case CardIds.ContrabandStash:
				return and(cardsPlayedThisMatch, and(not(rogue), not(neutral)));
			case CardIds.CookiesLadleTavernBrawl:
				return and(or(inDeck, inHand), murloc);
			case CardIds.Commencement:
				return and(inDeck, minion);
			case CardIds.CorruptedFelstoneTavernBrawl:
				return and(or(inDeck, inHand), spell, fel);
			case CardIds.CowardlyGrunt:
				return and(inDeck, minion);
			case CardIds.CrushclawEnforcer:
				return and(inDeck, naga);
			case CardIds.CutlassCourier:
				return and(inDeck, pirate);
			case CardIds.DarkInquisitorXanesh:
				return and(or(inDeck, inHand), or(corrupt, corrupted));
			case CardIds.DaUndatakah:
				return and(inGraveyard, minion, deathrattle);
			case CardIds.DeadRinger:
				return and(inDeck, minion, deathrattle);
			case CardIds.DeathBlossomWhomper:
				return and(inDeck, minion, deathrattle);
			case CardIds.DeathlyDeathTavernBrawl:
				return and(minion, deathrattle);
			case CardIds.DeathstriderTavernBrawl:
				return and(or(inDeck, inHand), minion, deathrattle);
			case CardIds.DeepwaterEvoker:
				return and(inDeck, spell);
			case CardIds.DevoutBlessingsTavernBrawlToken:
				return and(inGraveyard, minion, deathrattle);
			case CardIds.DinnerPerformer:
				return and(inDeck, minion, effectiveCostLessThanRemainingMana);
			case CardIds.DisksOfLegendTavernBrawl:
				return and(or(inDeck, inHand), minion, legendary);
			case CardIds.DivineIlluminationTavernBrawl:
				return and(holy);
			case CardIds.DoorOfShadows:
			case CardIds.DoorOfShadows_DoorOfShadowsToken:
				return and(inDeck, spell);
			case CardIds.DoubleJump:
				return and(inDeck, outcast);
			case CardIds.DoubleTime:
				return and(or(inDeck, inHand), spell);
			case CardIds.DraconicDreamTavernBrawl:
				return and(dragon);
			case CardIds.DragonAffinityTavernBrawl:
				return and(dragon);
			case CardIds.DragonbloodTavernBrawl:
				return and(dragon);
			case CardIds.DragonboneRitualTavernBrawl:
				return and(dragon);
			case CardIds.Drekthar_AV_100:
				return and(inDeck, minion, effectiveCostLess(card.getEffectiveManaCost()));
			case CardIds.DrocomurchanicasTavernBrawlToken:
				return and(inDeck, minion, or(dragon, murloc, mech));
			case CardIds.DunBaldarBunker:
				return and(inDeck, secret);
			case CardIds.EdgeOfDredgeTavernBrawl:
				return and(or(inDeck, inHand), dredge);
			case CardIds.EerieStoneTavernBrawl:
				return and(spell, shadow);
			case CardIds.EerieStoneTavernBrawl:
				return and(spell, shadow);
			case CardIds.ElixirOfVigorTavernBrawl:
				return and(minion);
			case CardIds.EnduranceTrainingTavernBrawl:
				return and(minion, taunt);
			case CardIds.ExpeditedBurialTavernBrawl:
				return and(minion, deathrattle);
			case CardIds.FelfireInTheHole:
				return and(inDeck, spell);
			case CardIds.Felgorger:
				return and(inDeck, spell, fel);
			case CardIds.FirekeepersIdolTavernBrawl:
				return and(spell, fire);
			case CardIds.FiremancerFlurgl:
				return and(race(Race.MURLOC), or(inDeck, inHand));
			case CardIds.FlamesOfTheKirinTorTavernBrawl:
				return and(or(inDeck, inHand), spell, fire);
			case CardIds.FlameWavesTavernBrawl:
				return and(or(inDeck, inHand), spell, fire);
			case CardIds.FossilFanatic:
				return and(inDeck, spell, fel);
			case CardIds.FrizzKindleroost:
				return and(inDeck, dragon);
			case CardIds.FrontLines_TID_949:
			case CardIds.FrontLines_Story_11_FrontLines:
				return and(inDeck, minion);
			case CardIds.FungalFortunes:
				return and(inDeck, minion);
			case CardIds.GatherYourParty:
				return and(inDeck, minion);
			case CardIds.GlacialDownpourTavernBrawl:
				return and(or(inDeck, inHand), spell, frost);
			case CardIds.GorlocRavager:
				return and(inDeck, murloc);
			case CardIds.GraveDefiler:
				return and(inDeck, spell, fel);
			case CardIds.GreedyGainsTavernBrawl:
				return and(or(inDeck, inHand), minion);
			case CardIds.GreySageParrot:
				return and(or(inDeck, inHand), spell, effectiveCostMore(4));
			case CardIds.GrommashsArmguardsTavernBrawl:
				return and(weapon);
			case CardIds.GuardianAnimals:
				return and(inDeck, minion, beast, effectiveCostLess(6));
			case CardIds.GuardianLightTavernBrawl:
				return and(or(inDeck, inHand), spell, holy);
			case CardIds.GuffRunetotem_BAR_720:
				return and(spell, spellSchool(SpellSchool.NATURE));
			case CardIds.Hadronox:
				return and(inGraveyard, minion, taunt);
			case CardIds.HarborScamp:
				return and(inDeck, pirate);
			case CardIds.HarnessTheElementsTavernBrawl:
				return and(inDeck, spell);
			case CardIds.HedgeMaze:
				return and(inDeck, minion, deathrattle);
			case CardIds.HeraldOfLokholar:
				return and(inDeck, spell, frost);
			case CardIds.HeraldOfNature:
				return and(or(inDeck, inHand), spell, nature);
			case CardIds.HeraldOfShadows:
				return and(inDeck, spell, shadow);
			case CardIds.HoldTheLineTavernBrawl:
				return and(taunt);
			case CardIds.Hullbreaker:
				return and(inDeck, spell);
			case CardIds.IcebloodTower:
				return and(inDeck, spell);
			case CardIds.IceRevenant:
				return and(inDeck, spell, frost);
			case CardIds.ImpCredibleTrousersTavernBrawl:
				return and(or(inDeck, inHand), spell, fel);
			case CardIds.Insight:
			case CardIds.Insight_InsightToken:
				return and(inDeck, minion);
			case CardIds.InspiringPresenceTavernBrawl:
				return and(minion, legendary);
			case CardIds.InvestmentOpportunity:
				return and(inDeck, overload);
			case CardIds.InvigoratingLightTavernBrawl:
				return and(spell, holy);
			case CardIds.IronRootsTavernBrawl:
				return and(or(inDeck, inHand), spell, nature);
			case CardIds.ItsRainingFin:
				return and(inDeck, murloc);
			case CardIds.JaceDarkweaver:
				return and(inOther, spell, spellSchool(SpellSchool.FEL), spellPlayedThisMatch);
			case CardIds.JerryRigCarpenter:
				return and(inDeck, spell, chooseOne);
			case CardIds.JewelOfNzoth:
				return and(minion, inGraveyard, deathrattle);
			case CardIds.K90tron:
				return and(inDeck, minion, effectiveCostEqual(1));
			case CardIds.KanrethadEbonlocke_KanrethadPrimeToken:
				return and(demon, inGraveyard, minion);
			case CardIds.Kazakusan_ONY_005:
				return and(or(inDeck, cardsPlayedThisMatch), minion, dragon);
			case CardIds.KhadgarsScryingOrb:
				return and(or(inDeck, inHand), spell);
			case CardIds.KelthuzadTheInevitable:
				return and(
					or(inDeck, inHand),
					cardIs(
						CardIds.VolatileSkeleton,
						CardIds.KelthuzadTheInevitable,
						CardIds.ColdCase,
						CardIds.Deathborne,
						CardIds.NightcloakSanctum,
						CardIds.BrittleBonesTavernBrawl,
					),
				);
			case CardIds.Kindle_DALA_911:
			case CardIds.Kindle_ULDA_911:
				return and(inDeck, spell);
			case CardIds.KindlingFlameTavernBrawl:
				return and(spell, fire, dealsDamage);
			case CardIds.KnightOfAnointment:
				return and(inDeck, spell, spellSchool(SpellSchool.HOLY));
			case CardIds.LadyAnacondra_WC_006:
				return and(spell, spellSchool(SpellSchool.NATURE));
			case CardIds.LadyAshvane_TSC_943:
			case CardIds.LadyAshvane_Story_11_LadyAshvane:
				return and(inDeck, weapon);
			case CardIds.LadyVashj_VashjPrimeToken:
				return and(inDeck, spell);
			case CardIds.LineHopper:
				return outcast;
			case CardIds.LivingSeedRank1:
			case CardIds.LivingSeedRank1_LivingSeedRank2Token:
			case CardIds.LivingSeedRank1_LivingSeedRank3Token:
				return and(inDeck, beast);
			case CardIds.MagisterDawngrasp:
				return and(inOther, spell, hasSpellSchool, spellPlayedThisMatch);
			case CardIds.MagisterUnchainedTavernBrawlToken:
				return and(inDeck, spell);
			case CardIds.MalygosTheSpellweaverCore:
				return and(inDeck, spell);
			case CardIds.MaskedReveler:
				return and(inDeck, minion);
			case CardIds.MeekMasteryTavernBrawl:
				return and(or(inDeck, inHand), minion, neutral, effectiveCostMore(2));
			case CardIds.MendingPoolsTavernBrawl:
				return and(spell, nature);
			case CardIds.MulchMadnessTavernBrawl:
				return and(minion, neutral);
			case CardIds.MummyMagic:
				return and(or(inDeck, inHand), minion, deathrattle);
			case CardIds.NagaGiant:
				return and(or(inDeck, inHand), spell);
			case CardIds.NaturalForceTavernBrawl:
				return and(spell, nature, dealsDamage);
			case CardIds.NzothGodOfTheDeep:
				return and(inGraveyard, minion, (handler) => !!handler.referenceCardProvider()?.race);
			case CardIds.NzothTheCorruptor:
				return and(inGraveyard, minion, deathrattle);
			case CardIds.OopsAllSpellsTavernBrawl:
				return and(or(inDeck, inHand), spell);
			case CardIds.OpenTheDoorwaysTavernBrawl:
				return and(discover);
			case CardIds.OptimizedPolarityTavernBrawl:
				return and(or(inDeck, inHand), mech, not(magnetic));
			case CardIds.OracleOfElune:
				return and(minion, effectiveCostLess(3));
			case CardIds.OrbOfRevelationTavernBrawl:
				return and(or(inDeck, inHand), or(discover, and(spell, effectiveCostMore(2))));
			case CardIds.OverlordSaurfang_BAR_334:
				return and(minion, inGraveyard, frenzy);
			case CardIds.PartyPortalTavernBrawl_PVPDR_SCH_Active08:
				return and(or(inDeck, inHand), spell);
			case CardIds.PetCollector:
				return and(inDeck, minion, beast, effectiveCostLess(6));
			case CardIds.PileOnHeroic:
				return and(inDeck, minion);
			case CardIds.PillageTheFallenTavernBrawl:
				return and(weapon);
			case CardIds.PlaguebringerTavernBrawl:
				return and(spell, effectiveCostMore(1));
			case CardIds.Plunder:
				return and(inDeck, weapon);
			case CardIds.PotionOfSparkingTavernBrawl:
				return and(minion, rush);
			case CardIds.PrimordialProtector_BAR_042:
				return and(inDeck, spell);
			case CardIds.PrincessTavernBrawl:
				return and(inDeck, minion, deathrattle);
			case CardIds.PrivateEye:
				return and(inDeck, secret);
			case CardIds.ProvingGrounds:
				return and(inDeck, minion);
			case CardIds.RaiseDead_SCH_514:
				return and(inGraveyard, minion);
			case CardIds.ImpendingCatastrophe:
				return and(or(inDeck, inHand), minion, imp);
			case CardIds.ImpKingRafaam:
			case CardIds.ImpKingRafaam_ImpKingRafaamToken:
				return and(or(inDeck, inHand, inGraveyard), minion, imp);
			case CardIds.RaidBossOnyxia_ONY_004:
				return and(or(inDeck, inHand), minion, whelp);
			case CardIds.Rally:
				return and(inGraveyard, minion, effectiveCostLess(4), effectiveCostMore(0));
			case CardIds.RallyTheTroopsTavernBrawl:
				return and(or(inDeck, inHand), battlecry);
			case CardIds.RazormaneBattleguard:
				return and(minion, taunt);
			case CardIds.RedscaleDragontamer:
				return and(inDeck, dragon);
			case CardIds.RevivePet:
				return and(inGraveyard, minion, beast);
			case CardIds.RhoninsScryingOrbTavernBrawl:
				return and(or(inDeck, inHand), spell);
			case CardIds.RighteousReservesTavernBrawl:
				return and(or(inDeck, inHand), minion, divineShield);
			case CardIds.RingmasterWhatley:
				return and(inDeck, minion, or(dragon, mech, pirate));
			case CardIds.RingOfPhaseshiftingTavernBrawl:
				return and(or(inDeck, inHand), minion, legendary);
			case CardIds.RingOfRefreshmentTavernBrawl:
				return and(or(inDeck, inHand), spell);
			case CardIds.RobeOfTheApprenticeTavernBrawl:
				return and(or(inDeck, inHand), spell, dealsDamage);
			case CardIds.RobeOfTheMagi:
				return and(or(inDeck, inHand), spell, dealsDamage);
			case CardIds.RobesOfShrinkingTavernBrawl:
				return and(or(inDeck, inHand), spell);
			case CardIds.RocketBackpacksTavernBrawl:
				return and(or(inDeck, inHand), minion, not(rush));
			case CardIds.RoyalGreatswordTavernBrawlToken:
				return and(inDeck, minion, legendary);
			case CardIds.RunningWild:
			case CardIds.RunningWild_RunningWild:
				return and(inDeck, minion);
			case CardIds.SalhetsPride:
				return and(inDeck, minion, effectiveCostLess(2));
			case CardIds.ScavengersIngenuity:
				return and(inDeck, beast);
			case CardIds.ScepterOfSummoning:
				return and(or(inDeck, inHand), minion, effectiveCostMore(5));
			case CardIds.ScrapShot:
				return and(inDeck, beast);
			case CardIds.ScrollSavvy:
				return and(inDeck, spell);
			case CardIds.SesselieOfTheFaeCourt:
				return and(inDeck, minion, deathrattle);
			case CardIds.SecretStudiesTavernBrawl:
				return and(inDeck, secret);
			case CardIds.SelectiveBreederCore:
				return and(inDeck, beast);
			case CardIds.ServiceBell:
				return and(inDeck, not(neutral));
			case CardIds.Shadowborn:
				return and(or(inDeck, inHand), spell, shadow);
			case CardIds.Shadowcasting101TavernBrawl:
				return and(or(inDeck, inHand), minion);
			case CardIds.ShroudOfConcealment:
				return and(inDeck, minion);
			case CardIds.Shudderwock:
				return and(cardsPlayedThisMatch, minion, battlecry);
			case CardIds.SketchyInformation:
				return and(inDeck, deathrattle, effectiveCostLess(5));
			case CardIds.SkulkingGeist:
				return and(or(inDeck, inHand), spell, baseCostEqual(1));
			case CardIds.Smokescreen:
				return and(inDeck, deathrattle);
			case CardIds.Snapdragon:
				return and(inDeck, minion, battlecry);
			case CardIds.SowTheSeedsTavernBrawl:
				return and(inDeck, minion);
			case CardIds.SpecialDeliveryTavernBrawl:
				return and(or(inDeck, inHand), minion, rush);
			case CardIds.SpiritGuide:
				return and(inDeck, spell, or(shadow, holy));
			case CardIds.SpreadingSaplingsTavernBrawl:
				return and(or(inDeck, inHand), spell, nature);
			case CardIds.SpringTheTrap:
				return and(inDeck, secret);
			case CardIds.SrExcavatorTavernBrawl:
				return and(inDeck, minion);
			case CardIds.SrTombDiver:
			case CardIds.JrTombDiver:
			case CardIds.JrTombDiverTavernBrawl:
			case CardIds.SrTombDiverTavernBrawl:
				return and(or(inDeck, inHand, inOther), spell, secret);
			case CardIds.StaffOfPainTavernBrawl:
				return and(or(inDeck, inHand), spell, shadow);
			case CardIds.StaffOfRenewalTavernBrawl:
				return and(inGraveyard, minion);
			case CardIds.StakingAClaimTavernBrawl:
				return and(or(inDeck, inHand), discover);
			case CardIds.StarvingTavernBrawl:
				return and(minion, beast);
			case CardIds.StickyFingersTavernBrawl:
				return and(or(inDeck, inHand), notInInitialDeck);
			case CardIds.StonehearthVindicator:
				return and(inDeck, spell, effectiveCostLess(4));
			case CardIds.StormpikeBattleRam:
				return and(or(inDeck, inHand), minion, beast);
			case CardIds.SunstridersCrownTavernBrawl:
				return and(or(inDeck, inHand), spell);
			case CardIds.Switcheroo:
				return and(inDeck, minion);
			case CardIds.Swordfish:
				return and(inDeck, pirate);
			case CardIds.SwordOfTheFallen:
				return and(inDeck, spell, secret);
			case CardIds.TamsinsPhylactery:
				return and(minion, inGraveyard, deathrattle);
			case CardIds.TangledWrath:
				return and(inDeck, spell);
			case CardIds.TopiorTheShrubbagazzor:
				return and(or(inDeck, inHand), spell, nature);
			case CardIds.TerrorscaleStalker:
				return and(or(inDeck, inHand), minion, deathrattle);
			case CardIds.TessGreymane_GIL_598:
			case CardIds.TessGreymaneCore:
				return and(cardsPlayedThisMatch, and(not(rogue), not(neutral)));
			case CardIds.TheCountess:
				return and(inDeck, neutral);
			case CardIds.TheUpperHand:
				return and(inDeck, spell);
			case CardIds.TortollanPilgrim:
				return and(inDeck, spell);
			case CardIds.TotemOfTheDead_LOOTA_845:
				return and(deathrattle);
			case CardIds.TownCrier_GIL_580:
				return and(inDeck, minion, rush);
			case CardIds.Tuskpiercer:
				return and(inDeck, deathrattle);
			case CardIds.TwilightsCall:
				return and(inGraveyard, minion, deathrattle);
			case CardIds.UnlockedPotential:
				return and(or(inDeck, inHand), minion, healthBiggerThanAttack);
			case CardIds.UnstableMagicTavernBrawl:
				return and(or(inDeck, inHand), spell, arcane);
			case CardIds.VanndarStormpike_AV_223:
				return and(inDeck, minion, effectiveCostLess(card.getEffectiveManaCost() + 1));
			case CardIds.VarianKingOfStormwind:
				return and(inDeck, or(rush, taunt, divineShield));
			case CardIds.Vectus:
				return and(inGraveyard, minion, deathrattle);
			case CardIds.VengefulSpirit_BAR_328:
				return and(inDeck, deathrattle);
			case CardIds.VitalitySurge:
				return and(inDeck, minion);
			case CardIds.WarCommandsTavernBrawl:
				return and(inDeck, minion, neutral, effectiveCostLess(4));
			case CardIds.WarsongWrangler:
				return and(inDeck, beast);
			case CardIds.WidowbloomSeedsman:
				return and(inDeck, spell, nature);
			case CardIds.WingCommanderIchman_AV_336:
				return and(inDeck, minion, beast);
			case CardIds.WitchingHour:
				return and(inGraveyard, minion, beast);
			case CardIds.WitherTheWeakTavernBrawl:
				return and(or(inDeck, inHand), spell, fel);
			case CardIds.XyrellaTheDevout:
				return and(inGraveyard, minion, deathrattle);
			case CardIds.YshaarjTheDefiler:
				return and(cardsPlayedThisMatch, corrupted);
		}
	}
}

export interface Handler {
	readonly referenceCardProvider: () => ReferenceCard;
	readonly deckCardProvider: () => VisualDeckCard;
	readonly zoneProvider: () => DeckZone;
	readonly highlightCallback: () => void;
	readonly unhighlightCallback: () => void;
}

export interface SelectorOptions {
	readonly uniqueZone?: boolean;
	readonly skipGameState?: boolean;
	readonly skipPrefs?: boolean;
}
