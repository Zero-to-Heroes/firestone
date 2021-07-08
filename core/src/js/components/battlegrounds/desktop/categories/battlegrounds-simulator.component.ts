import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, tap } from 'rxjs/operators';
import { BgsFaceOffWithSimulation } from '../../../../models/battlegrounds/bgs-face-off-with-simulation';
import { AppUiStoreService } from '../../../../services/app-ui-store.service';
import { BgsCustomSimulationChangeMinionRequestEvent } from '../../../../services/mainwindow/store/events/battlegrounds/simulator/bgs-custom-simulation-change-minion-request-event';
import { BgsCustomSimulationMinionRemoveRequestEvent } from '../../../../services/mainwindow/store/events/battlegrounds/simulator/bgs-custom-simulation-minion-remove-request-event';
import { BgsCustomSimulationUpdateMinionRequestEvent } from '../../../../services/mainwindow/store/events/battlegrounds/simulator/bgs-custom-simulation-update-minion-request-event';
import { ChangeMinionRequest } from '../../battles/bgs-battle-side.component';

@Component({
	selector: 'battlegrounds-simulator',
	styleUrls: [
		`../../../../../css/global/components-global.scss`,
		`../../../../../css/component/battlegrounds/desktop/categories/battlegrounds-simulator.component.scss`,
	],
	template: `
		<div class="battlegrounds-simulator">
			<bgs-battle
				class="battle"
				[faceOff]="faceOff$ | async"
				[hideActualBattle]="true"
				[clickToChange]="true"
				[allowClickToAdd]="true"
				[closeOnMinion]="true"
				(playerPortraitChangeRequested)="onPlayerPortraitChangeRequested()"
				(opponentPortraitChangeRequested)="onOpponentPortraitChangeRequested()"
				(playerMinionChangeRequested)="onPlayerMinionChangeRequested($event)"
				(opponentMinionChangeRequested)="onOpponentMinionChangeRequested($event)"
				(playerMinionUpdateRequested)="onPlayerMinionUpdateRequested($event)"
				(opponentMinionUpdateRequested)="onOpponentMinionUpdateRequested($event)"
				(playerMinionRemoveRequested)="onPlayerMinionRemoveRequested($event)"
				(opponentMinionRemoveRequested)="onOpponentMinionRemoveRequested($event)"
			></bgs-battle>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsSimulatorComponent {
	faceOff$: Observable<BgsFaceOffWithSimulation>;

	constructor(private readonly store: AppUiStoreService) {
		this.faceOff$ = this.store
			.listen$(([main, nav]) => main.battlegrounds.customSimulationState)
			.pipe(
				filter(([state]) => !!state),
				map(([state]) => state.faceOff),
				distinctUntilChanged(),
				tap((faceOff) => console.debug('[cd] emitting in ', this.constructor.name, faceOff)),
			);
	}

	onPlayerPortraitChangeRequested() {
		console.debug('request to change player portrait');
		// this.store.send(new BgsCustomSimulationChangeHeroRequestEvent('player'));
	}

	onOpponentPortraitChangeRequested() {
		console.debug('request to change opponent portrait');
		// this.store.send(new BgsCustomSimulationChangeHeroRequestEvent('opponnent'));
	}

	onPlayerMinionChangeRequested(event: ChangeMinionRequest) {
		console.debug('request to change minion to player warband', event);
		this.store.send(new BgsCustomSimulationChangeMinionRequestEvent('player', event?.index));
	}

	onOpponentMinionChangeRequested(event: ChangeMinionRequest) {
		console.debug('request to change minion to opp warband', event);
		this.store.send(new BgsCustomSimulationChangeMinionRequestEvent('opponent', event?.index));
	}

	onPlayerMinionUpdateRequested(event: ChangeMinionRequest) {
		console.debug('request to Update minion to player warband', event);
		this.store.send(new BgsCustomSimulationUpdateMinionRequestEvent('player', event?.index));
	}

	onOpponentMinionUpdateRequested(event: ChangeMinionRequest) {
		console.debug('request to Update minion to opp warband', event);
		this.store.send(new BgsCustomSimulationUpdateMinionRequestEvent('opponent', event?.index));
	}

	onPlayerMinionRemoveRequested(event: ChangeMinionRequest) {
		console.debug('request to remove minion to player warband', event);
		this.store.send(new BgsCustomSimulationMinionRemoveRequestEvent('player', event.index));
	}

	onOpponentMinionRemoveRequested(event: ChangeMinionRequest) {
		console.debug('request to remove minion to opp warband', event);
		this.store.send(new BgsCustomSimulationMinionRemoveRequestEvent('opponent', event.index));
	}
}
