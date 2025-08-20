import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { ALL_CLASSES } from '@firestone-hs/reference-data';
import { ArenaCardClassFilterType, PreferencesService } from '@firestone/shared/common/service';
import { IOption } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
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
export class ArenaCardClassFilterDropdownComponent extends AbstractSubscriptionComponent implements AfterContentInit {
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
