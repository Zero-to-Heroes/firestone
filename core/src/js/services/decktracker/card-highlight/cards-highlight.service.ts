import { Injectable } from '@angular/core';
import { CardIds, CardType, Race, ReferenceCard, SpellSchool } from '@firestone-hs/reference-data';
import { filter, map } from 'rxjs/operators';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { DeckZone } from '../../../models/decktracker/view/deck-zone';
import { VisualDeckCard } from '../../../models/decktracker/visual-deck-card';
import { PreferencesService } from '../../preferences.service';
import { AppUiStoreService } from '../../ui-store/app-ui-store.service';
import {
	and,
	beast,
	cardType,
	corrupt,
	corrupted,
	deathrattle,
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

	constructor(private readonly prefs: PreferencesService, private readonly store: AppUiStoreService) {
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
			case CardIds.Collectible.Demonhunter.DoubleJump:
				return and(inDeck, outcast);
			case CardIds.Collectible.Druid.FungalFortunes:
				return and(inDeck, minion);
			case CardIds.Collectible.Druid.GuffRunetotem1:
				return and(spell, spellSchool(SpellSchool.NATURE));
			case CardIds.Collectible.Druid.LadyAnacondra1:
				return and(spell, spellSchool(SpellSchool.NATURE));
			case CardIds.Collectible.Demonhunter.JaceDarkweaver:
				return and(inOther, spell, spellSchool(SpellSchool.FEL), spellPlayedThisMatch);
			case CardIds.Collectible.Demonhunter.LineHopper:
				return outcast;
			case CardIds.Collectible.Demonhunter.Tuskpiercer:
				return and(inDeck, deathrattle);
			case CardIds.Collectible.Demonhunter.VengefulSpirit2:
				return and(inDeck, deathrattle);
			case CardIds.Collectible.Druid.LivingSeedRank1:
			case CardIds.NonCollectible.Druid.LivingSeedRank1_LivingSeedRank2Token:
			case CardIds.NonCollectible.Druid.LivingSeedRank1_LivingSeedRank3Token:
				return and(inDeck, beast);
			case CardIds.Collectible.Hunter.BarakKodobane1:
				return and(inDeck, spell, effectiveCostLess(4), effectiveCostMore(0));
			case CardIds.Collectible.Hunter.GuardianAnimals:
				return and(inDeck, minion, beast, effectiveCostLess(6));
			case CardIds.Collectible.Hunter.JewelOfNzoth:
				return and(minion, inGraveyard, deathrattle);
			case CardIds.Collectible.Hunter.ScavengersIngenuity:
				return and(inDeck, beast);
			case CardIds.Collectible.Hunter.SelectiveBreederCore:
				return and(inDeck, beast);
			case CardIds.Collectible.Hunter.WarsongWrangler:
				return and(inDeck, beast);
			case CardIds.Collectible.Mage.ArcaneLuminary:
				return and(inDeck, notInInitialDeck);
			case CardIds.Collectible.Mage.Arcanologist:
			case CardIds.Collectible.Mage.ArcanologistCore:
				return and(inDeck, spell, secret);
			case CardIds.Collectible.Mage.BookOfSpecters:
				return and(inDeck, spell);
			case CardIds.Collectible.Paladin.KnightOfAnointment:
				return and(inDeck, spell, spellSchool(SpellSchool.HOLY));
			case CardIds.Collectible.Paladin.RedscaleDragontamer:
				return and(inDeck, dragon);
			case CardIds.Collectible.Paladin.SwordOfTheFallen:
				return and(inDeck, spell, secret);
			case CardIds.Collectible.Priest.DarkInquisitorXanesh:
				return and(or(inDeck, inHand), or(corrupt, corrupted));
			case CardIds.Collectible.Shaman.CagematchCustodian:
				return and(inDeck, cardType(CardType.WEAPON));
			case CardIds.Collectible.Shaman.FiremancerFlurgl:
				return and(race(Race.MURLOC), or(inDeck, inHand));
			case CardIds.Collectible.Warrior.HarborScamp:
				return and(inDeck, pirate);
			case CardIds.Collectible.Warrior.OverlordSaurfang1:
				return and(minion, inGraveyard, frenzy);
			case CardIds.Collectible.Warrior.RingmasterWhatley:
				return and(inDeck, minion, or(dragon, mech, pirate));

			case CardIds.Collectible.Neutral.Rally:
				return and(inGraveyard, minion, effectiveCostLess(4), effectiveCostMore(0));
			case CardIds.Collectible.Neutral.VarianKingOfStormwind:
				return and(inDeck, or(rush, taunt, divineShield));

			// Duels
			case CardIds.NonCollectible.Neutral.PrincessTavernBrawl:
				return and(inDeck, minion, deathrattle);
			case CardIds.NonCollectible.Neutral.SowTheSeedsTavernBrawl:
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
