import { CommonModule } from '@angular/common';
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ArenaModeFilterType, Preferences, PreferencesService } from '@firestone/shared/common/service';
import { IOption, SharedCommonViewModule } from '@firestone/shared/common/view';
import { BaseFilterWithUrlComponent, FilterUrlConfig } from '@firestone/shared/framework/common';
import { ILocalizationService, waitForReady } from '@firestone/shared/framework/core';
import { combineLatest, filter, Observable } from 'rxjs';

@Component({
	standalone: true,
	selector: 'web-arena-mode-filter-dropdown',
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
export class WebArenaModeFilterDropdownComponent
	extends BaseFilterWithUrlComponent<ArenaModeFilterType, Preferences>
	implements AfterContentInit
{
	filter$: Observable<{ filter: string; options: readonly FilterOption[]; placeholder: string }>;

	protected filterConfig: FilterUrlConfig<ArenaModeFilterType, Preferences> = {
		paramName: 'arenaActiveMode',
		preferencePath: 'arenaActiveMode',
		validValues: ['arena', 'arena-underground'],
	};

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		protected override readonly prefs: PreferencesService,
		protected override readonly route: ActivatedRoute,
		protected override readonly router: Router,
		private readonly i18n: ILocalizationService,
	) {
		super(cdr, prefs, route, router, new Preferences());
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs);

		// Initialize URL synchronization
		this.initializeUrlSync();

		const options: FilterOption[] = ['arena-underground', 'arena'].map(
			(value) =>
				({
					value: value,
					label: this.i18n.translateString(`app.arena.filters.mode.${value}`),
					tooltip: this.i18n.translateString(`app.arena.filters.mode.${value}-tooltip`),
				}) as FilterOption,
		);
		console.debug('[arena-mode-filter-dropdown] options', options, this.prefs, this.prefs['uniqueId']);
		this.filter$ = combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.arenaActiveMode)),
		]).pipe(
			filter(([filter]) => !!filter),
			this.mapData(([filter]) => {
				return {
					filter: filter,
					options: options,
					placeholder: options.find((option) => option.value === filter)?.label,
				};
			}),
		);

		this.cdr.detectChanges();
	}

	async onSelected(option: IOption) {
		await this.prefs.updatePrefs('arenaActiveMode', option.value as ArenaModeFilterType);
	}
}

interface FilterOption extends IOption {
	value: ArenaModeFilterType;
}
