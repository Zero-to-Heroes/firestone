import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	ViewRef,
} from '@angular/core';
import { ALL_BG_RACES, Race } from '@firestone-hs/reference-data';
import { BattlegroundsNavigationService } from '@firestone/battlegrounds/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { BgsTribesFilterSelectedEvent } from '../../../../services/mainwindow/store/events/battlegrounds/bgs-tribes-filter-selected-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';

@Component({
	selector: 'battlegrounds-tribes-filter-dropdown',
	styleUrls: [],
	template: `
		<battlegrounds-tribes-filter-dropdown-view
			class="battlegrounds-tribes-filter-dropdown"
			[allTribes]="allTribes"
			[currentFilter]="currentFilter$ | async"
			[visible]="visible$ | async"
			[validationErrorTooltip]="validationErrorTooltip"
			(valueSelected)="onSelected($event)"
		></battlegrounds-tribes-filter-dropdown-view>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsTribesFilterDropdownComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit
{
	allTribes = ALL_BG_RACES;
	currentFilter$: Observable<readonly Race[]>;
	visible$: Observable<boolean>;

	validationErrorTooltip = this.i18n.translateString('app.battlegrounds.filters.tribe.validation-error-tooltip');

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly i18n: LocalizationFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly nav: BattlegroundsNavigationService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.nav, this.prefs);

		this.currentFilter$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsActiveTribesFilter));
		this.visible$ = combineLatest([this.nav.selectedCategoryId$$, this.nav.currentView$$]).pipe(
			filter(([categoryId, currentView]) => !!categoryId && !!currentView),
			this.mapData(
				([categoryId, currentView]) =>
					!['categories', 'category'].includes(currentView) &&
					[
						'bgs-category-personal-heroes',
						'bgs-category-meta-heroes',
						'bgs-category-personal-quests',
						'bgs-category-personal-hero-details',
						'bgs-category-personal-rating',
						'bgs-category-perfect-games',
					].includes(categoryId),
			),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(values: readonly Race[]) {
		this.stateUpdater.next(new BgsTribesFilterSelectedEvent((values ?? []).map((value) => +value as Race)));
	}
}
