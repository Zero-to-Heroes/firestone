import { Injectable } from '@angular/core';
import { CardIds, CardType, Race, ReferenceCard, SpellSchool } from '@firestone-hs/reference-data';
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
	battlecry,
	beast,
	cardsPlayedThisMatch,
	cardType,
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
	effectiveCostMore,
	fel,
	fire,
	freeze,
	frenzy,
	frost,
	healthBiggerThanAttack,
	holy,
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
} from './selectors';

@Injectable()
export class CardsHighlightService extends AbstractSubscriptionService {
	private handlers: { [uniqueId: string]: Handler } = {};

	private gameState: GameState;
	private options: SelectorOptions;

	constructor(private readonly prefs: PreferencesService, protected readonly store: AppUiStoreFacadeService) {
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

		if (!side) {
			console.warn('no side provided', cardId, side);
		}

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
		card: DeckCard,
	): (handler: Handler, deckState?: DeckState, options?: SelectorOptions) => boolean {
		switch (cardId) {
			case CardIds.AbyssalDepths:
				return and(inDeck, minion);
			case CardIds.AllianceBannerman:
				return and(inDeck, minion);
			case CardIds.AmuletOfUndying:
				return and(inGraveyard, minion, deathrattle);
			case CardIds.ArcaneBrilliance:
				return and(
					inDeck,
					spell,
					or(effectiveCostEqual(7), effectiveCostEqual(8), effectiveCostEqual(9), effectiveCostEqual(10)),
				);
			case CardIds.ArcaneLuminary:
				return and(inDeck, notInInitialDeck);
			case CardIds.Arcanologist:
				return and(inDeck, spell, secret);
			case CardIds.ArcanologistCore:
				return and(inDeck, spell, secret);
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
			case CardIds.BarakKodobane1:
				return and(inDeck, spell, or(effectiveCostEqual(1), effectiveCostEqual(2), effectiveCostEqual(3)));

			case CardIds.BladeOfQuickeningTavernBrawlToken:
				return and(inDeck, outcast);
			case CardIds.BloodreaverGuldan:
				return and(inGraveyard, minion, demon);
			case CardIds.BookOfSpecters:
				return and(inDeck, spell);
			case CardIds.CagematchCustodian:
				return and(inDeck, cardType(CardType.WEAPON));
			case CardIds.CariaFelsoul:
				return and(inDeck, demon);
			case CardIds.ConchsCall:
				return and(inDeck, or(naga, spell));
			case CardIds.ContrabandStash:
				return and(inOther, not(rogue));
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
			case CardIds.DevoutBlessingsTavernBrawlToken:
				return and(inGraveyard, minion, deathrattle);
			case CardIds.DoubleJump:
				return and(inDeck, outcast);
			case CardIds.DunBaldarBunker:
				return and(inDeck, secret);
			case CardIds.EerieStoneTavernBrawl:
				return and(spell, shadow);
			case CardIds.FelfireInTheHole:
				return and(inDeck, spell);
			case CardIds.Felgorger:
				return and(inDeck, spell, fel);
			case CardIds.FiremancerFlurgl:
				return and(race(Race.MURLOC), or(inDeck, inHand));
			case CardIds.FungalFortunes:
				return and(inDeck, minion);
			case CardIds.GuardianAnimals:
				return and(inDeck, minion, beast, effectiveCostLess(6));
			case CardIds.GuffRunetotem1:
				return and(spell, spellSchool(SpellSchool.NATURE));
			case CardIds.HeraldOfLokholar:
				return and(inDeck, spell, frost);
			case CardIds.Hadronox:
				return and(inGraveyard, minion, taunt);
			case CardIds.HarborScamp:
				return and(inDeck, pirate);
			case CardIds.IcebloodTower:
				return and(inDeck, spell);
			case CardIds.InvestmentOpportunity:
				return and(inDeck, overload);
			case CardIds.JaceDarkweaver:
				return and(inOther, spell, spellSchool(SpellSchool.FEL), spellPlayedThisMatch);
			case CardIds.JewelOfNzoth:
				return and(minion, inGraveyard, deathrattle);
			case CardIds.KanrethadEbonlocke_KanrethadPrimeToken:
				return and(demon, inGraveyard, minion);
			case CardIds.Kazakusan1:
				return and(inDeck, minion, not(dragon));
			case CardIds.KnightOfAnointment:
				return and(inDeck, spell, spellSchool(SpellSchool.HOLY));
			case CardIds.LadyAnacondra1:
				return and(spell, spellSchool(SpellSchool.NATURE));
			case CardIds.LadyAshvane:
				return and(inDeck, weapon);
			case CardIds.LadyVashj_VashjPrimeToken:
				return and(inDeck, spell);
			case CardIds.LineHopper:
				return outcast;
			case CardIds.LivingSeedRank1:
			case CardIds.LivingSeedRank1_LivingSeedRank2Token:
			case CardIds.LivingSeedRank1_LivingSeedRank3Token:
				return and(inDeck, beast);
			case CardIds.MagisterUnchainedTavernBrawlToken:
				return and(inDeck, spell);
			case CardIds.MagisterDawngrasp:
				return and(inOther, spell, spellPlayedThisMatch);
			case CardIds.NzothGodOfTheDeep:
				return and(inGraveyard, minion, (handler) => !!handler.referenceCardProvider()?.race);
			case CardIds.NzothTheCorruptor:
				return and(inGraveyard, minion, deathrattle);
			case CardIds.OracleOfElune:
				return and(minion, effectiveCostLess(3));
			case CardIds.OverlordSaurfang1:
				return and(minion, inGraveyard, frenzy);
			case CardIds.PetCollector:
				return and(inDeck, minion, beast, effectiveCostLess(6));
			case CardIds.ProvingGrounds:
				return and(inDeck, minion);
			case CardIds.Rally:
				return and(inGraveyard, minion, effectiveCostLess(4), effectiveCostMore(0));
			case CardIds.RazormaneBattleguard:
				return and(minion, taunt);
			case CardIds.RedscaleDragontamer:
				return and(inDeck, dragon);
			case CardIds.RevivePet:
				return and(inGraveyard, minion, beast);
			case CardIds.RingmasterWhatley:
				return and(inDeck, minion, or(dragon, mech, pirate));
			case CardIds.RoyalGreatswordTavernBrawlToken:
				return and(inDeck, minion, legendary);
			case CardIds.ScavengersIngenuity:
				return and(inDeck, beast);
			case CardIds.ScrapShot:
				return and(inDeck, beast);
			case CardIds.SelectiveBreederCore:
				return and(inDeck, beast);
			case CardIds.Shudderwock:
				return and(cardsPlayedThisMatch, minion, battlecry);
			case CardIds.Smokescreen:
				return and(inDeck, deathrattle);
			case CardIds.SpiritGuide:
				return and(inDeck, spell, or(shadow, holy));
			case CardIds.SpringTheTrap:
				return and(inDeck, secret);
			case CardIds.StonehearthVindicator:
				return and(inDeck, spell, effectiveCostLess(4));
			case CardIds.SrExcavatorTavernBrawl:
				return and(inDeck, minion);
			case CardIds.SrTombDiver:
			case CardIds.JrTombDiver:
			case CardIds.SrTombDiverTavernBrawl:
				return and(or(inDeck, inOther), spell, secret);
			case CardIds.SwordOfTheFallen:
				return and(inDeck, spell, secret);
			case CardIds.TamsinsPhylactery:
				return and(minion, inGraveyard, deathrattle);
			case CardIds.Tuskpiercer:
				return and(inDeck, deathrattle);
			case CardIds.TwilightsCall:
				return and(inGraveyard, minion, deathrattle);
			case CardIds.VarianKingOfStormwind:
				return and(inDeck, or(rush, taunt, divineShield));
			case CardIds.Vectus:
				return and(inGraveyard, minion, deathrattle);
			case CardIds.VengefulSpirit2:
				return and(inDeck, deathrattle);
			case CardIds.WarsongWrangler:
				return and(inDeck, beast);
			case CardIds.Drekthar1:
				return and(inDeck, minion, effectiveCostLess(card.getEffectiveManaCost()));
			case CardIds.VanndarStormpike1:
				return and(inDeck, minion, effectiveCostLess(card.getEffectiveManaCost() + 1));
			case CardIds.VitalitySurge:
				return and(inDeck, minion);
			case CardIds.WingCommanderIchman1:
				return and(inDeck, minion, beast);
			case CardIds.XyrellaTheDevout:
				return and(inGraveyard, minion, deathrattle);

			// Duels passives
			case CardIds.AllShallServeTavernBrawl:
				return and(minion, demon);
			case CardIds.AllTogetherNowTavernBrawl:
				return and(or(inDeck, inHand), battlecry);
			case CardIds.ArcaneFluxTavernBrawl:
				return and(spell, arcane);
			case CardIds.ArcaniteCrystalTavernBrawl:
				return and(spell, arcane);
			case CardIds.ArcticArmorTavernBrawl:
				return and(freeze);
			case CardIds.BandOfBeesTavernBrawl:
				return and(or(inDeck, inHand), effectiveCostLess(3));
			case CardIds.BattleTotem2:
				return and(or(inDeck, inHand), battlecry);
			case CardIds.BeckoningBicornTavernBrawl:
				return and(or(inDeck, inHand), pirate);
			case CardIds.BronzeSignetTavernBrawl:
				return and(inDeck, minion);
			case CardIds.BitterColdTavernBrawl:
				return and(frost, dealsDamage);
			case CardIds.CapturedFlag:
				return and(or(inDeck, inHand), minion);
			case CardIds.CoilCastingTavernBrawl:
				return and(or(inDeck, inHand), naga);
			case CardIds.CookiesLadleTavernBrawl:
				return and(or(inDeck, inHand), murloc);
			case CardIds.CorruptedFelstoneTavernBrawl:
				return and(or(inDeck, inHand), spell, fel);
			case CardIds.DeathlyDeathTavernBrawl:
				return and(minion, deathrattle);
			case CardIds.DeathstriderTavernBrawl:
				return and(or(inDeck, inHand), minion, deathrattle);
			case CardIds.DisksOfLegendTavernBrawl:
				return and(or(inDeck, inHand), minion, legendary);
			case CardIds.DivineIlluminationTavernBrawl:
				return and(holy);
			case CardIds.DoubleTime:
				return and(or(inDeck, inHand), spell);
			case CardIds.DraconicDreamTavernBrawl:
				return and(dragon);
			case CardIds.DragonAffinityTavernBrawl:
				return and(dragon);
			case CardIds.DragonboneRitualTavernBrawl:
				return and(dragon);
			case CardIds.DragonbloodTavernBrawl:
				return and(dragon);
			case CardIds.EerieStoneTavernBrawl:
				return and(spell, shadow);
			case CardIds.EdgeOfDredgeTavernBrawl:
				return and(or(inDeck, inHand), dredge);
			case CardIds.ElixirOfVigorTavernBrawl:
				return and(minion);
			case CardIds.EnduranceTrainingTavernBrawl:
				return and(minion, taunt);
			case CardIds.ExpeditedBurialTavernBrawl:
				return and(minion, deathrattle);
			case CardIds.FirekeepersIdolTavernBrawl:
				return and(spell, fire);
			case CardIds.FlamesOfTheKirinTorTavernBrawl:
				return and(or(inDeck, inHand), spell, fire);
			case CardIds.FlameWavesTavernBrawl:
				return and(or(inDeck, inHand), spell, fire);
			case CardIds.GlacialDownpourTavernBrawl:
				return and(or(inDeck, inHand), spell, frost);
			case CardIds.GreedyGainsTavernBrawl:
				return and(or(inDeck, inHand), minion);
			case CardIds.GrommashsArmguardsTavernBrawl:
				return and(weapon);
			case CardIds.GuardianLightTavernBrawl:
				return and(or(inDeck, inHand), spell, holy);
			case CardIds.HoldTheLineTavernBrawl:
				return and(taunt);
			case CardIds.ImpCredibleTrousersTavernBrawl:
				return and(or(inDeck, inHand), spell, fel);
			case CardIds.InspiringPresenceTavernBrawl:
				return and(minion, legendary);
			case CardIds.InvigoratingLightTavernBrawl:
				return and(spell, holy);
			case CardIds.IronRootsTavernBrawl:
				return and(or(inDeck, inHand), spell, nature);
			case CardIds.KhadgarsScryingOrb:
				return and(or(inDeck, inHand), spell);
			case CardIds.KindlingFlameTavernBrawl:
				return and(spell, fire, dealsDamage);
			// case CardIds.KotoriLightblade:
			// 	return and(or(inDeck, inHand), spell, holy);
			case CardIds.MeekMasteryTavernBrawl:
				return and(or(inDeck, inHand), minion, neutral, effectiveCostMore(2));
			case CardIds.MulchMadnessTavernBrawl:
				return and(minion, neutral);
			case CardIds.MendingPoolsTavernBrawl:
				return and(spell, nature);
			case CardIds.MummyMagic:
				return and(or(inDeck, inHand), minion, deathrattle);
			case CardIds.NaturalForceTavernBrawl:
				return and(spell, nature, dealsDamage);
			case CardIds.OopsAllSpellsTavernBrawl:
				return and(or(inDeck, inHand), spell);
			case CardIds.OpenTheDoorwaysTavernBrawl:
				return and(discover);
			case CardIds.OptimizedPolarityTavernBrawl:
				return and(or(inDeck, inHand), mech, not(magnetic));
			case CardIds.OrbOfRevelationTavernBrawl:
				return and(or(inDeck, inHand), or(discover, and(spell, effectiveCostMore(2))));
			case CardIds.PillageTheFallenTavernBrawl:
				return and(weapon);
			case CardIds.PlaguebringerTavernBrawl:
				return and(spell, effectiveCostMore(1));
			case CardIds.PotionOfSparkingTavernBrawl:
				return and(minion, rush);
			case CardIds.RallyTheTroopsTavernBrawl:
				return and(or(inDeck, inHand), battlecry);
			case CardIds.RhoninsScryingOrbTavernBrawl:
				return and(or(inDeck, inHand), spell);
			case CardIds.RighteousReservesTavernBrawl:
				return and(or(inDeck, inHand), minion, divineShield);
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
			case CardIds.ScepterOfSummoning:
				return and(or(inDeck, inHand), minion, effectiveCostMore(5));
			case CardIds.SpecialDeliveryTavernBrawl:
				return and(or(inDeck, inHand), minion, rush);
			case CardIds.Shadowcasting101TavernBrawl:
				return and(or(inDeck, inHand), minion);
			case CardIds.SpreadingSaplingsTavernBrawl:
				return and(or(inDeck, inHand), spell, nature);
			case CardIds.StaffOfPainTavernBrawl:
				return and(or(inDeck, inHand), spell, shadow);
			case CardIds.StakingAClaimTavernBrawl:
				return and(or(inDeck, inHand), discover);
			case CardIds.StarvingTavernBrawl:
				return and(minion, beast);
			case CardIds.StormpikeBattleRam:
				return and(or(inDeck, inHand), minion, beast);
			case CardIds.StickyFingersTavernBrawl:
				return and(or(inDeck, inHand), notInInitialDeck);
			case CardIds.SunstridersCrownTavernBrawl:
				return and(or(inDeck, inHand), spell);
			case CardIds.TerrorscaleStalker:
				return and(or(inDeck, inHand), minion, deathrattle);
			case CardIds.TotemOfTheDead2:
				return and(deathrattle);
			case CardIds.UnlockedPotential:
				return and(or(inDeck, inHand), minion, healthBiggerThanAttack);
			case CardIds.UnstableMagicTavernBrawl:
				return and(or(inDeck, inHand), spell, arcane);
			case CardIds.WitherTheWeakTavernBrawl:
				return and(or(inDeck, inHand), spell, fel);

			// Duels treasures
			case CardIds.BladeOfTheBurningSun:
				return and(inDeck, minion);
			case CardIds.DrocomurchanicasTavernBrawlToken:
				return and(inDeck, minion, or(dragon, murloc, mech));
			case CardIds.PartyPortalTavernBrawl2:
				return and(or(inDeck, inHand), spell);
			case CardIds.PrincessTavernBrawl:
				return and(inDeck, minion, deathrattle);
			case CardIds.SowTheSeedsTavernBrawl:
				return and(inDeck, minion);
			case CardIds.StaffOfRenewalTavernBrawl:
				return and(inGraveyard, minion);
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
