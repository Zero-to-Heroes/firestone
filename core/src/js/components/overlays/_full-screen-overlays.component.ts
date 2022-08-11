import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostListener,
	OnDestroy,
	Renderer2,
	ViewChild,
	ViewEncapsulation,
} from '@angular/core';
import { GameType, SceneMode } from '@firestone-hs/reference-data';
import { isBattlegroundsScene } from '@services/battlegrounds/bgs-utils';
import { combineLatest, Observable } from 'rxjs';
import { filter, startWith, tap } from 'rxjs/operators';
import { CurrentAppType } from '../../models/mainwindow/current-app.type';
import { DebugService } from '../../services/debug.service';
import { OverwolfService } from '../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../abstract-subscription.component';

@Component({
	selector: 'full-screen-overlays',
	styleUrls: [
		'../../../css/global/components-global.scss',
		`../../../css/global/cdk-overlay.scss`,
		`../../../css/themes/collection-theme.scss`,
		`../../../css/themes/achievements-theme.scss`,
		`../../../css/themes/battlegrounds-theme.scss`,
		`../../../css/themes/decktracker-theme.scss`,
		`../../../css/themes/decktracker-desktop-theme.scss`,
		`../../../css/themes/replays-theme.scss`,
		`../../../css/themes/duels-theme.scss`,
		`../../../css/themes/general-theme.scss`,
		'../../../css/component/overlays/full-screen-overlays.component.scss',
	],
	template: `
		<div
			id="container"
			tabindex="0"
			class="full-screen-overlays drag-boundary overlay-container-parent"
			[activeTheme]="activeTheme$ | async"
		>
			<!-- Global -->
			<current-session-widget-wrapper></current-session-widget-wrapper>

			<!-- "Constructed" -->
			<decktracker-player-widget-wrapper class="focusable" tabindex="0"></decktracker-player-widget-wrapper>
			<decktracker-opponent-widget-wrapper></decktracker-opponent-widget-wrapper>
			<secrets-helper-widget-wrapper></secrets-helper-widget-wrapper>
			<opponent-hand-widget-wrapper></opponent-hand-widget-wrapper>
			<turn-timer-widget-wrapper></turn-timer-widget-wrapper>

			<!-- Duels -->
			<duels-decktracker-ooc-widget-wrapper></duels-decktracker-ooc-widget-wrapper>
			<duels-ooc-deck-select-widget-wrapper></duels-ooc-deck-select-widget-wrapper>

			<!-- BG -->
			<bgs-minion-tiers-widget-wrapper></bgs-minion-tiers-widget-wrapper>
			<bgs-battle-simulation-widget-wrapper></bgs-battle-simulation-widget-wrapper>
			<bgs-banned-tribes-widget-wrapper></bgs-banned-tribes-widget-wrapper>
			<bgs-window-button-widget-wrapper></bgs-window-button-widget-wrapper>

			<!-- Mercs -->
			<mercs-player-team-widget-wrapper></mercs-player-team-widget-wrapper>
			<mercs-opponent-team-widget-wrapper></mercs-opponent-team-widget-wrapper>
			<mercs-out-of-combat-player-team-widget-wrapper></mercs-out-of-combat-player-team-widget-wrapper>
			<mercs-action-queue-widget-wrapper></mercs-action-queue-widget-wrapper>

			<!-- Player Counters -->
			<player-attack-widget-wrapper></player-attack-widget-wrapper>
			<player-watchpost-widget-wrapper></player-watchpost-widget-wrapper>
			<player-spell-widget-wrapper></player-spell-widget-wrapper>
			<player-pogo-widget-wrapper></player-pogo-widget-wrapper>
			<player-libram-widget-wrapper></player-libram-widget-wrapper>
			<player-jade-widget-wrapper></player-jade-widget-wrapper>
			<player-galakrond-widget-wrapper></player-galakrond-widget-wrapper>
			<player-fatigue-widget-wrapper></player-fatigue-widget-wrapper>
			<player-abyssal-curse-widget-wrapper></player-abyssal-curse-widget-wrapper>
			<player-elwynn-boar-widget-wrapper></player-elwynn-boar-widget-wrapper>
			<player-elemental-widget-wrapper></player-elemental-widget-wrapper>
			<player-cthun-widget-wrapper></player-cthun-widget-wrapper>
			<player-bolner-widget-wrapper></player-bolner-widget-wrapper>
			<player-brilliant-macaw-widget-wrapper></player-brilliant-macaw-widget-wrapper>
			<player-lady-darkvein-widget-wrapper></player-lady-darkvein-widget-wrapper>
			<player-grey-sage-parrot-widget-wrapper></player-grey-sage-parrot-widget-wrapper>
			<player-hero-power-damage-widget-wrapper></player-hero-power-damage-widget-wrapper>
			<player-multicaster-widget-wrapper></player-multicaster-widget-wrapper>
			<player-coral-keeper-widget-wrapper></player-coral-keeper-widget-wrapper>
			<player-volatile-skeleton-widget-wrapper></player-volatile-skeleton-widget-wrapper>

			<!-- Opponent counters -->
			<opponent-attack-widget-wrapper></opponent-attack-widget-wrapper>
			<opponent-watchpost-widget-wrapper></opponent-watchpost-widget-wrapper>
			<opponent-pogo-widget-wrapper></opponent-pogo-widget-wrapper>
			<opponent-jade-widget-wrapper></opponent-jade-widget-wrapper>
			<opponent-galakrond-widget-wrapper></opponent-galakrond-widget-wrapper>
			<opponent-fatigue-widget-wrapper></opponent-fatigue-widget-wrapper>
			<opponent-abyssal-curse-widget-wrapper></opponent-abyssal-curse-widget-wrapper>
			<opponent-elwynn-boar-widget-wrapper></opponent-elwynn-boar-widget-wrapper>
			<opponent-cthun-widget-wrapper></opponent-cthun-widget-wrapper>
			<opponent-hero-power-damage-widget-wrapper></opponent-hero-power-damage-widget-wrapper>
			<opponent-volatile-skeleton-widget-wrapper></opponent-volatile-skeleton-widget-wrapper>

			<!-- BG Counters -->
			<player-bgs-southsea-widget-wrapper></player-bgs-southsea-widget-wrapper>
			<player-bgs-majordomo-widget-wrapper></player-bgs-majordomo-widget-wrapper>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None, // Needed to the cdk overlay styling to work
})
export class FullScreenOverlaysComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit, OnDestroy {
	@ViewChild('container', { static: false }) container: ElementRef;

	activeTheme$: Observable<CurrentAppType>;
	windowId: string;

	private gameInfoUpdatedListener: (message: any) => void;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly init_DebugService: DebugService,
		private readonly renderer: Renderer2,
		private readonly el: ElementRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		const lastNonGamePlayScene$: Observable<SceneMode> = this.store
			.listen$(([main, prefs]) => main.currentScene)
			.pipe(
				startWith([null]),
				tap((info) => console.debug('prep lastNonGamePlayScene', info)),
				filter(([scene]) => scene !== SceneMode.GAMEPLAY),
				this.mapData(([scene]) => scene),
				tap((info) => console.debug('lastNonGamePlayScene', info)),
			);
		this.activeTheme$ = combineLatest(
			lastNonGamePlayScene$,
			this.store.listenDeckState$((deckState) => deckState.metadata?.gameType),
			this.store.listen$(([main]) => main.currentScene),
		).pipe(
			tap((info) => console.debug('prep activeTheme', info)),
			this.mapData(([nonGameplayScene, [gameType], [currentScene]]) => {
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
						return 'battlegrounds';
					default:
						return 'decktracker';
				}
			}),
		);

		this.ow.addKeyDownListener(async (info) => {
			return;
			console.debug('keydown', info);
			// F11
			if (info.key === '122') {
				await this.ow.bringToFront(this.windowId, true);
				const element: HTMLElement = this.renderer.selectRootElement('#container', true);
				const focusable = this.el.nativeElement.querySelectorAll('.root');
				const element2 = focusable[0];
				console.debug('element', element, element2, focusable);
				setTimeout(() => {
					element.focus();
					element.click();
					element2.focus();
					element2.click();
					console.debug('set focus', element, document.activeElement);
				});
			}
			setTimeout(() => {
				console.debug('current focus', document.activeElement);
			});
		});
	}

	async ngAfterViewInit() {
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
		await this.ow.changeWindowSize(this.windowId, width, height);
		await this.ow.changeWindowPosition(this.windowId, 0, 0);
		window.dispatchEvent(new Event('window-resize'));
	}
}
