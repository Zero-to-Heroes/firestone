import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ConstructedNavigationService } from '@firestone/constructed/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { startWith } from 'rxjs/operators';

@Component({
	standalone: false,
	selector: 'constructed-my-decks-search',
	styleUrls: [`../../../../../css/component/decktracker/main/filters/constructed-my-decks-search.component.scss`],
	template: `
		<div class="decks-search" *ngIf="showWidget$ | async">
			<label class="search-label">
				<div
					class="icon"
					inlineSVG="assets/svg/search.svg"
					[helpTooltip]="'app.decktracker.filters.deck-search.tooltip' | owTranslate"
				></div>
				<input
					[formControl]="searchForm"
					(mousedown)="onMouseDown($event)"
					[placeholder]="'app.decktracker.filters.deck-search.placeholder' | owTranslate"
				/>
			</label>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedMyDecksSearchComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	showWidget$: Observable<boolean>;

	searchForm = new FormControl();

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly nav: ConstructedNavigationService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.nav, this.prefs);

		this.showWidget$ = this.nav.currentView$$.pipe(this.mapData((currentView) => currentView === 'decks'));

		this.searchForm.valueChanges
			.pipe(
				startWith(null),
				this.mapData((data: string) => data?.toLowerCase(), null, 50),
			)
			.subscribe((search) => this.prefs.updatePrefs('constructedDecksSearchString', search));

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.markForCheck();
		}
	}

	onMouseDown(event: Event) {
		event.stopPropagation();
	}
}
