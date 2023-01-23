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
import { OverwolfService } from '@firestone/shared/framework/core';
import { sleep } from '@services/utils';
import { Observable } from 'rxjs';
import { CurrentAppType } from '../../models/mainwindow/current-app.type';
import { DebugService } from '../../services/debug.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../abstract-subscription-store.component';

@Component({
	selector: 'full-screen-overlays-clickthrough',
	styleUrls: [
		`../../../css/global/cdk-overlay.scss`,
		`../../../css/themes/collection-theme.scss`,
		`../../../css/themes/achievements-theme.scss`,
		`../../../css/themes/battlegrounds-theme.scss`,
		`../../../css/themes/decktracker-theme.scss`,
		`../../../css/themes/decktracker-desktop-theme.scss`,
		`../../../css/themes/replays-theme.scss`,
		`../../../css/themes/duels-theme.scss`,
		`../../../css/themes/general-theme.scss`,
		'../../../css/component/overlays/full-screen-overlays-clickthrough.component.scss',
	],
	template: `
		<div
			class="full-screen-overlays-clickthrough drag-boundary overlay-container-parent"
			[activeTheme]="activeTheme$ | async"
		>
			<bgs-hero-selection-widget-wrapper></bgs-hero-selection-widget-wrapper>
			<bgs-leaderboard-widget-wrapper></bgs-leaderboard-widget-wrapper>
			<bgs-board-widget-wrapper></bgs-board-widget-wrapper>

			<constructed-board-widget-wrapper></constructed-board-widget-wrapper>
			<player-hero-power-widget-wrapper></player-hero-power-widget-wrapper>
			<choosing-card-widget-wrapper></choosing-card-widget-wrapper>

			<mercs-treasure-selection-widget-wrapper></mercs-treasure-selection-widget-wrapper>

			<duels-max-life-opponent-widget-wrapper></duels-max-life-opponent-widget-wrapper>
			<duels-ooc-treasure-selection-widget-wrapper></duels-ooc-treasure-selection-widget-wrapper>
			<duels-ooc-hero-selection-widget-wrapper></duels-ooc-hero-selection-widget-wrapper>
			<duels-ooc-hero-power-selection-widget-wrapper></duels-ooc-hero-power-selection-widget-wrapper>
			<duels-ooc-signature-treasure-selection-widget-wrapper></duels-ooc-signature-treasure-selection-widget-wrapper>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None, // Needed to the cdk overlay styling to work
})
export class FullScreenOverlaysClickthroughComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit, AfterViewInit, OnDestroy
{
	activeTheme$: Observable<CurrentAppType>;

	private windowId: string;
	private gameInfoUpdatedListener: (message: any) => void;

	constructor(
		private readonly ow: OverwolfService,
		private readonly init_DebugService: DebugService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.activeTheme$ = this.store
			.listenDeckState$((deckState) => deckState.metadata?.gameType)
			.pipe(
				this.mapData(([gameType]) => {
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
	}

	async ngAfterViewInit() {
		this.windowId = (await this.ow.getCurrentWindow()).id;
		this.ow.setWindowPassthrough(this.windowId);
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

	private async changeWindowSize(): Promise<void> {
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}
		const gameWidth = gameInfo.width;
		const gameHeight = gameInfo.height;
		const height = gameHeight;
		const width = gameHeight * 1.4;
		await this.ow.changeWindowSize(this.windowId, width, height);
		window.dispatchEvent(new Event('window-resize'));

		await sleep(300);
		const dpi = gameInfo.logicalWidth / gameWidth;
		const newLeft = Math.floor(dpi * 0.5 * (gameWidth - width));
		await this.ow.changeWindowPosition(this.windowId, newLeft, 0);
	}
}
