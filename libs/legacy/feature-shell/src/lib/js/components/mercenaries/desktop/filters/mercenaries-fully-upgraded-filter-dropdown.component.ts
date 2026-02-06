import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { MainWindowNavigationService } from '@firestone/mainwindow/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { IOption } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { combineLatest, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { MercenariesFullyUpgradedFilterType } from '../../../../models/mercenaries/mercenaries-filter-types';

@Component({
	standalone: false,
	selector: 'mercenaries-fully-upgraded-filter-dropdown',
	styleUrls: [],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			class="mercenaries-fully-upgraded-filter-dropdown"
			[options]="options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesFullyUpgradedFilterDropdownComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	options: FilterOption[];

	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly prefs: PreferencesService,
		private readonly mainNavigationService: MainWindowNavigationService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs, this.mainNavigationService);

		this.options = ['all', 'upgraded', 'non-upgraded'].map(
			(filter) =>
				({
					value: filter,
					label: this.i18n.translateString(`mercenaries.filters.fully-upgraded.${filter}`),
				}) as FilterOption,
		);
		this.filter$ = combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.mercenariesActiveFullyUpgradedFilter)),
			this.mainNavigationService.navigationState$$.pipe(
				this.mapData((state) => state.navigationMercenaries.selectedCategoryId),
			),
		]).pipe(
			filter(([filter, selectedCategoryId]) => !!filter && !!selectedCategoryId),
			this.mapData(([filter, selectedCategoryId]) => ({
				filter: filter,
				placeholder: this.options.find((option) => option.value === filter)?.label,
				visible: selectedCategoryId === 'mercenaries-personal-hero-stats',
			})),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}

	onSelected(option: IOption) {
		this.prefs.updatePrefs('mercenariesActiveFullyUpgradedFilter', (option as FilterOption).value);
	}
}

interface FilterOption extends IOption {
	value: MercenariesFullyUpgradedFilterType;
}
