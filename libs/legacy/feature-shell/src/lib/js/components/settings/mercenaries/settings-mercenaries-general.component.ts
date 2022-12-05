import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { Knob } from '../preference-slider.component';

@Component({
	selector: 'settings-mercenaries-general',
	styleUrls: [
		`../../../../css/global/scrollbar-settings.scss`,
		`../../../../css/global/forms.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/mercenaries/settings-mercenaries-general.component.scss`,
	],
	template: `
		<div class="mercenaries-general">
			<div class="settings-group">
				<preference-toggle
					[field]="'mercenariesEnablePlayerTeamWidget'"
					[label]="'settings.mercenaries.general.player-team-widget-label' | owTranslate"
					[tooltip]="'settings.mercenaries.general.player-team-widget-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					[field]="'mercenariesEnableOpponentTeamWidget'"
					[label]="'settings.mercenaries.general.opponent-team-widget-label' | owTranslate"
					[tooltip]="'settings.mercenaries.general.opponent-team-widget-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					[field]="'mercenariesEnableOutOfCombatPlayerTeamWidget'"
					[label]="'settings.mercenaries.general.map-team-widget-label' | owTranslate"
					[tooltip]="'settings.mercenaries.general.map-team-widget-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					[field]="'mercenariesEnableOutOfCombatPlayerTeamWidgetOnVillage'"
					[label]="'settings.mercenaries.general.village-team-widget-label' | owTranslate"
					[tooltip]="'settings.mercenaries.general.village-team-widget-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					[field]="'mercenariesEnableActionsQueueWidgetPvE'"
					[label]="'settings.mercenaries.general.action-queue-pve-label' | owTranslate"
					[tooltip]="'settings.mercenaries.general.action-queue-pve-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					[field]="'mercenariesEnableActionsQueueWidgetPvP'"
					[label]="'settings.mercenaries.general.action-queue-pvp-label' | owTranslate"
					[tooltip]="'settings.mercenaries.general.action-queue-pvp-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					[field]="'mercenariesHighlightSynergies'"
					[label]="'settings.mercenaries.general.synergies-label' | owTranslate"
					[tooltip]="'settings.mercenaries.general.synergies-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					[field]="'mercenariesShowTurnCounterInBattle'"
					[label]="'settings.mercenaries.general.turn-counter-battle-label' | owTranslate"
					[tooltip]="'settings.mercenaries.general.turn-counter-battle-tooltip' | owTranslate"
				></preference-toggle>
			</div>

			<div class="title" [owTranslate]="'settings.global.widget-size-label'"></div>
			<div class="settings-group">
				<div class="subtitle" [owTranslate]="'settings.mercenaries.general.your-team'"></div>
				<preference-slider
					class="first-slider"
					[field]="'mercenariesPlayerTeamOverlayScale'"
					[enabled]="true"
					[min]="75"
					[max]="125"
					[snapSensitivity]="5"
					[knobs]="sizeKnobs"
				>
				</preference-slider>
				<div class="subtitle" [owTranslate]="'settings.mercenaries.general.opponent-team'"></div>
				<preference-slider
					class="first-slider"
					[field]="'mercenariesOpponentTeamOverlayScale'"
					[enabled]="true"
					[min]="75"
					[max]="125"
					[snapSensitivity]="5"
					[knobs]="sizeKnobs"
				>
				</preference-slider>
				<div class="subtitle" [owTranslate]="'settings.mercenaries.general.action-queue'"></div>
				<preference-slider
					class="first-slider"
					[field]="'mercenariesActionsQueueOverlayScale'"
					[enabled]="true"
					[min]="75"
					[max]="125"
					[snapSensitivity]="5"
					[knobs]="sizeKnobs"
				>
				</preference-slider>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsMercenariesGeneralComponent {
	sizeKnobs: readonly Knob[] = [
		{
			absoluteValue: 75,
			label: this.i18n.translateString('settings.global.knob-sizes.small'),
		},
		{
			absoluteValue: 100,
			label: this.i18n.translateString('settings.global.knob-sizes.medium'),
		},
		{
			absoluteValue: 125,
			label: this.i18n.translateString('settings.global.knob-sizes.large'),
		},
	];

	constructor(private readonly i18n: LocalizationFacadeService) {}
}
