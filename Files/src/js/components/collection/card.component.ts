import { Component, NgZone, Input, SimpleChanges } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import * as Raven from 'raven-js';
import { NgxPopperModule } from 'ngx-popper';

import { AllCardsService } from '../../services/all-cards.service';

import { Card } from '../../models/card';
import { Set, SetCard } from '../../models/set';

declare var overwolf: any;

@Component({
	selector: 'card-view',
	styleUrls: [`../../../css/component/collection/card.component.scss`],
	template: `
		<div *ngIf="cardId" class="card-container" >
			<img src="{{image()}}" />
			<div class="count">
				{{collected + ' / ' + maxCollectible}}
			</div>
			<div #popper1
		          [popper]="popper1Content"
		          [popperShowOnStart]="true"
		          [popperTrigger]="'click'"
		          [popperPlacement]="'bottom'">
		    	<p class="bold">Hey!</p>
		    	<p class="thin">Choose where to put your popper!</p>
		    </div>
		    <popper-content #popper1Content>
		    	<p class="bold">Popper on bottom</p>
		    </popper-content>
		</div>
	`,
})
// 7.1.1.17994
export class CardComponent {

	@Input() private cardId: string;
	@Input() private collected: number;
	@Input() private maxCollectible: number;

	constructor(
		private sanitizer: DomSanitizer,
		private cards: AllCardsService) {
		// console.log('constructor CollectionComponent');
	}

	private image() {
		return 'https://s3.amazonaws.com/com.zerotoheroes/plugins/hearthstone/fullcards/en/256/' + this.cardId + '.png';
	}
}
