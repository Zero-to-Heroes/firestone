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
import { Observable } from 'rxjs';
import { MulliganAdvice } from '../models/mulligan-advice';
import { ConstructedMulliganGuideService } from '../services/constructed-mulligan-guide.service';
import { GameStateFacadeService } from '../services/game-state-facade.service';

@Component({
	selector: 'constructed-mulligan',
	styleUrls: ['./constructed-mulligan.component.scss'],
	template: `
		<div class="root">
			<ul class="mulligan-guide" *ngIf="mulliganGuide$ | async as mulliganGuide">
				<div class="mulligan-info" *ngFor="let info of mulliganGuide">{{ info.cardId }} - {{ info.score }}</div>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedMulliganComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	mulliganGuide$: Observable<readonly MulliganAdvice[] | null>;

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

		this.mulliganGuide$ = this.mulligan.mulliganAdvice$$;

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
