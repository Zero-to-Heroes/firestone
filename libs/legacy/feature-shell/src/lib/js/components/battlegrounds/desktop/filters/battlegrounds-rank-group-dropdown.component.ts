import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { BattlegroundsNavigationService } from '@firestone/battlegrounds/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { IOption } from 'ng-select';
import { Observable, combineLatest } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { MmrGroupFilterType } from '../../../../models/mainwindow/battlegrounds/mmr-group-filter-type';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { arraysEqual } from '../../../../services/utils';

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
export class BattlegroundsRankGroupDropdownComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	options: MmrGroupFilterOption[];

	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly prefs: PreferencesService,
		private readonly nav: BattlegroundsNavigationService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.nav, this.prefs);

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
		this.filter$ = combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsActiveMmrGroupFilter)),
			this.nav.selectedCategoryId$$,
		]).pipe(
			filter(([filter, selectedCategoryId]) => !!filter && !!selectedCategoryId),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			this.mapData(([filter, selectedCategoryId]) => ({
				filter: filter,
				placeholder: this.options.find((option) => option.value === filter)?.label,
				visible: selectedCategoryId === 'bgs-category-personal-rating',
			})),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	onSelected(option: IOption) {
		this.prefs.updatePrefs('bgsActiveMmrGroupFilter', (option as MmrGroupFilterOption).value);
	}
}

interface MmrGroupFilterOption extends IOption {
	value: MmrGroupFilterType;
}
