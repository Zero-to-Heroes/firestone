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
					[field]="'mercenariesEnableOpponentTeamWidget'"
					[label]="'Opponent team widget'"
					helpTooltip="When active, shows a recap overlay of all known opponent's heroes, abililties and equipment. "
				></preference-toggle>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsMercenariesGeneralComponent {}
