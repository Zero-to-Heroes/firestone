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
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/collection/full-card.component.scss`,
	],
	encapsulation: ViewEncapsulation.None,
	template: `
		<div class="card-details-container" [ngClass]="{'owned': card.owned, 'missing': !card.owned}" *ngIf="card">
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
				<div class="card-info audio" *ngIf="audioClips">
					<span class="sub-title">Sound:</span>
					<ul class="value">
						<li class="sound" *ngFor="let sound of audioClips" (click)="playSound(sound.audio)">
							<span>{{sound.name}}</span>
							<button class="i-30 brown-theme sound-button">
								<svg class="svg-icon-fill">
									<use xlink:href="/Files/assets/svg/sprite.svg#sound"/>
								</svg>
							</button>
						</li>
					</ul>
				</div>
				<div class="card-info flavor-text">
					<span class="sub-title">Flavor Text:</span>
					<span class="value">{{card.flavor}}</span>
				</div>
			</div>
		</div>
	`,
})
// 7.1.1.17994
export class FullCardComponent {

	@Output() close = new EventEmitter();

	card: any;
	audioClips: any[];

	// Soi we can cancel a playing sound if a new card is displayed
	private previousClips = [];

	constructor(
		private events: Events,
		private collectionManager: CollectionManager,
		private ngZone: NgZone,
		private cards: AllCardsService) {
	}

	@Input('cardId') set cardId(cardId: string) {
		this.previousClips = this.audioClips;
		this.audioClips = [];
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
		if (card.audio) {
			Object.keys(card.audio).forEach((key,index) => {
			    this.audioClips.push({
			    	name: key.split("_")[0],
			    	file: card.audio[key],
			    	audio: new Audio()
			    });
			    this.audioClips.forEach((sound) => {
			    	sound.audio.src = `http://static.zerotoheroes.com/hearthstone/audio/${sound.file}`;
			    	sound.audio.load();
			    });
			});
		}
	}

	playSound(audio) {
		this.cancelPlayingSounds();
		audio.play();
	}

	image() {
		return 'http://static.zerotoheroes.com/hearthstone/fullcard/en/256/' + this.card.id + '.png';
	}

	class() {
		if (this.card.playerClass == 'Neutral') {
			return 'All classes';
		}
		return this.card.playerClass;
	}

	type() {
		return this.card.type;
	}

	set() {
		return this.cards.setName(this.card.set);
	}

	closeWindow() {
		this.close.emit(null);
	}

	private cancelPlayingSounds() {
		this.previousClips.forEach((sound) => {
			sound.audio.pause();
			sound.audio.currentTime = 0;
		})
		this.audioClips.forEach((sound) => {
			sound.audio.pause();
			sound.audio.currentTime = 0;
		})
	}

	private updateCardWithCollection(collection: Card[], card: SetCard) {
		for (let i = 0; i < collection.length; i++) {
			let collectionCard = collection[i];
			if (collectionCard.id == card.id) {
				card.ownedPremium = collectionCard.premiumCount;
				card.ownedNonPremium = collectionCard.count;
			}
		}
	}

	private cancelPlayingSounds() {
		this.audioClips.forEach((sound) => {
			sound.audio.pause();
			sound.audio.currentTime = 0;
		})
	}

}
