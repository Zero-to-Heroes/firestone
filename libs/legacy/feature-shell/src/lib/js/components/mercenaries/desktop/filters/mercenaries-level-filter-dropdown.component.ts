import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { IOption } from '@firestone/shared/common/view';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { MercenariesHeroLevelFilterSelectedEvent } from '../../../../services/mainwindow/store/events/mercenaries/mercenaries-hero-level-filter-selected-event';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	standalone: false,
	selector: 'mercenaries-hero-level-filter-dropdown',
	styleUrls: [],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			class="mercenaries-hero-level-filter-dropdown"
			[options]="options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesHeroLevelFilterDropdownComponent
	extends AbstractSubscriptionStoreComponent
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
		this.options = ['0', '1', '5', '15', '30'].map(
			(filter) =>
				({
					value: filter,
					label: this.i18n.translateString(`mercenaries.filters.hero-level.level-${filter}`),
				}) as FilterOption,
		);
		this.filter$ = this.store
			.listen$(
				([main, nav, prefs]) => prefs.mercenariesActiveHeroLevelFilter2,
				([main, nav]) => nav.navigationMercenaries.selectedCategoryId,
			)
			.pipe(
				filter(([filter, selectedCategoryId]) => !!filter && !!selectedCategoryId),
				this.mapData(([filter, selectedCategoryId]) => ({
					filter: '' + filter,
					placeholder:
						this.options.find((option) => option.value === '' + filter)?.label ?? this.options[0].label,
					visible: false,
				})),
			);
	}

	onSelected(option: FilterOption) {
		this.store.send(new MercenariesHeroLevelFilterSelectedEvent(+option.value as any));
	}
}

interface FilterOption extends IOption {
	value: string; // actually MercenariesHeroLevelFilterType;
}
