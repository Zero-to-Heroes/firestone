import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ConstructedNavigationService } from '@firestone/constructed/common';
import { Preferences } from '@firestone/shared/common/service';
import { waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { GenericPreferencesUpdateEvent } from '../../../../services/mainwindow/store/events/generic-preferences-update-event';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
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
export class ConstructedMyDecksSearchComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	showWidget$: Observable<boolean>;

	searchForm = new FormControl();

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly nav: ConstructedNavigationService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.nav);

		this.showWidget$ = this.nav.currentView$$.pipe(this.mapData((currentView) => currentView === 'decks'));

		this.searchForm.valueChanges
			.pipe(
				startWith(null),
				this.mapData((data: string) => data?.toLowerCase(), null, 50),
			)
			.subscribe((search) =>
				this.store.send(
					new GenericPreferencesUpdateEvent((prefs: Preferences) => ({
						...prefs,
						constructedDecksSearchString: search,
					})),
				),
			);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	onMouseDown(event: Event) {
		event.stopPropagation();
	}
}
