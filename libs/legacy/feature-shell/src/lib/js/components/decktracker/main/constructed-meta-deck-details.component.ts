import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { AbstractSubscriptionStoreComponent } from '@components/abstract-subscription-store.component';
import { DeckStat } from '@firestone-hs/constructed-deck-stats';
import { decode } from '@firestone-hs/deckstrings';
import { Observable, combineLatest, debounceTime, filter } from 'rxjs';
import { Card } from '../../../models/card';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { ConstructedDeckDetails } from './constructed-meta-deck-details-view.component';

@Component({
	selector: 'constructed-meta-deck-details',
	styleUrls: [`../../../../css/component/decktracker/main/constructed-meta-deck-details.component.scss`],
	template: `
		<constructed-meta-deck-details-view
			[input]="deckDetails$ | async"
			[collection]="collection$ | async"
			[hasPremiumAccess]="hasPremiumAccess$ | async"
			[showRelativeInfo]="showRelativeInfo$ | async"
		>
		</constructed-meta-deck-details-view>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedMetaDeckDetailsComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit
{
	deckDetails$: Observable<ConstructedDeckDetails>;
	collection$: Observable<readonly Card[]>;
	hasPremiumAccess$: Observable<boolean>;
	showRelativeInfo$: Observable<boolean>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		this.hasPremiumAccess$ = this.store.hasPremiumSub$().pipe(this.mapData((hasPremium) => hasPremium));
		this.showRelativeInfo$ = this.listenForBasicPref$((prefs) => prefs.constructedMetaDecksShowRelativeInfo);
		this.collection$ = this.store.collection$().pipe(
			filter((collection) => !!collection),
			debounceTime(500),
			this.mapData((collection) => collection),
		);
		this.deckDetails$ = combineLatest([
			this.store.constructedMetaDecks$(),
			this.store.listen$(([main, nav]) => nav.navigationDecktracker.selectedConstructedMetaDeck),
			this.store.listenPrefs$((prefs) => prefs.constructedMetaDecksUseConservativeWinrate),
		]).pipe(
			this.mapData(([stats, [currentConstructedMetaDeck], [conservativeEstimate]]) => {
				const stat: DeckStat = stats?.deckStats?.find((s) => s.decklist === currentConstructedMetaDeck);
				console.debug('deckStat', stat, stats);
				if (!stat) {
					return null;
				}

				const standardDeviation = Math.sqrt((stat.winrate * (1 - stat.winrate)) / stat.totalGames);
				const conservativeWinrate: number = stat.winrate - 3 * standardDeviation;
				const winrateToUse = conservativeEstimate ? conservativeWinrate : stat.winrate;

				const deckDefinition = decode(stat.decklist);
				const result: ConstructedDeckDetails = {
					type: 'deck',
					archetypeId: stat.archetypeId,
					name:
						this.i18n.translateString(`archetype.${stat.archetypeName}`) ===
						`archetype.${stat.archetypeName}`
							? stat.archetypeName
							: this.i18n.translateString(`archetype.${stat.archetypeName}`),
					format: this.i18n.translateString(`global.format.${stat.format}`),
					heroCardClass: stat.playerClass,
					games: stat.totalGames,
					winrate: winrateToUse,
					deckstring: stat.decklist,
					cardsData: stat.cardsData,
					cardVariations: stat.cardVariations,
					archetypeCoreCards: stat.archetypeCoreCards,
					sideboards: deckDefinition.sideboards,
				};
				return result;
			}),
		);
	}
}
