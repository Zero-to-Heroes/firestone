import { Injectable } from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { waitForReady } from '@firestone/shared/framework/core';
import { combineLatest, distinctUntilChanged, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ScalingService {
	constructor(private readonly prefs: PreferencesService) {
		this.init();
	}

	private async init() {
		await waitForReady(this.prefs);

		this.prefs.preferences$$.pipe(map((prefs) => prefs.cardTooltipScale)).subscribe(async (scale) => {
			const newScale = (scale ?? 100) / 100;
			document.documentElement.style.setProperty('--card-tooltip-scale', '' + newScale);
			console.debug('[scaling] card tooltip scale set', newScale);
		});

		combineLatest([
			this.prefs.preferences$$.pipe(
				map((prefs) => prefs.globalWidgetScale ?? 100),
				distinctUntilChanged(),
			),
			this.prefs.preferences$$.pipe(
				map((prefs) => prefs.bgsBannedTribeScale ?? 100),
				distinctUntilChanged(),
			),
		]).subscribe(([globalScale, scale]) => {
			const newScale = (globalScale / 100) * (scale / 100);
			document.documentElement.style.setProperty('--banned-tribes-scale', '' + newScale);
		});
	}
}
