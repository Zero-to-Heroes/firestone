import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
} from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { BgsFaceOffWithSimulation } from '../../../models/battlegrounds/bgs-face-off-with-simulation';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'bgs-simulation-overlay',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/component/battlegrounds/simulation-overlay/bgs-simulation-overlay.component.scss`,
	],
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
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		this.nextBattle$ = combineLatest(
			this.store.listenBattlegrounds$(([state]) => state?.currentGame),
			this.store.listen$(
				([state, nav, prefs]) => prefs?.bgsShowSimResultsOnlyOnRecruit,
				([state, nav, prefs]) => prefs?.bgsHideSimResultsOnRecruit,
			),
		).pipe(
			filter(([[currentGame], [bgsShowSimResultsOnlyOnRecruit, bgsHideSimResultsOnRecruit]]) => !!currentGame),
			this.mapData(([[currentGame], [bgsShowSimResultsOnlyOnRecruit, bgsHideSimResultsOnRecruit]]) => {
				const result = currentGame.getRelevantFaceOff(
					bgsShowSimResultsOnlyOnRecruit,
					bgsHideSimResultsOnRecruit,
				);
				return result;
			}),
		);
		this.showSimulationSample$ = this.listenForBasicPref$((prefs) => prefs?.bgsEnableSimulationSampleInOverlay);
		this.store
			.listen$(([main, nav, prefs]) => prefs.bgsSimulatorScale)
			.pipe(this.mapData(([pref]) => pref))
			.subscribe((scale) => {
				// this.el.nativeElement.style.setProperty('--bgs-simulator-scale', scale / 100);
				const element = this.el.nativeElement.querySelector('.scalable');
				this.renderer.setStyle(element, 'transform', `scale(${scale / 100})`);
			});
	}
}
