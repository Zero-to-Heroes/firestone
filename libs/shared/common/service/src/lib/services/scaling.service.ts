import { Inject, Injectable, Optional } from '@angular/core';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { ADS_SERVICE_TOKEN, IAdsService, waitForReady } from '@firestone/shared/framework/core';
import { combineLatest, distinctUntilChanged, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ScalingService {
	constructor(
		private readonly prefs: PreferencesService,
		@Optional() @Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
	) {
		this.init();
	}

	private async init() {
		await waitForReady(this.prefs);
		if (this.ads) {
			await waitForReady(this.ads);
		}

		this.cardTooltip();
		this._multiScale('bgsBannedTribeScale', '--banned-tribes-scale');
		this._multiScale('bgsSimulatorScale', '--bgs-simulator-scale');
		this._multiScale('bgsMinionsListScale', '--bgs-minions-list-scale');
		this._multiScale('bgsHeroSelectionOverlayScale', '--bgs-hero-selection-overlay-scale');
		this._multiScale('bgsOpponentBoardScale', '--bgs-opponent-board-scale');
		this._multiScale('bgsQuestsOverlayScale', '--bgs-quests-overlay-scale');

		this._multiScale('arenaDraftOverlayScale', '--arena-card-options-scale');
		this._multiScale('arenaDraftOverlayScale', '--arena-draft-overlay-scale');
		this._multiScale('arenaSessionWidgetScale', '--arena-session-widget-scale');

		this._multiScale('decktrackerMulliganScale', '--decktracker-mulligan-scale');
		this._multiScale('countersScale', '--counters-scale-player');
		this._multiScale('countersScaleOpponent', '--counters-scale-opponent');
		this._multiScale('groupedCountersScale', '--grouped-counters-scale');
		this._multiScale('decktrackerOpponentHandScale', '--decktracker-opponent-hand-scale');
		this._multiScale('secretsHelperScale', '--secrets-helper-scale');
		this._multiScale('sessionWidgetScale', '--session-widget-scale');
		this.lottery();
	}

	private cardTooltip() {
		this.prefs.preferences$$
			.pipe(
				map((prefs) => prefs.cardTooltipScale),
				distinctUntilChanged(),
			)
			.subscribe(async (scale) => {
				const newScale = (scale ?? 100) / 100;
				document.documentElement.style.setProperty('--card-tooltip-scale', '' + newScale);
			});
	}

	private lottery() {
		combineLatest([
			this.ads.hasPremiumSub$$,
			this.prefs.preferences$$.pipe(
				map((prefs) => prefs.globalWidgetScale ?? 100),
				distinctUntilChanged(),
			),
			this.prefs.preferences$$.pipe(
				map((prefs) => prefs.lotteryScale ?? 100),
				distinctUntilChanged(),
			),
		]).subscribe(([premium, globalScale, scale]) => {
			const newScaleIntent = (globalScale / 100) * (scale / 100);
			const newScale = premium ? newScaleIntent : 1;
			document.documentElement.style.setProperty('--lottery-scale', '' + newScale);
		});
	}

	private _multiScale(pref: keyof Preferences, propertyName: string) {
		combineLatest([
			this.prefs.preferences$$.pipe(
				map((prefs) => prefs.globalWidgetScale ?? 100),
				distinctUntilChanged(),
			),
			this.prefs.preferences$$.pipe(
				map((prefs) => (prefs[pref] as number) ?? 100),
				distinctUntilChanged(),
			),
		]).subscribe(([globalScale, scale]) => {
			const newScale = (globalScale / 100) * (scale / 100);
			document.documentElement.style.setProperty(propertyName, '' + newScale);
		});
	}
}
