import { Component, Output, Input, EventEmitter } from '@angular/core';

import * as Raven from 'raven-js';

import { AllCardsService } from '../../services/all-cards.service';
import { Events } from '../../services/events.service';

import { Card } from '../../models/card';
import { Set, SetCard } from '../../models/set';

declare var overwolf: any;

@Component({
	selector: 'full-card',
	styleUrls: [`../../../css/component/collection/full-card.component.scss`],
	template: `
		<div class="full-card-container">
			<span class="close-button" (click)="closeWindow()">X</span>
			<img src="{{image()}}"/>
			<div class="details">
				<h1>{{card.name}}</h1>
				<div class="flavor-text">
					{{card.flavor}}
				</div>
			</div>
		</div>
	`,
})
// 7.1.1.17994
export class FullCardComponent {

	@Output() close = new EventEmitter();

	private card: any;

	constructor(
		private events: Events,
		private cards: AllCardsService) {
	}

	@Input('cardId') set cardId(cardId: string) {
		this.card = this.cards.getCard(cardId);
	}

	private image() {
		return 'https://s3.amazonaws.com/com.zerotoheroes/plugins/hearthstone/fullcards/en/256/' + this.card.id + '.png';
	}

	private closeWindow() {
		this.close.emit(null);
	}
}
