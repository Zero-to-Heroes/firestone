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

@Component({
	selector: 'constructed-mulligan',
	styleUrls: ['./constructed-mulligan.component.scss'],
	template: `
		<div class="root">
			<ul
				class="mulligan-guide"
				*ngIf="mulliganGuide$ | async as mulliganGuide"
				[ngClass]="{ wide: mulliganGuide.length === 4 }"
			>
				<div class="mulligan-info" *ngFor="let info of mulliganGuide">
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
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedMulliganComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	mulliganGuide$: Observable<readonly InternalMulliganAdvice[] | null>;

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

		this.mulliganGuide$ = this.mulligan.mulliganAdvice$$.pipe(
			filter((advice) => !!advice),
			this.mapData((advice) =>
				advice!.allDeckCards.map((advice) => ({
					impact: advice.score == null ? '-' : advice.score.toFixed(2),
				})),
			),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}

interface InternalMulliganAdvice {
	impact: string;
}
