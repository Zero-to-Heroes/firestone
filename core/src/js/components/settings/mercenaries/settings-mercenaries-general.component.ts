import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Knob } from '../preference-slider.component';

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
					[label]="'Team widget: Map'"
					helpTooltip="When active, shows a recap overlay of all your heroes, abililties and equipment on the bounty map. Useful for easily inspecting your team when choosing a path or picking a treasure. "
				></preference-toggle>
				<preference-toggle
					[field]="'mercenariesEnableOutOfCombatPlayerTeamWidgetOnVillage'"
					[label]="'Team widget: Village'"
					helpTooltip="When active, shows a recap overlay of all your heroes, abililties and equipment on the collection and team select screens. "
				></preference-toggle>
				<preference-toggle
					[field]="'mercenariesEnableActionsQueueWidgetPvE'"
					[label]="'Actions queue widget (PvE)'"
					helpTooltip="When active, shows an ordered list of all queued actions in PvE encounters. "
				></preference-toggle>
				<preference-toggle
					[field]="'mercenariesEnableActionsQueueWidgetPvP'"
					[label]="'Actions queue widget (PvP)'"
					helpTooltip="When active, shows an ordered list of all queued actions in PvP encounters. Because the opponent's actions are hidden until they resolve, this will only show you your own mercenaries' actions."
				></preference-toggle>
				<preference-toggle
					[field]="'mercenariesShowColorChartButton'"
					[label]="'Show role chart'"
					helpTooltip="When active, adds a small button below the team widget over which you can mouse over to display a recap of the roles bonus damage triangle"
				></preference-toggle>
				<preference-toggle
					[field]="'mercenariesShowTaskButton'"
					[label]="'Show tasks button'"
					helpTooltip="When active, adds a small button below the team widget over which you can mouse over to display a recap of all your current tasks. Always hidden in PvP."
				></preference-toggle>
				<preference-toggle
					[field]="'mercenariesHighlightSynergies'"
					[label]="'Highlight synergies'"
					helpTooltip="When mousing over an ability or equipment (in the team widget) or a treasure (in the treasure selection screen), highlights all cards in the team widget that have synergies with it."
				></preference-toggle>
			</div>

			<div class="title">Widgets size</div>
			<div class="settings-group">
				<div class="subtitle">Your team</div>
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
				<div class="subtitle">Opponent's team</div>
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
				<div class="subtitle">Action queue</div>
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
			label: 'Small',
		},
		{
			absoluteValue: 100,
			label: 'Medium',
		},
		{
			absoluteValue: 125,
			label: 'Large',
		},
	];
}
