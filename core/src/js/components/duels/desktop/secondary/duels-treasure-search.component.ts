import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	HostListener,
	OnDestroy,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil, tap } from 'rxjs/operators';
import { DuelsTreasureSearchEvent } from '../../../../services/mainwindow/store/events/duels/duels-treasure-search-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../../../services/ui-store/app-ui-store.service';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';

@Component({
	selector: 'duels-treasure-search',
	styleUrls: [`../../../../../css/component/duels/desktop/secondary/duels-treasure-search.component.scss`],
	template: `
		<div class="duels-treasure-search">
			<label class="search-label">
				<i class="i-30">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#search" />
					</svg>
				</i>
				<input
					[formControl]="searchForm"
					(mousedown)="onMouseDown($event)"
					[(ngModel)]="searchString"
					[placeholder]="'app.duels.search.treasure.placeholder' | owTranslate"
				/>
			</label>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsTreasureSearchComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit, OnDestroy {
	searchString: string;
	searchForm = new FormControl();

	private searchFormSub$$: Subscription;
	private searchStringSub$$: Subscription;
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.searchStringSub$$ = this.store
			.listen$(([main, nav]) => nav.navigationDuels.treasureSearchString)
			.pipe(
				tap((stat) => cdLog('emitting in ', this.constructor.name, stat)),
				takeUntil(this.destroyed$),
			)
			.subscribe(([searchString]) => {
				// TODO: force change detectiopn here?
				this.searchString = searchString;
			});
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		this.searchFormSub$$ = this.searchForm.valueChanges
			.pipe(debounceTime(200))
			.pipe(distinctUntilChanged())
			.subscribe((data) => {
				this.onSearchStringChange();
			});
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		super.ngOnDestroy();
		this.searchFormSub$$?.unsubscribe();
		this.searchStringSub$$?.unsubscribe();
	}

	onSearchStringChange() {
		this.stateUpdater.next(new DuelsTreasureSearchEvent(this.searchString));
	}

	onMouseDown(event: Event) {
		event.stopPropagation();
	}
}
