import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { AbstractSubscriptionStoreComponent } from '@components/abstract-subscription-store.component';
import { ConstructedMetaDecksStateService, overrideDeckName } from '@firestone/constructed/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { CardsFacadeService } from '@firestone/shared/framework/core';
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
		this.deckDetails$ = combineLatest([
			this.constructedMetaStats.currentConstructedMetaArchetype$$,
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.constructedMetaDecksUseConservativeWinrate)),
		]).pipe(
			this.mapData(([stat, conservativeEstimate]) => {
				if (!stat) {
					return stat === null ? null : undefined;
				}

				const standardDeviation = Math.sqrt((stat.winrate * (1 - stat.winrate)) / stat.totalGames);
				const conservativeWinrate: number = stat.winrate - 3 * standardDeviation;
				const winrateToUse = conservativeEstimate ? conservativeWinrate : stat.winrate;

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
					games: stat.totalGames,
					winrate: winrateToUse,
					archetypeCoreCards: stat.coreCards,
					cardsData: stat.cardsData.filter((c) => c.inStartingDeck > stat.totalGames / 50),
					discoverData: stat.discoverData.filter((c) => c.discovered > 10),
					matchups: stat.matchupInfo,
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
