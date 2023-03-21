import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
} from '@angular/core';
import { BattleResultHistory } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { OverwolfService } from '@firestone/shared/framework/core';
import { BgsBattleSimulationUpdateEvent } from '@services/battlegrounds/store/events/bgs-battle-simulation-update-event';
import { BgsSelectBattleEvent } from '@services/battlegrounds/store/events/bgs-select-battle-event';
import { BattlegroundsStoreEvent } from '@services/battlegrounds/store/events/_battlegrounds-store-event';
import { BgsFaceOffWithSimulation } from '../../../models/battlegrounds/bgs-face-off-with-simulation';
import { BgsBattleSimulationResetEvent } from '../../../services/battlegrounds/store/events/bgs-battle-simulation-reset-event';
import { BattlegroundsMainWindowSelectBattleEvent } from '../../../services/mainwindow/store/events/battlegrounds/battlegrounds-main-window-select-battle-event';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';

@Component({
	selector: 'bgs-battles-view',
	styleUrls: [
		`../../../../css/component/controls/controls.scss`,
		`../../../../css/component/controls/control-close.component.scss`,
		`../../../../css/component/battlegrounds/battles/bgs-battles-view.component.scss`,
	],
	template: `
		<div class="container">
			<div class="content empty-state" *ngIf="!faceOffs?.length">
				<i>
					<svg>
						<use xlink:href="assets/svg/sprite.svg#empty_state_tracker" />
					</svg>
				</i>
				<span class="title" [owTranslate]="'battlegrounds.sim.empty-state-title'"></span>
				<span class="subtitle" [owTranslate]="'battlegrounds.sim.empty-state-subtitle'"></span>
			</div>
			<ng-container>
				<div class="content" *ngIf="faceOffs?.length">
					<ng-container *ngIf="selectedFaceOff">
						<bgs-battle
							class="battle"
							[faceOff]="selectedFaceOff"
							[hideActualBattle]="false"
							[actualBattle]="actualBattle"
							[clickToChange]="true"
							[allowClickToAdd]="true"
							[closeOnMinion]="true"
							[fullScreenMode]="false"
							[showTavernTier]="true"
							[additionalClass]="'inline'"
							[simulationUpdater]="simulationUpdater"
							[simulationReset]="simulationReset"
							[allowKeyboardControl]="false"
						></bgs-battle>
						<button class="i-30 close-button" (mousedown)="closeBattle()">
							<svg class="svg-icon-fill">
								<use
									xmlns:xlink="https://www.w3.org/1999/xlink"
									xlink:href="assets/svg/sprite.svg#window-control_close"
								></use>
							</svg>
						</button>
						<div class="battles-header" [owTranslate]="'battlegrounds.sim.battles-header'"></div>
					</ng-container>
					<div class="battles-list" scrollable>
						<bgs-battle-recap
							*ngFor="let faceOff of faceOffs; trackBy: trackByFn"
							[faceOff]="faceOff"
							(click)="selectBattle(faceOff)"
							[ngClass]="{
								highlighted: selectedFaceOff?.id && faceOff.id === selectedFaceOff.id
							}"
						></bgs-battle-recap>
					</div>
				</div>
			</ng-container>
			<div class="left" *ngIf="!showAds">
				<div class="header" [owTranslate]="'battlegrounds.sim.turn-winrate-graph-title'"></div>
				<div class="left-info">
					<bgs-winrate-chart class="chart" [battleResultHistory]="battleResultHistory"></bgs-winrate-chart>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsBattlesViewComponent extends AbstractSubscriptionStoreComponent implements AfterViewInit {
	simulationUpdater: (currentFaceOff: BgsFaceOffWithSimulation, partialUpdate: BgsFaceOffWithSimulation) => void;
	simulationReset: (faceOffId: string) => void;

	@Input() faceOffs: readonly BgsFaceOffWithSimulation[];
	@Input() selectedFaceOff: BgsFaceOffWithSimulation;
	@Input() actualBattle: BgsFaceOffWithSimulation;
	@Input() battleResultHistory: readonly BattleResultHistory[];
	@Input() showAds: boolean;

	@Input() set isMainWindow(value: boolean) {
		this._isMainWindow = value;
		this.ngAfterViewInit();
	}

	private _isMainWindow: boolean;
	private battlegroundsUpdater: EventEmitter<BattlegroundsStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
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
		if (this._isMainWindow) {
			this.store.send(new BattlegroundsMainWindowSelectBattleEvent(faceOff));
		} else {
			this.battlegroundsUpdater.next(new BgsSelectBattleEvent(faceOff?.id));
		}
	}

	closeBattle() {
		this.battlegroundsUpdater.next(new BgsSelectBattleEvent(null));
	}

	trackByFn(index: number, item: BgsFaceOffWithSimulation) {
		return item.id;
	}
}
