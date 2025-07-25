import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MercenariesNavigationService } from '@firestone/mercenaries/common';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
	standalone: false,
	selector: 'mercenaries-hero-search',
	styleUrls: [`../../../../../css/component/mercenaries/desktop/secondary/mercenaries-hero-search.component.scss`],
	template: `
		<div class="mercenaries-hero-search">
			<label class="search-label">
				<i class="i-30" inlineSVG="assets/svg/search.svg"> </i>
				<input
					[formControl]="searchForm"
					(mousedown)="onMouseDown($event)"
					[(ngModel)]="searchString"
					[placeholder]="'mercenaries.search.hero-search-placeholder' | owTranslate"
				/>
			</label>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesHeroSearchComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, OnDestroy
{
	searchString: string;
	searchForm = new FormControl();

	private searchFormSub$$: Subscription;
	private searchStringSub$$: Subscription;

	constructor(protected readonly cdr: ChangeDetectorRef, private readonly nav: MercenariesNavigationService) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await this.nav.isReady();

		this.searchStringSub$$ = this.nav.heroSearchString$$
			.pipe(this.mapData((info) => info))
			.subscribe((heroSearchString) => {
				this.searchString = heroSearchString;
			});
		this.searchFormSub$$ = this.searchForm.valueChanges
			.pipe(debounceTime(200))
			.pipe(distinctUntilChanged())
			.subscribe((data) => {
				this.onSearchStringChange();
			});

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
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
