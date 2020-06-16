import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { Preferences } from '../../../models/preferences';
import { OverwolfService } from '../../../services/overwolf.service';
import { PreferencesService } from '../../../services/preferences.service';
import { Knob } from '../preference-slider.component';

@Component({
	selector: 'settings-battlegrounds-general',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/global/scrollbar-settings.scss`,
		`../../../../css/global/forms.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/battlegrounds/settings-battlegrounds-general.component.scss`,
	],
	template: `
		<div class="battlegrounds-general">
			<div class="title">Activate / Deactivate features</div>
			<div class="settings-group">
				<div class="subgroup">
					<preference-toggle field="bgsEnableApp" label="Enable Battlegrounds"></preference-toggle>
					<preference-toggle
						field="bgsEnableSimulation"
						label="Enable battle simulation"
						tooltip="When active, you will know your chances to win / tie / lose each battle at the start of the battle"
					></preference-toggle>
					<preference-toggle
						field="bgsUseLocalSimulator"
						[ngClass]="{ 'disabled': !enableSimulation }"
						label="Use local battle simulator"
						tooltip="Turning that off will run the battle simulations on a remote server, thus freeing your machine up. On the other hand, the results will take a bit longer to arrive"
					></preference-toggle>
					<preference-toggle
						field="bgsUseLocalPostMatchStats"
						label="Compute post-match stats locally"
						tooltip="When turned on, the stats that appear on the post-match screen will be computed locally, which is faster but can be CPU intensive. Turn it off to compute the stats on the cloud (it will take a bit more time though)"
					></preference-toggle>
					<preference-toggle
						field="bgsUseOverlay"
						label="Use game overlay"
						tooltip="When turned on, the battlegrounds window becomes an overlay, and is bound to the game window. Using this is recommended for single monitor setups, or if you want to stream the app"
					></preference-toggle>
					<preference-toggle
						field="playerBgsPogoCounter"
						label="Pogo-Hopper counter"
						tooltip="Show the number of times you played a Pogo-Hopper in Battlegrounds"
					></preference-toggle>
				</div>
			</div>
			<div class="title">
				Local simulator configuration
			</div>
			<div class="settings-group">
				<div
					class="text"
					[ngClass]="{ 'disabled': !useLocalSimulator || !enableSimulation }"
					helpTooltip="The number of simulations ran for each battle. We found 2,500 simulations to be a perfect spot. Increasing the number will increase the accuracy of the calculation but will require more resources from your PC."
				>
					Number of simulations
				</div>
				<preference-slider
					class="first-slider"
					field="bgsSimulatorNumberOfSims"
					[enabled]="useLocalSimulator"
					[showCurrentValue]="true"
					displayedValueUnit=""
					[min]="700"
					[max]="15000"
					[snapSensitivity]="200"
					[knobs]="numberOfSimsKnobs"
				>
				</preference-slider>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsBattlegroundsGeneralComponent implements AfterViewInit, OnDestroy {
	useLocalSimulator: boolean;
	enableSimulation: boolean;
	numberOfSimsKnobs: readonly Knob[] = [
		{
			absoluteValue: 2500,
		},
	];

	private preferencesSubscription: Subscription;

	constructor(
		private prefs: PreferencesService,
		private cdr: ChangeDetectorRef,
		private el: ElementRef,
		private ow: OverwolfService,
	) {}

	ngAfterViewInit() {
		this.loadDefaultValues();
		const preferencesEventBus: BehaviorSubject<any> = this.ow.getMainWindow().preferencesEventBus;
		this.preferencesSubscription = preferencesEventBus.asObservable().subscribe(event => {
			const preferences: Preferences = event.preferences;
			this.useLocalSimulator = preferences.bgsUseLocalSimulator;
			this.enableSimulation = preferences.bgsEnableSimulation;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		});
	}

	ngOnDestroy() {
		this.preferencesSubscription.unsubscribe();
	}

	private async loadDefaultValues() {
		const prefs = await this.prefs.getPreferences();
		this.useLocalSimulator = prefs.bgsUseLocalSimulator;
		this.enableSimulation = prefs.bgsEnableSimulation;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
