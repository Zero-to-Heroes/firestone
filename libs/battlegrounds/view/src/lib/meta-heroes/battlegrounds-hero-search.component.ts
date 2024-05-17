import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { BattlegroundsNavigationService } from '@firestone/battlegrounds/common';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

@Component({
	selector: 'battlegrounds-hero-search',
	styleUrls: [`./battlegrounds-hero-search.component.scss`],
	template: `
		<div class="search">
			<label class="search-label">
				<i class="i-30" inlineSVG="assets/svg/search.svg"> </i>
				<input
					[formControl]="searchForm"
					(mousedown)="onMouseDown($event)"
					[(ngModel)]="searchString"
					[placeholder]="'app.duels.search.hero.placeholder' | fsTranslate"
				/>
			</label>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsHeroSearchComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit, OnDestroy
{
	searchString: string;
	searchForm = new FormControl();

	private searchFormSub$$: Subscription;
	private searchStringSub$$: Subscription;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly nav: BattlegroundsNavigationService,
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
		this.searchFormSub$$ = this.searchForm.valueChanges
			.pipe(debounceTime(200))
			.pipe(distinctUntilChanged())
			.subscribe((data) => {
				this.onSearchStringChange();
			});
	}

	@HostListener('window:beforeunload')
	override ngOnDestroy() {
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
