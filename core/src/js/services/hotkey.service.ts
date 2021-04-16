import { Injectable } from '@angular/core';
import { OverwolfService } from './overwolf.service';

@Injectable()
export class HotkeyService {
	constructor(private readonly ow: OverwolfService) {}

	public async getHotkeyCombination(hotkeyName: string): Promise<string> {
		const hotkey = (await this.ow.getHotKey(hotkeyName)).binding || 'Unassigned';
		const hotkeyText = hotkey === 'Unassigned' ? 'No hotkey assigned' : this.splitHotkey(hotkey);
		return hotkeyText;
	}

	private splitHotkey(hotkey: string): string {
		const split = hotkey.split('+');
		return `Show/Hide: ${split.map(splitItem => splitItem).join('+')}`;
	}
}
