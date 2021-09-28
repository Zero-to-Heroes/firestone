import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { CardsFacadeService } from '@services/cards-facade.service';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { MercenariesModeFilterType } from '../../../../models/mercenaries/mercenaries-mode-filter.type';
import { MercenariesModeFilterSelectedEvent } from '../../../../services/mainwindow/store/events/mercenaries/mercenaries-mode-filter-selected-event';
import { OverwolfService } from '../../../../services/overwolf.service';
import { AppUiStoreService } from '../../../../services/ui-store/app-ui-store.service';

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
export class MercenariesModeFilterDropdownComponent {
	options: readonly ModeFilterOption[];

	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly allCards: CardsFacadeService,
		private readonly store: AppUiStoreService,
		private readonly cdr: ChangeDetectorRef,
	) {
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
				([main, nav, prefs]) => prefs.mercenariesActiveModeFilter,
				([main, nav]) => nav.navigationMercenaries.selectedCategoryId,
			)
			.pipe(
				filter(([filter, selectedCategoryId]) => !!filter && !!selectedCategoryId),
				map(([filter, selectedCategoryId]) => ({
					filter: filter,
					placeholder: this.options.find((option) => option.value === filter)?.label,
					visible:
						selectedCategoryId === 'mercenaries-hero-stats' ||
						selectedCategoryId === 'mercenaries-hero-details' ||
						selectedCategoryId === 'mercenaries-compositions-stats' ||
						selectedCategoryId === 'mercenaries-composition-details',
				})),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr?.detectChanges(), 0)),
				// tap((filter) => cdLog('emitting filter in ', this.constructor.name, filter)),
			);
	}

	onSelected(option: ModeFilterOption) {
		this.store.send(new MercenariesModeFilterSelectedEvent(option.value));
	}
}

interface ModeFilterOption extends IOption {
	value: MercenariesModeFilterType;
}
