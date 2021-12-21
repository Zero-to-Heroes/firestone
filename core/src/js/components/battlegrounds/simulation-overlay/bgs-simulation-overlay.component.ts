import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, takeUntil, tap } from 'rxjs/operators';
import { BgsFaceOffWithSimulation } from '../../../models/battlegrounds/bgs-face-off-with-simulation';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../../services/ui-store/app-ui-store.service';
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
			map(([[currentGame], [bgsShowSimResultsOnlyOnRecruit, bgsHideSimResultsOnRecruit]]) =>
				currentGame.getRelevantFaceOff(bgsShowSimResultsOnlyOnRecruit, bgsHideSimResultsOnRecruit),
			),
			distinctUntilChanged(),
			tap((filter) =>
				setTimeout(() => {
					if (!(this.cdr as ViewRef)?.destroyed) {
						this.cdr.detectChanges();
					}
				}, 0),
			),
			tap((filter) => cdLog('emitting nextBattle in ', this.constructor.name, filter)),
			takeUntil(this.destroyed$),
		);
		this.showSimulationSample$ = this.store
			.listen$(([state, nav, prefs]) => prefs?.bgsEnableSimulationSampleInOverlay)
			.pipe(
				map(([pref]) => pref),
				distinctUntilChanged(),
				tap((filter) =>
					setTimeout(() => {
						if (!(this.cdr as ViewRef)?.destroyed) {
							this.cdr.detectChanges();
						}
					}, 0),
				),
				tap((filter) => cdLog('emitting showSimulationSample in ', this.constructor.name, filter)),
				takeUntil(this.destroyed$),
			);
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
