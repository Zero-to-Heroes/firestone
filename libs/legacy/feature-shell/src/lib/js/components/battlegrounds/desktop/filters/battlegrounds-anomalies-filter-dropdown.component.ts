import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { BG_USE_ANOMALIES } from '@firestone/battlegrounds/common';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { IOptionWithImage } from '@firestone/shared/common/view';
import { sortByProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	selector: 'battlegrounds-anomalies-filter-dropdown',
	styleUrls: [],
	template: `
		<filter-dropdown
			class="battlegrounds-anomalies-filter-dropdown"
			[options]="options"
			[filter]="currentFilter$ | async"
			[placeholder]="'app.battlegrounds.filters.anomaly.all-anomalies' | owTranslate"
			[visible]="visible$ | async"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>

		<!-- <battlegrounds-anomalies-filter-dropdown-view
			class="battlegrounds-anomalies-filter-dropdown"
			[allAnomalies]="allAnomalies"
			[currentFilter]="currentFilter$ | async"
			[visible]="visible$ | async"
			[validationErrorTooltip]="validationErrorTooltip"
			(valueSelected)="onSelected($event)"
		></battlegrounds-anomalies-filter-dropdown-view> -->
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsAnomaliesFilterDropdownComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit
{
	// allAnomalies = this.buildAllAnomalies();
	options: IOptionWithImage[];
	currentFilter$: Observable<string>;
	visible$: Observable<boolean>;

	validationErrorTooltip = this.i18n.translateString('app.battlegrounds.filters.anomaly.validation-error-tooltip');

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly i18n: LocalizationFacadeService,
		private readonly allCards: CardsFacadeService,
		private readonly prefs: PreferencesService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.options = [
			{
				value: null,
				label: this.i18n.translateString('app.battlegrounds.filters.anomaly.all-anomalies'),
				image: null,
			},
			...this.allCards
				.getAnomalies()
				.map((anomaly) => ({
					value: anomaly.id,
					label: anomaly.name,
					image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${anomaly.id}.jpg`,
				}))
				.sort(sortByProperties((o) => [o.label])),
		];
		this.currentFilter$ = this.listenForBasicPref$((prefs) => prefs.bgsActiveAnomaliesFilter[0]);
		this.visible$ = this.store
			.listen$(
				([main, nav]) => nav.navigationBattlegrounds.selectedCategoryId,
				([main, nav]) => nav.navigationBattlegrounds.currentView,
			)
			.pipe(
				filter(([categoryId, currentView]) => !!categoryId && !!currentView),
				this.mapData(
					([categoryId, currentView]) =>
						BG_USE_ANOMALIES &&
						!['categories', 'category'].includes(currentView) &&
						![
							'bgs-category-personal-stats',
							'bgs-category-simulator',
							'bgs-category-personal-rating',
							'bgs-category-meta-quests',
							// 'bgs-category-perfect-games',
						].includes(categoryId),
				),
			);
	}

	async onSelected(value: IOption) {
		const prefs = await this.prefs.getPreferences();
		const newPrefs: Preferences = {
			...prefs,
			bgsActiveUseAnomalyFilterInHeroSelection: true,
			bgsActiveAnomaliesFilter: !value?.value ? [] : [value.value],
		};
		console.debug('[bgs-anomalies-filter-dropdown] setting new prefs', value, newPrefs);
		await this.prefs.savePreferences(newPrefs);
	}
}
