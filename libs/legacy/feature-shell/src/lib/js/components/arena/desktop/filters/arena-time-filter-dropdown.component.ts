import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { ArenaNavigationService } from '@firestone/arena/common';
import {
	ArenaTimeFilterType,
	PatchesConfigService,
	Preferences,
	PreferencesService,
} from '@firestone/shared/common/service';
import { IOption } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { formatPatch } from '../../../../services/utils';

@Component({
	standalone: false,
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
export class ArenaTimeFilterDropdownComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	filter$: Observable<{ filter: string; placeholder: string; options: IOption[]; visible: boolean }>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly patchesConfig: PatchesConfigService,
		private readonly prefs: PreferencesService,
		private readonly nav: ArenaNavigationService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.patchesConfig, this.prefs, this.nav);

		this.filter$ = combineLatest([
			this.patchesConfig.currentArenaMetaPatch$$,
			this.patchesConfig.currentArenaSeasonPatch$$,
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.arenaActiveTimeFilter)),
			this.nav.selectedCategoryId$$,
		]).pipe(
			filter(([patch, seasonPatch, filter, selectedCategoryId]) => !!filter && !!patch),
			this.mapData(([patch, seasonPatch, filter, selectedCategoryId]) => {
				const options: TimeFilterOption[] = [
					{
						value: 'all-time',
						label: this.i18n.translateString('app.arena.filters.time.past-100'),
						tooltip: this.i18n.translateString('app.global.filters.time.all-time-tooltip'),
					} as TimeFilterOption,
					{
						value: 'last-patch',
						label: this.i18n.translateString('app.global.filters.time-patch', {
							value: patch.version,
						}),
						tooltip: formatPatch(patch, this.i18n),
					} as TimeFilterOption,
					{
						value: 'current-season',
						label: this.i18n.translateString('app.arena.filters.time.current-season'),
						tooltip: formatPatch(seasonPatch, this.i18n),
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
			arenaActiveTimeFilter: option.value as ArenaTimeFilterType,
		};
		this.prefs.savePreferences(newPrefs);
	}
}

interface TimeFilterOption extends IOption {
	value: ArenaTimeFilterType;
}
