import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
} from '@angular/core';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { MmrGroupFilterType } from '../../../../models/mainwindow/battlegrounds/mmr-group-filter-type';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { BgsMmrGroupFilterSelectedEvent } from '../../../../services/mainwindow/store/events/battlegrounds/bgs-mmr-group-filter-selected-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { arraysEqual } from '../../../../services/utils';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';

@Component({
	selector: 'battlegrounds-rank-group-dropdown',
	styleUrls: [
		`../../../../../css/global/filters.scss`,
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/filter-dropdown.component.scss`,
	],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			class="battlegrounds-rank-group-dropdown"
			[options]="options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsRankGroupDropdownComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit {
	options: readonly MmrGroupFilterOption[];

	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

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
		this.options = [
			{
				value: 'per-match',
				label: this.i18n.translateString('app.battlegrounds.filters.rank-group.per-match'),
			} as MmrGroupFilterOption,
			{
				value: 'per-day',
				label: this.i18n.translateString('app.battlegrounds.filters.rank-group.per-day'),
				tooltip: this.i18n.translateString('app.battlegrounds.filters.rank-group.per-day-tooltip'),
			} as MmrGroupFilterOption,
		] as readonly MmrGroupFilterOption[];
		this.filter$ = this.store
			.listen$(
				([main, nav, prefs]) => prefs.bgsActiveMmrGroupFilter,
				([main, nav]) => nav.navigationBattlegrounds.selectedCategoryId,
			)
			.pipe(
				filter(([filter, selectedCategoryId]) => !!filter && !!selectedCategoryId),
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
				this.mapData(([filter, selectedCategoryId]) => ({
					filter: filter,
					placeholder: this.options.find((option) => option.value === filter)?.label,
					visible: selectedCategoryId === 'bgs-category-personal-rating',
				})),
			);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: MmrGroupFilterOption) {
		this.stateUpdater.next(new BgsMmrGroupFilterSelectedEvent(option.value));
	}
}

interface MmrGroupFilterOption extends IOption {
	value: MmrGroupFilterType;
}
