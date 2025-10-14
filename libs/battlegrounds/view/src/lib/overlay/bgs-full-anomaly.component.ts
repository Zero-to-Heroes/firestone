import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { GameStateFacadeService } from '@firestone/game-state';
import { AbstractSubscriptionComponent, arraysEqual } from '@firestone/shared/framework/common';
import { ILocalizationService, waitForReady } from '@firestone/shared/framework/core';
import { auditTime, distinctUntilChanged, map, Observable } from 'rxjs';

interface ActionSample {
	timestamp: number;
	actions: number;
}

@Component({
	standalone: false,
	selector: 'bgs-full-anomaly',
	styleUrls: [`./bgs-full-anomaly.component.scss`],
	template: `
		<div class="full-anomaly scalable">
			<div class="anomaly" *ngFor="let anomaly of anomalies$ | async">
				<img class="image" [src]="anomaly.image" />
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FullAnomalyComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	anomalies$: Observable<readonly Anomaly[]>;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly gameState: GameStateFacadeService,
		private readonly i18n: ILocalizationService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.gameState);

		this.anomalies$ = this.gameState.gameState$$.pipe(
			auditTime(1000),
			map((state) => state.bgState?.currentGame?.anomalies),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			this.mapData((anomalies) =>
				anomalies?.map((anomaly) => ({
					image: this.i18n.getCardImage(anomaly, {
						isBgs: true,
						isHighRes: true,
					}),
				})),
			),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}

interface Anomaly {
	image: string;
}
