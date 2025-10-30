import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { ConstructedMetaDecksStateService, ExtendedDeckStats } from '@firestone/constructed/common';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { Observable } from 'rxjs';

@Component({
	standalone: false,
	selector: 'constructed-meta-decks',
	styleUrls: [`../../../../css/component/decktracker/main/constructed-meta-decks.component.scss`],
	template: `
		<meta-decks-visualization [metaDecks]="decks$ | async" [cardSearch]="cardSearch$ | async">
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
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await Promise.all([this.constructedMetaStats.isReady()]);

		this.decks$ = this.constructedMetaStats.constructedMetaDecks$$.pipe(this.mapData((stats) => stats));
		this.cardSearch$ = this.constructedMetaStats.cardSearch$$.pipe(this.mapData((cardSearch) => cardSearch));

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
