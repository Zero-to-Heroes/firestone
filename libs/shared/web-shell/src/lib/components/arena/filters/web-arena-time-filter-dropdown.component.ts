import { CommonModule } from '@angular/common';
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
	ArenaTimeFilterType,
	formatPatch,
	PatchesConfigService,
	Preferences,
	PreferencesService,
} from '@firestone/shared/common/service';
import { IOption, SharedCommonViewModule } from '@firestone/shared/common/view';
import { BaseFilterWithUrlComponent, FilterUrlConfig } from '@firestone/shared/framework/common';
import { ILocalizationService, waitForReady } from '@firestone/shared/framework/core';
import { combineLatest, filter, Observable } from 'rxjs';

@Component({
	standalone: true,
	selector: 'web-arena-time-filter-dropdown',
	styleUrls: [],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			class="arena-mode-filter-dropdown"
			[options]="value.options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="true"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	imports: [CommonModule, SharedCommonViewModule],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebArenaTimeFilterDropdownComponent
	extends BaseFilterWithUrlComponent<ArenaTimeFilterType, Preferences>
	implements AfterContentInit
{
	filter$: Observable<{ filter: string; options: readonly IOption[]; placeholder: string }>;

	protected filterConfig: FilterUrlConfig<ArenaTimeFilterType, Preferences> = {
		paramName: 'arenaActiveTimeFilter',
		preferencePath: 'arenaActiveTimeFilter',
		validValues: ['last-patch', 'current-season', 'past-seven', 'past-three'],
	};

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		protected override readonly prefs: PreferencesService,
		protected override readonly route: ActivatedRoute,
		protected override readonly router: Router,
		private readonly i18n: ILocalizationService,
		private readonly patchesConfig: PatchesConfigService,
	) {
		super(cdr, prefs, route, router, new Preferences());
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs);

		// Initialize URL synchronization
		this.initializeUrlSync();

		this.filter$ = combineLatest([
			this.patchesConfig.currentArenaMetaPatch$$,
			this.patchesConfig.currentArenaSeasonPatch$$,
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.arenaActiveTimeFilter)),
		]).pipe(
			filter(([patch, seasonPatch, filter]) => !!filter && !!patch),
			this.mapData(([patch, seasonPatch, filter]) => {
				const options: TimeFilterOption[] = [
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

		this.cdr.detectChanges();
	}

	async onSelected(option: IOption) {
		await this.prefs.updatePrefs('arenaActiveTimeFilter', option.value as ArenaTimeFilterType);
	}
}

interface TimeFilterOption extends IOption {
	value: ArenaTimeFilterType;
}
