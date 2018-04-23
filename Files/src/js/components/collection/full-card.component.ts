import { Component, Output, Input, EventEmitter, NgZone, ViewEncapsulation } from '@angular/core';

import * as Raven from 'raven-js';

import { AllCardsService } from '../../services/all-cards.service';
import { CollectionManager } from '../../services/collection/collection-manager.service';
import { Events } from '../../services/events.service';

import { Card } from '../../models/card';
import { Set, SetCard } from '../../models/set';

declare var overwolf: any;

@Component({
	selector: 'full-card',
	styleUrls: [`../../../css/component/collection/full-card.component.scss`],
	encapsulation: ViewEncapsulation.None,
	template: `
		<div class="card-details-container" [ngClass]="{'owned': card.owned, 'missing': !card.owned}" *ngIf="card">
			<button class="i-30 close-button" (click)="closeWindow()">
				<svg class="svg-icon-fill">
					<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="/Files/assets/svg/sprite.svg#window-control_close"></use>
				</svg>
			</button>
			<div class="card-view-container">
				<card-view [card]="card" [tooltips]="false" [showCounts]="true">/</card-view>
			</div>
			<div class="details">
				<h1>{{card.name}}</h1>
				<div class="card-info class">
					<span class="sub-title">Class:</span>
					<span class="value">{{class()}}</span>
				</div>
				<div class="card-info type">
					<span class="sub-title">Type:</span>
					<span class="value">{{type()}}</span>
				</div>
				<div class="card-info set">
					<span class="sub-title">Set:</span>
					<span class="value">{{set()}}</span>
				</div>
				<div class="card-info flavor-text">
					<span class="sub-title">Flavor Text:</span>
					<span class="value">{{card.flavor}}</span>
				</div>
			</div>
			<i class="i-50X6 gold-theme deco deco-left">
				<svg class="svg-icon-fill">
					<use xlink:href="/Files/assets/svg/sprite.svg#golden_decoration"/>
				</svg>
			</i>
			<i class="i-50X6 gold-theme deco deco-top">
				<svg class="svg-icon-fill">
					<use xlink:href="/Files/assets/svg/sprite.svg#golden_decoration"/>
				</svg>
			</i>
			<i class="i-50X6 gold-theme deco deco-right">
				<svg class="svg-icon-fill">
					<use xlink:href="/Files/assets/svg/sprite.svg#golden_decoration"/>
				</svg>
			</i>
			<i class="i-50X6 gold-theme deco deco-bottom">
				<svg class="svg-icon-fill">
					<use xlink:href="/Files/assets/svg/sprite.svg#golden_decoration"/>
				</svg>
			</i>
		</div>
	`,
})
// 7.1.1.17994
export class FullCardComponent {

	@Output() close = new EventEmitter();

	private card: any;

	constructor(
		private events: Events,
		private collectionManager: CollectionManager,
		private ngZone: NgZone,
		private cards: AllCardsService) {
	}

	@Input('cardId') set cardId(cardId: string) {
		let card = this.cards.getCard(cardId);
		console.log('setting full card', card);
		this.collectionManager.getCollection((collection: Card[]) => {
			card.ownedPremium = 0;
			card.ownedNonPremium = 0;
			this.updateCardWithCollection(collection, card);
			card.owned = card.ownedPremium || card.ownedNonPremium;

			this.ngZone.run(() => {
				this.card = card;
				console.log('set full card card', this.card, this.card.type);
				this.events.broadcast(Events.HIDE_TOOLTIP);
			});
		})
	}

	private updateCardWithCollection(collection: Card[], card: SetCard) {
		for (let i = 0; i < collection.length; i++) {
			let collectionCard = collection[i];
			if (collectionCard.Id == card.id) {
				// console.log('Matching card', collectionCard, card);
				if (collectionCard.Premium) {
					card.ownedPremium = collectionCard.Count;
				}
				else {
					card.ownedNonPremium = collectionCard.Count;
				}
			}
		}
	}

	private image() {
		return 'http://static.zerotoheroes.com/hearthstone/fullcard/en/256/' + this.card.id + '.png';
	}

	private class() {
		if (this.card.playerClass == 'Neutral') {
			return 'All classes';
		}
		return this.card.playerClass;
	}

	private type() {
		return this.card.type;
	}

	private set() {
		return this.cards.setName(this.card.set);
	}

	private closeWindow() {
		this.close.emit(null);
	}

}
