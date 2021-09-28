import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { CardsFacadeService } from '@services/cards-facade.service';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { MercenariesStarterFilterType } from '../../../../models/mercenaries/mercenaries-starter-filter.type';
import { MercenariesStarterFilterSelectedEvent } from '../../../../services/mainwindow/store/events/mercenaries/mercenaries-starter-filter-selected-event';
import { OverwolfService } from '../../../../services/overwolf.service';
import { AppUiStoreService } from '../../../../services/ui-store/app-ui-store.service';

@Component({
	selector: 'mercenaries-starter-filter-dropdown',
	styleUrls: [
		`../../../../../css/global/filters.scss`,
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/filter-dropdown.component.scss`,
	],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			class="mercenaries-starter-filter-dropdown"
			[options]="options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesStarterFilterDropdownComponent {
	options: readonly StarterFilterOption[];

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
				label: 'All timings',
			} as StarterFilterOption,
			{
				value: 'starter',
				label: 'Starter',
			} as StarterFilterOption,
			{
				value: 'bench',
				label: 'Starts on bench',
			} as StarterFilterOption,
		] as readonly StarterFilterOption[];
		this.filter$ = this.store
			.listen$(
				([main, nav, prefs]) => prefs.mercenariesActiveStarterFilter,
				([main, nav]) => nav.navigationMercenaries.selectedCategoryId,
			)
			.pipe(
				filter(([filter, selectedCategoryId]) => !!filter && !!selectedCategoryId),
				map(([filter, selectedCategoryId]) => ({
					filter: filter,
					placeholder: this.options.find((option) => option.value === filter)?.label,
					visible:
						selectedCategoryId === 'mercenaries-hero-stats' ||
						selectedCategoryId === 'mercenaries-hero-details',
				})),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr?.detectChanges(), 0)),
				// tap((filter) => cdLog('emitting filter in ', this.constructor.name, filter)),
			);
	}

	onSelected(option: StarterFilterOption) {
		this.store.send(new MercenariesStarterFilterSelectedEvent(option.value));
	}
}

interface StarterFilterOption extends IOption {
	value: MercenariesStarterFilterType;
}
