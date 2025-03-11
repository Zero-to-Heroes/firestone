import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { Pick } from '@firestone-hs/arena-draft-pick';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { ArenaDeckOverview } from '../../models/arena-deck-details';
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
			<div class="details">
				<div class="deck-summary" *ngIf="overview$ | async as overview">
					<div class="header" [fsTranslate]="'app.arena.deck-details.deck-summary-header'"></div>
					<div class="overview">
						<div class="left-info">
							<div class="group result">
								<div class="wins">{{ overview.wins }}</div>
								<div class="separator">-</div>
								<div class="losses">{{ overview.losses }}</div>
							</div>

							<div class="group player-images">
								<img
									class="player-class"
									[src]="overview.playerClassImage"
									[cardTooltip]="overview.playerCardId"
									*ngIf="overview.playerClassImage"
								/>
							</div>

							<div
								class="group score"
								*ngIf="!!overview.draftStat?.deckScore"
								[helpTooltip]="deckScoreTooltip"
							>
								<div class="image" [inlineSVG]="'assets/svg/star.svg'"></div>
								<div class="value">{{ overview.draftStat.deckScore.toFixed(1) }}</div>
							</div>

							<div class="group rewards" *ngIf="overview.rewards?.length">
								<arena-reward *ngFor="let reward of overview.rewards" [reward]="reward"></arena-reward>
							</div>
						</div>

						<div class="right-info">
							<div
								class="group show-more"
								[ngClass]="{ expanded: isExpanded }"
								(click)="toggleShowMore()"
							>
								<div
									class="text"
									*ngIf="isExpanded"
									[fsTranslate]="'app.arena.runs.minimize-run-button'"
								></div>
								<div
									class="text"
									*ngIf="!isExpanded"
									[fsTranslate]="'app.arena.runs.view-run-button'"
								></div>
								<div class="icon" inlineSVG="assets/svg/collapse_caret.svg"></div>
							</div>
						</div>
					</div>
					<div class="run-details" *ngIf="isExpanded">
						<ul class="details">
							<li *ngFor="let step of overview.steps">
								<replay-info-generic-2 [replay]="step"></replay-info-generic-2>
							</li>
						</ul>
					</div>
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
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaDeckDetailsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	decklist$: Observable<string | null>;
	picks$: Observable<readonly Pick[] | undefined | null>;
	overview$: Observable<ArenaDeckOverview | null>;

	isExpanded: boolean;
	deckScoreTooltip = this.i18n.translateString('app.arena.runs.deck-score-tooltip');

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly nav: ArenaNavigationService,
		private readonly deckDetailsService: ArenDeckDetailsService,
		private readonly i18n: ILocalizationService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await this.nav.isReady();
		await this.deckDetailsService.isReady();

		this.decklist$ = this.deckDetailsService.deckDetails$$.pipe(
			this.mapData((deckDetails) => deckDetails?.deckstring ?? null),
		);
		this.picks$ = this.deckDetailsService.deckDetails$$.pipe(
			this.mapData((deckDetails) =>
				deckDetails?.picks === undefined
					? undefined
					: [...deckDetails.picks].sort((a, b) => a.pickNumber - b.pickNumber),
			),
		);
		this.overview$ = this.deckDetailsService.deckDetails$$.pipe(
			this.mapData((deckDetails) => deckDetails?.overview ?? null),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	toggleShowMore() {
		this.isExpanded = !this.isExpanded;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
