import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import { SetCard } from '../../models/set';
import { SearchCardsEvent } from '../../services/mainwindow/store/events/collection/search-cards-event';
import { ShowCardDetailsEvent } from '../../services/mainwindow/store/events/collection/show-card-details-event';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../abstract-subscription.component';

declare let amplitude;
@Component({
	selector: 'card-search',
	styleUrls: [`../../../css/component/collection/card-search.component.scss`, `../../../css/global/scrollbar.scss`],
	template: `
		<autocomplete-search-with-list
			class="card-search"
			(searchSubmitted)="onValidateSearch($event)"
			(itemClicked)="showCard($event)"
			[valueMatcher]="valueMatcher"
			[placeholder]="'app.collection.card-search.search-box-placeholder' | owTranslate"
			[dataSet]="cards$ | async"
			[tooltip]="'app.collection.card-search.search-box-tooltip' | owTranslate"
		></autocomplete-search-with-list>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardSearchComponent extends AbstractSubscriptionComponent implements AfterContentInit, OnDestroy {
	cards$: Observable<readonly SetCard[]>;

	valueMatcher: (element: SetCard) => string = (card) => card.name;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.cards$ = this.store
			.listen$(([main, nav, prefs]) => main.binder.allSets)
			.pipe(this.mapData(([sets]) => sets.flatMap((set) => set.allCards)));
	}

	onValidateSearch(searchString: string) {
		this.store.send(new SearchCardsEvent(searchString));
	}

	showCard(result: SetCard) {
		this.store.send(new ShowCardDetailsEvent(result.id));
	}
}
