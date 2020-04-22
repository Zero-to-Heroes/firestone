import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'settings-general-launch',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/global/forms.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/general/settings-general-launch.component.scss`,
	],
	template: `
		<div class="settings-group general-launch">
			<section class="toggle-label">
				<preference-toggle
					field="launchAppOnGameStart"
					label="Launch Firestone when game starts"
					tooltip="When turned off, you need to manually launch Firestone every time"
				></preference-toggle>
				<preference-toggle
					field="shareGamesWithVS"
					label="Contribute to the VS meta report"
					tooltip="When turned on, you contribute to build the Vicious Syndicate meta report. The server parses your games and extracts some global info (like the game's rank, the cards played) and anonymously sends this aggregated data to Vicious Syndicate. We don't get paid for this, but we do get some exposure since they then talk about us :)"
				></preference-toggle>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsGeneralLaunchComponent {}
