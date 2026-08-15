import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostListener,
	NgZone,
	OnDestroy,
	ViewChild,
	ViewEncapsulation,
	ViewRef,
} from '@angular/core';
import { GameType, isArena, isBattlegrounds, isMercenaries, SceneMode } from '@firestone-hs/reference-data';
import { ArenaRefService } from '@firestone/arena/data-access';
import {
	CardsHighlightFacadeService,
	CounterInstance,
	equalCounterInstance,
	GameStateFacadeService,
	getAllCounters,
	isBattlegroundsScene,
} from '@firestone/game-state';
import { CurrentAppType } from '@firestone/mainwindow/common';
import { SceneService } from '@firestone/memory';
import { InGameReplayService } from '@firestone/mods/common';
import { OverlayAppearanceService } from '@firestone/settings/services';
import { OverlayAppearanceThemeSelection, PreferencesService, ScalingService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import {
	CardsFacadeService,
	GameInfoService,
	HEARTHSTONE_GAME_ID,
	ILocalizationService,
	isElectronContext,
	OverwolfService,
	waitForReady,
} from '@firestone/shared/framework/core';
import { auditTime, combineLatest, distinctUntilChanged, filter, Observable, takeUntil } from 'rxjs';
import { DebugService } from '../../services/debug.service';

type OverlayPassthroughMode = 'noPassThrough' | 'passThrough' | 'passThroughAndNotify';

type ElectronOverlayHitTestApi = {
	isSharedTextureHitTestWorkaroundActive?: () => Promise<boolean>;
	setOverlayPassthrough?: (mode: OverlayPassthroughMode) => void;
};

@Component({
	standalone: false,
	selector: 'full-screen-overlays',
	styleUrls: [
		`../../../css/global/cdk-overlay.scss`,
		`../../../css/themes/collection-theme.scss`,
		`../../../css/themes/achievements-theme.scss`,
		`../../../css/themes/battlegrounds-theme.scss`,
		`../../../css/themes/decktracker-theme.scss`,
		`../../../css/themes/decktracker-desktop-theme.scss`,
		`../../../css/themes/replays-theme.scss`,
		`../../../css/themes/general-theme.scss`,
		`../../../../../../../shared/styles/src/lib/styles/overlay-themes/_index.scss`,
		'./_full-screen-overlays.component.scss',
	],
	template: `
		<div
			#container
			id="container"
			tabindex="0"
			class="full-screen-overlays drag-boundary overlay-container-parent"
			[activeTheme]="activeTheme$ | async"
			[overlayAppearanceTheme]="overlayAppearanceTheme$ | async"
		>
			<in-game-replay-widget-wrapper></in-game-replay-widget-wrapper>
			<ng-container *ngIf="allowOverlays$ | async">
				<div class="game-area-container">
					<div class="game-area">
						<ng-container *ngIf="showBattlegroundsOverlays$ | async">
							<bgs-leaderboard-widget-wrapper></bgs-leaderboard-widget-wrapper>
							<bgs-board-widget-wrapper></bgs-board-widget-wrapper>
							<bgs-hero-selection-widget-wrapper></bgs-hero-selection-widget-wrapper>
							<choosing-bgs-quest-widget-wrapper></choosing-bgs-quest-widget-wrapper>
							<choosing-bgs-trinket-widget-wrapper></choosing-bgs-trinket-widget-wrapper>
							<choosing-bgs-timewarped-widget-wrapper></choosing-bgs-timewarped-widget-wrapper>
							<bgs-dark-gift-overlay-widget-wrapper></bgs-dark-gift-overlay-widget-wrapper>
						</ng-container>

						<ng-container *ngIf="showConstructedOverlays$ | async">
							<constructed-board-widget-wrapper></constructed-board-widget-wrapper>
							<constructed-mulligan-hand-widget-wrapper></constructed-mulligan-hand-widget-wrapper>
							<choosing-card-widget-wrapper></choosing-card-widget-wrapper>
						</ng-container>

						<!-- Need to implement proper mouse-over support, will add this when I get a report -->
						<!-- This in fact doesn't work anymore, as I would need a pass-through window to handle it
						  this way -->
						<!-- <mercs-treasure-selection-widget-wrapper></mercs-treasure-selection-widget-wrapper> -->

						<ng-container *ngIf="showArenaOverlays$ | async">
							<constructed-board-widget-wrapper></constructed-board-widget-wrapper>
							<arena-hero-power-selection-widget-wrapper></arena-hero-power-selection-widget-wrapper>
							<arena-hero-selection-widget-wrapper></arena-hero-selection-widget-wrapper>
							<arena-hero-selected-widget-wrapper></arena-hero-selected-widget-wrapper>
							<arena-card-selection-widget-wrapper></arena-card-selection-widget-wrapper>
							<arena-package-card-selection-widget-wrapper></arena-package-card-selection-widget-wrapper>
							<arena-mulligan-widget-wrapper></arena-mulligan-widget-wrapper>
							<choosing-card-widget-wrapper></choosing-card-widget-wrapper>
						</ng-container>
					</div>
				</div>
				<!-- Global -->
				<!-- Use different wrappers to make it easier to position each one differently -->
				<hs-quests-widget-wrapper></hs-quests-widget-wrapper>
				<!-- Named "bgs-" but the manual reconnect button is for any CN gameplay; only auto options are BG-specific -->
				<bgs-reconnector-widget-wrapper></bgs-reconnector-widget-wrapper>
				<ng-container *ngIf="showBattlegroundsOverlays$ | async">
					<bgs-quests-widget-wrapper></bgs-quests-widget-wrapper>
				</ng-container>
				<ng-container *ngIf="showMercsOverlays$ | async">
					<mercs-quests-widget-wrapper></mercs-quests-widget-wrapper>
				</ng-container>

				<!-- "Constructed" -->
				<ng-container *ngIf="showConstructedOverlays$ | async">
					<decktracker-player-widget-wrapper
						class="focusable"
						style="pointer-events: none;"
						tabindex="0"
					></decktracker-player-widget-wrapper>
					<decktracker-opponent-widget-wrapper
						style="pointer-events: none;"
					></decktracker-opponent-widget-wrapper>
					<secrets-helper-widget-wrapper></secrets-helper-widget-wrapper>
					<opponent-hand-widget-wrapper></opponent-hand-widget-wrapper>
					<turn-timer-widget-wrapper></turn-timer-widget-wrapper>
					<constructed-mulligan-deck-widget-wrapper></constructed-mulligan-deck-widget-wrapper>
					<constructed-decktracker-ooc-widget-wrapper></constructed-decktracker-ooc-widget-wrapper>
				</ng-container>

				<!-- BG -->
				<ng-container *ngIf="showBattlegroundsOverlays$ | async">
					<bgs-minion-tiers-widget-wrapper></bgs-minion-tiers-widget-wrapper>
					<bgs-battle-simulation-widget-wrapper></bgs-battle-simulation-widget-wrapper>
					<bgs-banned-tribes-widget-wrapper></bgs-banned-tribes-widget-wrapper>
					<bgs-window-button-widget-wrapper></bgs-window-button-widget-wrapper>
					<bgs-hero-tips-widget-wrapper></bgs-hero-tips-widget-wrapper>
					<current-session-widget-wrapper></current-session-widget-wrapper>
					<bgs-hero-overview-widget-wrapper></bgs-hero-overview-widget-wrapper>
					<bgs-action-count-widget-wrapper></bgs-action-count-widget-wrapper>
					<bgs-full-anomaly-widget-wrapper></bgs-full-anomaly-widget-wrapper>
				</ng-container>

				<!-- Mercs -->
				<ng-container *ngIf="showMercsOverlays$ | async">
					<mercs-player-team-widget-wrapper></mercs-player-team-widget-wrapper>
					<mercs-opponent-team-widget-wrapper></mercs-opponent-team-widget-wrapper>
					<mercs-out-of-combat-player-team-widget-wrapper></mercs-out-of-combat-player-team-widget-wrapper>
					<mercs-action-queue-widget-wrapper></mercs-action-queue-widget-wrapper>
				</ng-container>

				<!-- Arena -->
				<ng-container *ngIf="showArenaOverlays$ | async">
					<arena-decktracker-ooc-widget-wrapper></arena-decktracker-ooc-widget-wrapper>
					<arena-mulligan-deck-widget-wrapper></arena-mulligan-deck-widget-wrapper>
					<arena-current-session-widget-wrapper></arena-current-session-widget-wrapper>
					<decktracker-player-widget-wrapper
						class="focusable"
						style="pointer-events: none;"
						tabindex="0"
					></decktracker-player-widget-wrapper>
					<decktracker-opponent-widget-wrapper
						style="pointer-events: none;"
					></decktracker-opponent-widget-wrapper>
					<secrets-helper-widget-wrapper></secrets-helper-widget-wrapper>
					<opponent-hand-widget-wrapper></opponent-hand-widget-wrapper>
					<turn-timer-widget-wrapper></turn-timer-widget-wrapper>
				</ng-container>

				<ng-container *ngIf="(showConstructedOverlays$ | async) || (showArenaOverlays$ | async)">
					<player-attack-widget-wrapper></player-attack-widget-wrapper>
					<opponent-attack-widget-wrapper></opponent-attack-widget-wrapper>
				</ng-container>

				<ng-container
					*ngIf="
						(showConstructedOverlays$ | async) ||
						(showArenaOverlays$ | async) ||
						(showBattlegroundsOverlays$ | async)
					"
				>
					<ng-container *ngIf="(useGroupedCounters$ | async) === false">
						<!-- Player Counters -->
						<counters-positioner
							class="widget-positioner player-counters"
							[positionerId]="'player-counters'"
						>
							<counter-wrapper
								*ngFor="let counter of playerCounters$ | async; trackBy: trackForCounter"
								side="player"
								[counter]="counter"
							></counter-wrapper
						></counters-positioner>

						<!-- Opponent counters -->
						<counters-positioner
							class="widget-positioner opponent-counters"
							[positionerId]="'opponent-counters'"
						>
							<counter-wrapper
								*ngFor="let counter of opponentCounters$ | async; trackBy: trackForCounter"
								side="opponent"
								[counter]="counter"
							></counter-wrapper>
						</counters-positioner>
					</ng-container>
					<ng-container *ngIf="(useGroupedCounters$ | async) === true">
						<grouped-counters-wrapper
							class="grouped-counters"
							[playerCounters]="playerCounters$ | async"
							[opponentCounters]="opponentCounters$ | async"
						></grouped-counters-wrapper>
					</ng-container>

					<player-max-resources-widget-wrapper></player-max-resources-widget-wrapper>
					<opponent-max-resources-widget-wrapper></opponent-max-resources-widget-wrapper>
				</ng-container>

				<lottery-widget-wrapper></lottery-widget-wrapper>
			</ng-container>

			<notifications></notifications>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None, // Needed to the cdk overlay styling to work
})
export class FullScreenOverlaysComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit, OnDestroy
{
	@ViewChild('container', { static: false }) container: ElementRef;

	allowOverlays$: Observable<boolean>;
	showBattlegroundsOverlays$: Observable<boolean>;
	showConstructedOverlays$: Observable<boolean>;
	showMercsOverlays$: Observable<boolean>;
	showArenaOverlays$: Observable<boolean>;

	activeTheme$: Observable<CurrentAppType>;
	overlayAppearanceTheme$: Observable<OverlayAppearanceThemeSelection>;
	useGroupedCounters$: Observable<boolean>;
	playerCounters$: Observable<readonly CounterInstance<any>[]>;
	opponentCounters$: Observable<readonly CounterInstance<any>[]>;

	windowId: string;

	private gameInfoUpdatedListener: (message: any) => void;
	private sharedTextureHitTestActive = false;
	private overlayInputCapturing = false;
	private overlayCursorEl: HTMLDivElement | null = null;
	private readonly onOverlayMouseOver = (event: MouseEvent) => this.handleOverlayPointer(event.target);
	private readonly onOverlayMouseOut = (event: MouseEvent) => this.handleOverlayPointer(event.relatedTarget);
	private readonly onOverlayMouseMove = (event: MouseEvent) => this.moveOverlayCaptureCursor(event);

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly init_DebugService: DebugService,
		private readonly ow: OverwolfService,
		private readonly gameInfo: GameInfoService,
		private readonly scene: SceneService,
		private readonly gameState: GameStateFacadeService,
		private readonly prefs: PreferencesService,
		private readonly overlayAppearance: OverlayAppearanceService,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: ILocalizationService,
		private readonly init_ScalingService: ScalingService,
		private readonly init_cardsHighlight: CardsHighlightFacadeService,
		private readonly inGameReplayService: InGameReplayService,
		private readonly arenaRef: ArenaRefService,
		private readonly ngZone: NgZone,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.scene, this.gameState, this.overlayAppearance, this.prefs, this.inGameReplayService);

		this.allowOverlays$ = this.inGameReplayService.isReplayOngoing$$.pipe(this.mapData((isOngoing) => !isOngoing));
		this.useGroupedCounters$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.useGroupedCounters));
		this.overlayAppearanceTheme$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.overlayAppearanceTheme),
		);

		// Mode-gate: only construct the widget trees for the active game-mode family.
		// Mid-BG this keeps constructed/arena/mercs wrappers out of the DOM (V8 + Blink).
		const overlayModeFamily$ = combineLatest([
			this.scene.currentScene$$,
			this.scene.lastNonGamePlayScene$$,
			this.gameState.gameState$$.pipe(this.mapData((gameState) => gameState?.metadata?.gameType)),
		]).pipe(
			this.mapData(([currentScene, nonGameplayScene, gameType]) =>
				resolveOverlayModeFamily(currentScene, nonGameplayScene, gameType),
			),
			distinctUntilChanged(),
		);
		this.showBattlegroundsOverlays$ = overlayModeFamily$.pipe(this.mapData((family) => family === 'battlegrounds'));
		this.showConstructedOverlays$ = overlayModeFamily$.pipe(this.mapData((family) => family === 'constructed'));
		this.showMercsOverlays$ = overlayModeFamily$.pipe(this.mapData((family) => family === 'mercenaries'));
		this.showArenaOverlays$ = overlayModeFamily$.pipe(this.mapData((family) => family === 'arena'));

		this.activeTheme$ = overlayModeFamily$.pipe(
			this.mapData((family) => (family === 'battlegrounds' ? 'battlegrounds' : 'decktracker')),
		);

		const arenaCards = (await this.arenaRef.validDiscoveryPool$$.getValueWithInit()) ?? [];
		// console.debug('[full-screen-overlays] arenaCards', arenaCards);
		const allCounters = getAllCounters(this.i18n, this.allCards).sort((a, b) => a.id.localeCompare(b.id));
		allCounters.forEach((c) => {
			c.init({
				arena: arenaCards,
			});
		});

		this.playerCounters$ = combineLatest([this.gameState.gameState$$, this.prefs.preferences$$]).pipe(
			auditTime(500),
			filter(([gameState, prefs]) => !!gameState && !!prefs),
			this.mapData(([gameState, prefs]) => {
				if (isMercenaries(gameState?.metadata?.gameType)) {
					return [];
				}
				// TODO: find a way to not recompute the data everytime. For instance, have each counter register which properties it listens to,
				// and make a diff on these properties and only recompute the new value if one of these properties changed
				const result = allCounters
					.filter((c) => c.isActive('player', gameState, gameState.bgState, prefs))
					.map((c) =>
						c.emit('player', gameState, gameState.bgState, this.allCards, prefs.countersUseExpandedView),
					)
					.filter((c) => c);
				// console.debug('[full-screen-overlays] playerCounters', result, allCounters.length);
				return result;
			}),
			distinctUntilChanged((a, b) => a.length === b.length && a.every((c, i) => equalCounterInstance(c, b[i]))),
			takeUntil(this.destroyed$),
		);
		this.opponentCounters$ = combineLatest([this.gameState.gameState$$, this.prefs.preferences$$]).pipe(
			auditTime(500),
			filter(([gameState, prefs]) => !!gameState && !!prefs),
			this.mapData(([gameState, prefs]) => {
				if (isMercenaries(gameState?.metadata?.gameType)) {
					return [];
				}
				return allCounters
					.filter((c) => c.isActive('opponent', gameState, gameState.bgState, prefs))
					.map((c) =>
						c.emit('opponent', gameState, gameState.bgState, this.allCards, prefs.countersUseExpandedView),
					)
					.filter((c) => c);
			}),
			distinctUntilChanged((a, b) => a.length === b.length && a.every((c, i) => equalCounterInstance(c, b[i]))),
			takeUntil(this.destroyed$),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}

	async ngAfterViewInit() {
		console.debug('full screen ngAfterViewInit');
		await waitForReady(this.overlayAppearance);
		this.overlayAppearance.register(this.container?.nativeElement);
		// Size is handled from the main controller in electron
		if (this.ow.isOwEnabled()) {
			this.windowId = (await this.ow.getCurrentWindow())?.id;
			this.gameInfoUpdatedListener = this.ow.addGameInfoUpdatedListener(async (res) => {
				if (Math.floor(res?.gameInfo?.id / 10) === HEARTHSTONE_GAME_ID && res?.resolutionChanged) {
					await this.changeWindowSize();
				}
			});
			await this.changeWindowSize();
		}
		window.dispatchEvent(new Event('window-resize'));
		void this.setupSharedTextureHitTestWorkaround();
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		super.ngOnDestroy();
		this.teardownSharedTextureHitTestWorkaround();
		this.ow.removeGameInfoUpdatedListener(this.gameInfoUpdatedListener);
	}

	trackForCounter(index: number, counter: CounterInstance<any>) {
		return counter.side + counter.id;
	}

	/**
	 * Shared-texture overlays don't alpha-hit-test. Overwolf's workaround:
	 * passThroughAndNotify by default, noPassThrough while hovering interactive UI.
	 * @see https://dev.overwolf.com/ow-electron/reference/examples/overlay/shared-texture-rendering/#beta-limitation-hit-testing-ignores-transparent-pixels
	 */
	private async setupSharedTextureHitTestWorkaround(): Promise<void> {
		if (!isElectronContext()) {
			return;
		}
		const api = (window as unknown as { electronAPI?: ElectronOverlayHitTestApi }).electronAPI;
		if (!api?.isSharedTextureHitTestWorkaroundActive || !api.setOverlayPassthrough) {
			return;
		}
		let active = false;
		try {
			active = await api.isSharedTextureHitTestWorkaroundActive();
		} catch (e) {
			console.warn('[full-screen-overlays] shared-texture hit-test probe failed', e);
			return;
		}
		if (!active) {
			return;
		}
		this.sharedTextureHitTestActive = true;
		console.log('[full-screen-overlays] enabling shared-texture hit-test workaround');
		// Shared-texture compositing does not show the OS/CSS cursor in-game — only pixels
		// in the overlay framebuffer (+ the game's own cursor). Keep OS cursor hidden and
		// draw a DOM cursor that is painted into the shared texture while capturing.
		document.documentElement.style.cursor = 'none';
		this.ensureOverlayCaptureCursorEl();
		this.ngZone.runOutsideAngular(() => {
			window.addEventListener('mouseover', this.onOverlayMouseOver, true);
			window.addEventListener('mouseout', this.onOverlayMouseOut, true);
			window.addEventListener('mousemove', this.onOverlayMouseMove, true);
		});
	}

	private teardownSharedTextureHitTestWorkaround(): void {
		if (!this.sharedTextureHitTestActive) {
			return;
		}
		window.removeEventListener('mouseover', this.onOverlayMouseOver, true);
		window.removeEventListener('mouseout', this.onOverlayMouseOut, true);
		window.removeEventListener('mousemove', this.onOverlayMouseMove, true);
		this.sharedTextureHitTestActive = false;
		this.applyOverlayCaptureCursor(false);
		document.documentElement.style.cursor = '';
		this.overlayCursorEl?.remove();
		this.overlayCursorEl = null;
		if (this.overlayInputCapturing) {
			this.setOverlayPassthrough('passThroughAndNotify');
			this.overlayInputCapturing = false;
		}
	}

	private handleOverlayPointer(target: EventTarget | null): void {
		if (!this.sharedTextureHitTestActive) {
			return;
		}
		const capture = !this.isTransparentPassThroughTarget(target);
		if (capture === this.overlayInputCapturing) {
			return;
		}
		this.overlayInputCapturing = capture;
		this.setOverlayPassthrough(capture ? 'noPassThrough' : 'passThroughAndNotify');
		this.applyOverlayCaptureCursor(capture);
	}

	/** Layout shells / empty fullscreen root should leave input with the game. */
	private isTransparentPassThroughTarget(target: EventTarget | null): boolean {
		if (!(target instanceof Element)) {
			return true;
		}
		if (target.classList?.contains('fs-ow-capture-cursor')) {
			return !this.overlayInputCapturing;
		}
		if (target.closest?.('.cdk-overlay-pane, .cdk-overlay-connected-position-bounding-box')) {
			return false;
		}
		const root =
			(this.container?.nativeElement as HTMLElement | undefined) ??
			(document.getElementById('container') as HTMLElement | null) ??
			undefined;
		if (!root) {
			// Fail open to capture — otherwise we never leave passThroughAndNotify and
			// the game cursor sticks to every widget.
			return false;
		}
		if (!root.contains(target)) {
			return target === document.documentElement || target === document.body;
		}
		if (
			target === root ||
			target.classList.contains('full-screen-overlays') ||
			target.classList.contains('game-area-container') ||
			target.classList.contains('game-area') ||
			target.classList.contains('widget-positioner')
		) {
			return true;
		}
		return false;
	}

	private ensureOverlayCaptureCursorEl(): void {
		if (this.overlayCursorEl) {
			return;
		}
		const el = document.createElement('div');
		el.className = 'fs-ow-capture-cursor';
		el.setAttribute('aria-hidden', 'true');
		el.style.display = 'none';
		document.body.appendChild(el);
		this.overlayCursorEl = el;
	}

	private applyOverlayCaptureCursor(capture: boolean): void {
		const root = (this.container?.nativeElement as HTMLElement | undefined) ?? document.getElementById('container');
		document.documentElement.style.cursor = 'none';
		if (capture) {
			root?.classList.add('fs-ow-capture-input');
			this.ensureOverlayCaptureCursorEl();
			if (this.overlayCursorEl) {
				this.overlayCursorEl.style.display = 'block';
			}
		} else {
			root?.classList.remove('fs-ow-capture-input');
			if (this.overlayCursorEl) {
				this.overlayCursorEl.style.display = 'none';
			}
		}
	}

	private moveOverlayCaptureCursor(event: MouseEvent): void {
		if (!this.overlayInputCapturing || !this.overlayCursorEl) {
			return;
		}
		this.overlayCursorEl.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;
	}

	private setOverlayPassthrough(mode: OverlayPassthroughMode): void {
		const api = (window as unknown as { electronAPI?: ElectronOverlayHitTestApi }).electronAPI;
		api?.setOverlayPassthrough?.(mode);
	}

	// Just make it full screen, always
	private async changeWindowSize(): Promise<void> {
		const gameInfo = await this.gameInfo.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}
		const gameWidth = gameInfo.width;
		const gameHeight = gameInfo.height;
		const height = gameHeight;
		const width = gameWidth;
		console.log('full screen change window size', width, height, gameWidth, gameHeight);
		// console.log('no-format', 'gameInfo', gameInfo);
		const currentWindow = await this.ow.getCurrentWindow();
		console.log('no-format', 'full screen current window', currentWindow);
		if (!this.windowId) {
			console.log('[full-screen-overlays] missing windowId');
			return;
		}
		await this.ow.changeWindowSize(this.windowId, width, height);
		console.log('full screen change window position');
		await this.ow.changeWindowPosition(this.windowId, 0, 0);
		window.dispatchEvent(new Event('window-resize'));
	}
}

type OverlayModeFamily = 'battlegrounds' | 'constructed' | 'mercenaries' | 'arena';

const isMercenariesScene = (scene: SceneMode | null | undefined): boolean => {
	if (scene == null) {
		return false;
	}
	return (
		scene === SceneMode.LETTUCE_BOUNTY_BOARD ||
		scene === SceneMode.LETTUCE_BOUNTY_TEAM_SELECT ||
		scene === SceneMode.LETTUCE_COLLECTION ||
		scene === SceneMode.LETTUCE_COOP ||
		scene === SceneMode.LETTUCE_FRIENDLY ||
		scene === SceneMode.LETTUCE_MAP ||
		scene === SceneMode.LETTUCE_PACK_OPENING ||
		scene === SceneMode.LETTUCE_PLAY ||
		scene === SceneMode.LETTUCE_VILLAGE
	);
};

const isArenaScene = (scene: SceneMode | null | undefined): boolean => scene === SceneMode.DRAFT;

const resolveOverlayModeFamily = (
	currentScene: SceneMode | null | undefined,
	nonGameplayScene: SceneMode | null | undefined,
	gameType: GameType | null | undefined,
): OverlayModeFamily => {
	if (currentScene === SceneMode.GAMEPLAY) {
		if (isBattlegrounds(gameType)) {
			return 'battlegrounds';
		}
		if (isMercenaries(gameType)) {
			return 'mercenaries';
		}
		if (isArena(gameType)) {
			return 'arena';
		}
		return 'constructed';
	}

	if (
		isBattlegroundsScene(currentScene) ||
		isBattlegroundsScene(nonGameplayScene) ||
		currentScene === SceneMode.BACON_COLLECTION
	) {
		return 'battlegrounds';
	}
	if (isMercenariesScene(currentScene) || isMercenariesScene(nonGameplayScene)) {
		return 'mercenaries';
	}
	if (isArenaScene(currentScene) || isArenaScene(nonGameplayScene)) {
		return 'arena';
	}
	return 'constructed';
};
