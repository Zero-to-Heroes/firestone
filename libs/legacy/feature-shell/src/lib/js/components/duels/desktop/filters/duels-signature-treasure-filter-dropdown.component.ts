import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { CardIds, duelsHeroConfigs } from '@firestone-hs/reference-data';
import { DuelsStatTypeFilterType } from '@firestone/duels/data-access';
import { PreferencesService } from '@firestone/shared/common/service';
import { waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { DuelsSignatureTreasureFilterSelectedEvent } from '../../../../services/mainwindow/store/events/duels/duels-signature-treasure-filter-selected-event';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	selector: 'duels-signature-treasure-filter-dropdown',
	styleUrls: [],
	template: `
		<duels-main-filter-multiselect-dropdown-view
			class="duels-hero-filter-dropdown"
			[allValuesLabel]="allValuesLabel"
			[referenceCards]="referenceCards"
			[selectedHeroes]="selectedHeroes$ | async"
			[extractor]="extractor"
			[currentFilter]="currentFilter$ | async"
			[visible]="visible$ | async"
			(optionSelected)="onSelected($event)"
		></duels-main-filter-multiselect-dropdown-view>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsSignatureTreasureFilterDropdownComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit
{
	currentFilter$: Observable<readonly string[]>;
	visible$: Observable<boolean>;
	selectedHeroes$: Observable<readonly string[]>;

	allValuesLabel = this.i18n.translateString('app.duels.filters.signature-treasure.all') as string;
	referenceCards = duelsHeroConfigs.flatMap((conf) => conf.signatureTreasures);
	extractor: (conf: typeof duelsHeroConfigs[0]) => readonly CardIds[] = (conf) => conf.signatureTreasures;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly prefs: PreferencesService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs);

		this.currentFilter$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.duelsActiveSignatureTreasureFilter2),
		);
		this.selectedHeroes$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.duelsActiveHeroesFilter2));
		this.visible$ = combineLatest([
			this.store.listen$(([main, nav]) => nav.navigationDuels.selectedCategoryId),
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.duelsActiveStatTypeFilter)),
		]).pipe(
			this.mapData(([[selectedCategoryId], statTypeFilter]) =>
				isSignatureTreasureVisible(selectedCategoryId, statTypeFilter),
			),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	onSelected(options: readonly string[]) {
		this.store.send(new DuelsSignatureTreasureFilterSelectedEvent(options));
	}
}

export const isSignatureTreasureVisible = (
	selectedCategoryId: string,
	statTypeFilter: DuelsStatTypeFilterType,
): boolean => {
	if (!['duels-stats', 'duels-treasures', 'duels-top-decks'].includes(selectedCategoryId)) {
		return false;
	}
	if (selectedCategoryId === 'duels-stats' && statTypeFilter !== 'hero-power') {
		return false;
	}
	return true;
};
