import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { AbstractSubscriptionStoreComponent } from '@components/abstract-subscription-store.component';
import { decode } from '@firestone-hs/deckstrings';
import { ConstructedMetaDecksStateService } from '@firestone/constructed/common';
import { Card } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { Observable, combineLatest, debounceTime, filter } from 'rxjs';
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
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await this.constructedMetaStats.isReady();
		await this.prefs.isReady();

		this.hasPremiumAccess$ = this.store.hasPremiumSub$().pipe(this.mapData((hasPremium) => hasPremium));
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
		]).pipe(
			this.mapData(([stat, conservativeEstimate]) => {
				console.debug('deckStat', stat);
				if (!stat) {
					// Keep the null / undefined
					// null = no data
					// undefined = loading
					return stat === null ? null : undefined;
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
					cardsData: stat.cardsData.filter((c) => c.inStartingDeck > stat.totalGames / 50),
					matchups: stat.matchupInfo,
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
