import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { SetCard } from '../../models/set';
import { SearchCardsEvent } from '../../services/mainwindow/store/events/collection/search-cards-event';
import { ShowCardDetailsEvent } from '../../services/mainwindow/store/events/collection/show-card-details-event';
import { UpdateCardSearchResultsEvent } from '../../services/mainwindow/store/events/collection/update-card-search-results-event';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../abstract-subscription.component';

declare let amplitude;
@Component({
	selector: 'card-search',
	styleUrls: [`../../../css/component/collection/card-search.component.scss`, `../../../css/global/scrollbar.scss`],
	template: `
		<div
			class="card-search"
			(keyup)="onValidateSearch($event)"
			*ngIf="{ searchResults: searchResults$ | async } as value"
		>
			<label class="search-label" [ngClass]="{ 'search-active': _searchString }">
				<i class="i-30">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#search" />
					</svg>
				</i>
				<input
					[formControl]="searchForm"
					(keypress)="filterKeyPress($event)"
					(mousedown)="onMouseDown($event)"
					(blur)="onFocusLost()"
					placeholder="Search card..."
				/>
			</label>
			<ul *ngIf="showSearchResults" class="search-results">
				<card-search-autocomplete-item
					*ngFor="let result of value.searchResults; trackBy: trackById"
					[fullString]="result.name"
					[searchString]="_searchString"
					(mousedown)="showCard(result)"
				>
				</card-search-autocomplete-item>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardSearchComponent extends AbstractSubscriptionComponent implements AfterContentInit, OnDestroy {
	searchResults$: Observable<readonly SetCard[]>;

	showSearchResults: boolean;
	_searchString: string;
	searchForm = new FormControl();

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.searchResults$ = this.store
			.listen$(
				([main, nav, prefs]) => main.binder.allSets,
				([main, nav, prefs]) => nav.navigationCollection.searchResults,
			)
			.pipe(
				this.mapData(([allSets, searchResults]) =>
					searchResults?.length > 0
						? allSets
								.map((set) => set.allCards)
								.reduce((a, b) => a.concat(b), [])
								.filter((card) => searchResults.indexOf(card.id) !== -1)
						: null,
				),
			);
		this.searchResults$.subscribe((result) => (this.showSearchResults = !!result?.length));
		this.store
			.listen$(([main, nav, prefs]) => nav.navigationCollection.searchString)
			.pipe(this.mapData(([searchString]) => searchString))
			.subscribe((searchString) => {
				this.searchForm.setValue(searchString);
				this._searchString = searchString;
			});
		this.searchForm.valueChanges
			.pipe(debounceTime(200), distinctUntilChanged(), takeUntil(this.destroyed$))
			.subscribe((data) => {
				this._searchString = data;
				this.onSearchStringChange();
			});
	}

	filterKeyPress(event: KeyboardEvent) {
		if (event.altKey) {
			event.preventDefault();
		}
	}

	onSearchStringChange() {
		this.showSearchResults = false;

		if (!this._searchString || this._searchString.length < 2) {
			return;
		}
		amplitude.getInstance().logEvent('search', {
			'page': 'cards',
			'searchString': this._searchString,
		});
		this.store.send(new UpdateCardSearchResultsEvent(this._searchString));
	}

	onValidateSearch(event: KeyboardEvent) {
		if (event.keyCode === 13 && this._searchString) {
			this.store.send(new SearchCardsEvent(this._searchString));
			this.showSearchResults = false;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		}
	}

	showCard(result: SetCard) {
		this.store.send(new ShowCardDetailsEvent(result.id));
	}

	onFocusLost() {
		setTimeout(() => {
			this.showSearchResults = false;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		}, 500);
	}

	onMouseDown(event: Event) {
		event.stopPropagation();
	}

	trackById(index, card: SetCard) {
		return card.id;
	}
}
