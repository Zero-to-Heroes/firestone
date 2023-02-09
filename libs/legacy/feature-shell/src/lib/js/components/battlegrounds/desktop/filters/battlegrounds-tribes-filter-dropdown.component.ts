import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
} from '@angular/core';
import { MultiselectOption } from '@components/filter-dropdown-multiselect.component';
import { Race } from '@firestone-hs/reference-data';
import { OverwolfService } from '@firestone/shared/framework/core';
import { combineLatest, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { getTribeIcon, getTribeName } from '../../../../services/battlegrounds/bgs-utils';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { BgsTribesFilterSelectedEvent } from '../../../../services/mainwindow/store/events/battlegrounds/bgs-tribes-filter-selected-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	selector: 'battlegrounds-tribes-filter-dropdown',
	styleUrls: [
		`../../../../../css/global/filters.scss`,
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/filter-dropdown.component.scss`,
	],
	template: `
		<filter-dropdown-multiselect
			*ngIf="filter$ | async as value"
			class="battlegrounds-tribes-filter-dropdown"
			[options]="options$ | async"
			[selected]="value.selected"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			[validationErrorTooltip]="validationErrorTooltip"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown-multiselect>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsTribesFilterDropdownComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit, AfterViewInit
{
	options$: Observable<readonly MultiselectOption[]>;
	filter$: Observable<{ selected: readonly string[]; placeholder: string; visible: boolean }>;

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
		this.options$ = this.store
			.listen$(([main, nav, prefs]) => main.battlegrounds.globalStats?.allTribes)
			.pipe(
				filter(([allTribes]) => !!allTribes?.length),
				this.mapData(([allTribes]) =>
					allTribes
						.map(
							(tribe) =>
								({
									value: '' + tribe,
									label: getTribeName(tribe, this.i18n),
									image: getTribeIcon(tribe),
								} as MultiselectOption),
						)
						.sort((a, b) => (a.label < b.label ? -1 : 1)),
				),
			);
		this.filter$ = combineLatest(
			this.options$,
			this.store.listen$(
				([main, nav, prefs]) => prefs.bgsActiveTribesFilter,
				([main, nav, prefs]) => main.battlegrounds.globalStats.allTribes,
				([main, nav]) => nav.navigationBattlegrounds.selectedCategoryId,
				([main, nav]) => nav.navigationBattlegrounds.currentView,
			),
		).pipe(
			filter(
				([options, [tribesFilter, allTribes, categoryId, currentView]]) =>
					!!tribesFilter && !!allTribes?.length && !!categoryId && !!currentView,
			),
			this.mapData(([options, [tribesFilter, allTribes, categoryId, currentView]]) => ({
				selected: !!tribesFilter?.length
					? tribesFilter.map((tribe) => '' + tribe)
					: allTribes.map((tribe) => '' + tribe),
				placeholder: this.i18n.translateString('app.battlegrounds.filters.tribe.all-tribes'),
				visible:
					!['categories', 'category'].includes(currentView) &&
					!['bgs-category-personal-stats', 'bgs-category-simulator', 'bgs-category-personal-rating'].includes(
						categoryId,
					),
			})),
		);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(values: readonly string[]) {
		this.stateUpdater.next(new BgsTribesFilterSelectedEvent((values ?? []).map((value) => +value as Race)));
	}
}
