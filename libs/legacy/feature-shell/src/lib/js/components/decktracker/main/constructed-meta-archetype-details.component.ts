import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { AbstractSubscriptionStoreComponent } from '@components/abstract-subscription-store.component';
import { ArchetypeStat } from '@firestone-hs/constructed-deck-stats';
import { Observable, combineLatest } from 'rxjs';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { ConstructedDeckDetails } from './constructed-meta-deck-details-view.component';

@Component({
	selector: 'constructed-meta-archetype-details',
	styleUrls: [`../../../../css/component/decktracker/main/constructed-meta-deck-details.component.scss`],
	template: `
		<constructed-meta-deck-details-view
			[input]="deckDetails$ | async"
			[archetypes]="archetypes$ | async"
			[hasPremiumAccess]="hasPremiumAccess$ | async"
			[showRelativeInfo]="showRelativeInfo$ | async"
		>
		</constructed-meta-deck-details-view>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedMetaArchetypeDetailsComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit
{
	deckDetails$: Observable<ConstructedDeckDetails>;
	archetypes$: Observable<readonly ArchetypeStat[]>;
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
		this.archetypes$ = this.store
			.constructedMetaDecks$()
			.pipe(this.mapData((stats) => stats?.archetypeStats ?? []));
		this.deckDetails$ = combineLatest([
			this.store.constructedMetaDecks$(),
			this.store.listen$(([main, nav]) => nav.navigationDecktracker.selectedConstructedMetaArchetype),
			this.store.listenPrefs$((prefs) => prefs.constructedMetaDecksUseConservativeWinrate),
		]).pipe(
			this.mapData(([stats, [archetypeId], [conservativeEstimate]]) => {
				const stat: ArchetypeStat = stats?.archetypeStats?.find((s) => s.id === archetypeId);
				if (!stat) {
					return null;
				}

				const standardDeviation = Math.sqrt((stat.winrate * (1 - stat.winrate)) / stat.totalGames);
				const conservativeWinrate: number = stat.winrate - 3 * standardDeviation;
				const winrateToUse = conservativeEstimate ? conservativeWinrate : stat.winrate;

				const result: ConstructedDeckDetails = {
					type: 'archetype',
					archetypeId: stat.id,
					name:
						this.i18n.translateString(`archetype.${stat.name}`) === `archetype.${stat.name}`
							? stat.name
							: this.i18n.translateString(`archetype.${stat.name}`),
					format: this.i18n.translateString(`global.format.${stat.format}`),
					heroCardClass: stat.heroCardClass,
					games: stat.totalGames,
					winrate: winrateToUse,
					archetypeCoreCards: stat.coreCards,
					cardsData: stat.cardsData,
				};
				return result;
			}),
		);
	}
}
