import { Injectable } from '@angular/core';
import { CardIds, ReferenceCard } from '@firestone-hs/reference-data';
import { DeckZone } from '../../../models/decktracker/view/deck-zone';
import { VisualDeckCard } from '../../../models/decktracker/visual-deck-card';
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
	jewelOfNzoth,
	knightOfAnointment,
	lineHopper,
	livingSeed,
	overlordSaurfang,
	rally,
	redscaleDragontamer,
	ringmasterWhatley,
	tuskpiercer,
} from './selectors';

@Injectable()
export class CardsHighlightService {
	private handlers: { [uniqueId: string]: Handler } = {};

	constructor(private readonly prefs: PreferencesService) {}

	register(_uniqueId: string, handler: Handler) {
		this.handlers[_uniqueId] = handler;
	}

	unregister(_uniqueId: string) {
		delete this.handlers[_uniqueId];
	}

	async onMouseEnter(cardId: string) {
		return;
		const prefs = await this.prefs.getPreferences();
		if (!prefs.overlayHighlightRelatedCards) {
			return;
		}

		const selector: (handler: Handler) => boolean = this.buildSelector(cardId);
		if (selector) {
			Object.values(this.handlers)
				.filter((handler) => selector(handler))
				.forEach((handler) => handler.highlightCallback());
		}
	}

	onMouseLeave(cardId: string) {
		Object.values(this.handlers).forEach((handler) => handler.unhighlightCallback());
	}

	private buildSelector(cardId: string): (handler: Handler) => boolean {
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
				return livingSeed;
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
