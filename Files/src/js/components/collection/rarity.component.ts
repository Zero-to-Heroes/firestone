import { Component, NgZone, Input, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { AllCardsService } from '../../services/all-cards.service';

import { Card } from '../../models/card';
import { Set, SetCard } from '../../models/set';

declare var overwolf: any;

@Component({
	selector: 'rarity-view',
	styleUrls: [`../../../css/component/collection/rarity.component.scss`],
	template: `
		<div *ngIf="cardSet && rarity" class="rarity-container">
			<div class="rarity-progress" (click)="toggleShowMissingCards()">
				<img src="{{'/Files/assets/images/rarity-' + rarity.toLowerCase() + '.png'}}" class="rarity" title="{{rarity}}" />
				<span class="rarity-progress-info">{{rarity}}: {{cardSet.ownedForRarity(rarity)}} / {{cardSet.totalForRarity(rarity)}}</span>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
// 7.1.1.17994
export class RarityComponent {

	@Input() rarity: string;
	@Input() cardSet: Set;

	constructor(
		private sanitizer: DomSanitizer,
		private cards: AllCardsService) {
		// console.log('constructor CollectionComponent');
	}
}
