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
				<preference-toggle
					[field]="'mercenariesShowColorChartButton'"
					[label]="'Show role chart'"
					helpTooltip="When active, adds a small button below the team widget over which you can mouse over to display a recap of the roles bonus damage triangle"
				></preference-toggle>
				<preference-toggle
					[field]="'mercenariesHighlightSynergies'"
					[label]="'Highlight synergies'"
					helpTooltip="When mousing over an ability or equipment (in the team widget) or a treasure (in the treasure selection screen), highlights all cards in the team widget that have synergies with it."
				></preference-toggle>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsMercenariesGeneralComponent {}
