import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { Knob } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { Observable } from 'rxjs';

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
export class SettingsDecktrackerTurnTimerComponent extends AbstractSubscriptionComponent implements AfterContentInit {
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
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs);

		this.showTurnTimer$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.showTurnTimer));

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
