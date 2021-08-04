import { Injectable } from '@angular/core';
import { CardIds, ReferenceCard } from '@firestone-hs/reference-data';
import { map } from 'rxjs/operators';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { DeckZone } from '../../../models/decktracker/view/deck-zone';
import { VisualDeckCard } from '../../../models/decktracker/visual-deck-card';
import { AppUiStoreService } from '../../app-ui-store.service';
import { PreferencesService } from '../../preferences.service';
import {
	arcaneLuminary,
	arcanologist,
	barakKodobane,
	cagematchCustodian,
	darkInquisitorXanesh,
	doubleJump,
	fungalFortunes,
	guardianAnimals,
	guffRunetotem,
	jaceDarkweaver,
	jewelOfNzoth,
	knightOfAnointment,
	lineHopper,
	livingSeed as beastsInDeck,
	murlocsInDeckAndHand,
	overlordSaurfang,
	rally,
	redscaleDragontamer,
	ringmasterWhatley,
	tuskpiercer,
	varianKingOfStormwind,
} from './selectors';

@Injectable()
export class CardsHighlightService {
	private handlers: { [uniqueId: string]: Handler } = {};

	private gameState: GameState;

	constructor(private readonly prefs: PreferencesService, private readonly store: AppUiStoreService) {
		this.store
			.listenDeckState$((gameState) => gameState)
			.pipe(map(([loading]) => loading))
			.subscribe((gameState) => (this.gameState = gameState));
	}

	register(_uniqueId: string, handler: Handler) {
		this.handlers[_uniqueId] = handler;
	}

	unregister(_uniqueId: string) {
		delete this.handlers[_uniqueId];
	}

	async onMouseEnter(cardId: string, side: 'player' | 'opponent') {
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
				return doubleJump;
			case CardIds.Collectible.Demonhunter.Tuskpiercer:
			case CardIds.Collectible.Demonhunter.VengefulSpirit2:
				return tuskpiercer;
			case CardIds.Collectible.Demonhunter.LineHopper:
				return lineHopper;
			case CardIds.Collectible.Druid.LivingSeedRank1:
			case CardIds.NonCollectible.Druid.LivingSeedRank1_LivingSeedRank2Token:
			case CardIds.NonCollectible.Druid.LivingSeedRank1_LivingSeedRank3Token:
			case CardIds.Collectible.Hunter.SelectiveBreederCore:
			case CardIds.Collectible.Hunter.WarsongWrangler:
			case CardIds.Collectible.Hunter.ScavengersIngenuity:
				return beastsInDeck;
			case CardIds.Collectible.Druid.FungalFortunes:
				return fungalFortunes;
			case CardIds.Collectible.Druid.GuffRunetotem1:
			case CardIds.Collectible.Druid.LadyAnacondra1:
				return guffRunetotem;
			case CardIds.Collectible.Hunter.GuardianAnimals:
				return guardianAnimals;
			case CardIds.Collectible.Hunter.BarakKodobane1:
				return barakKodobane;
			case CardIds.Collectible.Hunter.JewelOfNzoth:
				return jewelOfNzoth;
			case CardIds.Collectible.Mage.Arcanologist:
			case CardIds.Collectible.Mage.ArcanologistCore:
			case CardIds.Collectible.Paladin.SwordOfTheFallen:
				return arcanologist;
			case CardIds.Collectible.Mage.ArcaneLuminary:
				return arcaneLuminary;
			case CardIds.Collectible.Paladin.KnightOfAnointment:
				return knightOfAnointment;
			case CardIds.Collectible.Paladin.RedscaleDragontamer:
				return redscaleDragontamer;
			case CardIds.Collectible.Neutral.Rally:
				return rally;
			case CardIds.Collectible.Priest.DarkInquisitorXanesh:
				return darkInquisitorXanesh;
			case CardIds.Collectible.Shaman.CagematchCustodian:
				return cagematchCustodian;
			case CardIds.Collectible.Warrior.RingmasterWhatley:
				return ringmasterWhatley;
			case CardIds.Collectible.Warrior.OverlordSaurfang1:
				return overlordSaurfang;
			case CardIds.Collectible.Shaman.FiremancerFlurgl:
				return murlocsInDeckAndHand;
			case CardIds.Collectible.Neutral.VarianKingOfStormwind:
				return varianKingOfStormwind;
			case CardIds.Collectible.Demonhunter.JaceDarkweaver:
				return jaceDarkweaver;
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
