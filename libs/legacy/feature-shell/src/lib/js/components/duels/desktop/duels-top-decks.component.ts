import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { PatchesConfigService, PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent, deepEqual } from '@firestone/shared/framework/common';
import { Observable, combineLatest } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { DuelsGroupedDecks } from '../../../models/duels/duels-grouped-decks';
import { DuelsMetaStatsService } from '../../../services/duels/duels-meta-stats.service';
import { DuelsTopDeckService } from '../../../services/duels/duels-top-decks.service';
import { MainWindowStateFacadeService } from '../../../services/mainwindow/store/main-window-state-facade.service';
import { getDuelsMmrFilterNumber, topDeckGroupApplyFilters } from '../../../services/ui-store/duels-ui-helper';

@Component({
	selector: 'duels-top-decks',
	styleUrls: [`../../../../css/component/duels/desktop/duels-top-decks.component.scss`],
	template: `
		<ng-container
			*ngIf="{
				deckGroups: deckGroups$ | async
			} as value"
		>
			<div class="duels-runs-container">
				<with-loading [isLoading]="value.deckGroups == null">
					<virtual-scroller
						#scroll
						*ngIf="value.deckGroups?.length"
						class="runs-list"
						[items]="value.deckGroups"
						[bufferAmount]="6"
						[attr.aria-label]="'Duels recent top decks'"
						role="list"
						scrollable
					>
						<duels-grouped-top-decks
							*ngFor="let stat of scroll.viewPortItems; trackBy: trackByGroup"
							[groupedDecks]="stat"
						></duels-grouped-top-decks>
					</virtual-scroller>
					<duels-empty-state *ngIf="!value.deckGroups?.length"></duels-empty-state>
				</with-loading>
			</div>
		</ng-container>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsTopDecksComponent extends AbstractSubscriptionComponent implements AfterContentInit, OnDestroy {
	deckGroups$: Observable<DuelsGroupedDecks[]>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly patchesConfig: PatchesConfigService,
		private readonly duelsTopDecks: DuelsTopDeckService,
		private readonly prefs: PreferencesService,
		private readonly mainWindowState: MainWindowStateFacadeService,
		private readonly duelsMetaStats: DuelsMetaStatsService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await Promise.all([
			this.patchesConfig.isReady(),
			this.duelsTopDecks.isReady(),
			this.prefs.isReady(),
			this.mainWindowState.isReady(),
			this.duelsMetaStats.isReady(),
		]);

		this.deckGroups$ = combineLatest([
			this.duelsTopDecks.topDeck$$,
			this.duelsMetaStats.duelsMetaStats$$,
			this.mainWindowState.mainWindowState$$.pipe(this.mapData((state) => state.duels.decksSearchString)),
			this.prefs.preferences$$.pipe(
				this.mapData(
					(prefs) => ({
						mmrFilter: prefs.duelsActiveMmrFilter,
						classFilter: prefs.duelsActiveHeroesFilter2,
						heroPowerFilter: prefs.duelsActiveHeroPowerFilter2,
						sigTreasureFilter: prefs.duelsActiveSignatureTreasureFilter2,
						timeFilter: prefs.duelsActiveTimeFilter,
						dustFilter: prefs.duelsActiveTopDecksDustFilter,
						passivesFilter: prefs.duelsActivePassiveTreasuresFilter,
					}),
					(a, b) => deepEqual(a, b),
				),
			),
			this.patchesConfig.currentDuelsMetaPatch$$,
		]).pipe(
			tap((info) => console.debug('[duels-top-deck] info', info)),
			filter(([topDecks, duelsMetaStats]) => !!topDecks?.length && !!duelsMetaStats?.mmrPercentiles?.length),
			this.mapData(
				([
					topDecks,
					duelsMetaStats,
					searchString,
					{
						mmrFilter,
						classFilter,
						heroPowerFilter,
						sigTreasureFilter,
						timeFilter,
						dustFilter,
						passivesFilter,
					},
					patch,
				]) => {
					const trueMmrFilter = getDuelsMmrFilterNumber(duelsMetaStats.mmrPercentiles, mmrFilter);
					const result = topDecks
						.map((deck) =>
							topDeckGroupApplyFilters(
								deck,
								trueMmrFilter,
								classFilter,
								heroPowerFilter,
								sigTreasureFilter,
								timeFilter,
								dustFilter,
								passivesFilter,
								patch,
								searchString,
							),
						)
						.filter((group) => group.decks.length > 0);
					return result;
				},
			),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	trackByGroup(index, item: DuelsGroupedDecks) {
		return item.header;
	}
}
