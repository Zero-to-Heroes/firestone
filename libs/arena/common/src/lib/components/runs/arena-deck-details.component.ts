import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { Pick } from '@firestone-hs/arena-draft-pick';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { Observable } from 'rxjs';
import { ArenDeckDetailsService } from '../../services/arena-deck-details.service';
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
			<div class="picks">
				<div class="header" [fsTranslate]="'app.arena.deck-details.picks-header'"></div>
				<ng-container *ngIf="{ picks: picks$ | async } as value">
					<with-loading [isLoading]="value.picks === undefined">
						<div class="picks-list" *ngIf="value.picks as picks" scrollable>
							<div class="pick" *ngFor="let pick of picks">
								<div class="pick-number">{{ pick.pickNumber }}</div>
								<div class="options">
									<div
										class="option"
										*ngFor="let option of pick.options"
										[ngClass]="{ selected: option === pick.pick }"
									>
										<card-tile class="option-card" [cardId]="option"></card-tile>
									</div>
								</div>
							</div>
						</div>
						<div class="error" *ngIf="value.picks === null">Error</div>
					</with-loading>
				</ng-container>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaDeckDetailsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	decklist$: Observable<string | null>;
	picks$: Observable<readonly Pick[] | undefined | null>;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly nav: ArenaNavigationService,
		private readonly deckDetailsService: ArenDeckDetailsService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await this.nav.isReady();
		await this.deckDetailsService.isReady();

		this.decklist$ = this.nav.selectedPersonalDeckstring$$.pipe(
			this.mapData((selectedPersonalDeckstring) => selectedPersonalDeckstring),
		);
		this.picks$ = this.deckDetailsService.deckDetails$$.pipe(
			this.mapData((deckDetails) => (deckDetails === undefined ? undefined : deckDetails?.picks ?? null)),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
