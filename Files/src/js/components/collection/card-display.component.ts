import { Component, NgZone, Input, SimpleChanges } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import * as Raven from 'raven-js';

import { AllCardsService } from '../../services/all-cards.service';

import { Card } from '../../models/card';
import { Set, SetCard, MissingCard } from '../../models/set';

declare var overwolf: any;

@Component({
	selector: 'card-display',
	styleUrls: [`../../../css/component/collection/card-display.component.scss`],
	template: `
		<div *ngIf="_set" class="card-display">
			<div *ngIf="_missingCards.length > 0">
				<h2>Showing missing cards for {{_set.name}}</h2>
				<!--<ul *ngIf="cards.getRarities(_set.id).length > 1" class="rarities">
					<li *ngFor="let rarity of cards.getRarities(_set.id)">
						<rarity-view [rarity]="rarity" [cardSet]="_set"></rarity-view>
					</li>
				</ul>-->
				<ul class="missing-cards">
					<li *ngFor="let missingCard of _missingCards">
						<card-view [cardId]="missingCard.id" [collected]="missingCard.collected" [maxCollectible]="missingCard.maxCollectible">/</card-view>
					</li>
				</ul>
			</div>
			<div *ngIf="_missingCards.length == 0">
				<h2>Congratulations! You have collected all the cards for {{_set.name}}</h2>
			</div>
		</div>
	`,
})
export class CardDisplayComponent {

	// @Input() private maxCards: number;
	private _set: Set;
	private _missingCards: MissingCard[];
	// private _showRarities = false;
	// private showMissingCards = false;

	constructor(
		// private sanitizer: DomSanitizer,
		private cards: AllCardsService) {
		// console.log('constructor CollectionComponent');
	}

	@Input('set') set cardSet(set: Set) {
		this._set = set;
		if (set != null) {
			this._missingCards = set.missingCards();
		}
	}

	// private toggleShowRarities() {
	// 	this._showRarities = !this._showRarities;
	// 	this.showMissingCards = !this.showMissingCards;
	// }

	// private collectedWidth() {
	// 	return this.maxCards == 0 ? 0 : Math.max(33, 100.0 * this.cardSet.numberOfCards() / this.maxCards);
	// }

	// private background() {
	// 	return this.sanitizer.bypassSecurityTrustStyle('url(/Files/assets/images/set-background/' + this.cardSet.id + '.jpg)')
	// }

	// private clip() {
	// 	return this.sanitizer.bypassSecurityTrustStyle('inset(0 ' + (100 - 100.0 * this.cardSet.ownedCards / this.cardSet.numberOfCards()) + '% 0 0)')
	// }

}
