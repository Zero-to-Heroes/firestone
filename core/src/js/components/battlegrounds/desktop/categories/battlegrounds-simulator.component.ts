import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, tap } from 'rxjs/operators';
import { BgsFaceOffWithSimulation } from '../../../../models/battlegrounds/bgs-face-off-with-simulation';
import { BgsCustomSimulationUpdateEvent } from '../../../../services/mainwindow/store/events/battlegrounds/simulator/bgs-custom-simulation-update-event';
import { AppUiStoreService } from '../../../../services/ui-store/app-ui-store.service';

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
				[fullScreenMode]="true"
				[showTavernTier]="false"
				[simulationUpdater]="simulationUpdater"
			></bgs-battle>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsSimulatorComponent {
	faceOff$: Observable<BgsFaceOffWithSimulation>;
	simulationUpdater: (currentFaceOff: BgsFaceOffWithSimulation, partialUpdate: BgsFaceOffWithSimulation) => void;

	constructor(private readonly store: AppUiStoreService) {
		this.faceOff$ = this.store
			.listen$(([main, nav]) => main.battlegrounds.customSimulationState)
			.pipe(
				filter(([state]) => !!state),
				map(([state]) => state.faceOff),
				distinctUntilChanged(),
				tap((faceOff) => console.debug('[cd] emitting in ', this.constructor.name, faceOff)),
			);

		this.simulationUpdater = (currentFaceOff, partialUpdate) => {
			this.store.send(new BgsCustomSimulationUpdateEvent(currentFaceOff, partialUpdate));
		};
	}
}
