import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
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
				[label]="'settings.battlegrounds.full-toggle-label' | owTranslate"
				[tooltip]="'settings.battlegrounds.full-toggle-tooltip' | owTranslate"
			></preference-toggle>

			<div class="title" [owTranslate]="'settings.battlegrounds.overlay.overlay-title'"></div>
			<div class="settings-group">
				<preference-toggle
					field="bgsShowBannedTribesOverlay"
					[ngClass]="{ 'disabled': !value.bgsFullToggle }"
					[label]="'settings.battlegrounds.overlay.show-banned-tribes-label' | owTranslate"
					[tooltip]="'settings.battlegrounds.overlay.show-banned-tribes-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="bgsEnableMinionListOverlay"
					[ngClass]="{ 'disabled': !value.bgsFullToggle }"
					[label]="'settings.battlegrounds.overlay.show-minions-list-label' | owTranslate"
					[tooltip]="'settings.battlegrounds.overlay.show-minions-list-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="bgsEnableTurnNumbertOverlay"
					[ngClass]="{ 'disabled': !value.bgsFullToggle }"
					[label]="'settings.battlegrounds.overlay.turn-counter-label' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="bgsShowLastOpponentIconInOverlay"
					[ngClass]="{ 'disabled': !value.bgsFullToggle }"
					[label]="'settings.battlegrounds.overlay.last-opponent-icon-label' | owTranslate"
					[tooltip]="'settings.battlegrounds.overlay.last-opponent-icon-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="bgsEnableOpponentBoardMouseOver"
					[ngClass]="{ 'disabled': !value.bgsFullToggle }"
					[label]="'settings.battlegrounds.overlay.last-opponent-board-label' | owTranslate"
					[tooltip]="'settings.battlegrounds.overlay.last-opponent-board-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="bgsEnableBattleSimulationOverlay"
					[ngClass]="{ 'disabled': !value.enableSimulation || !value.bgsFullToggle }"
					[label]="'settings.battlegrounds.overlay.battle-simulation-label' | owTranslate"
					[tooltip]="'settings.battlegrounds.overlay.battle-simulation-tooltip' | owTranslate"
				></preference-toggle>
			</div>

			<div class="title" [owTranslate]="'settings.battlegrounds.general.simulator-config-title'"></div>
			<div class="settings-group">
				<preference-toggle
					field="bgsEnableSimulationSampleInOverlay"
					[ngClass]="{
						'disabled':
							!value.enableSimulation || !value.bgsEnableBattleSimulationOverlay || !value.bgsFullToggle
					}"
					[label]="'settings.battlegrounds.overlay.battle-simulation-example-label' | owTranslate"
					[tooltip]="'settings.battlegrounds.overlay.battle-simulation-example-tooltip' | owTranslate"
				></preference-toggle>
				<div class="slider-label" [owTranslate]="'settings.global.widget-size-label'"></div>
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

			<div class="title" [owTranslate]="'settings.battlegrounds.overlay.banned-tribes-title'"></div>
			<div class="settings-group" [ngClass]="{ 'disabled': !value.showBannedTribes || !value.bgsFullToggle }">
				<preference-toggle
					class="banned-tribes-vertical"
					field="bgsBannedTribesShowVertically"
					[ngClass]="{ 'disabled': !value.bgsFullToggle || !value.showBannedTribes }"
					[label]="'settings.battlegrounds.overlay.banned-tribes-show-in-column-label' | owTranslate"
					[tooltip]="'settings.battlegrounds.overlay.banned-tribes-show-in-column-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="bgsShowAvailableTribesOverlay"
					[ngClass]="{ 'disabled': !value.bgsFullToggle || !value.showBannedTribes }"
					[label]="'settings.battlegrounds.overlay.show-available-tribes-label' | owTranslate"
					[tooltip]="'settings.battlegrounds.overlay.show-available-tribes-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="bgsTribesOverlaySingleRow"
					[ngClass]="{ 'disabled': !value.bgsFullToggle || !value.showBannedTribes }"
					[label]="'settings.battlegrounds.overlay.banned-tribes-single-row-label' | owTranslate"
					[tooltip]="'settings.battlegrounds.overlay.banned-tribes-single-row-tooltip' | owTranslate"
				></preference-toggle>
				<div
					class="slider-label"
					[owTranslate]="'settings.battlegrounds.overlay.banned-tribes-icon-size-label'"
				></div>
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

			<div class="title" [owTranslate]="'settings.battlegrounds.overlay.minions-list-title'"></div>
			<div class="settings-group">
				<preference-toggle
					field="bgsEnableMinionListMouseOver"
					[ngClass]="{ 'disabled': !value.bgsFullToggle || !value.bgsEnableMinionListOverlay }"
					[label]="'settings.battlegrounds.overlay.minions-list-show-on-mouse-over-label' | owTranslate"
					[tooltip]="'settings.battlegrounds.overlay.minions-list-show-on-mouse-over-tooltip' | owTranslate"
					advancedSetting
					[messageWhenToggleValue]="
						'settings.battlegrounds.overlay.minions-list-show-on-mouse-over-confirmation' | owTranslate
					"
					[valueToDisplayMessageOn]="false"
				></preference-toggle>
				<preference-toggle
					field="bgsShowTribesHighlight"
					[ngClass]="{ 'disabled': !value.bgsFullToggle || !value.bgsEnableMinionListOverlay }"
					[label]="'settings.battlegrounds.overlay.minions-list-show-tribes-highlight-label' | owTranslate"
					[tooltip]="
						'settings.battlegrounds.overlay.minions-list-show-tribes-highlight-tooltip' | owTranslate
					"
				></preference-toggle>
				<preference-toggle
					field="bgsMinionListShowGoldenCard"
					[ngClass]="{ 'disabled': !value.bgsFullToggle || !value.bgsEnableMinionListOverlay }"
					[label]="'settings.battlegrounds.overlay.minions-list-show-golden-cards-label' | owTranslate"
					[tooltip]="'settings.battlegrounds.overlay.minions-list-show-golden-cards-tooltip' | owTranslate"
				></preference-toggle>
				<div class="slider-label" [owTranslate]="'settings.global.widget-size-label'"></div>
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

			<div class="title" [owTranslate]="'settings.battlegrounds.overlay.opponent-board-title'"></div>
			<div
				class="settings-group"
				[ngClass]="{ 'disabled': !value.bgsEnableOpponentBoardMouseOver || !value.bgsFullToggle }"
			>
				<preference-toggle
					class="opponent-board-top"
					field="bgsOpponentOverlayAtTop"
					[ngClass]="{ 'disabled': !value.bgsEnableOpponentBoardMouseOver || !value.bgsFullToggle }"
					[label]="'settings.battlegrounds.overlay.opponent-board-show-top-label' | owTranslate"
					[tooltip]="'settings.battlegrounds.overlay.opponent-board-show-top-tooltip' | owTranslate"
				></preference-toggle>
				<div class="slider-label" [owTranslate]="'settings.global.widget-size-label'"></div>
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

			<div class="title" [owTranslate]="'settings.battlegrounds.overlay.counters-title'"></div>
			<div class="settings-group">
				<preference-toggle
					field="playerBgsSouthseaCounter"
					[ngClass]="{ 'disabled': !value.bgsFullToggle }"
					[label]="'settings.battlegrounds.overlay.counter-soutshsea-label' | owTranslate"
					[tooltip]="'settings.battlegrounds.overlay.counter-soutshsea-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="playerBgsMajordomoCounter"
					[ngClass]="{ 'disabled': !value.bgsFullToggle }"
					[label]="'settings.battlegrounds.overlay.counter-majordomo-label' | owTranslate"
					[tooltip]="'settings.battlegrounds.overlay.counter-majordomo-tooltip' | owTranslate"
				></preference-toggle>
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
			label: this.i18n.translateString('settings.global.knob-sizes.small'),
		},
		{
			percentageValue: 18,
			label: this.i18n.translateString('settings.global.knob-sizes.medium'),
		},
		{
			percentageValue: 100,
			label: this.i18n.translateString('settings.global.knob-sizes.large'),
		},
	];

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
	) {
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
