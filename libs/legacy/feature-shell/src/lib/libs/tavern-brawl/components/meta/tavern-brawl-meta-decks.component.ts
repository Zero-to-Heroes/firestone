import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { EnhancedDeckStat } from '@components/decktracker/main/meta-decks-visualization.component';
import { ExtendedDeckStats } from '@firestone/constructed/common';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ILocalizationService, OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { TavernBrawlService } from '../../services/tavern-brawl.service';
import { ExtendedBrawlInfo } from '../overview/tavern-brawl-overview.component';

@Component({
	standalone: false,
	selector: 'tavern-brawl-meta-decks',
	styleUrls: [`./tavern-brawl-meta-decks.component.scss`],
	template: `
		<div class="tavern-brawl-meta">
			<div class="brawl-info" *ngIf="brawlInfo$ | async as brawlInfo">
				<div class="brawl-name">{{ brawlInfo.nameLabel }}</div>
			</div>
			<div class="filters">
				<constructed-player-class-filter-dropdown class="filter"></constructed-player-class-filter-dropdown>
				<constructed-sample-size-filter-dropdown class="filter"></constructed-sample-size-filter-dropdown>
			</div>
			<meta-decks-visualization
				[metaDecks]="decks$ | async"
				[cardSearch]="cardSearch$ | async"
				(deckSelected)="onDeckSelected($event)"
			>
			</meta-decks-visualization>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TavernBrawlMetaDecksComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	brawlInfo$: Observable<ExtendedBrawlInfo>;
	decks$: Observable<ExtendedDeckStats>;
	cardSearch$: Observable<readonly string[]>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly metaStats: TavernBrawlService,
		private readonly i18n: ILocalizationService,
		private readonly ow: OverwolfService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.metaStats);

		this.decks$ = this.metaStats.metaDecks$$.pipe(
			this.mapData((stats) => {
				const result: ExtendedDeckStats = {
					...stats,
					lastUpdated: new Date(stats.lastUpdateDate),
					dataPoints: stats.stats.reduce((a, b) => a + b.matches, 0),
					rankBracket: null,
					timePeriod: null,
					format: null,
				};
				console.debug('[tavern-brawl-meta-decks] result', result);
				return result;
			}),
		);
		this.cardSearch$ = this.metaStats.cardSearch$$.pipe(this.mapData((cardSearch) => cardSearch));

		this.brawlInfo$ = this.metaStats.tavernBrawl$$.pipe(
			this.mapData((stats) => {
				if (!stats?.info) {
					return null;
				}

				const nameLabel: string = this.i18n.translateString(
					!!stats.info?.name ? 'app.tavern-brawl.with-name' : 'app.tavern-brawl.no-name',
					{
						name: stats.info?.name,
						date: !!stats.info?.startDate
							? new Date(stats.info.startDate).toLocaleString(this.i18n.formatCurrentLocale(), {
									month: 'long',
									day: 'numeric',
								})
							: 'unknown date',
					},
				);
				return {
					...stats.info,
					nameLabel: nameLabel,
				};
			}),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onDeckSelected(deck: EnhancedDeckStat) {
		console.debug('copying deck', deck);
		this.ow.placeOnClipboard(deck.decklist);
	}
}
