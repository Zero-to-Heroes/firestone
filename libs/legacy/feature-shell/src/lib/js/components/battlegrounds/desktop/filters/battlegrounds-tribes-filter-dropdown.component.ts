import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
} from '@angular/core';
import { Race } from '@firestone-hs/reference-data';
import { OverwolfService } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { BgsTribesFilterSelectedEvent } from '../../../../services/mainwindow/store/events/battlegrounds/bgs-tribes-filter-selected-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	selector: 'battlegrounds-tribes-filter-dropdown',
	styleUrls: [],
	template: `
		<battlegrounds-tribes-filter-dropdown-view
			class="battlegrounds-tribes-filter-dropdown"
			[allTribes]="allTribes$ | async"
			[currentFilter]="currentFilter$ | async"
			[visible]="visible$ | async"
			[validationErrorTooltip]="validationErrorTooltip"
			(valueSelected)="onSelected($event)"
		></battlegrounds-tribes-filter-dropdown-view>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsTribesFilterDropdownComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit, AfterViewInit
{
	allTribes$: Observable<readonly Race[]>;
	currentFilter$: Observable<readonly Race[]>;
	visible$: Observable<boolean>;

	validationErrorTooltip = this.i18n.translateString('app.battlegrounds.filters.tribe.validation-error-tooltip');

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly i18n: LocalizationFacadeService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.allTribes$ = this.store
			.listen$(([main, nav, prefs]) => main.battlegrounds.globalStats?.allTribes)
			.pipe(this.mapData(([allTribes]) => allTribes));
		this.currentFilter$ = this.listenForBasicPref$((prefs) => prefs.bgsActiveTribesFilter);
		this.visible$ = this.store
			.listen$(
				([main, nav]) => nav.navigationBattlegrounds.selectedCategoryId,
				([main, nav]) => nav.navigationBattlegrounds.currentView,
			)
			.pipe(
				filter(([categoryId, currentView]) => !!categoryId && !!currentView),
				this.mapData(
					([categoryId, currentView]) =>
						!['categories', 'category'].includes(currentView) &&
						![
							'bgs-category-personal-stats',
							'bgs-category-simulator',
							'bgs-category-personal-rating',
						].includes(categoryId),
				),
			);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(values: readonly Race[]) {
		this.stateUpdater.next(new BgsTribesFilterSelectedEvent((values ?? []).map((value) => +value as Race)));
	}
}
