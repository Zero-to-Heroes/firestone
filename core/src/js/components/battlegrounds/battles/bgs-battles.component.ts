import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	HostListener,
	Input,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { BattleResultHistory, BgsBattleSimulationResult } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { BgsBattleSimulationUpdateEvent } from '@services/battlegrounds/store/events/bgs-battle-simulation-update-event';
import { BgsSelectBattleEvent } from '@services/battlegrounds/store/events/bgs-select-battle-event';
import { BattlegroundsStoreEvent } from '@services/battlegrounds/store/events/_battlegrounds-store-event';
import { OverwolfService } from '@services/overwolf.service';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, tap } from 'rxjs/operators';
import { BgsFaceOffWithSimulation } from '../../../models/battlegrounds/bgs-face-off-with-simulation';
import { BgsGame } from '../../../models/battlegrounds/bgs-game';
import { BgsPanel } from '../../../models/battlegrounds/bgs-panel';
import { BgsBattlesPanel } from '../../../models/battlegrounds/in-game/bgs-battles-panel';
import { BgsBattleSimulationResetEvent } from '../../../services/battlegrounds/store/events/bgs-battle-simulation-reset-event';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';

@Component({
	selector: 'bgs-battles',
	styleUrls: [
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/global/scrollbar.scss`,
		`../../../../css/component/controls/controls.scss`,
		`../../../../css/component/controls/control-close.component.scss`,
		`../../../../css/component/battlegrounds/battles/bgs-battles.component.scss`,
	],
	template: `
		<div class="container">
			<div class="content empty-state" *ngIf="!faceOffs?.length">
				<i>
					<svg>
						<use xlink:href="assets/svg/sprite.svg#empty_state_tracker" />
					</svg>
				</i>
				<span class="title">Nothing here yet</span>
				<span class="subtitle">Your first battle will show here after you face an opponent</span>
			</div>
			<ng-container *ngIf="{ value: faceOff$ | async } as selectedFaceOff">
				<div class="content" *ngIf="faceOffs?.length">
					<ng-container *ngIf="selectedFaceOff.value">
						<bgs-battle
							class="battle"
							[faceOff]="selectedFaceOff.value"
							[hideActualBattle]="false"
							[actualBattle]="actualBattle$ | async"
							[clickToChange]="true"
							[allowClickToAdd]="true"
							[closeOnMinion]="true"
							[fullScreenMode]="false"
							[showTavernTier]="true"
							[additionalClass]="'inline'"
							[simulationUpdater]="simulationUpdater"
							[simulationReset]="simulationReset"
						></bgs-battle>
						<button class="i-30 close-button" (mousedown)="closeBattle()">
							<svg class="svg-icon-fill">
								<use
									xmlns:xlink="https://www.w3.org/1999/xlink"
									xlink:href="assets/svg/sprite.svg#window-control_close"
								></use>
							</svg>
						</button>
						<div class="battles-header">All battles</div>
					</ng-container>
					<div class="battles-list" scrollable>
						<bgs-battle-recap
							*ngFor="let faceOff of faceOffs.slice().reverse(); trackBy: trackByFn"
							[faceOff]="faceOff"
							(click)="selectBattle(faceOff)"
							[ngClass]="{
								'highlighted': selectedFaceOff.value?.id && faceOff.id === selectedFaceOff.value.id
							}"
						></bgs-battle-recap>
					</div>
				</div>
			</ng-container>
			<div class="left">
				<div class="header">Avg. winrate by turn</div>
				<div class="left-info">
					<bgs-winrate-chart
						class="chart"
						[battleResultHistory]="battleResultHistory$ | async"
					></bgs-winrate-chart>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsBattlesComponent implements AfterViewInit, OnDestroy {
	simulationUpdater: (currentFaceOff: BgsFaceOffWithSimulation, partialUpdate: BgsFaceOffWithSimulation) => void;
	simulationReset: (faceOffId: string) => void;

	faceOffs: readonly BgsFaceOffWithSimulation[];
	faceOff$: Observable<BgsFaceOffWithSimulation>;
	actualBattle$: Observable<BgsFaceOffWithSimulation>;
	battleResultHistory$: Observable<readonly BattleResultHistory[]>;

	@Input() set panel(value: BgsBattlesPanel) {
		this._panel = value;
		this.updateInfo();
	}

	@Input() set game(value: BgsGame) {
		this._game = value;
		this.updateInfo();
	}

	private _panel: BgsBattlesPanel;
	private _game: BgsGame;
	private battlegroundsUpdater: EventEmitter<BattlegroundsStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly cdr: ChangeDetectorRef,
		private readonly store: AppUiStoreFacadeService,
	) {
		this.faceOff$ = this.store
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
				map(([faceOffs, panel]) => {
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
				distinctUntilChanged(),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				tap((faceOff) => console.debug('[cd] emitting face off in ', this.constructor.name, faceOff)),
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
				map(([faceOffs, panel]) => faceOffs.find((f) => f.id === panel.selectedFaceOffId)),
				distinctUntilChanged(),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				tap((faceOff) => console.debug('[cd] emitting actual battle in ', this.constructor.name, faceOff)),
			);
		this.battleResultHistory$ = this.store
			.listenBattlegrounds$(([state]) => state.currentGame?.faceOffs)
			.pipe(
				map(([faceOffs]) => faceOffs),
				filter((faceOffs) => !!faceOffs?.length),
				distinctUntilChanged(),
				map((faceOffs) =>
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
				// FIXME
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				tap((faceOff) => console.debug('[cd] emitting stats in ', this.constructor.name, faceOff)),
			);

		this.simulationUpdater = (currentFaceOff, partialUpdate) => {
			this.battlegroundsUpdater.next(new BgsBattleSimulationUpdateEvent(currentFaceOff, partialUpdate));
		};
		this.simulationReset = (faceOffId: string) => {
			this.battlegroundsUpdater.next(new BgsBattleSimulationResetEvent(faceOffId));
		};
	}

	async ngAfterViewInit() {
		this.battlegroundsUpdater = (await this.ow.getMainWindow()).battlegroundsUpdater;
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		this._game = null;
		this._panel = null;
	}

	selectBattle(faceOff: BgsFaceOffWithSimulation) {
		console.debug('selecting battle?', faceOff);
		// if (!faceOff?.battleInfo) {
		// 	console.debug('no battle info');
		// 	return;
		// }
		this.battlegroundsUpdater.next(new BgsSelectBattleEvent(faceOff?.id));
	}

	closeBattle(faceOff: BgsFaceOffWithSimulation) {
		this.battlegroundsUpdater.next(new BgsSelectBattleEvent(null));
	}

	trackByFn(index: number, item: BgsFaceOffWithSimulation) {
		return item.id;
	}

	private updateInfo() {
		if (!this._panel || !this._game?.faceOffs?.length || this.faceOffs === this._game.faceOffs) {
			return;
		}
		this.faceOffs = this._game.faceOffs;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
