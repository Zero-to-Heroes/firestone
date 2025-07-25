import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { BattlegroundsNavigationService } from '@firestone/battlegrounds/common';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { IOption } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { arraysEqual } from '../../../../services/utils';

@Component({
	standalone: false,
	selector: 'battlegrounds-mode-filter-dropdown',
	styleUrls: [],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			class="battlegrounds-mode-filter-dropdown"
			[options]="options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsModeFilterDropdownComponent
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
			{
				value: 'battlegrounds',
				label: this.i18n.translateString('global.game-mode.battlegrounds'),
			},
			{
				value: 'battlegrounds-duo',
				label: this.i18n.translateString('global.game-mode.battlegrounds-duo'),
			},
		];
		this.filter$ = combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsActiveGameMode)),
			this.nav.selectedCategoryId$$,
		]).pipe(
			filter(([filter, selectedCategoryId]) => !!filter && !!selectedCategoryId),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			this.mapData(([filter, selectedCategoryId]) => ({
				filter: filter,
				placeholder: this.options.find((option) => option.value === filter)?.label,
				visible: [
					'bgs-category-your-stats',
					'bgs-category-meta-heroes',
					'bgs-category-leaderboard',
					'bgs-category-personal-rating',
				].includes(selectedCategoryId),
			})),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	async onSelected(option: IOption) {
		const prefs = await this.prefs.getPreferences();
		const newPrefs: Preferences = {
			...prefs,
			bgsActiveGameMode: option.value as 'battlegrounds' | 'battlegrounds-duo',
		};
		await this.prefs.savePreferences(newPrefs);
	}
}
