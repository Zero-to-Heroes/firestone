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
import { ArenaClassFilterType, Preferences, PreferencesService } from '@firestone/shared/common/service';
import { IOption } from '@firestone/shared/common/view';
import { BaseFilterWithUrlComponent, FilterUrlConfig } from '@firestone/shared/framework/common';
import { formatClass, ILocalizationService } from '@firestone/shared/framework/core';
import { combineLatest, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
	standalone: false,
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
export class ArenaClassFilterDropdownComponent
	extends BaseFilterWithUrlComponent<ArenaClassFilterType, Preferences>
	implements AfterContentInit
{
	filter$: Observable<{ filter: string; placeholder: string; options: IOption[]; visible: boolean }>;

	protected filterConfig: FilterUrlConfig<ArenaClassFilterType, Preferences> = {
		paramName: 'arenaActiveClassFilter',
		preferencePath: 'arenaActiveClassFilter',
		// Note: validValues not specified since ALL_CLASSES is dynamic
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
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.arenaActiveClassFilter)),
		]).pipe(
			filter(([filter]) => !!filter),
			this.mapData(([filter]) => {
				const options = ['all', ...(ALL_CLASSES as ArenaClassFilterType[])].map(
					(option) =>
						({
							value: option,
							label: formatClass(option, this.i18n),
						}) as ClassFilterOption,
				);
				return {
					filter: filter,
					options: options,
					placeholder:
						options.find((option) => option.value === filter)?.label ??
						this.i18n.translateString('app.arena.filters.hero-class.all'),
					visible: true,
				};
			}),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	async onSelected(option: IOption) {
		await this.prefs.updatePrefs('arenaActiveClassFilter', option.value as ArenaClassFilterType);
	}
}

interface ClassFilterOption extends IOption {
	value: ArenaClassFilterType;
}
