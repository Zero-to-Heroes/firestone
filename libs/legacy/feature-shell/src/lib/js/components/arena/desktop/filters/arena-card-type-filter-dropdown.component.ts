import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { ArenaNavigationService } from '@firestone/arena/common';
import {
	ArenaCardTypeFilterType,
	ArenaClassFilterType,
	Preferences,
	PreferencesService,
} from '@firestone/shared/common/service';
import { IOption } from '@firestone/shared/common/view';
import { Observable, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	standalone: false,
	selector: 'arena-card-type-filter-dropdown',
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
export class ArenaCardTypeFilterDropdownComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit
{
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
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.arenaActiveCardTypeFilter)),
		]).pipe(
			filter(([selectedCategoryId, filter]) => !!filter),
			this.mapData(([selectedCategoryId, filter]) => {
				const options = ['all', 'legendary', 'treasure', 'other'].map(
					(option) =>
						({
							value: option,
							label: this.i18n.translateString(`app.arena.filters.card-type.${option}`),
						}) as ClassFilterOption,
				);
				return {
					filter: filter,
					options: options,
					placeholder:
						options.find((option) => option.value === filter)?.label ??
						this.i18n.translateString('app.arena.filters.card-type.all'),
					visible: true,
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
			arenaActiveCardTypeFilter: option.value as ArenaCardTypeFilterType,
		};
		this.prefs.savePreferences(newPrefs);
	}
}

interface ClassFilterOption extends IOption {
	value: ArenaClassFilterType;
}
