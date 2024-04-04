import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	HostListener,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { DuelsNavigationService } from '@firestone/duels/general';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { OverwolfService } from '@firestone/shared/framework/core';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';

@Component({
	selector: 'duels-hero-search',
	styleUrls: [`../../../../../css/component/duels/desktop/secondary/duels-treasure-search.component.scss`],
	template: `
		<div class="duels-treasure-search">
			<label class="search-label">
				<i class="i-30" inlineSVG="assets/svg/search.svg"> </i>
				<input
					[formControl]="searchForm"
					(mousedown)="onMouseDown($event)"
					[(ngModel)]="searchString"
					[placeholder]="'app.duels.search.hero.placeholder' | owTranslate"
				/>
			</label>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsHeroSearchComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit, OnDestroy
{
	searchString: string;
	searchForm = new FormControl();

	private searchFormSub$$: Subscription;
	private searchStringSub$$: Subscription;
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly nav: DuelsNavigationService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await this.nav.isReady();
		this.searchStringSub$$ = this.nav.heroSearchString$$
			.pipe(takeUntil(this.destroyed$))
			.subscribe((heroSearchString) => {
				this.searchString = heroSearchString;
			});

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
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
		this.nav.heroSearchString$$.next(this.searchString);
	}

	onMouseDown(event: Event) {
		event.stopPropagation();
	}
}
