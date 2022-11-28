import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { filter, map, takeUntil, tap } from 'rxjs/operators';
import {
	MercenariesFullyUpgradedFilterType,
	MercenariesOwnedFilterType,
} from '../../../../models/mercenaries/mercenaries-filter-types';
import { Preferences } from '../../../../models/preferences';
import { GenericPreferencesUpdateEvent } from '../../../../services/mainwindow/store/events/generic-preferences-update-event';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';

@Component({
	selector: 'mercenaries-owned-filter-dropdown',
	styleUrls: [
		`../../../../../css/global/filters.scss`,
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/filter-dropdown.component.scss`,
	],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			class="mercenaries-owned-filter-dropdown"
			[options]="options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesOwnedFilterDropdownComponent extends AbstractSubscriptionComponent implements AfterContentInit {
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
		this.options = ['all', 'owned', 'non-owned'].map(
			(filter) =>
				({
					value: filter,
					label: this.i18n.translateString(`mercenaries.filters.owned.${filter}`),
				} as FilterOption),
		);
		this.filter$ = this.store
			.listen$(
				([main, nav, prefs]) => prefs.mercenariesActiveOwnedFilter,
				([main, nav]) => nav.navigationMercenaries.selectedCategoryId,
			)
			.pipe(
				filter(([filter, selectedCategoryId]) => !!filter && !!selectedCategoryId),
				this.mapData(([filter, selectedCategoryId]) => ({
					filter: filter,
					placeholder: this.options.find((option) => option.value === filter)?.label,
					visible: selectedCategoryId === 'mercenaries-personal-hero-stats',
				})),
			);
	}

	onSelected(option: IOption) {
		this.store.send(
			new GenericPreferencesUpdateEvent((prefs: Preferences) => ({
				...prefs,
				mercenariesActiveOwnedFilter: (option as FilterOption).value,
			})),
		);
	}
}

interface FilterOption extends IOption {
	value: MercenariesOwnedFilterType;
}
