import { ChangeDetectionStrategy, Component } from '@angular/core';

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
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsDecktrackerMulliganComponent {}
