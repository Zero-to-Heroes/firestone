import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { SetCard } from '@firestone/collection/common';
import { MainWindowStateFacadeService } from '@firestone/mainwindow/common';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { SetsManagerService } from '@firestone/collection/services';
import { SearchCardsEvent, ShowCardDetailsEvent } from '@firestone/mainwindow/common';

@Component({
	standalone: false,
	selector: 'card-search',
	styleUrls: [`../../../css/component/collection/card-search.component.scss`],
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

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly sets: SetsManagerService,
		private readonly mainWindowState: MainWindowStateFacadeService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.sets);

		this.cards$ = this.sets.sets$$.pipe(this.mapData((sets) => sets.flatMap((set) => set.allCards)));

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}

	onValidateSearch(searchString: string) {
		this.mainWindowState.send(new SearchCardsEvent(searchString));
	}

	showCard(result: SetCard) {
		this.mainWindowState.send(new ShowCardDetailsEvent(result.id));
	}
}
