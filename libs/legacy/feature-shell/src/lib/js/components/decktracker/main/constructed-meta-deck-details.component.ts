import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { AbstractSubscriptionStoreComponent } from '@components/abstract-subscription-store.component';
import { Observable, combineLatest } from 'rxjs';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { ConstructedDeckDetails } from './constructed-meta-deck-details-view.component';

@Component({
	selector: 'constructed-meta-deck-details',
	styleUrls: [`../../../../css/component/decktracker/main/constructed-meta-deck-details.component.scss`],
	template: `
		<constructed-meta-deck-details-view [input]="deckDetails$ | async"> </constructed-meta-deck-details-view>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedMetaDeckDetailsComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit
{
	deckDetails$: Observable<ConstructedDeckDetails>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		this.deckDetails$ = combineLatest([
			this.store.constructedMetaDecks$(),
			this.store.listen$(([main, nav]) => nav.navigationDecktracker.selectedConstructedMetaDeck),
			this.store.listenPrefs$((prefs) => prefs.constructedMetaDecksUseConservativeWinrate),
		]).pipe(
			this.mapData(([stats, [currentConstructedMetaDeck], [conservativeEstimate]]) => {
				const stat = stats.deckStats.find((s) => s.decklist === currentConstructedMetaDeck);
				if (!stat) {
					return null;
				}

				const standardDeviation = Math.sqrt((stat.winrate * (1 - stat.winrate)) / stat.totalGames);
				const conservativeWinrate: number = stat.winrate - 3 * standardDeviation;
				const winrateToUse = conservativeEstimate ? conservativeWinrate : stat.winrate;
				const result: ConstructedDeckDetails = {
					type: 'deck',
					name:
						this.i18n.translateString(`archetype.${stat.archetypeName}`) ===
						`archetype.${stat.archetypeName}`
							? stat.archetypeName
							: this.i18n.translateString(`archetype.${stat.archetypeName}`),
					heroCardClass: stat.playerClass,
					games: stat.totalGames,
					winrate: winrateToUse,
					deckstring: stat.decklist,
					cardsData: stat.cardsData,
				};
				return result;
			}),
			// tap((decks) => console.debug('[meta-decks] emitting decks', decks)),
		);
	}
}
