import { Injectable } from '@angular/core';
import { CardIds, CardType, Race, ReferenceCard, SpellSchool } from '@firestone-hs/reference-data';
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
	beast,
	cardType,
	corrupt,
	corrupted,
	deathrattle,
	demon,
	divineShield,
	dragon,
	effectiveCostEqual,
	effectiveCostLess,
	effectiveCostMore,
	fel,
	frenzy,
	frost,
	holy,
	inDeck,
	inGraveyard,
	inHand,
	inOther,
	mech,
	minion,
	not,
	notInInitialDeck,
	or,
	outcast,
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

// We don't want a shared service with a facade here, as we don't want any communitication between
// different decks
@Injectable()
export class CardsHighlightService extends AbstractSubscriptionService {
	private handlers: { [uniqueId: string]: Handler } = {};

	private gameState: GameState;

	constructor(private readonly prefs: PreferencesService, protected readonly store: AppUiStoreFacadeService) {
		super(store);
		this.init();
	}

	public shutDown() {
		super.onDestroy();
	}

	private async init() {
		await this.store.initComplete();
		this.store
			.listenDeckState$((gameState) => gameState)
			.pipe(
				map(([gameState]) => gameState),
				filter((gameState) => !!gameState),
				takeUntil(this.destroyed$),
			)
			.subscribe((gameState) => (this.gameState = gameState));
	}

	register(_uniqueId: string, handler: Handler) {
		this.handlers[_uniqueId] = handler;
	}

	unregister(_uniqueId: string) {
		delete this.handlers[_uniqueId];
	}

	async onMouseEnter(cardId: string, side: 'player' | 'opponent', card?: DeckCard) {
		// Happens when using the deck-list component outside of a game
		if (!this.gameState) {
			return;
		}

		const prefs = await this.prefs.getPreferences();
		if (!prefs.overlayHighlightRelatedCards) {
			return;
		}

		if (!side) {
			console.warn('no side provided', cardId, side);
		}

		const selector: (handler: Handler, deckState?: DeckState) => boolean = this.buildSelector(cardId, card);
		if (selector) {
			Object.values(this.handlers)
				.filter((handler) =>
					selector(handler, side === 'player' ? this.gameState.playerDeck : this.gameState.opponentDeck),
				)
				.forEach((handler) => handler.highlightCallback());
		}
	}

	onMouseLeave(cardId: string) {
		Object.values(this.handlers).forEach((handler) => handler.unhighlightCallback());
	}

	private buildSelector(cardId: string, card: DeckCard): (handler: Handler, deckState?: DeckState) => boolean {
		switch (cardId) {
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
			case CardIds.BalindaStonehearth:
				return and(inDeck, spell);
			case CardIds.BarakKodobane1:
				return and(inDeck, spell, or(effectiveCostEqual(1), effectiveCostEqual(2), effectiveCostEqual(3)));
			case CardIds.BloodreaverGuldan:
				return and(inGraveyard, minion, demon);
			case CardIds.BookOfSpecters:
				return and(inDeck, spell);
			case CardIds.CagematchCustodian:
				return and(inDeck, cardType(CardType.WEAPON));
			case CardIds.CariaFelsoul:
				return and(inDeck, demon);
			case CardIds.ContrabandStash:
				return and(inOther, not(rogue));
			case CardIds.DarkInquisitorXanesh:
				return and(or(inDeck, inHand), or(corrupt, corrupted));
			case CardIds.DaUndatakah:
				return and(inGraveyard, minion, deathrattle);
			case CardIds.DeadRinger:
				return and(inDeck, minion, deathrattle);
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
			case CardIds.JaceDarkweaver:
				return and(inOther, spell, spellSchool(SpellSchool.FEL), spellPlayedThisMatch);
			case CardIds.JewelOfNzoth:
				return and(minion, inGraveyard, deathrattle);
			case CardIds.KanrethadEbonlocke_KanrethadPrimeToken:
				return and(demon, inGraveyard, minion);
			case CardIds.KnightOfAnointment:
				return and(inDeck, spell, spellSchool(SpellSchool.HOLY));
			case CardIds.LadyAnacondra1:
				return and(spell, spellSchool(SpellSchool.NATURE));
			case CardIds.LadyVashj_VashjPrimeToken:
				return and(inDeck, spell);
			case CardIds.LineHopper:
				return outcast;
			case CardIds.LivingSeedRank1:
			case CardIds.LivingSeedRank1_LivingSeedRank2Token:
			case CardIds.LivingSeedRank1_LivingSeedRank3Token:
				return and(inDeck, beast);
			case CardIds.NzothGodOfTheDeep:
				return and(inGraveyard, minion, (handler) => !!handler.referenceCardProvider()?.race);
			case CardIds.NzothTheCorruptor:
				return and(inGraveyard, minion, deathrattle);
			case CardIds.OracleOfElune:
				return and(minion, effectiveCostLess(3));
			case CardIds.OverlordSaurfang1:
				return and(minion, inGraveyard, frenzy);
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
			case CardIds.ScavengersIngenuity:
				return and(inDeck, beast);
			case CardIds.SelectiveBreederCore:
				return and(inDeck, beast);
			case CardIds.SpiritGuide:
				return and(inDeck, spell, or(shadow, holy));
			case CardIds.SpringTheTrap:
				return and(inDeck, secret);
			case CardIds.StonehearthVindicator:
				return and(inDeck, spell, effectiveCostLess(4));
			case CardIds.StaffOfPainTavernBrawl:
				return and(spell, shadow);
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
			case CardIds.VengefulSpirit2:
				return and(inDeck, deathrattle);
			case CardIds.WarsongWrangler:
				return and(inDeck, beast);
			case CardIds.Drekthar1:
				return and(inDeck, minion, effectiveCostMore(card.getEffectiveManaCost() - 1));
			case CardIds.VanndarStormpike:
				return and(inDeck, minion, effectiveCostLess(card.getEffectiveManaCost() + 1));
			case CardIds.VitalitySurge:
				return and(inDeck, minion);
			case CardIds.WingCommanderIchman:
				return and(inDeck, minion, beast);
			case CardIds.XyrellaTheDevout:
				return and(inGraveyard, minion, deathrattle);

			// Duels
			case CardIds.PrincessTavernBrawl:
				return and(inDeck, minion, deathrattle);
			case CardIds.SowTheSeedsTavernBrawl:
				return and(inDeck, minion);
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
