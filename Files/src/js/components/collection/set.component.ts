import { Component, NgZone, Input } from '@angular/core';

import * as Raven from 'raven-js';

import { CollectionManager } from '../../services/collection-manager.service';
import { AllCardsService } from '../../services/all-cards.service';

import { Card } from '../../models/card';
import { Set, SetCard } from '../../models/set';

declare var overwolf: any;

@Component({
	selector: 'set-view',
	styleUrls: [`../../../css/component/collection/set.component.scss`],
	template: `
		<div *ngIf="set">
			{{set.name}}: {{set.ownedCards}} / {{set.numberOfCards()}}
			<ul *ngIf="cards.getRarities(set.id).length > 1">
				<li *ngFor="let rarity of cards.getRarities(set.id)" title="{{set.missingCards(rarity)}}">
					{{rarity}}: {{set.ownedForRarity(rarity)}} / {{set.totalForRarity(rarity)}}
					<ul *ngIf="set.missingCards(rarity).length > 0">
						<li *ngFor="let missingCard of set.missingCards(rarity)">
							{{missingCard.name}} ({{missingCard.collected}} / {{missingCard.maxCollectible}})
						</li>
					</ul>
				</li>
			</ul>
		</div>
	`,
})
// 7.1.1.17994
export class SetComponent {

	@Input() set: Set;

	constructor(private collectionManager: CollectionManager, private cards: AllCardsService) {
		console.log('constructor CollectionComponent');
	}
}
