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
						field="bgsUseLocalSimulator"
						label="Use local battle simulator"
						tooltip="Turning that off will run the battle simulations on a remote server, thus freeing your machine up. On the other hand, the results will take a bit longer to arrive"
					></preference-toggle>
				</div>
			</div>
			<div
				class="title"
				helpTooltip="The number of simulations ran for each battle. The more simulations, the better the results, but the heavier the load on your PC. The default value of 2500 iterations is usually a good compromise."
			>
				Local simulator configuration
			</div>
			<div class="settings-group">
				<div class="text" [ngClass]="{ 'disabled': !useLocalSimulator }">Number of simulations</div>
				<preference-slider
					class="first-slider"
					field="bgsSimulatorNumberOfSims"
					[enabled]="useLocalSimulator"
					[showCurrentValue]="true"
					displayedValueUnit=""
					[min]="1500"
					[max]="10000"
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
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
