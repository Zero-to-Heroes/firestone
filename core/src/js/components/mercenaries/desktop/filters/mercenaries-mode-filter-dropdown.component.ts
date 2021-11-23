import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { filter, map, takeUntil, tap } from 'rxjs/operators';
import { MercenariesModeFilterType } from '../../../../models/mercenaries/mercenaries-filter-types';
import { MercenariesModeFilterSelectedEvent } from '../../../../services/mainwindow/store/events/mercenaries/mercenaries-mode-filter-selected-event';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';

@Component({
	selector: 'mercenaries-mode-filter-dropdown',
	styleUrls: [
		`../../../../../css/global/filters.scss`,
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/filter-dropdown.component.scss`,
	],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			class="mercenaries-mode-filter-dropdown"
			[options]="options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesModeFilterDropdownComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	options: readonly ModeFilterOption[];

	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		this.options = [
			{
				value: 'pve',
				label: 'PvE',
			} as ModeFilterOption,
			{
				value: 'pvp',
				label: 'PvP',
			} as ModeFilterOption,
		] as readonly ModeFilterOption[];
		this.filter$ = this.store
			.listen$(
				([main, nav, prefs]) => main.mercenaries.globalStats,
				([main, nav, prefs]) => prefs.mercenariesActiveModeFilter,
				([main, nav]) => nav.navigationMercenaries.selectedCategoryId,
			)
			.pipe(
				filter(([globalStats, filter, selectedCategoryId]) => !!filter && !!selectedCategoryId),
				map(([globalStats, filter, selectedCategoryId]) => ({
					filter: filter,
					placeholder: this.options.find((option) => option.value === filter)?.label,
					visible:
						!!globalStats?.pve?.heroStats?.length &&
						(selectedCategoryId === 'mercenaries-hero-stats' ||
							selectedCategoryId === 'mercenaries-personal-hero-stats' ||
							selectedCategoryId === 'mercenaries-hero-details' ||
							selectedCategoryId === 'mercenaries-compositions-stats' ||
							selectedCategoryId === 'mercenaries-composition-details'),
				})),
				// FIXME
				tap((filter) =>
					setTimeout(() => {
						if (!(this.cdr as ViewRef)?.destroyed) {
							this.cdr.detectChanges();
						}
					}, 0),
				),
				// tap((filter) => cdLog('emitting filter in ', this.constructor.name, filter)),
				takeUntil(this.destroyed$),
			);
	}

	onSelected(option: ModeFilterOption) {
		this.store.send(new MercenariesModeFilterSelectedEvent(option.value));
	}
}

interface ModeFilterOption extends IOption {
	value: MercenariesModeFilterType;
}
