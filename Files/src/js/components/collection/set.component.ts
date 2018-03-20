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
		<div *ngIf="_cardSet" class="set">
			<div class="logo-container">
				<img src="{{'/Files/assets/images/sets/' + _cardSet.id + '.png'}}" class="set-logo" />
				<span class="text set-name" *ngIf="_displayName">{{_cardSet.name}}</span>
			</div>
			<span class="cards-collected">{{_cardSet.ownedCards}}/{{_cardSet.numberOfCards()}}</span>
		</div>
	`,
})
// 7.1.1.17994
export class SetComponent {

	@Input() private maxCards: number;

	private _cardSet: Set;
	private _displayName = false;

	@Input('cardSet') set cardSet(set: Set) {
		this._cardSet = set;
		// console.log('setting set', set, set.name)
		if (['Basic', 'Classic', 'Hall of Fame'].indexOf(set.name) > -1) {
			this._displayName = true;
		}
	}

	constructor(
		private sanitizer: DomSanitizer,
		private cards: AllCardsService) {
		// console.log('constructor CollectionComponent');
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
