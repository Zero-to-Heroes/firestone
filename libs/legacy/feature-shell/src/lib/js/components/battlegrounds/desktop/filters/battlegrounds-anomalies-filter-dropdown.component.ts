import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { Preferences } from '@legacy-import/src/lib/js/models/preferences';
import { PreferencesService } from '@legacy-import/src/lib/js/services/preferences.service';
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
	options: IOption[];
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
			},
			...this.allCards.getAnomalies().map((anomaly) => ({
				value: anomaly.id,
				label: anomaly.name,
				icon: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${anomaly.id}.jpg`,
			})),
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
						!['categories', 'category'].includes(currentView) &&
						![
							'bgs-category-personal-stats',
							'bgs-category-simulator',
							'bgs-category-personal-rating',
							'bgs-category-meta-quests',
						].includes(categoryId),
				),
			);
	}

	async onSelected(value: IOption) {
		const prefs = await this.prefs.getPreferences();
		const newPrefs: Preferences = {
			...prefs,
			bgsActiveAnomaliesFilter: !value?.value ? [] : [value.value],
		};
		await this.prefs.savePreferences(newPrefs);
	}
}
