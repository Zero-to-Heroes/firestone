import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { OverwolfService } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { Preferences } from '../../../../models/preferences';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { GenericPreferencesUpdateEvent } from '../../../../services/mainwindow/store/events/generic-preferences-update-event';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	selector: 'constructed-my-decks-search',
	styleUrls: [
		`../../../../../css/global/filters.scss`,
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/filter-dropdown.component.scss`,
		`../../../../../css/component/decktracker/main/filters/constructed-my-decks-search.component.scss`,
	],
	template: `
		<div class="decks-search" *ngIf="showWidget$ | async">
			<label class="search-label">
				<div
					class="icon"
					inlineSVG="assets/svg/sprite.svg#search"
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
		private readonly ow: OverwolfService,
		private readonly i18n: LocalizationFacadeService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.showWidget$ = this.store
			.listen$(([main, nav]) => nav.navigationDecktracker.currentView)
			.pipe(this.mapData(([currentView]) => currentView === 'decks'));

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
	}

	onMouseDown(event: Event) {
		event.stopPropagation();
	}
}
