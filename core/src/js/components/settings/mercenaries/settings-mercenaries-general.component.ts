import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'settings-mercenaries-general',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
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
					[label]="'Player team widget'"
					helpTooltip="When active, shows a recap overlay of all your heroes, abililties and equipment. "
				></preference-toggle>
				<preference-toggle
					[field]="'mercenariesEnableOpponentTeamWidget'"
					[label]="'Opponent team widget'"
					helpTooltip="When active, shows a recap overlay of all known opponent's heroes, abililties and equipment. "
				></preference-toggle>
				<preference-toggle
					[field]="'mercenariesEnableOutOfCombatPlayerTeamWidget'"
					[label]="'Out of combat team widget'"
					helpTooltip="When active, shows a recap overlay of all your heroes, abililties and equipment on the bounty map. Useful for easily inspecting your team when choosing a path or picking a treasure. "
				></preference-toggle>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsMercenariesGeneralComponent {}
