import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	OnDestroy,
	ViewEncapsulation,
} from '@angular/core';
import { GameType } from '@firestone-hs/reference-data';
import { Observable } from 'rxjs';
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
		<div class="full-screen-overlays drag-boundary overlay-container-parent" [activeTheme]="activeTheme$ | async">
			<!-- Global -->
			<current-session-widget-wrapper></current-session-widget-wrapper>

			<!-- "Constructed" -->
			<decktracker-player-widget-wrapper></decktracker-player-widget-wrapper>
			<decktracker-opponent-widget-wrapper></decktracker-opponent-widget-wrapper>
			<secrets-helper-widget-wrapper></secrets-helper-widget-wrapper>
			<opponent-hand-widget-wrapper></opponent-hand-widget-wrapper>

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
			<player-elwynn-boar-widget-wrapper></player-elwynn-boar-widget-wrapper>
			<player-elemental-widget-wrapper></player-elemental-widget-wrapper>
			<player-cthun-widget-wrapper></player-cthun-widget-wrapper>
			<player-bolner-widget-wrapper></player-bolner-widget-wrapper>
			<player-brilliant-macaw-widget-wrapper></player-brilliant-macaw-widget-wrapper>
			<player-hero-power-damage-widget-wrapper></player-hero-power-damage-widget-wrapper>
			<player-multicaster-widget-wrapper></player-multicaster-widget-wrapper>

			<!-- Opponent counters -->
			<opponent-attack-widget-wrapper></opponent-attack-widget-wrapper>
			<opponent-watchpost-widget-wrapper></opponent-watchpost-widget-wrapper>
			<opponent-pogo-widget-wrapper></opponent-pogo-widget-wrapper>
			<opponent-jade-widget-wrapper></opponent-jade-widget-wrapper>
			<opponent-galakrond-widget-wrapper></opponent-galakrond-widget-wrapper>
			<opponent-fatigue-widget-wrapper></opponent-fatigue-widget-wrapper>
			<opponent-elwynn-boar-widget-wrapper></opponent-elwynn-boar-widget-wrapper>
			<opponent-cthun-widget-wrapper></opponent-cthun-widget-wrapper>
			<opponent-hero-power-damage-widget-wrapper></opponent-hero-power-damage-widget-wrapper>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None, // Needed to the cdk overlay styling to work
})
export class FullScreenOverlaysComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit, OnDestroy {
	activeTheme$: Observable<CurrentAppType>;
	windowId: string;

	private gameInfoUpdatedListener: (message: any) => void;

	constructor(
		private readonly ow: OverwolfService,
		private readonly init_DebugService: DebugService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		this.activeTheme$ = this.store
			.listenDeckState$((deckState) => deckState.metadata?.gameType)
			.pipe(
				this.mapData(([gameType]) => {
					switch (gameType) {
						case GameType.GT_BATTLEGROUNDS:
						case GameType.GT_BATTLEGROUNDS_AI_VS_AI:
						case GameType.GT_BATTLEGROUNDS_FRIENDLY:
							return 'battlegrounds';
						default:
							return 'decktracker';
					}
				}),
			);
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
