import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { Observable, combineLatest } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { DuelsGroupedDecks } from '../../../models/duels/duels-grouped-decks';
import { DuelsTopDeckService } from '../../../services/duels/duels-top-decks.service';
import { PatchesConfigService } from '../../../services/patches-config.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { getDuelsMmrFilterNumber, topDeckApplyFilters } from '../../../services/ui-store/duels-ui-helper';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';

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
export class DuelsTopDecksComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit, OnDestroy {
	deckGroups$: Observable<DuelsGroupedDecks[]>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly patchesConfig: PatchesConfigService,
		private readonly duelsTopDecks: DuelsTopDeckService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await this.patchesConfig.isReady();
		await this.duelsTopDecks.isReady();

		this.deckGroups$ = combineLatest([
			this.duelsTopDecks.topDeck$$,
			this.store.duelsMetaStats$(),
			this.store.listen$(
				([main, nav]) => main.duels.decksSearchString,
				([main, nav, prefs]) => prefs.duelsActiveMmrFilter,
				([main, nav, prefs]) => prefs.duelsActiveHeroesFilter2,
				([main, nav, prefs]) => prefs.duelsActiveHeroPowerFilter2,
				([main, nav, prefs]) => prefs.duelsActiveSignatureTreasureFilter2,
				([main, nav, prefs]) => prefs.duelsActiveTimeFilter,
				([main, nav, prefs]) => prefs.duelsActiveTopDecksDustFilter,
				([main, nav, prefs]) => prefs.duelsActivePassiveTreasuresFilter,
			),
			this.patchesConfig.currentDuelsMetaPatch$$,
		]).pipe(
			tap((info) => console.debug('[duels-top-deck] info', info)),
			filter(([topDecks, duelsMetaStats, [_]]) => !!topDecks?.length && !!duelsMetaStats?.mmrPercentiles?.length),
			this.mapData(
				([
					topDecks,
					duelsMetaStats,
					[
						searchString,
						mmrFilter,
						classFilter,
						heroPowerFilter,
						sigTreasureFilter,
						timeFilter,
						dustFilter,
						passivesFilter,
					],
					patch,
				]) => {
					const trueMmrFilter = getDuelsMmrFilterNumber(duelsMetaStats.mmrPercentiles, mmrFilter);
					const result = topDecks
						.map((deck) =>
							topDeckApplyFilters(
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

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		super.ngOnDestroy();
	}

	trackByGroup(index, item: DuelsGroupedDecks) {
		return item.header;
	}
}
