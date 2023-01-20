import { AfterContentInit, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import {
	BgsSimulatorKeyboardControl,
	BgsSimulatorKeyboardControls,
} from '@components/battlegrounds/battles/simulator-keyboard-controls.service';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { BgsFaceOffWithSimulation } from '../../../../models/battlegrounds/bgs-face-off-with-simulation';
import { BgsCustomSimulationResetEvent } from '../../../../services/mainwindow/store/events/battlegrounds/simulator/bgs-custom-simulation-reset-event';
import { BgsCustomSimulationUpdateEvent } from '../../../../services/mainwindow/store/events/battlegrounds/simulator/bgs-custom-simulation-update-event';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	selector: 'battlegrounds-simulator',
	styleUrls: [`../../../../../css/component/battlegrounds/desktop/categories/battlegrounds-simulator.component.scss`],
	template: `
		<div class="battlegrounds-simulator">
			<div class="info" [helpTooltip]="helpTooltip" [helpTooltipClasses]="'bgs-simulator-help-tooltip'">
				<svg>
					<use xlink:href="assets/svg/sprite.svg#info" />
				</svg>
			</div>
			<bgs-battle
				class="battle"
				[faceOff]="faceOff$ | async"
				[hideActualBattle]="true"
				[clickToChange]="true"
				[allowClickToAdd]="true"
				[closeOnMinion]="true"
				[fullScreenMode]="true"
				[showTavernTier]="true"
				[simulationUpdater]="simulationUpdater"
				[simulationReset]="simulationReset"
				[allowKeyboardControl]="true"
			></bgs-battle>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsSimulatorComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit, AfterViewInit
{
	simulationUpdater: (currentFaceOff: BgsFaceOffWithSimulation, partialUpdate: BgsFaceOffWithSimulation) => void;
	simulationReset: (faceOffId: string) => void;

	faceOff$: Observable<BgsFaceOffWithSimulation>;

	helpTooltip: string = this.buildHelpTooltip();

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		this.faceOff$ = this.store
			.listen$(([main, nav]) => main.battlegrounds.customSimulationState)
			.pipe(
				filter(([state]) => !!state),
				this.mapData(([state]) => state.faceOff),
			);
	}

	ngAfterViewInit(): void {
		this.simulationUpdater = (currentFaceOff, partialUpdate) => {
			this.store.send(new BgsCustomSimulationUpdateEvent(currentFaceOff, partialUpdate));
		};
		this.simulationReset = (faceOffId: string) => {
			this.store.send(new BgsCustomSimulationResetEvent(faceOffId));
		};
	}

	private buildHelpTooltip(): string {
		return `
			<div class="content">
				<div class="title">${this.i18n.translateString('battlegrounds.sim.simulator-help-tooltip.title')}</div>
				<ul class="controls">
					<li class="control">${this.i18n.translateString('battlegrounds.sim.simulator-help-tooltip.control-hero', {
						playerKey: BgsSimulatorKeyboardControls.getKeyName(BgsSimulatorKeyboardControl.PlayerHero),
						opponentKey: BgsSimulatorKeyboardControls.getKeyName(BgsSimulatorKeyboardControl.OpponentHero),
					})}</li> 
					<li class="control">${this.i18n.translateString('battlegrounds.sim.simulator-help-tooltip.control-hero-power', {
						playerKey: BgsSimulatorKeyboardControls.getKeyName(BgsSimulatorKeyboardControl.PlayerHeroPower),
						opponentKey: BgsSimulatorKeyboardControls.getKeyName(
							BgsSimulatorKeyboardControl.OpponentHeroPower,
						),
					})}</li>
					<li class="control">${this.i18n.translateString('battlegrounds.sim.simulator-help-tooltip.control-minion', {
						playerKey: BgsSimulatorKeyboardControls.getKeyName(BgsSimulatorKeyboardControl.PlayerAddMinion),
						opponentKey: BgsSimulatorKeyboardControls.getKeyName(
							BgsSimulatorKeyboardControl.OpponentAddMinion,
						),
					})}</li>
					<li class="control">${this.i18n.translateString('battlegrounds.sim.simulator-help-tooltip.control-general')}</li>
				</ul>
			</div>
		`;
	}
}
