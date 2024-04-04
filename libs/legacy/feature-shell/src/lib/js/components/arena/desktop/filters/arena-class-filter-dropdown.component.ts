import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { ArenaNavigationService } from '@firestone/arena/common';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { IOption } from 'ng-select';
import { Observable, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ArenaClassFilterType } from '../../../../models/arena/arena-class-filter.type';
import { classes, formatClass } from '../../../../services/hs-utils';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

/** This approach seems to be the cleanest way to properly narrow down the values needed from
 * the state. The other approaches are cool and data-driven, but as of now they seem more
 * difficult to implement with a store approach. The other filters might have to be refactored
 * to this approach
 */
@Component({
	selector: 'arena-class-filter-dropdown',
	styleUrls: [],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			[options]="value.options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaClassFilterDropdownComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	filter$: Observable<{ filter: string; placeholder: string; options: IOption[]; visible: boolean }>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly prefs: PreferencesService,
		private readonly nav: ArenaNavigationService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await this.prefs.isReady();
		await this.store.initComplete();
		await this.nav.isReady();

		this.filter$ = combineLatest([
			this.nav.selectedCategoryId$$,
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.arenaActiveClassFilter)),
		]).pipe(
			filter(([selectedCategoryId, filter]) => !!filter),
			this.mapData(([selectedCategoryId, filter]) => {
				const options = ['all', ...(classes as ArenaClassFilterType[])].map(
					(option) =>
						({
							value: option,
							label: formatClass(option, this.i18n),
						} as ClassFilterOption),
				);
				return {
					filter: filter,
					options: options,
					placeholder:
						options.find((option) => option.value === filter)?.label ??
						this.i18n.translateString('app.arena.filters.hero-class.all'),
					visible: ['arena-runs', 'card-stats', 'arena-high-wins-runs'].includes(selectedCategoryId),
				};
			}),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	async onSelected(option: IOption) {
		const prefs = await this.prefs.getPreferences();
		const newPrefs: Preferences = {
			...prefs,
			arenaActiveClassFilter: option.value as ArenaClassFilterType,
		};
		this.prefs.savePreferences(newPrefs);
	}
}

interface ClassFilterOption extends IOption {
	value: ArenaClassFilterType;
}
