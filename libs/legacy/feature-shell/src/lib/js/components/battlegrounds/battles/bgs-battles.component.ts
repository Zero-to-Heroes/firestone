import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	ViewRef,
} from '@angular/core';
import { BattleResultHistory, BgsBattleSimulationResult } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { BgsBattlesPanel, BgsFaceOffWithSimulation, BgsPanel } from '@firestone/battlegrounds/core';
import { AnalyticsService, OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { BattlegroundsStoreEvent } from '@services/battlegrounds/store/events/_battlegrounds-store-event';
import { BgsBattleSimulationUpdateEvent } from '@services/battlegrounds/store/events/bgs-battle-simulation-update-event';
import { BgsSelectBattleEvent } from '@services/battlegrounds/store/events/bgs-select-battle-event';
import { Observable, combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map } from 'rxjs/operators';
import { AdService } from '../../../services/ad.service';
import { BgsBattleSimulationResetEvent } from '../../../services/battlegrounds/store/events/bgs-battle-simulation-reset-event';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { deepEqual } from '../../../services/utils';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';

@Component({
	selector: 'bgs-battles',
	styleUrls: [
		`../../../../css/component/controls/controls.scss`,
		`../../../../css/component/controls/control-close.component.scss`,
		`../../../../css/component/battlegrounds/battles/bgs-battles.component.scss`,
	],
	template: `
		<bgs-battles-view
			*ngIf="{ selectedFaceOff: selectedFaceOff$ | async, faceOffs: faceOffs$ | async } as value"
			[faceOffs]="value.faceOffs"
			[selectedFaceOff]="value.selectedFaceOff"
			[actualBattle]="actualBattle$ | async"
			[battleResultHistory]="battleResultHistory$ | async"
			[canSelectBattle]="false"
			[showAds]="showAds$ | async"
		>
		</bgs-battles-view>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsBattlesComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit, AfterViewInit {
	simulationUpdater: (currentFaceOff: BgsFaceOffWithSimulation, partialUpdate: BgsFaceOffWithSimulation) => void;
	simulationReset: (faceOffId: string) => void;

	faceOffs$: Observable<readonly BgsFaceOffWithSimulation[]>;
	selectedFaceOff$: Observable<BgsFaceOffWithSimulation>;
	actualBattle$: Observable<BgsFaceOffWithSimulation>;
	battleResultHistory$: Observable<readonly BattleResultHistory[]>;
	showAds$: Observable<boolean>;

	private battlegroundsUpdater: EventEmitter<BattlegroundsStoreEvent>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly analytics: AnalyticsService,
		private readonly ads: AdService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.ads);

		this.faceOffs$ = this.store
			.listenBattlegrounds$(([state]) => state.currentGame?.faceOffs)
			.pipe(
				debounceTime(1000),
				filter(([faceOffs]) => !!faceOffs?.length),
				this.mapData(
					([faceOffs]) => faceOffs.slice().reverse(),
					(a, b) => deepEqual(a, b),
					0,
				),
			);
		this.selectedFaceOff$ = combineLatest(
			this.faceOffs$,
			this.store.listenBattlegrounds$(([state]) => state.panels),
		).pipe(
			map(
				([faceOffs, [panels]]) =>
					[faceOffs, panels?.find((p: BgsPanel) => p.id === 'bgs-battles') as BgsBattlesPanel] as readonly [
						readonly BgsFaceOffWithSimulation[],
						BgsBattlesPanel,
					],
			),
			filter(([faceOffs, panel]) => !!panel),
			this.mapData(([faceOffs, panel]) => {
				// If the user closed it at least once, we don't force-show it anymore
				if (!panel.selectedFaceOffId) {
					return null;
				}
				const currentSimulations = panel.currentSimulations ?? [];
				const currentSimulationIndex = currentSimulations.map((s) => s.id).indexOf(panel.selectedFaceOffId);
				if (currentSimulationIndex === -1) {
					const faceOff = faceOffs.find((f) => f.id === panel.selectedFaceOffId);
					return faceOff;
				}

				const currentSimulation = currentSimulations[currentSimulationIndex];
				return currentSimulation;
			}),
		);
		this.actualBattle$ = this.store
			.listenBattlegrounds$(
				([state]) => state.currentGame?.faceOffs,
				([state]) => state.panels,
			)
			.pipe(
				map(
					([faceOffs, panels]) =>
						[
							faceOffs,
							panels.find((p: BgsPanel) => p.id === 'bgs-battles') as BgsBattlesPanel,
						] as readonly [readonly BgsFaceOffWithSimulation[], BgsBattlesPanel],
				),
				filter(([faceOffs, panel]) => !!panel),
				this.mapData(([faceOffs, panel]) => faceOffs.find((f) => f.id === panel.selectedFaceOffId)),
			);
		this.battleResultHistory$ = this.store
			.listenBattlegrounds$(([state]) => state.currentGame?.faceOffs)
			.pipe(
				map(([faceOffs]) => faceOffs),
				filter((faceOffs) => !!faceOffs?.length),
				distinctUntilChanged(),
				this.mapData((faceOffs) =>
					faceOffs.map(
						(faceOff) =>
							({
								turn: faceOff.turn,
								simulationResult: {
									wonPercent: faceOff.battleResult?.wonPercent,
								} as BgsBattleSimulationResult,
								actualResult: null,
							} as BattleResultHistory),
					),
				),
			);
		this.showAds$ = this.ads.hasPremiumSub$$.pipe(this.mapData((showAds) => !showAds));
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	async ngAfterViewInit() {
		this.battlegroundsUpdater = (await this.ow.getMainWindow()).battlegroundsUpdater;
		this.simulationUpdater = (currentFaceOff, partialUpdate) => {
			this.battlegroundsUpdater.next(new BgsBattleSimulationUpdateEvent(currentFaceOff, partialUpdate));
		};
		this.simulationReset = (faceOffId: string) => {
			this.battlegroundsUpdater.next(new BgsBattleSimulationResetEvent(faceOffId));
		};
	}

	selectBattle(faceOff: BgsFaceOffWithSimulation) {
		this.analytics.trackEvent('select-battle', { origin: 'bgs-battles' });
		// this.battlegroundsUpdater.next(new BgsSelectBattleEvent(faceOff?.id));
	}

	closeBattle(faceOff: BgsFaceOffWithSimulation) {
		this.battlegroundsUpdater.next(new BgsSelectBattleEvent(null));
	}

	trackByFn(index: number, item: BgsFaceOffWithSimulation) {
		return item.id;
	}
}
