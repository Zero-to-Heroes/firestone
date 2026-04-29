import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { FilterOption, MainWindowStateFacadeService } from '@firestone/mainwindow/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { IOption } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { combineLatest, Observable } from 'rxjs';

@Component({
	standalone: false,
	selector: 'achievements-completed-filter-dropdown',
	styleUrls: [],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			class="achievements-completed-filter-dropdown"
			[options]="options$ | async"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementsCompletedFilterDropdownComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	filters: readonly FilterOption[];

	options$: Observable<IOption[]>;
	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly mainWindowStateFacade: MainWindowStateFacadeService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.mainWindowStateFacade, this.prefs);

		this.options$ = this.mainWindowStateFacade.mainWindowState$$.pipe(
			this.mapData((state) =>
				state?.achievements.filters.map((option) => ({
					label: option.label,
					value: option.value,
				})),
			),
		);
		this.filter$ = combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.achievementsCompletedActiveFilter)),
			this.options$,
		]).pipe(
			this.mapData(([filter, options]) => ({
				filter: filter,
				placeholder: options.find((option) => option.value === filter)?.label,
				visible: true,
			})),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}

	onSelected(option: IOption) {
		this.prefs.updatePrefs('achievementsCompletedActiveFilter', option.value as any);
	}
}
