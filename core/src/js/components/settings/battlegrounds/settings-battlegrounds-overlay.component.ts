import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';
import { Knob } from '../preference-slider.component';

@Component({
	selector: 'settings-battlegrounds-overlay',
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
			<div class="title">Overlay configuration</div>
			<div class="settings-group">
				<preference-toggle
					field="bgsShowBannedTribesOverlay"
					[ngClass]="{ 'disabled': !value.bgsFullToggle }"
					label="Show banned tribes"
					tooltip="Adds a small widget that shows what tribes are banned in the current run"
				></preference-toggle>
				<preference-toggle
					field="bgsEnableMinionListOverlay"
					[ngClass]="{ 'disabled': !value.bgsFullToggle }"
					label="Show minions list"
					tooltip="Show the list of minions, grouped by tavern tier"
				></preference-toggle>
				<preference-toggle
					field="bgsEnableTurnNumbertOverlay"
					[ngClass]="{ 'disabled': !value.bgsFullToggle }"
					[label]="'battlegrounds.turn-counter.settings-label' | owTranslate"
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
					field="bgsEnableBattleSimulationOverlay"
					[ngClass]="{ 'disabled': !value.enableSimulation || !value.bgsFullToggle }"
					label="Battle Simulation overlay"
					tooltip="Also show the current battle simulation results as an overlay on top of the game"
				></preference-toggle>
			</div>

			<div class="title">Simulator configuration</div>
			<div class="settings-group">
				<div class="slider-label">Widget size</div>
				<preference-slider
					class="simulator-size-slider"
					field="bgsSimulatorScale"
					[enabled]="value.bgsFullToggle && value.bgsEnableApp"
					[showCurrentValue]="false"
					displayedValueUnit=""
					[min]="80"
					[max]="170"
					[snapSensitivity]="5"
					[knobs]="sizeKnobs"
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
				<div class="slider-label">Icon size</div>
				<preference-slider
					class="banned-tribes-size-slider"
					field="bgsBannedTribeScale"
					[enabled]="value.bgsFullToggle"
					[showCurrentValue]="false"
					displayedValueUnit=""
					[min]="80"
					[max]="135"
					[snapSensitivity]="5"
					[knobs]="sizeKnobs"
				>
				</preference-slider>
			</div>

			<div class="title">Minions list</div>
			<div class="settings-group">
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
					[ngClass]="{ 'disabled': !value.bgsFullToggle || !value.bgsEnableMinionListOverlay }"
					label="Show tribes highlight"
					tooltip="Adds buttons to highlight specific tribes in Bob's Tavern"
				></preference-toggle>
				<preference-toggle
					field="bgsMinionListShowGoldenCard"
					[ngClass]="{ 'disabled': !value.bgsFullToggle || !value.bgsEnableMinionListOverlay }"
					label="Show golden cards"
					tooltip="Show both the normal and golden version of cards when mousing over the minion"
				></preference-toggle>
				<div class="slider-label">Widget size</div>
				<preference-slider
					class="minions-list-size-slider"
					field="bgsMinionsListScale"
					[enabled]="value.bgsFullToggle && value.bgsEnableMinionListOverlay"
					[showCurrentValue]="false"
					displayedValueUnit=""
					[min]="80"
					[max]="135"
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
				<div class="slider-label">Icon size</div>
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
export class SettingsBattlegroundsOverlayComponent extends AbstractSubscriptionComponent implements AfterContentInit {
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

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit() {
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
}
