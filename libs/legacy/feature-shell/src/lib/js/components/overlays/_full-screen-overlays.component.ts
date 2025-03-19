import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostListener,
	OnDestroy,
	ViewChild,
	ViewEncapsulation,
	ViewRef,
} from '@angular/core';
import { GameType } from '@firestone-hs/reference-data';
import { BgsStateFacadeService } from '@firestone/battlegrounds/common';
import { CounterInstance, GameStateFacadeService, getAllCounters } from '@firestone/game-state';
import { SceneService } from '@firestone/memory';
import { CustomAppearanceService } from '@firestone/settings';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent, deepEqual } from '@firestone/shared/framework/common';
import {
	CardsFacadeService,
	ILocalizationService,
	OverwolfService,
	waitForReady,
} from '@firestone/shared/framework/core';
import { isBattlegroundsScene } from '@services/battlegrounds/bgs-utils';
import { combineLatest, debounceTime, distinctUntilChanged, filter, Observable, takeUntil } from 'rxjs';
import { CurrentAppType } from '../../models/mainwindow/current-app.type';
import { DebugService } from '../../services/debug.service';

@Component({
	selector: 'full-screen-overlays',
	styleUrls: [
		`../../../css/global/cdk-overlay.scss`,
		`../../../css/themes/collection-theme.scss`,
		`../../../css/themes/achievements-theme.scss`,
		// `../../../css/themes/battlegrounds-theme.scss`,
		`../../../css/themes/decktracker-theme.scss`,
		`../../../css/themes/decktracker-desktop-theme.scss`,
		`../../../css/themes/replays-theme.scss`,
		`../../../css/themes/general-theme.scss`,
		'./_full-screen-overlays.component.scss',
	],
	template: `
		<div
			id="container"
			tabindex="0"
			class="full-screen-overlays drag-boundary overlay-container-parent"
			[activeTheme]="activeTheme$ | async"
		>
			<div class="game-area-container">
				<div class="game-area">
					<bgs-hero-overview-widget-wrapper></bgs-hero-overview-widget-wrapper>
					<bgs-leaderboard-widget-wrapper></bgs-leaderboard-widget-wrapper>
					<bgs-board-widget-wrapper></bgs-board-widget-wrapper>
					<bgs-hero-selection-widget-wrapper></bgs-hero-selection-widget-wrapper>
					<!-- Will reactivate this when I can test them properly -->
					<!-- <choosing-bgs-quest-widget-wrapper></choosing-bgs-quest-widget-wrapper>
					<choosing-bgs-trinket-widget-wrapper></choosing-bgs-trinket-widget-wrapper> -->

					<constructed-board-widget-wrapper></constructed-board-widget-wrapper>
					<constructed-mulligan-hand-widget-wrapper></constructed-mulligan-hand-widget-wrapper>
					<choosing-card-widget-wrapper></choosing-card-widget-wrapper>

					<!-- Need to implement proper mouse-over support, will add this when I get a report -->
					<!-- <mercs-treasure-selection-widget-wrapper></mercs-treasure-selection-widget-wrapper> -->

					<arena-hero-selection-widget-wrapper></arena-hero-selection-widget-wrapper>
					<arena-card-selection-widget-wrapper></arena-card-selection-widget-wrapper>
					<arena-mulligan-widget-wrapper></arena-mulligan-widget-wrapper>
				</div>
			</div>
			<!-- Global -->
			<current-session-widget-wrapper></current-session-widget-wrapper>
			<!-- Use different wrappers to make it easier to position each one differently -->
			<hs-quests-widget-wrapper></hs-quests-widget-wrapper>
			<bgs-quests-widget-wrapper></bgs-quests-widget-wrapper>
			<mercs-quests-widget-wrapper></mercs-quests-widget-wrapper>

			<!-- "Constructed" -->
			<decktracker-player-widget-wrapper class="focusable" tabindex="0"></decktracker-player-widget-wrapper>
			<decktracker-opponent-widget-wrapper></decktracker-opponent-widget-wrapper>
			<secrets-helper-widget-wrapper></secrets-helper-widget-wrapper>
			<opponent-hand-widget-wrapper></opponent-hand-widget-wrapper>
			<turn-timer-widget-wrapper></turn-timer-widget-wrapper>
			<constructed-mulligan-deck-widget-wrapper></constructed-mulligan-deck-widget-wrapper>
			<constructed-decktracker-ooc-widget-wrapper></constructed-decktracker-ooc-widget-wrapper>

			<!-- BG -->
			<bgs-minion-tiers-widget-wrapper></bgs-minion-tiers-widget-wrapper>
			<bgs-battle-simulation-widget-wrapper></bgs-battle-simulation-widget-wrapper>
			<bgs-banned-tribes-widget-wrapper></bgs-banned-tribes-widget-wrapper>
			<bgs-window-button-widget-wrapper></bgs-window-button-widget-wrapper>
			<bgs-hero-tips-widget-wrapper></bgs-hero-tips-widget-wrapper>

			<!-- Mercs -->
			<mercs-player-team-widget-wrapper></mercs-player-team-widget-wrapper>
			<mercs-opponent-team-widget-wrapper></mercs-opponent-team-widget-wrapper>
			<mercs-out-of-combat-player-team-widget-wrapper></mercs-out-of-combat-player-team-widget-wrapper>
			<mercs-action-queue-widget-wrapper></mercs-action-queue-widget-wrapper>

			<!-- Arena -->
			<arena-decktracker-ooc-widget-wrapper></arena-decktracker-ooc-widget-wrapper>
			<arena-mulligan-deck-widget-wrapper></arena-mulligan-deck-widget-wrapper>

			<!-- Player Counters -->
			<player-attack-widget-wrapper></player-attack-widget-wrapper>
			<player-watchpost-widget-wrapper></player-watchpost-widget-wrapper>
			<player-pogo-widget-wrapper></player-pogo-widget-wrapper>
			<player-astral-automaton-widget-wrapper></player-astral-automaton-widget-wrapper>
			<player-jade-widget-wrapper></player-jade-widget-wrapper>
			<player-galakrond-widget-wrapper></player-galakrond-widget-wrapper>
			<player-fatigue-widget-wrapper></player-fatigue-widget-wrapper>
			<player-abyssal-curse-widget-wrapper></player-abyssal-curse-widget-wrapper>
			<player-elwynn-boar-widget-wrapper></player-elwynn-boar-widget-wrapper>
			<player-elemental-widget-wrapper></player-elemental-widget-wrapper>
			<player-cthun-widget-wrapper></player-cthun-widget-wrapper>
			<player-bolner-widget-wrapper></player-bolner-widget-wrapper>
			<player-brilliant-macaw-widget-wrapper></player-brilliant-macaw-widget-wrapper>
			<counter-wrapper
				*ngFor="let counter of playerCounters$ | async; trackBy: trackForCounter"
				side="player"
				[counter]="counter"
			></counter-wrapper>
			<player-max-resources-widget-wrapper></player-max-resources-widget-wrapper>

			<!-- Opponent counters -->
			<opponent-attack-widget-wrapper></opponent-attack-widget-wrapper>
			<opponent-watchpost-widget-wrapper></opponent-watchpost-widget-wrapper>
			<opponent-pogo-widget-wrapper></opponent-pogo-widget-wrapper>
			<opponent-astral-automaton-widget-wrapper></opponent-astral-automaton-widget-wrapper>
			<opponent-jade-widget-wrapper></opponent-jade-widget-wrapper>
			<opponent-galakrond-widget-wrapper></opponent-galakrond-widget-wrapper>
			<opponent-fatigue-widget-wrapper></opponent-fatigue-widget-wrapper>
			<opponent-abyssal-curse-widget-wrapper></opponent-abyssal-curse-widget-wrapper>
			<opponent-elwynn-boar-widget-wrapper></opponent-elwynn-boar-widget-wrapper>
			<opponent-cthun-widget-wrapper></opponent-cthun-widget-wrapper>
			<counter-wrapper
				*ngFor="let counter of opponentCounters$ | async; trackBy: trackForCounter"
				side="opponent"
				[counter]="counter"
			></counter-wrapper>
			<opponent-max-resources-widget-wrapper></opponent-max-resources-widget-wrapper>

			<!-- BG Counters -->
			<player-bgs-southsea-widget-wrapper></player-bgs-southsea-widget-wrapper>
			<player-bgs-magmaloc-widget-wrapper></player-bgs-magmaloc-widget-wrapper>
			<player-bgs-blood-gem-widget-wrapper></player-bgs-blood-gem-widget-wrapper>
			<player-bgs-majordomo-widget-wrapper></player-bgs-majordomo-widget-wrapper>
			<player-bgs-lord-of-gains-widget-wrapper></player-bgs-lord-of-gains-widget-wrapper>
			<player-bgs-tuskarr-raider-widget-wrapper></player-bgs-tuskarr-raider-widget-wrapper>

			<lottery-widget-wrapper></lottery-widget-wrapper>

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

	activeTheme$: Observable<CurrentAppType>;
	playerCounters$: Observable<readonly CounterInstance<any>[]>;
	opponentCounters$: Observable<readonly CounterInstance<any>[]>;

	windowId: string;

	private gameInfoUpdatedListener: (message: any) => void;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly init_DebugService: DebugService,
		private readonly ow: OverwolfService,
		private readonly scene: SceneService,
		private readonly gameState: GameStateFacadeService,
		private readonly bgState: BgsStateFacadeService,
		private readonly prefs: PreferencesService,
		private readonly customStyles: CustomAppearanceService,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: ILocalizationService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.scene, this.gameState, this.customStyles, this.prefs, this.bgState);

		this.activeTheme$ = combineLatest([
			this.scene.currentScene$$,
			this.scene.lastNonGamePlayScene$$,
			this.gameState.gameState$$.pipe(this.mapData((gameState) => gameState?.metadata?.gameType)),
		]).pipe(
			this.mapData(([currentScene, nonGameplayScene, gameType]) => {
				if (!gameType) {
					if (isBattlegroundsScene(currentScene) || isBattlegroundsScene(nonGameplayScene)) {
						return 'battlegrounds';
					}
				}
				switch (gameType) {
					case GameType.GT_BATTLEGROUNDS:
					case GameType.GT_BATTLEGROUNDS_AI_VS_AI:
					case GameType.GT_BATTLEGROUNDS_FRIENDLY:
					case GameType.GT_BATTLEGROUNDS_PLAYER_VS_AI:
					case GameType.GT_BATTLEGROUNDS_DUO:
					case GameType.GT_BATTLEGROUNDS_DUO_VS_AI:
					case GameType.GT_BATTLEGROUNDS_DUO_FRIENDLY:
					case GameType.GT_BATTLEGROUNDS_DUO_AI_VS_AI:
						return 'battlegrounds';
					default:
						return 'decktracker';
				}
			}),
		);
		const allCounters = getAllCounters(this.i18n, this.allCards).sort((a, b) => a.id.localeCompare(b.id));
		this.playerCounters$ = combineLatest([
			this.gameState.gameState$$,
			this.bgState.gameState$$,
			this.prefs.preferences$$,
		]).pipe(
			debounceTime(500),
			filter(([gameState, bgState, prefs]) => !!gameState && !!prefs),
			this.mapData(([gameState, bgState, prefs]) => {
				// TODO: find a way to not recompute the data everytime. For instance, have each counter register which properties it listens to,
				// and make a diff on these properties and only recompute the new value if one of these properties changed
				const result = allCounters
					.filter((c) => c.isActive('player', gameState, bgState, prefs))
					.map((c) => c.emit('player', gameState, bgState, this.allCards, prefs.countersUseExpandedView))
					.filter((c) => c);
				return result;
			}),
			distinctUntilChanged((a, b) => deepEqual(a, b)),
			takeUntil(this.destroyed$),
		);
		this.opponentCounters$ = combineLatest([
			this.gameState.gameState$$,
			this.bgState.gameState$$,
			this.prefs.preferences$$,
		]).pipe(
			debounceTime(500),
			filter(([gameState, bgState, prefs]) => !!gameState && !!prefs),
			this.mapData(([gameState, bgState, prefs]) => {
				return allCounters
					.filter((c) => c.isActive('opponent', gameState, bgState, prefs))
					.map((c) => c.emit('opponent', gameState, bgState, this.allCards, prefs.countersUseExpandedView))
					.filter((c) => c);
			}),
			distinctUntilChanged((a, b) => deepEqual(a, b)),
			takeUntil(this.destroyed$),
		);
		this.customStyles.register();

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	async ngAfterViewInit() {
		console.debug('full screen ngAfterViewInit');
		this.windowId = (await this.ow.getCurrentWindow()).id;
		this.gameInfoUpdatedListener = this.ow.addGameInfoUpdatedListener(async (res: any) => {
			if (res && res.resolutionChanged) {
				await this.changeWindowSize();
			}
		});
		await this.changeWindowSize();
		window.dispatchEvent(new Event('window-resize'));
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		super.ngOnDestroy();
		this.ow.removeGameInfoUpdatedListener(this.gameInfoUpdatedListener);
	}

	trackForCounter(index: number, counter: CounterInstance<any>) {
		return counter.id;
	}

	// Just make it full screen, always
	private async changeWindowSize(): Promise<void> {
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}
		const gameWidth = gameInfo.width;
		const gameHeight = gameInfo.height;
		const height = gameHeight;
		const width = gameWidth;
		console.log('full screen change window size', width, height, gameWidth, gameHeight);
		await this.ow.changeWindowSize(this.windowId, width, height);
		console.log('full screen change window position');
		await this.ow.changeWindowPosition(this.windowId, 0, 0);
		window.dispatchEvent(new Event('window-resize'));
	}
}
