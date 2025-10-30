import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	ViewRef,
} from '@angular/core';
import { ConstructedMetaDecksStateService, ExtendedDeckStats } from '@firestone/constructed/common';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { AnalyticsService, OverwolfService } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { ConstructedMetaDeckDetailsShowEvent } from '../../../services/mainwindow/store/processors/decktracker/constructed-meta-deck-show-details';
import { EnhancedDeckStat } from './meta-decks-visualization.component';

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

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly constructedMetaStats: ConstructedMetaDecksStateService,
		private readonly analytics: AnalyticsService,
		private readonly ow: OverwolfService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await Promise.all([this.constructedMetaStats.isReady()]);

		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;

		this.decks$ = this.constructedMetaStats.constructedMetaDecks$$.pipe(this.mapData((stats) => stats));
		this.cardSearch$ = this.constructedMetaStats.cardSearch$$.pipe(this.mapData((cardSearch) => cardSearch));

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onDeckSelected(deck: EnhancedDeckStat) {
		this.analytics.trackEvent('meta-deck-view-details', { deckstring: deck.decklist });
		this.stateUpdater.next(new ConstructedMetaDeckDetailsShowEvent(deck.decklist));
	}
}
