import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { ConstructedMetaDecksStateService, EnhancedDeckStat, ExtendedDeckStats } from '@firestone/constructed/common';
import { ConstructedMetaDeckDetailsShowEvent, MainWindowStateFacadeService } from '@firestone/mainwindow/common';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { AnalyticsService } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';

@Component({
	standalone: false,
	selector: 'constructed-meta-decks',
	styleUrls: [`../../../../css/component/decktracker/main/constructed-meta-decks.component.scss`],
	template: `
		<meta-decks-visualization
			[metaDecks]="decks$ | async"
			[cardSearch]="cardSearch$ | async"
			(deckSelected)="onDeckSelected($event)"
		>
		</meta-decks-visualization>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedMetaDecksComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	decks$: Observable<ExtendedDeckStats>;
	cardSearch$: Observable<readonly string[]>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly constructedMetaStats: ConstructedMetaDecksStateService,
		private readonly analytics: AnalyticsService,
		private readonly mainWindowStateFacade: MainWindowStateFacadeService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await Promise.all([this.constructedMetaStats.isReady()]);

		this.decks$ = this.constructedMetaStats.constructedMetaDecks$$.pipe(this.mapData((stats) => stats));
		this.cardSearch$ = this.constructedMetaStats.cardSearch$$.pipe(this.mapData((cardSearch) => cardSearch));

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}

	onDeckSelected(deck: EnhancedDeckStat) {
		this.analytics.trackEvent('meta-deck-view-details', { deckstring: deck.decklist });
		this.mainWindowStateFacade.send(new ConstructedMetaDeckDetailsShowEvent(deck.decklist));
	}
}
