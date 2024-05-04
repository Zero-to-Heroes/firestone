import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { CollectionNavigationService } from '@firestone/collection/common';
import { CollectionSetStatsTypeFilterType, PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest, debounceTime } from 'rxjs';
import { Set } from '../../models/set';
import { SetsManagerService } from '../../services/collection/sets-manager.service';

@Component({
	selector: 'set-stats-switcher',
	styleUrls: [
		`../../../css/global/forms.scss`,
		`../../../css/global/toggle.scss`,
		`../../../css/component/collection/set-stats-switcher.component.scss`,
	],
	template: `
		<ng-container [ngSwitch]="setStatsType$ | async">
			<set-stats *ngSwitchCase="'cards-stats'" [sets]="currentSets$ | async"> </set-stats>
			<card-history *ngSwitchCase="'cards-history'" [sets]="currentSets$ | async"> </card-history>
		</ng-container>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetStatsSwitcherComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	setStatsType$: Observable<CollectionSetStatsTypeFilterType>;
	currentSets$: Observable<readonly Set[]>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly nav: CollectionNavigationService,
		private readonly prefs: PreferencesService,
		private readonly setsManager: SetsManagerService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.nav, this.prefs, this.setsManager);

		this.setStatsType$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.collectionSetStatsTypeFilter));
		const activeFilter$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.collectionSelectedFormat));
		const allSets$ = this.setsManager.sets$$.pipe(
			debounceTime(1000),
			this.mapData((sets) => sets),
		);
		this.currentSets$ = combineLatest([activeFilter$, allSets$, this.nav.selectedSetId$$]).pipe(
			this.mapData(([activeFilter, allSets, selectedSetId]) => {
				if (selectedSetId) {
					return allSets.filter((set) => set.id === selectedSetId);
				}

				const sets =
					activeFilter === 'all'
						? allSets
						: activeFilter === 'standard'
						? allSets.filter((set) => set.standard)
						: activeFilter === 'twist'
						? allSets.filter((set) => set.twist)
						: allSets.filter((set) => !set.standard);
				console.debug('visible sets', sets, activeFilter);
				return sets;
			}),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
}
