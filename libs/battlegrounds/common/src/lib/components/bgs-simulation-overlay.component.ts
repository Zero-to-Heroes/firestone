import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { BgsBattleSimulationService, bgsSimLatency } from '@firestone/battlegrounds/core';
import { BgsFaceOffWithSimulation, GameStateFacadeService } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { Observable, combineLatest } from 'rxjs';
import { filter, map } from 'rxjs/operators';

@Component({
	standalone: false,
	selector: 'bgs-simulation-overlay',
	styleUrls: [`./bgs-simulation-overlay.component.scss`],
	template: `
		<div class="app-container battlegrounds-theme simulation-overlay scalable">
			<bgs-battle-status
				[nextBattle]="nextBattle$ | async"
				[showReplayLink]="showSimulationSample$ | async"
			></bgs-battle-status>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsSimulationOverlayComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	nextBattle$: Observable<BgsFaceOffWithSimulation | null>;
	showSimulationSample$: Observable<boolean>;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
		private readonly prefs: PreferencesService,
		private readonly gameState: GameStateFacadeService,
		private readonly simulation: BgsBattleSimulationService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await Promise.all([this.prefs.isReady, this.gameState.isReady()]);

		// Face-off scaffolding from game state; live battleResult from battleInfo$$ when
		// available in this window. Cross-window overlays still get urgentGameState$$.
		this.nextBattle$ = combineLatest([
			this.gameState.gameState$$.pipe(this.mapData((state) => state?.bgState.currentGame, null, 0)),
			this.prefs.preferences$$.pipe(
				this.mapData((prefs) => ({
					bgsShowSimResultsOnlyOnRecruit: prefs?.bgsShowSimResultsOnlyOnRecruit,
					bgsHideSimResultsOnRecruit: prefs?.bgsHideSimResultsOnRecruit,
				})),
			),
			this.simulation.battleInfo$$.pipe(this.mapData((info) => info, null, 0)),
		]).pipe(
			filter(([currentGame]) => !!currentGame),
			map(([currentGame, { bgsShowSimResultsOnlyOnRecruit, bgsHideSimResultsOnRecruit }, liveSim]) => {
				const faceOff = currentGame?.getRelevantFaceOff(
					bgsShowSimResultsOnlyOnRecruit,
					bgsHideSimResultsOnRecruit,
				);
				if (!faceOff) {
					return null;
				}
				if (liveSim?.battleId === faceOff.id && liveSim.result?.wonPercent != null) {
					bgsSimLatency.markFirstPaint(faceOff.id);
					return faceOff.update({
						battleResult: liveSim.result,
						battleInfoStatus: liveSim.intermediateResult ? 'ongoing' : 'done',
					});
				}
				if (faceOff.battleResult?.wonPercent != null) {
					bgsSimLatency.markFirstPaint(faceOff.id);
				}
				return faceOff;
			}),
			this.mapData((faceOff) => faceOff, null, 0),
		);
		this.showSimulationSample$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs?.bgsEnableSimulationSampleInOverlay),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}
}
