import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { DuelsDeckSortFilterType } from '@firestone/duels/view';
import { OverwolfService } from '@firestone/shared/framework/core';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { GenericPreferencesUpdateEvent } from '../../../../services/mainwindow/store/events/generic-preferences-update-event';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	selector: 'duels-deck-sort-dropdown',
	styleUrls: [],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			class="duels-deck-sort-dropdown"
			[options]="options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsDeckSortDropdownComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	options: DeckSortFilterOption[];

	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly i18n: LocalizationFacadeService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.options = [
			{
				value: 'last-played',
				label: this.i18n.translateString('app.duels.filters.deck-sort.last-played'),
			} as DeckSortFilterOption,
			{
				value: 'winrate',
				label: this.i18n.translateString('app.duels.filters.deck-sort.winrate'),
			} as DeckSortFilterOption,
		];
		this.filter$ = this.store
			.listen$(
				([main, nav, prefs]) => prefs.duelsActiveDeckSortFilter,
				([main, nav]) => nav.navigationDuels.selectedCategoryId,
			)
			.pipe(
				filter(([filter, selectedCategoryId]) => !!filter && !!selectedCategoryId),
				this.mapData(([filter, selectedCategoryId]) => ({
					filter: filter,
					placeholder: this.options.find((option) => option.value === filter)?.label,
					visible: ['duels-personal-decks'].includes(selectedCategoryId),
				})),
			);
	}

	onSelected(option: IOption) {
		this.store.send(
			new GenericPreferencesUpdateEvent((prefs) => ({
				...prefs,
				duelsActiveDeckSortFilter: (option as DeckSortFilterOption).value,
			})),
		);
	}
}

interface DeckSortFilterOption extends IOption {
	value: DuelsDeckSortFilterType;
}
