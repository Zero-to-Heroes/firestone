import { Inject, Injectable, Optional } from '@angular/core';
import type { IAdsService } from '@firestone/shared/framework/core';
import { ADS_SERVICE_TOKEN, waitForReady } from '@firestone/shared/framework/core';
import { combineLatest, debounceTime, distinctUntilChanged, fromEvent, map, merge, of } from 'rxjs';
import { Preferences } from '../models/preferences';
import { PreferencesService } from './preferences.service';

@Injectable({ providedIn: 'root' })
export class ScalingService {
	/**
	 * Emits the current window innerHeight when it changes (e.g. on resize or when Electron applies final size).
	 * Emits immediately on subscribe with the current height, then on every distinct change.
	 */
	public readonly innerHeight$ =
		typeof window === 'undefined'
			? of(1080)
			: merge(of(window.innerHeight), fromEvent(window, 'resize').pipe(map(() => window.innerHeight))).pipe(
					distinctUntilChanged(),
					debounceTime(50),
				);

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

		// await this.initializeGlobalScale();
		this.cardTooltip();
		this._multiScale('helpTooltipScale', '--help-tooltip-scale');
		this._multiScale('bgsBannedTribeScale', '--banned-tribes-scale');
		this._multiScale('bgsSimulatorScale', '--bgs-simulator-scale');
		this._multiScale('bgsMinionsListScale', '--bgs-minions-list-scale');
		this._multiScale('bgsHeroSelectionOverlayScale', '--bgs-hero-selection-overlay-scale');
		this._multiScale('bgsOpponentBoardScale', '--bgs-opponent-board-scale');
		this._multiScale('bgsQuestsOverlayScale', '--bgs-quests-overlay-scale');
		this._multiScale('bgsActionCountScale', '--bgs-action-count-scale');
		this._multiScale('bgsAnomalyFullOverlayScale', '--bgs-full-anomaly-scale');

		this._multiScale('arenaDraftOverlayScale', '--arena-card-options-scale');
		this._multiScale('arenaDraftOverlayScale', '--arena-draft-overlay-scale');
		this._multiScale('arenaSessionWidgetScale', '--arena-session-widget-scale');

		this._multiScale('decktrackerMulliganScale', '--decktracker-mulligan-scale');
		this._multiScale('countersScale', '--counters-scale-player');
		this._multiScale('countersScaleOpponent', '--counters-scale-opponent');
		this._multiScale('groupedCountersScale', '--grouped-counters-scale');
		this._multiScale('countersWidgetsScale', '--counters-widgets-scale');
		this._multiScale('decktrackerOpponentHandScale', '--decktracker-opponent-hand-scale');
		this._multiScale('secretsHelperScale', '--secrets-helper-scale');
		this._multiScale('sessionWidgetScale', '--session-widget-scale');
		this.lottery();
	}

	public subscribeToWindowHeight(force = false) {
		if (typeof window === 'undefined') return;
		this.innerHeight$.subscribe((height) => this.applyGlobalScaleFromHeight(height, force));
	}

	private async applyGlobalScaleFromHeight(height: number, force = false) {
		if (typeof window === 'undefined') {
			console.log('[scaling-service] initializing global scale, but window is undefined');
			return;
		}

		const prefs = await this.prefs.getPreferences();
		if (!force && prefs.globalWidgetScale != new Preferences().globalWidgetScale) {
			console.log('[scaling-service] global scale already initialized', prefs.globalWidgetScale);
			return;
		}

		const globalScale = Math.max(80, Math.round((height / 1080) * 100));
		console.log('[scaling-service] window height', height, 'global scale', globalScale);
		await this.prefs.updatePrefs('globalWidgetScale', globalScale);
		await this.prefs.updatePrefs('cardTooltipScale', globalScale);
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
