import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { filter, map, takeUntil, tap } from 'rxjs/operators';
import { MercenariesPveDifficultyFilterType } from '../../../../models/mercenaries/mercenaries-pve-difficulty-filter.type';
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
export class MercenariesPveDifficultyFilterDropdownComponent extends AbstractSubscriptionComponent {
	options: readonly FilterOption[];

	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	constructor(private readonly store: AppUiStoreFacadeService, private readonly cdr: ChangeDetectorRef) {
		super();
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
				takeUntil(this.destroyed$),
				filter(([globalStats, filter, modeFilter, selectedCategoryId]) => !!filter && !!selectedCategoryId),
				map(([globalStats, filter, modeFilter, selectedCategoryId]) => ({
					filter: filter,
					placeholder: this.options.find((option) => option.value === filter)?.label,
					visible:
						modeFilter === 'pve' &&
						!!globalStats?.pve?.heroStats?.length &&
						(selectedCategoryId === 'mercenaries-hero-stats' ||
							selectedCategoryId === 'mercenaries-personal-hero-stats' ||
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
