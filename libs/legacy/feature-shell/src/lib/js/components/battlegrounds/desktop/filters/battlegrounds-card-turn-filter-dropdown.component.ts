import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { BattlegroundsNavigationService } from '@firestone/battlegrounds/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { IOption } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { arraysEqual } from '../../../../services/utils';

@Component({
	standalone: false,
	selector: 'battlegrounds-card-turn-filter-dropdown',
	styleUrls: [],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			class="battlegrounds-card-turn-filter-dropdown"
			[options]="options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsCardTurnFilterDropdownComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	options: IOption[];

	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly i18n: LocalizationFacadeService,
		private readonly prefs: PreferencesService,
		private readonly nav: BattlegroundsNavigationService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.nav, this.prefs);

		this.options = [
			// {
			// 	value: null,
			// 	label: `All turns`,
			// },
			...Array(10)
				.fill(0)
				.map((_, i) => i + 1)
				.map((turn) => ({
					value: turn.toString(),
					label: `Turn ${turn}`,
				})),
		];
		this.filter$ = combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsActiveCardsTurn)),
			this.nav.selectedCategoryId$$,
		]).pipe(
			filter(([filter, selectedCategoryId]) => !!selectedCategoryId),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			this.mapData(([filter, selectedCategoryId]) => ({
				filter: filter == null ? null : filter.toString(),
				placeholder: this.options.find(
					(option) => (option.value === null && filter == null) || +option.value === filter,
				)?.label,
				visible: ['bgs-category-meta-cards'].includes(selectedCategoryId),
			})),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	async onSelected(option: IOption) {
		this.prefs.updatePrefs('bgsActiveCardsTurn', option.value == null ? null : +option.value);
	}
}
