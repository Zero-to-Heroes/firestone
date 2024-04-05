import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { ReferenceCard } from '@firestone-hs/reference-data';
import { CollectionNavigationService } from '@firestone/collection/common';
import { CardBack } from '@firestone/memory';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { CurrentView } from '../../models/mainwindow/collection/current-view.type';
import { Set, SetCard } from '../../models/set';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../abstract-subscription-store.component';

@Component({
	selector: 'collection',
	styleUrls: [
		`../../../css/component/app-section.component.scss`,
		`../../../css/component/collection/collection.component.scss`,
	],
	template: `
		<div
			class="app-section collection"
			*ngIf="{
				currentView: currentView$ | async,
				selectedSet: selectedSet$ | async,
				selectedCard: selectedCard$ | async,
				selectedCardBack: selectedCardBack$ | async,
				searchString: searchString$ | async
			} as value"
		>
			<section class="main" [ngClass]="{ divider: value.currentView === 'cards' }">
				<with-loading [isLoading]="loading$ | async">
					<div class="content main-content" *ngIf="menuDisplayType$ | async as menuDisplayType">
						<global-header *ngIf="menuDisplayType === 'breadcrumbs'"> </global-header>
						<collection-menu-selection
							class="menu-selection"
							*ngIf="menuDisplayType === 'menu'"
							[selectedTab]="value.currentView"
						>
						</collection-menu-selection>
						<sets *ngIf="value.currentView === 'sets'"> </sets>
						<cards
							[set]="value.selectedSet"
							[searchString]="value.searchString"
							*ngIf="value.currentView === 'cards'"
						>
						</cards>
						<full-card
							class="full-card"
							[selectedCard]="value.selectedCard"
							*ngIf="value.currentView === 'card-details'"
						>
						</full-card>
						<card-backs *ngIf="value.currentView === 'card-backs'"> </card-backs>
						<full-card-back
							class="full-card"
							[cardBack]="value.selectedCardBack"
							*ngIf="value.currentView === 'card-back-details'"
						>
						</full-card-back>
						<hero-portraits *ngIf="value.currentView === 'hero-portraits'"> </hero-portraits>
						<the-coins *ngIf="value.currentView === 'coins'"> </the-coins>
						<pack-stats *ngIf="value.currentView === 'packs'"></pack-stats>
					</div>
				</with-loading>
			</section>
			<section
				class="secondary"
				*ngIf="
					!(showAds$ | async) &&
					value.currentView !== 'coins' &&
					value.currentView !== 'card-backs' &&
					value.currentView !== 'hero-portraits'
				"
			>
				<set-stats-switcher
					*ngIf="
						value.currentView === 'sets' ||
						value.currentView === 'cards' ||
						value.currentView === 'card-details' ||
						isSetDetails(value.currentView, value.selectedSet, value.searchString)
					"
				>
				</set-stats-switcher>
				<pack-history *ngIf="value.currentView === 'packs'"> </pack-history>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	loading$: Observable<boolean>;
	currentView$: Observable<CurrentView>;
	menuDisplayType$: Observable<string>;
	searchString$: Observable<string>;
	selectedSet$: Observable<Set>;
	selectedCard$: Observable<SetCard | ReferenceCard>;
	selectedCardBack$: Observable<CardBack>;
	showAds$: Observable<boolean>;
	displayedSets$: Observable<readonly Set[]>;

	isSetDetails(currentView: CurrentView, selectedSet: Set, searchString: string): boolean {
		return currentView === 'cards' && !!selectedSet && !searchString;
	}

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly nav: CollectionNavigationService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await this.nav.isReady();

		this.loading$ = this.store
			.listen$(([main, nav, prefs]) => main.binder.isLoading)
			.pipe(this.mapData(([loading]) => loading));
		this.currentView$ = this.nav.currentView$$.pipe(this.mapData((currentView) => currentView));
		this.menuDisplayType$ = this.store
			.listen$(([main, nav, prefs]) => nav.navigationCollection.menuDisplayType)
			.pipe(this.mapData(([menuDisplayType]) => menuDisplayType));
		this.searchString$ = this.store
			.listen$(([main, nav, prefs]) => nav.navigationCollection.searchString)
			.pipe(this.mapData(([searchString]) => searchString));
		this.selectedSet$ = combineLatest([
			this.store.sets$(),
			this.store.listen$(([main, nav, prefs]) => nav.navigationCollection.selectedSetId),
		]).pipe(this.mapData(([allSets, [selectedSetId]]) => allSets.find((set) => set.id === selectedSetId)));
		this.selectedCard$ = combineLatest([
			this.store.sets$(),
			this.store.listen$(([main, nav, prefs]) => nav.navigationCollection.selectedCardId),
		]).pipe(
			this.mapData(([allSets, [selectedCardId]]) =>
				selectedCardId
					? allSets.map((set) => set.getCard(selectedCardId)).find((card) => !!card) ??
					  // This is the case when it's not a collectible card for instance
					  this.allCards.getCard(selectedCardId)
					: null,
			),
		);
		this.selectedCardBack$ = combineLatest([
			this.store.cardBacks$(),
			this.store.listen$(([main, nav, prefs]) => nav.navigationCollection.selectedCardBackId),
		]).pipe(
			this.mapData(([cardBacks, [selectedCardBackId]]) =>
				cardBacks?.find((cardBack) => cardBack.id === selectedCardBackId),
			),
		);
		this.showAds$ = this.store.showAds$().pipe(this.mapData((info) => info));

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
}
