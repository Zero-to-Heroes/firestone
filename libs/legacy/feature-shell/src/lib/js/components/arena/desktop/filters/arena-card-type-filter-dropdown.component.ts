import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { ArenaCardTypeFilterType, Preferences, PreferencesService } from '@firestone/shared/common/service';
import { IOption } from 'ng-select';
import { Observable, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ArenaClassFilterType } from '../../../../models/arena/arena-class-filter.type';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
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
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await this.prefs.isReady();
		await this.store.initComplete();

		this.filter$ = combineLatest([
			this.store.listen$(([main, nav, prefs]) => nav.navigationArena.selectedCategoryId),
			this.prefs.preferences$((prefs) => prefs.arenaActiveCardTypeFilter),
		]).pipe(
			filter(([[selectedCategoryId], [filter]]) => !!filter),
			this.mapData(([[selectedCategoryId], [filter]]) => {
				const options = ['all', 'legendary', 'treasure'].map(
					(option) =>
						({
							value: option,
							label: this.i18n.translateString(`app.arena.filters.card-type.${option}`),
						} as ClassFilterOption),
				);
				return {
					filter: filter,
					options: options,
					placeholder:
						options.find((option) => option.value === filter)?.label ??
						this.i18n.translateString('app.arena.filters.card-type.all'),
					visible: ['card-stats'].includes(selectedCategoryId),
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
