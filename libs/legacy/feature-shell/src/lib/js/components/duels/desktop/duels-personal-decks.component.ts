import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { normalizeDuelsHeroCardId } from '@firestone-hs/reference-data';
import { DuelsDeckSummary, getLatestTimestampForDuelsDeckSummary } from '@firestone/duels/general';
import { DuelsDeckSortFilterType } from '@firestone/duels/view';
import { PatchesConfigService } from '@firestone/shared/common/service';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { filterDuelsRuns } from '../../../services/ui-store/duels-ui-helper';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';

@Component({
	selector: 'duels-personal-decks',
	styleUrls: [
		`../../../../css/global/menu.scss`,
		`../../../../css/component/duels/desktop/duels-personal-decks.component.scss`,
	],
	template: `
		<div *ngIf="decks$ | async as decks; else emptyState" class="duels-decks">
			<duels-personal-deck-vignette
				class="item"
				*ngFor="let deck of decks; trackBy: trackByDeck"
				[deck]="deck"
			></duels-personal-deck-vignette>
		</div>
		<ng-template #emptyState>
			<duels-empty-state></duels-empty-state>
		</ng-template>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsPersonalDecksComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	decks$: Observable<readonly DuelsDeckSummary[]>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly patchesConfig: PatchesConfigService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await this.patchesConfig.isReady();

		this.decks$ = combineLatest([
			this.store.duelsDecks$(),
			this.store.listen$(
				([main, nav, prefs]) => prefs.duelsActiveTimeFilter,
				([main, nav, prefs]) => prefs.duelsActiveHeroesFilter2,
				([main, nav, prefs]) => prefs.duelsActiveGameModeFilter,
				([main, nav, prefs]) => prefs.duelsActiveDeckSortFilter,
				([main, nav, prefs]) => prefs.duelsPersonalDeckNames,
				([main, nav, prefs]) => prefs.duelsPersonalDeckHiddenDeckCodes,
				([main, nav, prefs]) => prefs.duelsPersonalDeckShowHiddenDecks,
				([main, nav, prefs]) => prefs.duelsDeckDeletes,
			),
			this.patchesConfig.currentDuelsMetaPatch$$,
		]).pipe(
			map(
				([
					decks,
					[
						timeFilter,
						heroesFilter,
						gameMode,
						deckSort,
						deckNames,
						hiddenCodes,
						showHidden,
						duelsDeckDeletes,
					],
					patch,
				]) =>
					decks
						?.filter(
							(deck) => !hiddenCodes?.length || showHidden || !hiddenCodes.includes(deck.initialDeckList),
						)
						.map((deck) => {
							return {
								...deck,
								runs: filterDuelsRuns(
									deck.runs,
									timeFilter,
									heroesFilter,
									gameMode,
									duelsDeckDeletes,
									patch,
									0,
								),
								deckName:
									deckNames[deck.initialDeckList] ??
									deck.deckName ??
									this.i18n.translateString('decktracker.deck-name.unnamed-deck'),
								hidden: hiddenCodes?.includes(deck.initialDeckList),
							} as DuelsDeckSummary;
						})
						.filter((deck) => {
							const matchesHero = !heroesFilter?.length
								? true
								: heroesFilter.some(
										(heroFilter) => normalizeDuelsHeroCardId(deck.heroCardId) === heroFilter,
								  );
							return matchesHero && (!!deck.runs?.length || deck.isPersonalDeck);
						})
						.sort(this.getSort(deckSort)),
			),
			this.mapData((decks) => (!!decks?.length ? decks : null)),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	trackByDeck(index: number, deck: DuelsDeckSummary): string {
		return deck.initialDeckList;
	}

	private getSort(deckSort: DuelsDeckSortFilterType): (a: DuelsDeckSummary, b: DuelsDeckSummary) => number {
		switch (deckSort) {
			case 'last-played':
				return (a, b) => getLatestTimestampForDuelsDeckSummary(b) - getLatestTimestampForDuelsDeckSummary(a);
			case 'winrate':
				return (a, b) => (b?.global?.averageWinsPerRun ?? 0) - (a?.global?.averageWinsPerRun ?? 0);
		}
	}
}
