import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { Observable } from 'rxjs';
import { ArenaNavigationService } from '../../services/arena-navigation.service';

@Component({
	selector: 'arena-deck-details',
	styleUrls: [`./arena-deck-details.component.scss`],
	template: `
		<div class="arena-deck-details">
			<div class="deck-list-container" *ngIf="decklist$ | async as decklist">
				<copy-deckstring
					class="copy-deckcode"
					[deckstring]="decklist"
					[copyText]="'app.duels.deckbuilder.export-deckcode-button' | fsTranslate"
				>
				</copy-deckstring>
				<deck-list-basic class="deck-list" [deckstring]="decklist"></deck-list-basic>
			</div>
			<!-- <div class="stats" scrollable *ngIf="deck.personal">
				<div
					class="header"
					[owTranslate]="'app.duels.deck-stat.all-runs-with-deck'"
					[translateParams]="{ deckName: deck.deck.deckName }"
				></div>
				<duels-runs-list
					[deckstring]="deck.deck.initialDeckList"
					[displayLoot]="true"
					[displayShortLoot]="false"
				></duels-runs-list>
			</div>
			<div class="stats" *ngIf="!deck.personal" scrollable>
				<div class="header" [owTranslate]="'app.duels.deck-stat.run-details'"></div>
				<duels-run [run]="deck.run" [displayLoot]="true" [isExpanded]="true"></duels-run>
			</div> -->
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaDeckDetailsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	decklist$: Observable<string | null>;

	constructor(protected override readonly cdr: ChangeDetectorRef, private readonly nav: ArenaNavigationService) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await this.nav.isReady();

		this.decklist$ = this.nav.selectedPersonalDeckstring$$.pipe(
			this.mapData((selectedPersonalDeckstring) => selectedPersonalDeckstring),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
