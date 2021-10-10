import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { CardsFacadeService } from '@services/cards-facade.service';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { MercenariesPveDifficultyFilterType } from '../../../../models/mercenaries/mercenaries-pve-difficulty-filter.type';
import { MercenariesPveDifficultyFilterSelectedEvent } from '../../../../services/mainwindow/store/events/mercenaries/mercenaries-pve-difficulty-filter-selected-event';
import { OverwolfService } from '../../../../services/overwolf.service';
import { AppUiStoreService } from '../../../../services/ui-store/app-ui-store.service';

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
export class MercenariesPveDifficultyFilterDropdownComponent {
	options: readonly FilterOption[];

	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly allCards: CardsFacadeService,
		private readonly store: AppUiStoreService,
		private readonly cdr: ChangeDetectorRef,
	) {
		this.options = [
			{
				value: 'all',
				label: 'All',
			} as FilterOption,
			{
				value: 'normal',
				label: 'Normal',
			} as FilterOption,
			{
				value: 'heroic',
				label: 'Heroic',
			} as FilterOption,
			{
				value: 'legendary',
				label: 'Legendary',
			} as FilterOption,
		] as readonly FilterOption[];
		this.filter$ = this.store
			.listen$(
				([main, nav, prefs]) => main.mercenaries.globalStats,
				([main, nav, prefs]) => prefs.mercenariesActivePveDifficultyFilter,
				([main, nav, prefs]) => prefs.mercenariesActiveModeFilter,
				([main, nav]) => nav.navigationMercenaries.selectedCategoryId,
			)
			.pipe(
				filter(([globalStats, filter, modeFilter, selectedCategoryId]) => !!filter && !!selectedCategoryId),
				map(([globalStats, filter, modeFilter, selectedCategoryId]) => ({
					filter: filter,
					placeholder: this.options.find((option) => option.value === filter)?.label,
					visible:
						modeFilter === 'pve' &&
						!!globalStats?.pve?.heroStats?.length &&
						(selectedCategoryId === 'mercenaries-hero-stats' ||
							selectedCategoryId === 'mercenaries-hero-details' ||
							selectedCategoryId === 'mercenaries-compositions-stats' ||
							selectedCategoryId === 'mercenaries-composition-details'),
				})),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr?.detectChanges(), 0)),
				// tap((filter) => cdLog('emitting filter in ', this.constructor.name, filter)),
			);
	}

	onSelected(option: FilterOption) {
		this.store.send(new MercenariesPveDifficultyFilterSelectedEvent(option.value));
	}
}

interface FilterOption extends IOption {
	value: MercenariesPveDifficultyFilterType;
}
