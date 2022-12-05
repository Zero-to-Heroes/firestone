import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'settings-replays-general',
	styleUrls: [
		`../../../../css/global/scrollbar-settings.scss`,
		`../../../../css/global/forms.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/replays/settings-replays-general.component.scss`,
	],
	template: `
		<div class="replays-general">
			<div class="settings-group" [owTranslate]="'settings.replays.empty-state'"></div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsReplaysGeneralComponent {}
