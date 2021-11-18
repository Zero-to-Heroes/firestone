import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef } from '@angular/core';
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
				bgsEnableBattleSimulationOverlay: bgsEnableBattleSimulationOverlay$ | async,
				bgsHideSimResultsOnRecruit: bgsHideSimResultsOnRecruit$ | async,
				bgsShowSimResultsOnlyOnRecruit: bgsShowSimResultsOnlyOnRecruit$ | async,
				bgsEnableOpponentBoardMouseOver: bgsEnableOpponentBoardMouseOver$ | async,
				bgsFullToggle: bgsFullToggle$ | async,
				bgsEnableApp: bgsEnableApp$ | async,
				bgsUseOverlay: bgsUseOverlay$ | async,
				showBannedTribes: showBannedTribes$ | async,
				bgsEnableMinionListOverlay: bgsEnableMinionListOverlay$ | async
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
			<div class="title">Overlay configuration</div>
			<div class="settings-group">
				<preference-toggle
					field="bgsShowBannedTribesOverlay"
					[ngClass]="{ 'disabled': !value.bgsFullToggle }"
					label="Show banned tribes"
					tooltip="Adds a small widget that shows what tribes are banned in the current run"
				></preference-toggle>
				<preference-toggle
					field="bgsShowLastOpponentIconInOverlay"
					[ngClass]="{ 'disabled': !value.bgsFullToggle }"
					label="Last opponent icon"
					tooltip="Adds an icon next to your last opponent in the leaderboard"
				></preference-toggle>
				<preference-toggle
					field="bgsEnableOpponentBoardMouseOver"
					[ngClass]="{ 'disabled': !value.bgsFullToggle }"
					label="Show last opponent board"
					tooltip="Show the last known opponent's board (and additional info) when mousing over their portrait in the leaderboard"
				></preference-toggle>
				<preference-toggle
					field="bgsEnableMinionListOverlay"
					[ngClass]="{ 'disabled': !value.bgsFullToggle }"
					label="Show minions list"
					tooltip="Show the list of minions, grouped by tavern tier"
				></preference-toggle>
				<preference-toggle
					field="bgsEnableMinionListMouseOver"
					[ngClass]="{ 'disabled': !value.bgsFullToggle || !value.bgsEnableMinionListOverlay }"
					label="Show minions list on mouse over"
					tooltip="When deactivated, you will have to click on the tavern tier icons to show the minions list"
					advancedSetting
					messageWhenToggleValue="Got it, we will only show you the minions details when you click on a star"
					[valueToDisplayMessageOn]="false"
				></preference-toggle>
				<preference-toggle
					field="bgsShowTribesHighlight"
					[ngClass]="{ 'disabled': !value.bgsFullToggle }"
					label="Show tribes highlight"
					tooltip="Adds buttons to highlight specific tribes in Bob's Tavern"
				></preference-toggle>
				<preference-toggle
					field="bgsEnableBattleSimulationOverlay"
					[ngClass]="{ 'disabled': !value.enableSimulation || !value.bgsFullToggle }"
					label="Battle Simulation overlay"
					tooltip="Also show the current battle simulation results as an overlay on top of the game"
				></preference-toggle>
				<preference-toggle
					field="bgsEnableSimulationSampleInOverlay"
					[ngClass]="{
						'disabled':
							!value.enableSimulation || !value.bgsEnableBattleSimulationOverlay || !value.bgsFullToggle
					}"
					label="Simulation example in overlay"
					tooltip="Adds a button to view an example of how the simulator reached a specific result. WARNING: it will open a new tab in your default browser."
				></preference-toggle>
				<!-- <preference-toggle
					field="playerBgsPogoCounter"
					[ngClass]="{ 'disabled': !value.bgsFullToggle }"
					label="Pogo-Hopper counter"
					tooltip="Show the number of times you played a Pogo-Hopper in Battlegrounds"
				></preference-toggle> -->
			</div>

			<div class="title">Local simulator configuration</div>
			<div class="settings-group">
				<div
					class="text"
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

			<div class="title">Banned tribes</div>
			<div class="settings-group" [ngClass]="{ 'disabled': !value.showBannedTribes || !value.bgsFullToggle }">
				<preference-toggle
					class="banned-tribes-vertical"
					field="bgsBannedTribesShowVertically"
					[ngClass]="{ 'disabled': !value.bgsFullToggle }"
					label="Show in column"
					tooltip="When active, banned tribes are shown in a column instead of a row"
				></preference-toggle>
				<div class="text">Icon size</div>
				<preference-slider
					class="banned-tribes-size-slider"
					field="bgsBannedTribeScale"
					[enabled]="value.bgsFullToggle"
					[showCurrentValue]="false"
					displayedValueUnit=""
					[min]="80"
					[max]="200"
					[snapSensitivity]="5"
					[knobs]="sizeKnobs"
				>
				</preference-slider>
			</div>

			<div class="title">Opponent board</div>
			<div class="settings-group" [ngClass]="{ 'disabled': !value.showBannedTribes || !value.bgsFullToggle }">
				<preference-toggle
					class="opponent-board-top"
					field="bgsOpponentOverlayAtTop"
					[ngClass]="{ 'disabled': !value.bgsEnableOpponentBoardMouseOver || !value.bgsFullToggle }"
					label="Show at top of the screen"
					tooltip="Toggle to show the opponent board at the top or bottom of the screen"
				></preference-toggle>
				<div class="text">Icon size</div>
				<preference-slider
					class="opponent-board-size-slider"
					field="bgsOpponentBoardScale"
					[enabled]="value.bgsFullToggle && value.bgsEnableOpponentBoardMouseOver"
					[showCurrentValue]="false"
					displayedValueUnit=""
					[min]="80"
					[max]="150"
					[snapSensitivity]="5"
					[knobs]="sizeKnobs"
				>
				</preference-slider>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsBattlegroundsGeneralComponent extends AbstractSubscriptionComponent implements AfterViewInit {
	useLocalSimulator$: Observable<boolean>;
	enableSimulation$: Observable<boolean>;
	bgsEnableBattleSimulationOverlay$: Observable<boolean>;
	bgsHideSimResultsOnRecruit$: Observable<boolean>;
	bgsShowSimResultsOnlyOnRecruit$: Observable<boolean>;
	bgsEnableOpponentBoardMouseOver$: Observable<boolean>;
	bgsFullToggle$: Observable<boolean>;
	bgsEnableApp$: Observable<boolean>;
	bgsUseOverlay$: Observable<boolean>;
	showBannedTribes$: Observable<boolean>;
	bgsEnableMinionListOverlay$: Observable<boolean>;

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

	ngAfterViewInit() {
		this.reloadBgWindows = this.ow.getMainWindow().reloadBgWindows;
		this.useLocalSimulator$ = this.listenForBasicPref$((prefs) => prefs.bgsUseLocalSimulator);
		this.enableSimulation$ = this.listenForBasicPref$((prefs) => prefs.bgsEnableSimulation);
		this.bgsEnableBattleSimulationOverlay$ = this.listenForBasicPref$(
			(prefs) => prefs.bgsEnableBattleSimulationOverlay,
		);
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
		this.showBannedTribes$ = this.listenForBasicPref$((prefs) => prefs.bgsShowBannedTribesOverlay);
		this.bgsEnableMinionListOverlay$ = this.listenForBasicPref$((prefs) => prefs.bgsEnableMinionListOverlay);
	}

	toggleOverlay = () => {
		this.reloadBgWindows();
	};
}
