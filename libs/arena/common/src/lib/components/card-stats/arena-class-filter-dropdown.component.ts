import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { ALL_CLASSES } from '@firestone-hs/reference-data';
import { ArenaClassFilterType, PreferencesService } from '@firestone/shared/common/service';
import { IOption } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
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
export class ArenaClassFilterDropdownComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	filter$: Observable<{ filter: string; placeholder: string; options: IOption[]; visible: boolean }>;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly i18n: ILocalizationService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await this.prefs.isReady();

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
