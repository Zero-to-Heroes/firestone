import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { Knob } from '../preference-slider.component';

@Component({
	selector: 'settings-arena-general',
	styleUrls: [
		`../../../../css/global/scrollbar-settings.scss`,
		`../../../../css/global/forms.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/collection/settings-collection-notification.component.scss`,
		`./settings-arena-general.component.scss`,
	],
	template: `
		<div class="collection-notification">
			<section class="settings-group">
				<preference-toggle
					field="arenaShowHeroSelectionOverlay"
					[label]="'settings.arena.general.show-hero-selection-overlay' | owTranslate"
					[tooltip]="'settings.arena.general.show-hero-selection-overlay-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="arenaShowCardSelectionOverlay"
					[label]="'settings.arena.general.show-card-selection-overlay' | owTranslate"
					[tooltip]="'settings.arena.general.show-card-selection-overlay-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="arenaShowOocTracker"
					[label]="'settings.arena.general.show-draft-tracker' | owTranslate"
					[tooltip]="'settings.arena.general.show-draft-tracker-tooltip' | owTranslate"
				></preference-toggle>
			</section>
			<section class="settings-group">
				<div class="subtitle" [owTranslate]="'settings.arena.general.tracker-size'"></div>
				<preference-slider
					class="slider first-slider"
					[field]="'arenaOocTrackerScale'"
					[enabled]="true"
					[min]="50"
					[max]="150"
					[snapSensitivity]="5"
					[knobs]="sizeKnobs"
				>
				</preference-slider>
				<div class="subtitle" [owTranslate]="'settings.arena.general.draft-overlay-size'"></div>
				<preference-slider
					class="first-slider"
					[field]="'arenaDraftOverlayScale'"
					[enabled]="true"
					[min]="50"
					[max]="175"
					[snapSensitivity]="5"
					[knobs]="sizeKnobs"
				>
				</preference-slider>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsArenaGeneralComponent {
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
