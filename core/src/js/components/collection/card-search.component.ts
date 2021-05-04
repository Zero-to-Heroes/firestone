import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	HostListener,
	Input,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { SetCard } from '../../models/set';
import { Events } from '../../services/events.service';
import { SearchCardsEvent } from '../../services/mainwindow/store/events/collection/search-cards-event';
import { ShowCardDetailsEvent } from '../../services/mainwindow/store/events/collection/show-card-details-event';
import { UpdateCardSearchResultsEvent } from '../../services/mainwindow/store/events/collection/update-card-search-results-event';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../services/overwolf.service';

declare let amplitude;
@Component({
	selector: 'card-search',
	styleUrls: [`../../../css/component/collection/card-search.component.scss`, `../../../css/global/scrollbar.scss`],
	template: `
		<div class="card-search" (keyup)="onValidateSearch($event)">
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
					*ngFor="let result of _searchResults; trackBy: trackById"
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
export class CardSearchComponent implements AfterViewInit, OnDestroy {
	_searchResults: readonly SetCard[];
	_searchString: string;

	searchForm = new FormControl();

	showSearchResults = false;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;
	private subscription: Subscription;

	constructor(private events: Events, private ow: OverwolfService, private cdr: ChangeDetectorRef) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		this.subscription = this.searchForm.valueChanges
			.pipe(debounceTime(200))
			.pipe(distinctUntilChanged())
			.subscribe((data) => {
				// console.log('value changed?', data);
				this._searchString = data;
				this.onSearchStringChange();
			});
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		this.subscription?.unsubscribe();
	}

	@Input('searchString') set searchString(searchString: string) {
		this.searchForm.setValue(searchString);
		this._searchString = searchString;
		// console.log('set searchstring', this._searchString);
	}

	@Input('searchResults') set searchResults(searchResults: readonly SetCard[]) {
		this._searchResults = searchResults;
		this.showSearchResults = searchResults && searchResults.length > 0;
		// console.log('set searchResults', this._searchResults);
	}

	filterKeyPress(event: KeyboardEvent) {
		if (event.altKey) {
			event.preventDefault();
		}
	}

	onSearchStringChange() {
		this.showSearchResults = false;
		// console.log('searchstring changed', this._searchString);
		if (!this._searchString || this._searchString.length < 2) {
			return;
		}
		amplitude.getInstance().logEvent('search', {
			'page': 'cards',
			'searchString': this._searchString,
		});
		this.stateUpdater.next(new UpdateCardSearchResultsEvent(this._searchString));
	}

	onValidateSearch(event: KeyboardEvent) {
		if (event.keyCode === 13 && this._searchString) {
			// console.log('validating search', this.searchResults, this._searchString);
			this.stateUpdater.next(new SearchCardsEvent(this._searchString));
			this.showSearchResults = false;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		}
	}

	showCard(result: SetCard) {
		this.stateUpdater.next(new ShowCardDetailsEvent(result.id));
	}

	onFocusLost() {
		setTimeout(() => {
			console.log('focus lost');
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
