/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Inject,
	ViewRef,
} from '@angular/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ADS_SERVICE_TOKEN, IAdsService } from '@firestone/shared/framework/core';
import { Observable, filter } from 'rxjs';
import { ConstructedMulliganGuideService } from '../services/constructed-mulligan-guide.service';
import { GameStateFacadeService } from '../services/game-state-facade.service';
import { MulliganChartData } from './mulligan-detailed-info.component';

@Component({
	selector: 'constructed-mulligan',
	styleUrls: ['./constructed-mulligan.component.scss'],
	template: `
		<div class="root">
			<ul
				class="mulligan-guide"
				*ngIf="cardsInHandInfo$ | async as cardsInHandInfo"
				[ngClass]="{ wide: cardsInHandInfo.length === 4 }"
			>
				<div class="mulligan-info" *ngFor="let info of cardsInHandInfo">
					<div class="stat mulligan-winrate">
						<span
							class="label"
							[fsTranslate]="'decktracker.overlay.mulligan.mulligan-impact'"
							[helpTooltip]="'decktracker.overlay.mulligan.mulligan-impact-tooltip' | fsTranslate"
						></span>
						<span class="value">{{ info.impact }}</span>
					</div>
				</div>
			</ul>
			<div class="mulligan-overview">
				<mulligan-detailed-info [data]="allDeckMulliganInfo$ | async"></mulligan-detailed-info>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedMulliganComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	cardsInHandInfo$: Observable<readonly InternalMulliganAdvice[] | null>;
	allDeckMulliganInfo$: Observable<MulliganChartData | null>;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		@Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
		private readonly gameState: GameStateFacadeService,
		private readonly mulligan: ConstructedMulliganGuideService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await this.gameState.isReady();
		await this.ads.isReady();

		this.cardsInHandInfo$ = this.mulligan.mulliganAdvice$$.pipe(
			filter((advice) => !!advice),
			this.mapData((guide) => {
				return guide!.cardsInHand
					.map((cardId) => guide?.allDeckCards.find((advice) => advice.cardId === cardId))
					.map((advice) => ({
						impact: advice?.score == null ? '-' : advice.score.toFixed(2),
					}));
			}),
		);
		this.allDeckMulliganInfo$ = this.mulligan.mulliganAdvice$$.pipe(
			filter((advice) => !!advice),
			this.mapData((guide) => {
				return {
					mulliganData: guide!.allDeckCards
						.map((advice) => ({
							cardId: advice.cardId,
							label: advice.cardId,
							value: advice.score ?? 0,
							selected: !!guide?.cardsInHand.includes(advice.cardId),
						}))
						.sort((a, b) => a.value - b.value),
					format: guide!.format,
					sampleSize: guide!.sampleSize,
					rankBracket: guide!.rankBracket,
					opponentClass: guide!.opponentClass,
				};
			}),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}

interface InternalMulliganAdvice {
	impact: string;
}
