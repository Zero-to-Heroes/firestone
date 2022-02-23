import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
} from '@angular/core';
import { Observable } from 'rxjs';
import { OverwolfService } from '../../../services/overwolf.service';
import { PreferencesService } from '../../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';
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
		<div
			class="battlegrounds-general"
			*ngIf="{
				useLocalSimulator: useLocalSimulator$ | async,
				enableSimulation: enableSimulation$ | async,
				bgsHideSimResultsOnRecruit: bgsHideSimResultsOnRecruit$ | async,
				bgsShowSimResultsOnlyOnRecruit: bgsShowSimResultsOnlyOnRecruit$ | async,
				bgsEnableOpponentBoardMouseOver: bgsEnableOpponentBoardMouseOver$ | async,
				bgsFullToggle: bgsFullToggle$ | async,
				bgsEnableApp: bgsEnableApp$ | async,
				bgsUseOverlay: bgsUseOverlay$ | async
			} as value"
			scrollable
		>
			<preference-toggle
				class="enable-bgs"
				field="bgsFullToggle"
				label="Enable Battlegrounds"
				tooltip="Turn off to disable all Battlegrounds live features"
			></preference-toggle>
			<div class="title">Companion App</div>
			<div class="settings-group">
				<div class="subgroup">
					<preference-toggle
						field="bgsEnableApp"
						[ngClass]="{ 'disabled': !value.bgsFullToggle }"
						label="Enable App"
					></preference-toggle>
					<preference-toggle
						field="bgsEnableSimulation"
						[ngClass]="{ 'disabled': !value.bgsFullToggle }"
						label="Enable battle simulation"
						tooltip="When active, you will know your chances to win / tie / lose each battle at the start of the battle"
					></preference-toggle>
					<preference-toggle
						field="bgsHideSimResultsOnRecruit"
						[ngClass]="{ 'disabled': !value.bgsFullToggle || value.bgsShowSimResultsOnlyOnRecruit }"
						label="Hide simulation after battle"
						tooltip="When active, simulation results will be hidden once the battle phase ends"
					></preference-toggle>
					<preference-toggle
						field="bgsShowSimResultsOnlyOnRecruit"
						[ngClass]="{ 'disabled': !value.bgsFullToggle || value.bgsHideSimResultsOnRecruit }"
						label="Show simulation only in tavern"
						tooltip="When active, simulation results will be hidden during the battle, and shown once you get back to the tavern"
					></preference-toggle>
					<preference-toggle
						field="bgsUseLocalSimulator"
						[ngClass]="{ 'disabled': !value.enableSimulation || !value.bgsFullToggle }"
						label="Use local battle simulator"
						tooltip="Turning that off will run the battle simulations on a remote server, thus freeing your machine up. On the other hand, the results will take a bit longer to arrive"
					></preference-toggle>
					<preference-toggle
						field="bgsShowHeroSelectionScreen"
						[ngClass]="{ 'disabled': !value.bgsEnableApp || !value.bgsFullToggle }"
						label="Show hero selection screen"
						tooltip="When turned on, a window with stats on the heroes offered is shown"
					></preference-toggle>
					<preference-toggle
						field="bgsShowNextOpponentRecapSeparately"
						[ngClass]="{ 'disabled': !value.bgsEnableApp || !value.bgsFullToggle }"
						label="Show next opp recap"
						tooltip="On the second-screen BG window, shows your next opponent's info at the top in a bigger space, in addition to being in the list with all the others below."
					></preference-toggle>
					<preference-toggle
						field="bgsShowHeroSelectionAchievements"
						[ngClass]="{ 'disabled': !value.bgsFullToggle }"
						label="Show achievements"
						tooltip="Shows the missing achievements for each hero at the hero selection stage."
					></preference-toggle>
					<preference-toggle
						field="bgsShowHeroSelectionTooltip"
						[ngClass]="{ 'disabled': !value.bgsFullToggle }"
						label="Show hero tooltip"
						tooltip="Shows hero stats when mousing over the hero portrait on the game's hero selection screen."
					></preference-toggle>
					<preference-toggle
						field="bgsUseLocalPostMatchStats"
						[ngClass]="{ 'disabled': !value.bgsEnableApp || !value.bgsFullToggle }"
						label="Compute post-match stats locally"
						tooltip="When turned on, the stats that appear on the post-match screen will be computed locally, which is faster but can be CPU intensive. Turn it off to compute the stats on the cloud (it will take a bit more time though)"
					></preference-toggle>
					<preference-toggle
						field="bgsUseOverlay"
						[ngClass]="{ 'disabled': !value.bgsEnableApp || !value.bgsFullToggle }"
						label="Set integrated mode"
						tooltip="When turned on, the battlegrounds window becomes an overlay, and is bound to the game window. Using this is recommended for single monitor setups, or if you want to stream the app"
						[toggleFunction]="toggleOverlay"
					></preference-toggle>
					<preference-toggle
						field="bgsShowOverlayButton"
						[ngClass]="{ 'disabled': !value.bgsEnableApp || !value.bgsFullToggle || !value.bgsUseOverlay }"
						label="Show overlay button"
						tooltip="Shows a button on the overlay to toggle the main window or on off, which you can use instead of the hotkeys"
					></preference-toggle>
					<preference-toggle
						field="bgsForceShowPostMatchStats"
						[ngClass]="{ 'disabled': !value.bgsEnableApp || !value.bgsFullToggle }"
						label="Popup post-match stats"
						tooltip="When active, the battlegrounds window will be restored after a match to show the post-match stats, even if it was minimized"
					></preference-toggle>
				</div>
			</div>

			<div class="title">Simulator configuration</div>
			<div class="settings-group">
				<preference-toggle
					field="bgsEnableSimulationSampleInOverlay"
					[ngClass]="{
						'disabled':
							!value.enableSimulation || !value.bgsEnableBattleSimulationOverlay || !value.bgsFullToggle
					}"
					label="Simulation example in overlay"
					tooltip="Adds a button to view an example of how the simulator reached a specific result. WARNING: it will open a new tab in your default browser."
				></preference-toggle>
				<div
					class="slider-label"
					[ngClass]="{
						'disabled': !value.useLocalSimulator || !value.enableSimulation || !value.bgsFullToggle
					}"
					helpTooltip="The number of simulations ran for each battle. We found 5,000 simulations to be a perfect spot. Increasing the number will increase the accuracy of the calculation but will require more resources from your PC."
				>
					Number of simulations
				</div>
				<preference-slider
					class="simulation-slider"
					field="bgsSimulatorNumberOfSims"
					[enabled]="value.useLocalSimulator && value.bgsEnableApp && value.bgsFullToggle"
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
export class SettingsBattlegroundsGeneralComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit {
	useLocalSimulator$: Observable<boolean>;
	enableSimulation$: Observable<boolean>;
	bgsHideSimResultsOnRecruit$: Observable<boolean>;
	bgsShowSimResultsOnlyOnRecruit$: Observable<boolean>;
	bgsEnableOpponentBoardMouseOver$: Observable<boolean>;
	bgsFullToggle$: Observable<boolean>;
	bgsEnableApp$: Observable<boolean>;
	bgsUseOverlay$: Observable<boolean>;

	numberOfSimsKnobs: readonly Knob[] = [
		{
			absoluteValue: 2500,
		},
	];
	sizeKnobs: readonly Knob[] = [
		{
			percentageValue: 0,
			label: 'Small',
		},
		{
			percentageValue: 18,
			label: 'Medium',
		},
		{
			percentageValue: 100,
			label: 'Large',
		},
	];

	// private preferencesSubscription: Subscription;

	private reloadBgWindows;

	constructor(
		private prefs: PreferencesService,
		private el: ElementRef,
		private ow: OverwolfService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.useLocalSimulator$ = this.listenForBasicPref$((prefs) => prefs.bgsUseLocalSimulator);
		this.enableSimulation$ = this.listenForBasicPref$((prefs) => prefs.bgsEnableSimulation);
		this.bgsHideSimResultsOnRecruit$ = this.listenForBasicPref$((prefs) => prefs.bgsHideSimResultsOnRecruit);
		this.bgsShowSimResultsOnlyOnRecruit$ = this.listenForBasicPref$(
			(prefs) => prefs.bgsShowSimResultsOnlyOnRecruit,
		);
		this.bgsEnableOpponentBoardMouseOver$ = this.listenForBasicPref$(
			(prefs) => prefs.bgsEnableOpponentBoardMouseOver,
		);
		this.bgsEnableApp$ = this.listenForBasicPref$((prefs) => prefs.bgsEnableApp);
		this.bgsUseOverlay$ = this.listenForBasicPref$((prefs) => prefs.bgsUseOverlay);
		this.bgsFullToggle$ = this.listenForBasicPref$((prefs) => prefs.bgsFullToggle);
	}

	ngAfterViewInit() {
		this.reloadBgWindows = this.ow.getMainWindow().reloadBgWindows;
	}

	toggleOverlay = () => {
		this.reloadBgWindows();
	};
}
