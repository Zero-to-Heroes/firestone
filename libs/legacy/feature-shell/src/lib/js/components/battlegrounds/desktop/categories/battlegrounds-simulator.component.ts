import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';

import { BgsFaceOffWithSimulation } from '@firestone/battlegrounds/core';
import {
	BgsSimulatorControllerService,
	BgsSimulatorKeyboardControl,
	BgsSimulatorKeyboardControls,
} from '@firestone/battlegrounds/simulator';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { Observable } from 'rxjs';

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
			<bgs-battle class="battle" [faceOff]="faceOff$ | async"></bgs-battle>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsSimulatorComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	faceOff$: Observable<BgsFaceOffWithSimulation>;

	helpTooltip: string = this.buildHelpTooltip();

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly controller: BgsSimulatorControllerService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.controller);

		this.faceOff$ = this.controller.faceOff$$.pipe(this.mapData((faceOff) => faceOff));

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
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
