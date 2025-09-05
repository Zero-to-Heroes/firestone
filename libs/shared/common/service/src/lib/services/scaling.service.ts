import { Injectable } from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { waitForReady } from '@firestone/shared/framework/core';
import { map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ScalingService {
	constructor(private readonly prefs: PreferencesService) {
		this.init();
	}

	private async init() {
		await waitForReady(this.prefs);

		this.prefs.preferences$$.pipe(map((prefs) => prefs.cardTooltipScale)).subscribe(async (scale) => {
			const newScale = (scale ?? 100) / 100;
			// Set the --card-tooltip-scale CSS variable at the root element of theWindow
			document.documentElement.style.setProperty('--card-tooltip-scale', '' + newScale);
			console.debug('[scaling] card tooltip scale set', newScale);
			// console.debug('getting scalable elements');
			// const elements = await this.getScalableElements();
			// console.debug('scalable elements', elements);
			// elements.forEach((element) => {
			// 	this.renderer.setStyle(element, 'transform', `scale(${newScale})`);
			// 	this.renderer.setStyle(element, 'opacity', `1`);
			// });
			// console.debug('scalable elements set');
		});
	}
}
