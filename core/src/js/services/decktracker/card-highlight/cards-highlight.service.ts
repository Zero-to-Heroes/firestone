import { Injectable } from '@angular/core';
import { CardIds, CardType, Race, ReferenceCard, SpellSchool } from '@firestone-hs/reference-data';
import { filter, map } from 'rxjs/operators';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { DeckZone } from '../../../models/decktracker/view/deck-zone';
import { VisualDeckCard } from '../../../models/decktracker/visual-deck-card';
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
	effectiveCostLess,
	effectiveCostMore,
	frenzy,
	inDeck,
	inGraveyard,
	inHand,
	inOther,
	mech,
	minion,
	notInInitialDeck,
	or,
	outcast,
	pirate,
	race,
	rush,
	secret,
	spell,
	spellPlayedThisMatch,
	spellSchool,
	taunt,
} from './selectors';

@Injectable()
export class CardsHighlightService {
	private handlers: { [uniqueId: string]: Handler } = {};

	private gameState: GameState;

	constructor(private readonly prefs: PreferencesService, private readonly store: AppUiStoreFacadeService) {
		this.store
			.listenDeckState$((gameState) => gameState)
			.pipe(
				map(([gameState]) => gameState),
				filter((gameState) => !!gameState),
			)
			.subscribe((gameState) => (this.gameState = gameState));
	}

	register(_uniqueId: string, handler: Handler) {
		this.handlers[_uniqueId] = handler;
	}

	unregister(_uniqueId: string) {
		delete this.handlers[_uniqueId];
	}

	async onMouseEnter(cardId: string, side: 'player' | 'opponent') {
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

		const selector: (handler: Handler, deckState?: DeckState) => boolean = this.buildSelector(cardId);
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

	private buildSelector(cardId: string): (handler: Handler, deckState?: DeckState) => boolean {
		switch (cardId) {
			case CardIds.ArcaneLuminary:
				return and(inDeck, notInInitialDeck);
			case CardIds.Arcanologist:
			case CardIds.ArcanologistCore:
				return and(inDeck, spell, secret);
			case CardIds.BarakKodobane1:
				return and(inDeck, spell, effectiveCostLess(4), effectiveCostMore(0));
			case CardIds.BookOfSpecters:
				return and(inDeck, spell);
			case CardIds.CagematchCustodian:
				return and(inDeck, cardType(CardType.WEAPON));
			case CardIds.DarkInquisitorXanesh:
				return and(or(inDeck, inHand), or(corrupt, corrupted));
			case CardIds.DoubleJump:
				return and(inDeck, outcast);
			case CardIds.FiremancerFlurgl:
				return and(race(Race.MURLOC), or(inDeck, inHand));
			case CardIds.FungalFortunes:
				return and(inDeck, minion);
			case CardIds.GuardianAnimals:
				return and(inDeck, minion, beast, effectiveCostLess(6));
			case CardIds.GuffRunetotem1:
				return and(spell, spellSchool(SpellSchool.NATURE));
			case CardIds.HarborScamp:
				return and(inDeck, pirate);
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
			case CardIds.OverlordSaurfang1:
				return and(minion, inGraveyard, frenzy);
			case CardIds.Rally:
				return and(inGraveyard, minion, effectiveCostLess(4), effectiveCostMore(0));
			case CardIds.RedscaleDragontamer:
				return and(inDeck, dragon);
			case CardIds.RingmasterWhatley:
				return and(inDeck, minion, or(dragon, mech, pirate));
			case CardIds.ScavengersIngenuity:
				return and(inDeck, beast);
			case CardIds.SelectiveBreederCore:
				return and(inDeck, beast);
			case CardIds.SwordOfTheFallen:
				return and(inDeck, spell, secret);
			case CardIds.Tuskpiercer:
				return and(inDeck, deathrattle);
			case CardIds.VarianKingOfStormwind:
				return and(inDeck, or(rush, taunt, divineShield));
			case CardIds.VengefulSpirit2:
				return and(inDeck, deathrattle);
			case CardIds.WarsongWrangler:
				return and(inDeck, beast);

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
