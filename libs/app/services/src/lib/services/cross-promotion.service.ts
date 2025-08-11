import { Injectable } from '@angular/core';
import { OverwolfService } from '@firestone/shared/framework/core';

@Injectable({ providedIn: 'root' })
export class CrossPromotionService {
	constructor(private readonly ow: OverwolfService) {}

	public async isBazaarInstalled(): Promise<boolean> {
		const info = await this.ow.getGameInfo(24780);
		console.debug('[cross-promotion] bazaar gameInfo', info);
		return info?.gameInfo != null;
	}

	public async isBazaarTrackerInstalled(): Promise<boolean> {
		const info = await this.ow.getExtensionInfo('ljobjikjbmlfnajgidkmpcdmblmfmccjcabebbnm');
		console.debug('[cross-promotion] bazaar tracker extensionInfo', info);
		return info.error !== 'Extension not found.';
	}
}
