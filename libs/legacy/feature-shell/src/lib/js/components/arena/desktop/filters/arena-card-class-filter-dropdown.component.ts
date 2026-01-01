import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { ArenaCardClassFilterType, PreferencesService } from '@firestone/shared/common/service';
import { IOption } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { Observable, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';
import { classes } from '../../../../services/hs-utils';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';

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
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
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
							label: classes.includes(option)
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
			this.cdr.markForCheck();
		}
	}

	async onSelected(option: IOption) {
		await this.prefs.updatePrefs('arenaActiveCardClassFilter', option.value as ArenaCardClassFilterType);
	}
}

interface ClassFilterOption extends IOption {
	value: ArenaCardClassFilterType;
}
