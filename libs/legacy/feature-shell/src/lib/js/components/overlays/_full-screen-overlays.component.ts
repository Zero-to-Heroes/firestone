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
import { GameStateFacadeService } from '@firestone/game-state';
import { SceneService } from '@firestone/memory';
import { CustomAppearanceService } from '@firestone/settings';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { isBattlegroundsScene } from '@services/battlegrounds/bgs-utils';
import { Observable, combineLatest } from 'rxjs';
import { CurrentAppType } from '../../models/mainwindow/current-app.type';
import { DebugService } from '../../services/debug.service';

@Component({
	selector: 'full-screen-overlays',
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

			<!-- Duels -->
			<duels-decktracker-ooc-widget-wrapper></duels-decktracker-ooc-widget-wrapper>
			<duels-ooc-deck-select-widget-wrapper></duels-ooc-deck-select-widget-wrapper>

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
			<player-spell-widget-wrapper></player-spell-widget-wrapper>
			<player-pogo-widget-wrapper></player-pogo-widget-wrapper>
			<player-astral-automaton-widget-wrapper></player-astral-automaton-widget-wrapper>
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
			<player-monstrous-parrot-widget-wrapper></player-monstrous-parrot-widget-wrapper>
			<player-vanessa-widget-wrapper></player-vanessa-widget-wrapper>
			<player-sea-shanty-widget-wrapper></player-sea-shanty-widget-wrapper>
			<player-wheel-of-death-widget-wrapper></player-wheel-of-death-widget-wrapper>
			<player-thirsty-drifter-widget-wrapper></player-thirsty-drifter-widget-wrapper>
			<player-cards-played-from-another-class-widget-wrapper></player-cards-played-from-another-class-widget-wrapper>
			<player-cards-drawn-widget-wrapper></player-cards-drawn-widget-wrapper>
			<player-elemental-streak-widget-wrapper></player-elemental-streak-widget-wrapper>
			<player-tram-heist-widget-wrapper></player-tram-heist-widget-wrapper>
			<player-excavate-widget-wrapper></player-excavate-widget-wrapper>
			<player-chaotic-tendril-widget-wrapper></player-chaotic-tendril-widget-wrapper>
			<player-secrets-played-widget-wrapper></player-secrets-played-widget-wrapper>
			<player-lightray-widget-wrapper></player-lightray-widget-wrapper>
			<player-holy-spells-widget-wrapper></player-holy-spells-widget-wrapper>
			<player-menagerie-widget-wrapper></player-menagerie-widget-wrapper>
			<player-corpse-spent-widget-wrapper></player-corpse-spent-widget-wrapper>
			<player-overdraft-widget-wrapper></player-overdraft-widget-wrapper>
			<player-asvedon-widget-wrapper></player-asvedon-widget-wrapper>
			<player-murozond-widget-wrapper></player-murozond-widget-wrapper>
			<player-naga-giant-widget-wrapper></player-naga-giant-widget-wrapper>
			<player-gardens-grace-widget-wrapper></player-gardens-grace-widget-wrapper>
			<player-anachronos-widget-wrapper></player-anachronos-widget-wrapper>
			<player-bonelord-frostwhisper-widget-wrapper></player-bonelord-frostwhisper-widget-wrapper>
			<player-shockspitter-widget-wrapper></player-shockspitter-widget-wrapper>
			<player-parrot-mascot-widget-wrapper></player-parrot-mascot-widget-wrapper>
			<player-queensguard-widget-wrapper></player-queensguard-widget-wrapper>
			<player-spectral-pillager-widget-wrapper></player-spectral-pillager-widget-wrapper>
			<player-lady-darkvein-widget-wrapper></player-lady-darkvein-widget-wrapper>
			<player-grey-sage-parrot-widget-wrapper></player-grey-sage-parrot-widget-wrapper>
			<player-hero-power-damage-widget-wrapper></player-hero-power-damage-widget-wrapper>
			<player-multicaster-widget-wrapper></player-multicaster-widget-wrapper>
			<player-volatile-skeleton-widget-wrapper></player-volatile-skeleton-widget-wrapper>
			<player-relic-widget-wrapper></player-relic-widget-wrapper>
			<player-chained-guardian-widget-wrapper></player-chained-guardian-widget-wrapper>
			<player-treant-widget-wrapper></player-treant-widget-wrapper>
			<player-dragons-summoned-widget-wrapper></player-dragons-summoned-widget-wrapper>
			<player-pirates-summoned-widget-wrapper></player-pirates-summoned-widget-wrapper>
			<player-earthen-golem-widget-wrapper></player-earthen-golem-widget-wrapper>

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
			<opponent-hero-power-damage-widget-wrapper></opponent-hero-power-damage-widget-wrapper>
			<opponent-volatile-skeleton-widget-wrapper></opponent-volatile-skeleton-widget-wrapper>
			<opponent-relic-widget-wrapper></opponent-relic-widget-wrapper>
			<opponent-anachronos-widget-wrapper></opponent-anachronos-widget-wrapper>
			<opponent-bonelord-frostwhisper-widget-wrapper></opponent-bonelord-frostwhisper-widget-wrapper>
			<opponent-shockspitter-widget-wrapper></opponent-shockspitter-widget-wrapper>
			<opponent-multicaster-widget-wrapper></opponent-multicaster-widget-wrapper>
			<opponent-chaotic-tendril-widget-wrapper></opponent-chaotic-tendril-widget-wrapper>
			<opponent-spell-widget-wrapper></opponent-spell-widget-wrapper>
			<opponent-excavate-widget-wrapper></opponent-excavate-widget-wrapper>
			<opponent-earthen-golem-widget-wrapper></opponent-earthen-golem-widget-wrapper>
			<opponent-corpse-spent-widget-wrapper></opponent-corpse-spent-widget-wrapper>
			<opponent-wheel-of-death-widget-wrapper></opponent-wheel-of-death-widget-wrapper>
			<opponent-dragons-summoned-widget-wrapper></opponent-dragons-summoned-widget-wrapper>

			<!-- BG Counters -->
			<player-bgs-southsea-widget-wrapper></player-bgs-southsea-widget-wrapper>
			<player-bgs-magmaloc-widget-wrapper></player-bgs-magmaloc-widget-wrapper>
			<player-bgs-blood-gem-widget-wrapper></player-bgs-blood-gem-widget-wrapper>
			<player-bgs-majordomo-widget-wrapper></player-bgs-majordomo-widget-wrapper>
			<player-bgs-gold-delta-widget-wrapper></player-bgs-gold-delta-widget-wrapper>
			<player-bgs-lord-of-gains-widget-wrapper></player-bgs-lord-of-gains-widget-wrapper>

			<lottery-widget-wrapper></lottery-widget-wrapper>
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

	windowId: string;

	private gameInfoUpdatedListener: (message: any) => void;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly init_DebugService: DebugService,
		private readonly ow: OverwolfService,
		private readonly scene: SceneService,
		private readonly gameState: GameStateFacadeService,
		private readonly customStyles: CustomAppearanceService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		console.debug('full screen getting ready');
		await waitForReady(this.scene, this.gameState, this.customStyles);
		console.debug('full screen ready');

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
