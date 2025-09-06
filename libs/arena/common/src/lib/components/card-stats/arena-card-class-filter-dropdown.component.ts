import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Optional,
	ViewRef,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ALL_CLASSES } from '@firestone-hs/reference-data';
import { ArenaCardClassFilterType, Preferences, PreferencesService } from '@firestone/shared/common/service';
import { IOption } from '@firestone/shared/common/view';
import { BaseFilterWithUrlComponent, FilterUrlConfig } from '@firestone/shared/framework/common';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
	standalone: false,
	selector: 'arena-card-class-filter-dropdown',
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
export class ArenaCardClassFilterDropdownComponent
	extends BaseFilterWithUrlComponent<ArenaCardClassFilterType, Preferences>
	implements AfterContentInit
{
	filter$: Observable<{ filter: string; placeholder: string; options: IOption[]; visible: boolean }>;

	protected filterConfig: FilterUrlConfig<ArenaCardClassFilterType, Preferences> = {
		paramName: 'arenaActiveCardClassFilter',
		preferencePath: 'arenaActiveCardClassFilter',
		validValues: ['all', 'neutral', 'no-neutral'],
	};

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		@Optional() protected override readonly route: ActivatedRoute,
		@Optional() protected override readonly router: Router,
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
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.arenaActiveCardClassFilter)),
		]).pipe(
			filter(([filter]) => !!filter),
			this.mapData(([filter]) => {
				const options = ['all', 'neutral', 'no-neutral'].map(
					(option) =>
						({
							value: option,
							label: ALL_CLASSES.includes(option)
								? this.i18n.translateString(`global.class.${option?.toLowerCase()}`)
								: this.i18n.translateString(`app.arena.filters.card-class.${option}`),
						}) as ClassFilterOption,
				);
				return {
					filter: filter,
					options: options,
					placeholder:
						options.find((option) => option.value === filter)?.label ??
						this.i18n.translateString('app.arena.filters.card-class.all'),
					visible: true,
				};
			}),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	async onSelected(option: IOption) {
		await this.prefs.updatePrefs('arenaActiveCardClassFilter', option.value as ArenaCardClassFilterType);
	}
}

interface ClassFilterOption extends IOption {
	value: ArenaCardClassFilterType;
}
