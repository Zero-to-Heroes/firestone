import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ArenaCardTypeFilterType, ArenaClassFilterType, PreferencesService, Preferences } from '@firestone/shared/common/service';
import { IOption } from '@firestone/shared/common/view';
import { BaseFilterWithUrlComponent, FilterUrlConfig } from '@firestone/shared/framework/common';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';

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
export class ArenaCardTypeFilterDropdownComponent extends BaseFilterWithUrlComponent<ArenaCardTypeFilterType, Preferences> implements AfterContentInit {
	filter$: Observable<{ filter: string; placeholder: string; options: IOption[]; visible: boolean }>;

	protected filterConfig: FilterUrlConfig<ArenaCardTypeFilterType, Preferences> = {
		paramName: 'arenaActiveCardTypeFilter',
		preferencePath: 'arenaActiveCardTypeFilter',
		validValues: ['all', 'legendary', 'treasure', 'other'],
	};

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		protected override readonly route: ActivatedRoute,
		protected override readonly router: Router,
		protected override readonly prefs: PreferencesService,
		private readonly i18n: ILocalizationService,
	) {
		super(cdr, prefs, route, router, new Preferences());
	}

	async ngAfterContentInit() {
		await this.prefs.isReady();

		// Initialize URL synchronization
		this.initializeUrlSync();

		this.filter$ = combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.arenaActiveCardTypeFilter)),
		]).pipe(
			filter(([filter]) => !!filter),
			this.mapData(([filter]) => {
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
		await this.prefs.updatePrefs('arenaActiveCardTypeFilter', option.value as ArenaCardTypeFilterType);
	}
}

interface ClassFilterOption extends IOption {
	value: ArenaClassFilterType;
}
