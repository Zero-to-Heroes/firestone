import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { AbstractSubscriptionStoreComponent } from '@components/abstract-subscription-store.component';
import { ConstructedCardData, ConstructedMatchupInfo } from '@firestone-hs/constructed-deck-stats';
import { Sideboard, decode } from '@firestone-hs/deckstrings';
import { CardIds, getBaseCardId } from '@firestone-hs/reference-data';
import { ConstructedMetaDecksStateService, overrideDeckName } from '@firestone/constructed/common';
import { Card } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { CardsFacadeService, waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest, debounceTime, filter } from 'rxjs';
import { AdService } from '../../../services/ad.service';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { ConstructedDeckDetails, ExtendedConstructedCardData } from './constructed-meta-deck-details-view.component';

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
	deckDetails$: Observable<ConstructedDeckDetails | null | undefined>;
	collection$: Observable<readonly Card[]>;
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
		this.collection$ = this.store.collection$().pipe(
			filter((collection) => !!collection),
			debounceTime(500),
			this.mapData((collection) => collection),
		);
		this.deckDetails$ = combineLatest([
			this.constructedMetaStats.currentConstructedMetaDeck$$,
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.constructedMetaDecksUseConservativeWinrate)),
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.constructedMetaDeckPlayCoinFilter)),
		]).pipe(
			this.mapData(([stat, conservativeEstimate, playCoin]) => {
				console.debug('deckStat', stat);
				if (!stat) {
					// Keep the null / undefined
					// null = no data
					// undefined = loading
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

				const deckDefinition = decode(stat.decklist);
				const result: ConstructedDeckDetails = {
					type: 'deck',
					archetypeId: stat.archetypeId,
					name:
						overrideDeckName(stat, this.allCards) ??
						(this.i18n.translateString(`archetype.${stat.archetypeName}`) ===
						`archetype.${stat.archetypeName}`
							? stat.archetypeName
							: this.i18n.translateString(`archetype.${stat.archetypeName}`)),
					format: this.i18n.translateString(`global.format.${stat.format}`),
					heroCardClass: stat.playerClass,
					games: statToUse.totalGames,
					winrate: winrateToUse,
					deckstring: stat.decklist,
					cardsData: statToUse.cardsData
						.filter((c) => c.inStartingDeck > stat.totalGames / 50)
						.map((c) => enrichCard(c, deckDefinition.sideboards, this.allCards)),
					discoverData: stat.discoverData.filter((c) => c.discovered > 10),
					matchups: matchupInfo,
					cardVariations: stat.cardVariations,
					archetypeCoreCards: stat.archetypeCoreCards,
					sideboards: deckDefinition.sideboards,
				};
				return result;
			}),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}

export const enrichCard = (
	card: ConstructedCardData,
	sideboards: readonly Sideboard[],
	allCards: CardsFacadeService,
): ExtendedConstructedCardData => {
	if (card.cardId?.startsWith(CardIds.ZilliaxDeluxe3000_TOY_330)) {
		const result: ExtendedConstructedCardData = {
			...card,
			sideboard: sideboards?.find((sb) => sb.keyCardDbfId === allCards.getCard(getBaseCardId(card.cardId)).dbfId),
		};
		return result;
	}
	return card;
};
