import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { BgsFaceOffWithSimulation, BgsStateFacadeService } from '@firestone/battlegrounds/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { Observable, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
	selector: 'bgs-simulation-overlay',
	styleUrls: [`../../../../css/component/battlegrounds/simulation-overlay/bgs-simulation-overlay.component.scss`],
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
	nextBattle$: Observable<BgsFaceOffWithSimulation>;
	showSimulationSample$: Observable<boolean>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
		private readonly prefs: PreferencesService,
		private readonly gameState: BgsStateFacadeService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await Promise.all([this.prefs.isReady, this.gameState.isReady()]);

		this.nextBattle$ = combineLatest([
			this.gameState.gameState$$.pipe(this.mapData((state) => state?.currentGame)),
			this.prefs.preferences$$.pipe(
				this.mapData((prefs) => ({
					bgsShowSimResultsOnlyOnRecruit: prefs?.bgsShowSimResultsOnlyOnRecruit,
					bgsHideSimResultsOnRecruit: prefs?.bgsHideSimResultsOnRecruit,
				})),
			),
		]).pipe(
			filter(([currentGame, { bgsShowSimResultsOnlyOnRecruit, bgsHideSimResultsOnRecruit }]) => !!currentGame),
			this.mapData(([currentGame, { bgsShowSimResultsOnlyOnRecruit, bgsHideSimResultsOnRecruit }]) => {
				const result = currentGame.getRelevantFaceOff(
					bgsShowSimResultsOnlyOnRecruit,
					bgsHideSimResultsOnRecruit,
				);
				return result;
			}),
		);
		this.showSimulationSample$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs?.bgsEnableSimulationSampleInOverlay),
		);
		this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs?.bgsSimulatorScale)).subscribe((scale) => {
			// this.el.nativeElement.style.setProperty('--bgs-simulator-scale', scale / 100);
			const element = this.el.nativeElement.querySelector('.scalable');
			this.renderer.setStyle(element, 'transform', `scale(${scale / 100})`);
		});

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
