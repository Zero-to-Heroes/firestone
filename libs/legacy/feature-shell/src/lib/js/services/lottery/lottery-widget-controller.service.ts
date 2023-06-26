import { Injectable } from '@angular/core';
import { arraysEqual } from '@firestone/shared/framework/common';
import { OverwolfService } from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest, distinctUntilChanged, filter, map, startWith, tap } from 'rxjs';
import { AppUiStoreFacadeService } from '../ui-store/app-ui-store-facade.service';

@Injectable()
export class LotteryWidgetControllerService {
	public shouldTrack$$ = new BehaviorSubject<boolean>(true);

	constructor(private readonly store: AppUiStoreFacadeService, private readonly ow: OverwolfService) {
		this.init();
		window['lotteryWidgetController'] = this;
	}

	private async init() {
		await this.store.initComplete();
		const displayWidgetFromData$ = combineLatest([
			this.store.listen$(([main, nav, prefs]) => main.currentScene),
			this.store.listenPrefs$((prefs) => prefs.showLottery),
			this.store.hasPremiumSub$(),
		]).pipe(
			// tap((info) => console.debug('[lottery-widget] should track 0?', info)),
			map(([[currentScene], [showLottery], isPremium]) => {
				return (
					// currentScene === SceneMode.GAMEPLAY &&
					// Check for null so that by default it doesn't show up for premium users
					showLottery === true || (!isPremium && showLottery === null)
				);
			}),
		);
		combineLatest([this.store.listenPrefs$((prefs) => prefs.lotteryOverlay), displayWidgetFromData$])
			.pipe(
				tap((info) => console.debug('[lottery-widget] should show window?', info)),
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
			)
			.subscribe(async ([[lotteryOverlay], visible]) => {
				// console.debug('[lottery-widget] setting visibility', visible);
				const lotteryWindow = await this.ow.obtainDeclaredWindow(OverwolfService.LOTTERY_WINDOW);
				if (lotteryOverlay) {
					this.ow.closeWindow(lotteryWindow.id);
					return;
				}

				if (visible) {
					this.ow.restoreWindow(lotteryWindow.id);
					this.ow.bringToFront(lotteryWindow.id);
				} else {
					this.ow.closeWindow(lotteryWindow.id);
				}
			});

		const adVisible$ = this.store.eventBus$$.pipe(
			filter((event) => event?.name === 'lottery-visibility-changed'),
			map((event) => event.data.visible as 'hidden' | 'partial' | 'full'),
			distinctUntilChanged(),
			tap((info) => console.debug('[lottery-widget] ad visible?', info)),
			map((visible) => visible === 'full' || visible === 'partial'),
			startWith(true),
		);

		combineLatest([displayWidgetFromData$, adVisible$]).subscribe(([displayWidget, adVisible]) => {
			console.debug('[lottery-widget] should track?', displayWidget, adVisible);
			this.shouldTrack$$.next(displayWidget && adVisible);
		});
	}
}
