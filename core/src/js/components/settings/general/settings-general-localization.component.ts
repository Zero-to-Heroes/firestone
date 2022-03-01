import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';

@Component({
	selector: 'settings-general-localization',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/global/forms.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/general/settings-general-localization.component.scss`,
	],
	template: `
		<div class="title" [owTranslate]="'settings.general.localization.title'"></div>
		<div class="settings-group localization">
			<div class="text" [innerHTML]="text1"></div>
			<div class="text" [innerHTML]="text11"></div>
			<div class="text" [innerHTML]="text2"></div>
			<div class="text" [innerHTML]="text3"></div>
			<localization-dropdown class="language-dropdown"></localization-dropdown>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsGeneralLocalizationComponent {
	text1 = this.i18n.translateString('settings.general.localization.text-1');
	text11 = this.i18n.translateString('settings.general.localization.text-11');
	text2 = this.i18n.translateString('settings.general.localization.text-2', {
		link: `<a href="https://github.com/Zero-to-Heroes/firestone-translations/blob/main/README.md" target="_blank">${this.i18n.translateString(
			'settings.general.localization.link',
		)}</a
	>`,
	});
	text3 = this.i18n.translateString('settings.general.localization.text-3');

	constructor(private readonly i18n: LocalizationFacadeService) {}
}
