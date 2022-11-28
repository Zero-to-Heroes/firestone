import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { filter, map, takeUntil, tap } from 'rxjs/operators';
import { MercenariesPveDifficultyFilterType } from '../../../../models/mercenaries/mercenaries-filter-types';
import { MercenariesPveDifficultyFilterSelectedEvent } from '../../../../services/mainwindow/store/events/mercenaries/mercenaries-pve-difficulty-filter-selected-event';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';

@Component({
	selector: 'mercenaries-pve-difficulty-filter-dropdown',
	styleUrls: [
		`../../../../../css/global/filters.scss`,
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/filter-dropdown.component.scss`,
	],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			class="mercenaries-pve-difficulty-filter-dropdown"
			[options]="options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesPveDifficultyFilterDropdownComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	options: FilterOption[];

	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		this.options = ['all', 'normal', 'heroic', 'legendary'].map(
			(filter) =>
				({
					value: filter,
					label: this.i18n.translateString(`mercenaries.filters.pve-difficulty.${filter}`),
				} as FilterOption),
		);
		this.filter$ = this.store
			.listen$(
				([main, nav, prefs]) => main.mercenaries.getGlobalStats(),
				([main, nav, prefs]) => prefs.mercenariesActivePveDifficultyFilter,
				([main, nav, prefs]) => prefs.mercenariesActiveModeFilter,
				([main, nav]) => nav.navigationMercenaries.selectedCategoryId,
			)
			.pipe(
				filter(([globalStats, filter, modeFilter, selectedCategoryId]) => !!filter && !!selectedCategoryId),
				this.mapData(([globalStats, filter, modeFilter, selectedCategoryId]) => ({
					filter: filter,
					placeholder: this.options.find((option) => option.value === filter)?.label,
					visible:
						modeFilter === 'pve' &&
						!!globalStats?.pve?.heroStats?.length &&
						(selectedCategoryId === 'mercenaries-hero-stats' ||
							selectedCategoryId === 'mercenaries-personal-hero-stats' ||
							selectedCategoryId === 'mercenaries-meta-hero-details' ||
							selectedCategoryId === 'mercenaries-compositions-stats' ||
							selectedCategoryId === 'mercenaries-composition-details'),
				})),
			);
	}

	onSelected(option: IOption) {
		this.store.send(new MercenariesPveDifficultyFilterSelectedEvent((option as FilterOption).value));
	}
}

interface FilterOption extends IOption {
	value: MercenariesPveDifficultyFilterType;
}
