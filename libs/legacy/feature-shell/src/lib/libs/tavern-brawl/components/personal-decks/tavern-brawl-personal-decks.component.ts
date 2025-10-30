import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { DeckSummary } from '@firestone/constructed/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import {
	CardsFacadeService,
	ILocalizationService,
	OverwolfService,
	waitForReady,
} from '@firestone/shared/framework/core';
import { DecksProviderService } from '@legacy-import/src/lib/js/services/decktracker/main/decks-provider.service';
import { Observable, combineLatest } from 'rxjs';

@Component({
	standalone: false,
	selector: 'tavern-brawl-personal-decks',
	styleUrls: [`./tavern-brawl-personal-decks.component.scss`],
	template: `
		<div class="decktracker-decks" *ngIf="decks$ | async as decks">
			<ul class="deck-list" scrollable [attr.aria-label]="'Tavern Brawl deck stats'" role="list">
				<li *ngFor="let deck of decks; trackBy: trackByDeckId">
					<decktracker-deck-summary [deck]="deck" role="listitem"> </decktracker-deck-summary>
				</li>
			</ul>
			<section class="empty-state" *ngIf="!decks || decks.length === 0">
				<div class="state-container">
					<i class="i-236X165">
						<svg>
							<use xlink:href="assets/svg/sprite.svg#empty_state_tracker" />
						</svg>
					</i>
					<span class="title" [owTranslate]="'app.decktracker.decks.empty-state-title'"></span>
					<span class="subtitle" [owTranslate]="'app.decktracker.decks.empty-state-subtitle'"></span>
				</div>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TavernBrawlPersonalDecksComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	decks$: Observable<readonly DeckSummary[]>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: ILocalizationService,
		private readonly deckService: DecksProviderService,
		private readonly prefs: PreferencesService,
		private readonly ow: OverwolfService,
		private readonly allCards: CardsFacadeService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.deckService, this.prefs);

		const deckSource$: Observable<readonly DeckSummary[]> = combineLatest([this.deckService.decks$$]).pipe(
			this.mapData(([decks]) => {
				console.debug('decks', decks);
				const result =
					decks
						// ?.filter(d => d.format === 'tavern-brawl')
						?.filter((d) => d.totalGames > 0)
						.sort(
							(a, b) => new Date(b.lastUsedTimestamp).getTime() - new Date(a.lastUsedTimestamp).getTime(),
						) ?? [];
				return result;
			}),
		);
		this.decks$ = deckSource$;

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	trackByDeckId(index: number, item: DeckSummary) {
		return item.deckstring;
	}
}
