import { Injectable } from '@angular/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { OverwolfService } from './overwolf.service';

@Injectable()
export class HotkeyService {
	constructor(private readonly ow: OverwolfService, private readonly i18n: LocalizationFacadeService) {}

	public async getHotkeyCombination(hotkeyName: string): Promise<string> {
		const hotkey = (await this.ow.getHotKey(hotkeyName))?.binding || 'Unassigned';
		const hotkeyText =
			hotkey === 'Unassigned'
				? this.i18n.translateString('app.global.controls.no-hotkey-assigned')
				: this.splitHotkey(hotkey);
		return hotkeyText;
	}

	private splitHotkey(hotkey: string): string {
		const split = hotkey.split('+');
		return `${this.i18n.translateString('app.global.controls.hotkey-text')} ${split
			.map((splitItem) => splitItem)
			.join('+')}`;
	}
}
