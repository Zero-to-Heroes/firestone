import { Component, ViewRef, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { trigger, state, transition, style, animate } from '@angular/animations';

import { CollectionManager } from '../services/collection/collection-manager.service';
import { AllCardsService } from '../services/all-cards.service';
import { Events } from '../services/events.service';

import { Card } from '../models/card';
import { Set, SetCard } from '../models/set';
import { timeInterval } from 'rxjs/operator/timeInterval';

const COLLECTION_HIDE_TRANSITION_DURATION_IN_MS = 150;

declare var overwolf: any;
declare var ga: any;
declare var adsReady: any;
declare var OwAd: any;

@Component({
	selector: 'collection',
	styleUrls: [
		`../../css/component/collection.component.scss`,
	],
	template: `
		<div class="collection">
			<section class="main" [ngClass]="{'divider': _selectedView == 'cards'}" [@viewState]="_viewState">
				<collection-menu
					[displayType]="_menuDisplayType"
					[selectedSet]="_selectedSet"
					[selectedFormat]="_selectedFormat"
					[selectedCardId]="selectedCard ? selectedCard.id : ''"
					[searchString]="searchString">
				</collection-menu>
				<ng-container [ngSwitch]="_selectedView">
					<sets *ngSwitchCase="'sets'" 
							[selectedFormat]="_selectedFormat"
							[standardSets]="standardSets"
							[wildSets]="wildSets">
					</sets>
					<cards *ngSwitchCase="'cards'" [cardList]="_cardList" [set]="_selectedSet" [searchString]="searchString"></cards>
					<full-card *ngSwitchCase="'card-details'" class="full-card" [selectedCard]="selectedCard"></full-card>
				</ng-container>
			</section>
			<section class="secondary">
				<card-search>Search card</card-search>
				<card-history></card-history>
				<div class="ads-container">
					<div class="no-ads-placeholder">
						<i class="i-117X33 gold-theme logo">
							<svg class="svg-icon-fill">
								<use xlink:href="/Files/assets/svg/sprite.svg#ad_placeholder"/>
							</svg>
						</i>
					</div>
					<div class="ads" id="ad-div"></div>
				</div>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	animations: [
		trigger('viewState', [
			state('hidden',	style({
				opacity: 0,
				"pointer-events": "none",
			})),
			state('shown',	style({
				opacity: 1,
			})),
			transition(
				'hidden <=> shown',
				animate(`${COLLECTION_HIDE_TRANSITION_DURATION_IN_MS}ms linear`)),
		])
	]
})
// 7.1.1.17994
export class CollectionComponent implements AfterViewInit {

	standardSets: Set[];
	wildSets: Set[];

	_menuDisplayType: string = 'menu';
	_selectedView: string = 'sets';
	_selectedSet: Set;
	_selectedFormat: string;
	searchString: string;
	_viewState: string = 'shown';
	_cardList: ReadonlyArray<SetCard>;
	selectedCard: SetCard;

	private windowId: string;
	private adRef;
	private adInit = false;
	private refreshing = false;

	constructor(
		private _events: Events,
		private cards: AllCardsService,
		private collectionManager: CollectionManager,
		private cdr: ChangeDetectorRef) {
	}

	ngAfterViewInit() {
		ga('send', 'event', 'collection', 'show');
		this.cdr.detach();

		overwolf.windows.getCurrentWindow((result) => {
			if (result.status === "success") {
				this.windowId = result.window.id;
			}
		});

		overwolf.windows.onStateChanged.addListener((message) => {
			if (message.window_name != "CollectionWindow") {
				return;
			}
			console.log('state changed CollectionWindow', message);
			if (message.window_state != 'normal') {
				console.log('removing ad', message.window_state);
				this.removeAds();
				// this.cdr.detectChanges();
			}
			else {
				console.log('refreshing ad', message.window_state);
				this.refreshAds();
				this.updateSets();
			}
		});

		// console.log('constructing');
		this._events.on(Events.SET_SELECTED).subscribe(
			(data) => {
				this.transitionState(() => {
					this.reset();
					// console.log(`selecting set, showing cards`, data);
					this._menuDisplayType = 'breadcrumbs';
					this._selectedView = 'cards';
					this._selectedSet = data.data[0];
					this._selectedFormat = this._selectedSet.standard ? 'standard' : 'wild';
					this._cardList = this._selectedSet.allCards;
					// this.cdr.detectChanges();
				});
			}
		)

		this._events.on(Events.FORMAT_SELECTED).subscribe(
			(data) => {
				this.transitionState(() => {
					this.reset();
					// console.log(`selecting format in collection`, data);
					this._menuDisplayType = 'breadcrumbs';
					this._selectedView = 'sets';
					this._selectedFormat = data.data[0];
				});
			}
		)

		this._events.on(Events.MODULE_SELECTED).subscribe(
			(data) => {
				this.transitionState(() => {
					this.reset();
					this._menuDisplayType = 'menu';
					this._selectedView = 'sets';
				});
			}
		)

		this._events.on(Events.SHOW_CARDS).subscribe(
			(data) => {
				this.transitionState(() => {
					this.reset();
					this._menuDisplayType = 'breadcrumbs';
					this._selectedView = 'cards';
					this._cardList = data.data[0];
					this.searchString = data.data[1];
				})
			}
		)

		this._events.on(Events.SHOW_CARD_MODAL).subscribe(
			(event) => {
				this.transitionState(() => {
					this.selectCard(event.data[0]);
				});
			}
		);

		overwolf.windows.onMessageReceived.addListener((message) => {
			console.log('received', message, this.windowId);
			if (message.id === 'click-card') {
				// this.ngZone.run(() => {
				// this.transitionState(() => {
					this.selectCard(message.content);
					overwolf.windows.restore(this.windowId);
					// this.cdr.detectChanges();
				// })
			}
		});

		this.refreshAds();
		this.updateSets();
	}

	private transitionState(changeStateCallback: Function) {
		this._viewState = "hidden";
		setTimeout(() => {
			changeStateCallback();
			this._viewState = "shown";
			if (!(<ViewRef>this.cdr).destroyed) {
				this.cdr.detectChanges();
			}
		}, COLLECTION_HIDE_TRANSITION_DURATION_IN_MS);
	}

	private selectCard(fullCardId: string) {
		let newSet = this.cards.getSetFromCardId(fullCardId);
		// Always rebuild the set to update the card owned information
		this.buildSet(fullCardId).then((set) => {
			this.reset();
			this._menuDisplayType = 'breadcrumbs';
			this._selectedView = 'card-details';
			this._selectedSet = set;
			this.selectedCard = this._selectedSet.allCards.filter((card) => card.id == fullCardId)[0];
			this._selectedFormat = this._selectedSet.standard ? 'standard' : 'wild';
			this.cdr.detectChanges();
		});
	}

	private refreshAds() {
		if (this.adInit) {
			console.log('already initializing ads, returning');
			return;
		}
		if (!adsReady) {
			console.log('ads container not ready, returning');
			setTimeout(() => {
				this.refreshAds()
			}, 50);
			return;
		}
		if (!this.adRef) {
			console.log('first time init ads, creating OwAd');
			this.adInit = true;
			overwolf.windows.getCurrentWindow((result) => {
				if (result.status === "success") {
					console.log('is window visible?', result);
					if (result.window.isVisible) {
						console.log('init OwAd');
						this.adRef = new OwAd(document.getElementById("ad-div"));
					}
					this.adInit = false;
				}
			});
			return;
		}
		console.log('refreshing ads');
		this.adRef.refreshAd();
	}

	private removeAds() {
		if (!this.adRef) {
			return;
		}
		console.log('removing ads');
		this.adRef.removeAd();
	}

	private reset() {
		this._menuDisplayType = undefined;
		this._selectedView = undefined;
		this._selectedSet =undefined;
		this._selectedFormat = undefined;
		this._cardList = undefined;
		this.selectedCard = undefined;
		this.searchString = undefined;
	}

	private updateSets() {
		if (this.refreshing) {
			return;
		}
		this.refreshing = true;

		this.collectionManager.getCollection((collection: Card[]) => {
			this.buildSetsFromCollection(collection);
			this.refreshing = false;
			console.log('sets updated', this.standardSets, this.wildSets);
			this.cdr.detectChanges();
		})
	}

	private buildSetsFromCollection(collection: Card[]) {
		const standardSets = this.cards.getStandardSets();
		this.standardSets = standardSets.map((set) => this.mergeSet(collection, set));
		const wildSets = this.cards.getWildSets();
		this.wildSets = wildSets.map((set) => this.mergeSet(collection, set));
	}

	private buildSet(fullCardId: string): Promise<Set> {
		return new Promise<Set>((resolve) => {
			this.collectionManager.getCollection((collection: Card[]) => {
				console.log('building set from', fullCardId);
				const set = this.cards.getSetFromCardId(fullCardId);
				console.log('base set is', set);
				const mergedSet = this.mergeSet(collection, set);
				console.log('merged set is', mergedSet);
				resolve(mergedSet);
			})
		})
	}

	private mergeSet(collection: Card[], set: Set): Set {
		const updatedCards: SetCard[] = this.mergeFullCards(collection, set.allCards);
		const ownedLimitCollectibleCards = updatedCards
			.map((card: SetCard) => card.getNumberCollected())
			.reduce((c1, c2) => c1 + c2, 0);
		const ownedLimitCollectiblePremiumCards = updatedCards
			.map((card: SetCard) => card.getNumberCollectedPremium())
			.reduce((c1, c2) => c1 + c2, 0);
		return new Set(
			set.id,
			set.name,
			set.standard,
			updatedCards,
			ownedLimitCollectibleCards,
			ownedLimitCollectiblePremiumCards);
	}

	private mergeFullCards(collection: Card[], setCards: ReadonlyArray<SetCard>): SetCard[] {
		return setCards.map((card: SetCard) => {
			const collectionCard: Card = collection.find((collectionCard: Card) => collectionCard.id === card.id);
			const ownedPremium = collectionCard ? collectionCard.premiumCount : 0;
			const ownedNonPremium = collectionCard ? collectionCard.count : 0;
			return new SetCard(card.id, card.name, card.rarity, ownedNonPremium, ownedPremium);
		});
	}
}
