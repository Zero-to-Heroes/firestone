import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { BattlegroundsNavigationService } from '@firestone/battlegrounds/common';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { BgsQuestActiveTabType } from '@legacy-import/src/lib/js/models/mainwindow/battlegrounds/bgs-rank-filter.type';
import { IOption } from 'ng-select';
import { Observable, combineLatest } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { arraysEqual } from '../../../../services/utils';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	selector: 'battlegrounds-quest-type-filter-dropdown',
	styleUrls: [],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			class="battlegrounds-quest-type-filter-dropdown"
			[options]="options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsQuestTypeFilterDropdownComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit
{
	options: QuestTypeFilterOption[];

	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly i18n: LocalizationFacadeService,
		private readonly prefs: PreferencesService,
		private readonly nav: BattlegroundsNavigationService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.nav);

		this.options = [
			{
				value: 'quests',
				label: this.i18n.translateString('app.battlegrounds.filters.quest-type.quests'),
			} as QuestTypeFilterOption,
			{
				value: 'rewards',
				label: this.i18n.translateString('app.battlegrounds.filters.quest-type.rewards'),
			} as QuestTypeFilterOption,
		];
		this.filter$ = combineLatest([
			this.store.listen$(([main, nav, prefs]) => prefs.bgsQuestsActiveTab),
			this.nav.selectedCategoryId$$,
		]).pipe(
			filter(([[filter], selectedCategoryId]) => !!filter && !!selectedCategoryId),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			this.mapData(([[filter], selectedCategoryId]) => ({
				filter: filter,
				placeholder: this.options.find((option) => option.value === filter)?.label,
				visible: selectedCategoryId === 'bgs-category-meta-quests',
			})),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	async onSelected(option: /* QuestTypeFilterOption*/ IOption) {
		const prefs = await this.prefs.getPreferences();
		const newPrefs: Preferences = {
			...prefs,
			bgsQuestsActiveTab: option.value as BgsQuestActiveTabType,
		};
		await this.prefs.savePreferences(newPrefs);
	}
}

interface QuestTypeFilterOption extends IOption {
	value: BgsQuestActiveTabType;
}
