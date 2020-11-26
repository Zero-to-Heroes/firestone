import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'settings-replays-general',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/global/scrollbar-settings.scss`,
		`../../../../css/global/forms.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/replays/settings-replays-general.component.scss`,
	],
	template: `
		<div class="replays-general">
			<div class="settings-group">
				<!-- <preference-toggle
					[field]="'replaysShowNotification'"
					[label]="'Show notifications'"
				></preference-toggle> -->
				No settings there yet
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsReplaysGeneralComponent {}
