import { Injectable } from '@angular/core';
import { IAppVersionService } from '@firestone/app/common';
import { OverwolfService } from '@firestone/shared/framework/core';

@Injectable({ providedIn: 'root' })
export class OwAppVersionService implements IAppVersionService {
	constructor(private readonly ow: OverwolfService) {}

	async getAppVersion(): Promise<{ app: string; version: string }> {
		const version = await this.ow.getAppVersion('lnknbakkpommmjjdnelmfbjjdbocfpnpbkijjnob');
		return { app: 'firestone', version: version };
	}
}
