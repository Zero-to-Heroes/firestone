import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { Observable } from 'rxjs';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';
import { Knob } from '../preference-slider.component';

@Component({
	selector: 'settings-decktracker-turn-timer',
	styleUrls: [
		`../../../../css/global/scrollbar-settings.scss`,
		`../../../../css/global/forms.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/decktracker/settings-decktracker-turn-timer.component.scss`,
	],
	template: `
		<div class="decktracker-appearance" scrollable *ngIf="{ showTurnTimer: showTurnTimer$ | async } as value">
			<div class="subtitle" [owTranslate]="'settings.decktracker.turn-timer.title'"></div>
			<div class="settings-group">
				<preference-toggle
					field="showTurnTimer"
					[label]="'settings.decktracker.turn-timer.show-turn-timer-label' | owTranslate"
					[tooltip]="'settings.decktracker.turn-timer.show-turn-timer-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="showTurnTimerMatchLength"
					[label]="'settings.decktracker.turn-timer.show-turn-timer-match-length-label' | owTranslate"
					[tooltip]="'settings.decktracker.turn-timer.show-turn-timer-match-length-tooltip' | owTranslate"
				></preference-toggle>
			</div>

			<div class="title" [owTranslate]="'settings.decktracker.turn-timer.size-title'"></div>
			<div class="settings-group">
				<preference-slider
					class="size-slider"
					field="turnTimerWidgetScale"
					[enabled]="value.showTurnTimer"
					[showCurrentValue]="false"
					displayedValueUnit=""
					[min]="60"
					[max]="140"
					[snapSensitivity]="5"
					[knobs]="sizeKnobs"
				>
				</preference-slider>
			</div>

			<div class="title" [owTranslate]="'settings.decktracker.turn-timer.opacity-title'"></div>
			<div class="settings-group">
				<preference-slider
					class="opacity-slider"
					field="turnTimerWidgetOpacity"
					[enabled]="value.showTurnTimer"
					[showCurrentValue]="false"
					displayedValueUnit=""
					[min]="0"
					[max]="100"
					[snapSensitivity]="5"
					[knobs]="opacityKnobs"
				>
				</preference-slider>
			</div>

			<div class="title" [owTranslate]="'settings.decktracker.turn-timer.width-title'"></div>
			<div class="settings-group">
				<preference-slider
					class="opacity-slider"
					field="turnTimerWidgetWidth"
					[enabled]="value.showTurnTimer"
					[showCurrentValue]="false"
					displayedValueUnit=""
					[min]="100"
					[max]="300"
					[snapSensitivity]="5"
					[knobs]="sizeKnobs"
				>
				</preference-slider>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsDecktrackerTurnTimerComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit
{
	showTurnTimer$: Observable<boolean>;

	sizeKnobs: readonly Knob[] = [
		{
			percentageValue: 0,
			label: this.i18n.translateString('settings.global.knob-sizes.small'),
		},
		{
			percentageValue: 50,
			label: this.i18n.translateString('settings.global.knob-sizes.medium'),
		},
		{
			percentageValue: 100,
			label: this.i18n.translateString('settings.global.knob-sizes.large'),
		},
	];
	opacityKnobs: readonly Knob[] = [
		{
			percentageValue: 0,
			label: this.i18n.translateString('settings.global.knob-opacity.transparent'),
		},
		{
			percentageValue: 100,
			label: this.i18n.translateString('settings.global.knob-opacity.opaque'),
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
		this.showTurnTimer$ = this.listenForBasicPref$((prefs) => prefs.showTurnTimer);
	}
}
