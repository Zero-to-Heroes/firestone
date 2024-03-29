import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { ArenaNavigationService } from '@firestone/arena/common';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { PatchesConfigService } from '@legacy-import/src/lib/js/services/patches-config.service';
import { IOption } from 'ng-select';
import { Observable, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ArenaTimeFilterType } from '../../../../models/arena/arena-time-filter.type';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { formatPatch } from '../../../../services/utils';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	selector: 'arena-time-filter-dropdown',
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
export class ArenaTimeFilterDropdownComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	filter$: Observable<{ filter: string; placeholder: string; options: IOption[]; visible: boolean }>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly patchesConfig: PatchesConfigService,
		private readonly prefs: PreferencesService,
		private readonly nav: ArenaNavigationService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await this.patchesConfig.isReady();
		await this.prefs.isReady();
		await this.store.initComplete();
		await this.nav.isReady();

		this.filter$ = combineLatest([
			this.patchesConfig.currentArenaMetaPatch$$,
			this.prefs.preferences$((prefs) => prefs.arenaActiveTimeFilter),
			this.nav.selectedCategoryId$$,
		]).pipe(
			filter(([patch, [filter], selectedCategoryId]) => !!filter && !!patch),
			this.mapData(([patch, [filter], selectedCategoryId]) => {
				const options: TimeFilterOption[] = [
					{
						value: 'all-time',
						label: this.i18n.translateString('app.arena.filters.time.past-100'),
					} as TimeFilterOption,
					{
						value: 'last-patch',
						label: this.i18n.translateString('app.global.filters.time-patch', {
							value: patch.version,
						}),
						tooltip: formatPatch(patch, this.i18n),
					} as TimeFilterOption,
					{
						value: 'past-seven',
						label: this.i18n.translateString('app.arena.filters.time.past-seven'),
					} as TimeFilterOption,
					{
						value: 'past-three',
						label: this.i18n.translateString('app.arena.filters.time.past-three'),
					} as TimeFilterOption,
				];
				return {
					filter: filter,
					options: options,
					placeholder:
						options.find((option) => option.value === filter)?.label ??
						this.i18n.translateString('app.arena.filters.time.past-100'),
					visible: ['arena-runs', 'class-tier-list', 'card-stats'].includes(selectedCategoryId),
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
			arenaActiveTimeFilter: option.value as ArenaTimeFilterType,
		};
		this.prefs.savePreferences(newPrefs);
	}
}

interface TimeFilterOption extends IOption {
	value: ArenaTimeFilterType;
}
