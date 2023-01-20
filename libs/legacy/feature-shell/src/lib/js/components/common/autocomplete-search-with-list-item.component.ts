import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../abstract-subscription-store.component';

@Component({
	selector: 'autocomplete-search-with-list-item',
	styleUrls: [`../../../css/component/common/autocomplete-search-with-list-item.component.scss`],
	template: `
		<li class="search-autocomplete" *ngIf="value$ | async as value">
			<span class="no-match">{{ value.first }}</span>
			<span class="match">{{ value.match }}</span>
			<span class="no-match">{{ value.last }}</span>
		</li>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchAutocompleteItemComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	value$: Observable<Value>;

	@Input() set fullString(value: string) {
		this.fullString$$.next(value);
	}

	@Input() set searchString(value: string) {
		this.searchString$$.next(value);
	}

	private fullString$$ = new BehaviorSubject<string>(null);
	private searchString$$ = new BehaviorSubject<string>(null);

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.value$ = combineLatest(this.fullString$$.asObservable(), this.searchString$$.asObservable()).pipe(
			filter(([fullString, searchString]) => !!fullString?.length && !!searchString?.length),
			this.mapData(([fullString, searchString]) => {
				const searchIndex = fullString.toLowerCase().indexOf(searchString.toLowerCase());
				const searchEnd = searchIndex + searchString.length;
				const result: Value = {
					first: fullString.substring(0, searchIndex),
					match: fullString.substring(searchIndex, Math.min(fullString.length, searchEnd)),
					last: searchEnd < fullString.length ? fullString.substring(searchEnd) : null,
				};
				return result;
			}),
		);
	}
}

interface Value {
	first: string;
	match: string;
	last: string;
}
