import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { Knob } from '../preference-slider.component';

@Component({
	selector: 'settings-decktracker-mulligan',
	styleUrls: [
		`../../../../css/global/scrollbar-settings.scss`,
		`../../../../css/global/forms.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`./settings-decktracker-mulligan.component.scss`,
	],
	template: `
		<div class="decktracker-appearance" scrollable>
			<div class="settings-group">
				<preference-toggle
					field="decktrackerShowMulliganCardImpact"
					[label]="'settings.decktracker.mulligan.show-mulligan-card-impact-label' | owTranslate"
					[tooltip]="'settings.decktracker.mulligan.show-mulligan-card-impact-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="decktrackerShowMulliganDeckOverview"
					[label]="'settings.decktracker.mulligan.show-mulligan-deck-overview-label' | owTranslate"
					[tooltip]="'settings.decktracker.mulligan.show-mulligan-deck-overview-tooltip' | owTranslate"
				></preference-toggle>
			</div>

			<div class="title" [owTranslate]="'settings.decktracker.mulligan.size'"></div>
			<div class="settings-group">
				<preference-slider
					class="first-slider"
					[field]="'decktrackerMulliganScale'"
					[enabled]="true"
					[min]="25"
					[max]="175"
					[snapSensitivity]="5"
					[knobs]="sizeKnobs"
				>
				</preference-slider>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsDecktrackerMulliganComponent {
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

	constructor(private readonly i18n: LocalizationFacadeService) {}
}
