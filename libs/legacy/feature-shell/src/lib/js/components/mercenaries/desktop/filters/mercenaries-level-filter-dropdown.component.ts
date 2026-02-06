import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { MainWindowNavigationService, MainWindowStateFacadeService } from '@firestone/mainwindow/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { IOption } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { combineLatest, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { MercenariesHeroLevelFilterSelectedEvent } from '../../../../services/mainwindow/store/events/mercenaries/mercenaries-hero-level-filter-selected-event';

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
		private readonly mainWindowStateFacade: MainWindowStateFacadeService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs, this.mainNavigationService);

		this.options = ['0', '1', '5', '15', '30'].map(
			(filter) =>
				({
					value: filter,
					label: this.i18n.translateString(`mercenaries.filters.hero-level.level-${filter}`),
				}) as FilterOption,
		);
		this.filter$ = combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.mercenariesActiveHeroLevelFilter2)),
			this.mainNavigationService.navigationState$$.pipe(
				this.mapData((state) => state.navigationMercenaries.selectedCategoryId),
			),
		]).pipe(
			filter(([filter, selectedCategoryId]) => !!filter && !!selectedCategoryId),
			this.mapData(([filter, selectedCategoryId]) => ({
				filter: '' + filter,
				placeholder:
					this.options.find((option) => option.value === '' + filter)?.label ?? this.options[0].label,
				visible: false,
			})),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}

	onSelected(option: FilterOption) {
		this.mainWindowStateFacade.send(new MercenariesHeroLevelFilterSelectedEvent(+option.value as any));
	}
}

interface FilterOption extends IOption {
	value: string; // actually MercenariesHeroLevelFilterType;
}
