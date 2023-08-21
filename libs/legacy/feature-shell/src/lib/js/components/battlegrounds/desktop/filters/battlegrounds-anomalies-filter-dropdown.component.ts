import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter } from '@angular/core';
import { CardType } from '@firestone-hs/reference-data';
import { CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { Preferences } from '@legacy-import/src/lib/js/models/preferences';
import { PreferencesService } from '@legacy-import/src/lib/js/services/preferences.service';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	selector: 'battlegrounds-anomalies-filter-dropdown',
	styleUrls: [],
	template: `
		<battlegrounds-anomalies-filter-dropdown-view
			class="battlegrounds-anomalies-filter-dropdown"
			[allAnomalies]="allAnomalies"
			[currentFilter]="currentFilter$ | async"
			[visible]="visible$ | async"
			[validationErrorTooltip]="validationErrorTooltip"
			(valueSelected)="onSelected($event)"
		></battlegrounds-anomalies-filter-dropdown-view>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsAnomaliesFilterDropdownComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit
{
	allAnomalies = this.buildAllAnomalies();
	currentFilter$: Observable<readonly string[]>;
	visible$: Observable<boolean>;

	validationErrorTooltip = this.i18n.translateString('app.battlegrounds.filters.anomaly.validation-error-tooltip');

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

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
		this.currentFilter$ = this.listenForBasicPref$((prefs) => prefs.bgsActiveAnomaliesFilter);
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

	async onSelected(values: readonly string[]) {
		const prefs = await this.prefs.getPreferences();
		const newPrefs: Preferences = {
			...prefs,
			bgsActiveAnomaliesFilter: values,
		};
		await this.prefs.savePreferences(newPrefs);
	}

	private buildAllAnomalies(): readonly string[] {
		return this.allCards
			.getCards()
			.filter((card) => card.type?.toUpperCase() === CardType[CardType.BATTLEGROUND_ANOMALY])
			.map((card) => card.id);
	}
}
