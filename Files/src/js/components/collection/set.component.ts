import { Component, NgZone, Input, SimpleChanges } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import * as Raven from 'raven-js';

import { AllCardsService } from '../../services/all-cards.service';

import { Card } from '../../models/card';
import { Set, SetCard, MissingCard } from '../../models/set';

declare var overwolf: any;

@Component({
	selector: 'set-view',
	styleUrls: [`../../../css/component/collection/set.component.scss`],
	template: `
		<div *ngIf="cardSet && maxCards" class="set">
			<div class="set-container">
				<div class="image-container">
					<img src="{{'/Files/assets/images/set-logos/' + cardSet.id + '.png'}}" class="set-logo" />
				</div>
				<div class="set-progress-bar" (click)="toggleShowRarities()" [style.width.%]="collectedWidth()">
					<span class="set-progress-bar-background" [style.background-image]="background()"></span>
					<span class="set-progress-bar-done" [style.clip-path]="clip()" [style.background-image]="background()"></span>
					<span class="set-progress-info">{{cardSet.name}}: {{cardSet.ownedCards}} / {{cardSet.numberOfCards()}}</span>
				</div>
			</div>
			<ul *ngIf="cards.getRarities(cardSet.id).length > 1 && _showRarities" class="rarities">
				<li *ngFor="let rarity of cards.getRarities(cardSet.id)">
					<rarity-view [rarity]="rarity" [cardSet]="cardSet"></rarity-view>
				</li>
			</ul>
			<ul *ngIf="cardSet.missingCards().length > 0 && showMissingCards" class="missing-cards">
				<li *ngFor="let missingCard of cardSet.missingCards()">
					<card-view [cardId]="missingCard.id" [collected]="missingCard.collected" [maxCollectible]="missingCard.maxCollectible">/</card-view>
				</li>
			</ul>
		</div>
	`,
})
// 7.1.1.17994
export class SetComponent {

	@Input() private maxCards: number;
	@Input() private cardSet: Set;
	private _showRarities = false;
	private showMissingCards = false;

	constructor(
		private sanitizer: DomSanitizer,
		private cards: AllCardsService) {
		// console.log('constructor CollectionComponent');
	}

	private toggleShowRarities() {
		this._showRarities = !this._showRarities;
		this.showMissingCards = !this.showMissingCards;
	}

	private collectedWidth() {
		return this.maxCards == 0 ? 0 : Math.max(33, 100.0 * this.cardSet.numberOfCards() / this.maxCards);
	}

	private background() {
		return this.sanitizer.bypassSecurityTrustStyle('url(/Files/assets/images/set-background/' + this.cardSet.id + '.jpg)')
	}

	private clip() {
		return this.sanitizer.bypassSecurityTrustStyle('inset(0 ' + (100 - 100.0 * this.cardSet.ownedCards / this.cardSet.numberOfCards()) + '% 0 0)')
	}

}
