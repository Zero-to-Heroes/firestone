import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { AbstractSubscriptionStoreComponent } from '@components/abstract-subscription-store.component';
import { ConstructedMatchupInfo } from '@firestone-hs/constructed-deck-stats';
import { ConstructedMetaDecksStateService, overrideDeckName } from '@firestone/constructed/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { CardsFacadeService, waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { AdService } from '../../../services/ad.service';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { ConstructedDeckDetails } from './constructed-meta-deck-details-view.component';

@Component({
	selector: 'constructed-meta-archetype-details',
	styleUrls: [`../../../../css/component/decktracker/main/constructed-meta-deck-details.component.scss`],
	template: `
		<constructed-meta-deck-details-view
			[input]="deckDetails$ | async"
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
	hasPremiumAccess$: Observable<boolean>;
	showRelativeInfo$: Observable<boolean>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly constructedMetaStats: ConstructedMetaDecksStateService,
		private readonly prefs: PreferencesService,
		private readonly allCards: CardsFacadeService,
		private readonly ads: AdService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.constructedMetaStats, this.prefs, this.ads);

		this.hasPremiumAccess$ = this.ads.hasPremiumSub$$.pipe(this.mapData((hasPremium) => hasPremium));
		this.showRelativeInfo$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.constructedMetaDecksShowRelativeInfo2),
		);
		this.deckDetails$ = combineLatest([
			this.constructedMetaStats.currentConstructedMetaArchetype$$,
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.constructedMetaDecksUseConservativeWinrate)),
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.constructedMetaDeckPlayCoinFilter)),
		]).pipe(
			this.mapData(([stat, conservativeEstimate, playCoin]) => {
				console.debug('archetype details', stat, conservativeEstimate, playCoin);
				if (!stat) {
					return stat === null ? null : undefined;
				}

				const statToUse =
					playCoin === 'coin'
						? stat.coinPlayInfo.find((s) => s.coinPlay === 'coin')
						: playCoin === 'play'
						? stat.coinPlayInfo.find((s) => s.coinPlay === 'play')
						: stat;
				const standardDeviation = Math.sqrt(
					(statToUse.winrate * (1 - statToUse.winrate)) / statToUse.totalGames,
				);
				const conservativeWinrate: number = statToUse.winrate - 3 * standardDeviation;
				const winrateToUse = conservativeEstimate ? conservativeWinrate : statToUse.winrate;

				const matchupInfo: readonly ConstructedMatchupInfo[] = stat.matchupInfo.map((matchup) => {
					const derivedStat =
						playCoin === 'coin'
							? matchup.coinPlayInfo.find((s) => s.coinPlay === 'coin')
							: playCoin === 'play'
							? matchup.coinPlayInfo.find((s) => s.coinPlay === 'play')
							: matchup;
					const result: ConstructedMatchupInfo = {
						...matchup,
						winrate: derivedStat?.winrate ?? matchup.winrate,
						totalGames: derivedStat?.totalGames ?? matchup.totalGames,
						wins: derivedStat?.wins ?? matchup.wins,
						losses: derivedStat?.losses ?? matchup.losses,
						cardsData: derivedStat?.cardsData ?? matchup.cardsData,
					};
					return result;
				});

				const result: ConstructedDeckDetails = {
					type: 'archetype',
					archetypeId: stat.id,
					name:
						overrideDeckName(stat, this.allCards) ??
						(this.i18n.translateString(`archetype.${stat.name}`) === `archetype.${stat.name}`
							? stat.name
							: this.i18n.translateString(`archetype.${stat.name}`)),
					format: this.i18n.translateString(`global.format.${stat.format}`),
					heroCardClass: stat.heroCardClass,
					games: statToUse.totalGames,
					winrate: winrateToUse,
					archetypeCoreCards: stat.coreCards,
					cardsData: statToUse.cardsData.filter((c) => c.inStartingDeck > stat.totalGames / 50),
					discoverData: stat.discoverData.filter((c) => c.discovered > 10),
					matchups: matchupInfo,
				};
				console.debug('archetype', result);
				return result;
			}),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
