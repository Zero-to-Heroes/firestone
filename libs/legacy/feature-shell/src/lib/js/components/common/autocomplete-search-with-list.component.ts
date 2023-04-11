import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	OnDestroy,
	Output,
	ViewRef,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, takeUntil } from 'rxjs/operators';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../abstract-subscription-store.component';

@Component({
	selector: 'autocomplete-search-with-list',
	styleUrls: [`../../../css/component/common/autocomplete-search-with-list.component.scss`],
	template: `
		<div
			class="search"
			*ngIf="{ searchResults: searchResults$ | async, searchString: searchString$ | async } as value"
			(keyup)="onValidateSearch($event, value.searchString)"
		>
			<label class="search-label" [ngClass]="{ 'search-active': value.searchString }">
				<i class="i-30" [helpTooltip]="tooltip" inlineSVG="assets/svg/search.svg"> </i>
				<input
					[formControl]="searchForm"
					(keypress)="filterKeyPress($event)"
					(mousedown)="onMouseDown($event)"
					(blur)="onFocusLost()"
					[placeholder]="placeholder"
				/>
			</label>
			<ul *ngIf="showSearchResults" class="search-results">
				<autocomplete-search-with-list-item
					*ngFor="let result of value.searchResults"
					[fullString]="valueMatcher(result)"
					[searchString]="value.searchString"
					(mousedown)="clickItem(result)"
				>
				</autocomplete-search-with-list-item>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutocompleteSearchWithListComponent<T>
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit, OnDestroy
{
	@Output() itemClicked = new EventEmitter<T>();
	@Output() searchSubmitted = new EventEmitter<string>();

	@Input() valueMatcher: (element: T) => string;
	@Input() placeholder: string;
	@Input() maxResults = 20;
	@Input() tooltip: string;

	@Input() set dataSet(value: readonly T[]) {
		this.dataSet$$.next(value);
	}

	searchResults$: Observable<readonly T[]>;
	searchString$: Observable<string>;

	searchForm = new FormControl();

	private currentSearchString$$ = new BehaviorSubject<string>(null);
	private dataSet$$ = new BehaviorSubject<readonly T[]>(null);

	showSearchResults: boolean;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.searchResults$ = combineLatest(
			this.dataSet$$.asObservable(),
			this.currentSearchString$$.asObservable(),
		).pipe(
			filter(([dataSet, searchString]) => !!dataSet),
			this.mapData(
				([dataSet, searchString]) =>
					dataSet
						.filter((item) => this.valueMatcher(item)?.toLowerCase()?.includes(searchString?.toLowerCase()))
						.slice(0, this.maxResults),
				// Always reemit, so
				(a, b) => false,
			),
		);
		this.searchResults$
			.pipe(
				this.mapData(
					(info) => info,
					(a, b) => false,
				),
			)
			.subscribe((result) => {
				this.showSearchResults = !!result?.length;
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			});
		this.searchForm.valueChanges
			.pipe(debounceTime(200), distinctUntilChanged(), takeUntil(this.destroyed$))
			.subscribe((data: string) => {
				this.showSearchResults = false;
				this.currentSearchString$$.next(data);
			});
		this.searchString$ = this.currentSearchString$$.asObservable().pipe(this.mapData((info) => info));
	}

	filterKeyPress(event: KeyboardEvent) {
		if (event.altKey) {
			event.preventDefault();
		}
	}

	onValidateSearch(event: KeyboardEvent, searchString: string) {
		if (event.keyCode === 13 && searchString) {
			this.searchSubmitted.next(searchString);
			this.showSearchResults = false;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		}
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

	clickItem(item: T) {
		this.itemClicked.next(item);
		this.showSearchResults = false;
	}
}
