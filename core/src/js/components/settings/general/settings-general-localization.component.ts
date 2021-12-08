import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'settings-general-localization',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/global/forms.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/general/settings-general-localization.component.scss`,
	],
	template: `
		<div class="settings-group localization">
			<div class="text">
				Firestone is slowly putting in place localization. For the moment, the options are very limited, and
				only concern the cards (text and images). Later on more languages will be added, and the app text itself
				will also be translated. But it takes time, so please be patient :)
			</div>
			<div class="text">
				Please restart the app (from the General tab) to make sure the new language is taken into account
			</div>
			<localization-dropdown class="language-dropdown"></localization-dropdown>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsGeneralLocalizationComponent {}
