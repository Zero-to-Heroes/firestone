import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Preferences } from '@legacy-import/src/lib/js/models/preferences';
import { PreferencesService } from '@legacy-import/src/lib/js/services/preferences.service';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { MmrGroupFilterType } from '../../../../models/mainwindow/battlegrounds/mmr-group-filter-type';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { arraysEqual } from '../../../../services/utils';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	selector: 'battlegrounds-rank-group-dropdown',
	styleUrls: [],
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
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit
{
	options: MmrGroupFilterOption[];

	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly prefs: PreferencesService,
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
		];
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

	async onSelected(option: IOption) {
		const prefs = await this.prefs.getPreferences();
		const newPrefs: Preferences = {
			...prefs,
			bgsActiveMmrGroupFilter: (option as MmrGroupFilterOption).value,
		};
		const updated = await this.prefs.savePreferences(newPrefs);
		console.debug('updated prefs', updated);
	}
}

interface MmrGroupFilterOption extends IOption {
	value: MmrGroupFilterType;
}
