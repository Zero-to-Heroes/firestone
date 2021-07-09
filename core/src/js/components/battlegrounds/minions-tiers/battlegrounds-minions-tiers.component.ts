import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	HostListener,
	OnDestroy,
	ViewEncapsulation,
	ViewRef,
} from '@angular/core';
import { Race, ReferenceCard } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { BehaviorSubject, Subscription } from 'rxjs';
import { CardTooltipPositionType } from '../../../directives/card-tooltip-position.type';
import { BattlegroundsState } from '../../../models/battlegrounds/battlegrounds-state';
import { Preferences } from '../../../models/preferences';
import { getAllCardsInGame } from '../../../services/battlegrounds/bgs-utils';
import { DebugService } from '../../../services/debug.service';
import { FeatureFlags } from '../../../services/feature-flags';
import { CARDS_VERSION } from '../../../services/hs-utils';
import { OverwolfService } from '../../../services/overwolf.service';
import { PreferencesService } from '../../../services/preferences.service';
import { arraysEqual, groupByFunction } from '../../../services/utils';

@Component({
	selector: 'battlegrounds-minions-tiers',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		`../../../../css/global/cdk-overlay.scss`,
		`../../../../css/themes/battlegrounds-theme.scss`,
		'../../../../css/component/battlegrounds/minions-tiers/battlegrounds-minions-tiers.component.scss',
	],
	template: `
		<div
			class="battlegrounds-minions-tiers overlay-container-parent battlegrounds-theme"
			(mouseleave)="onTavernMouseLeave()"
			(mousedown)="dragMove($event)"
		>
			<div class="tiers-container" *ngIf="showMinionsList">
				<div class="logo-container" *ngIf="currentTurn">
					<div class="background-main-part"></div>
					<div class="background-second-part"></div>
					<div class="turn-number">Turn {{ currentTurn }}</div>
				</div>
				<ul class="tiers">
					<div
						class="tier"
						*ngFor="let currentTier of tiers; trackBy: trackByFn"
						[ngClass]="{
							'selected': displayedTier && displayedTier.tavernTier === currentTier.tavernTier,
							'locked': isLocked(currentTier)
						}"
						(mouseover)="onTavernMouseOver(currentTier)"
						(click)="onTavernClick(currentTier)"
					>
						<img class="icon" src="assets/images/bgs/star.png" />
						<div class="number">{{ currentTier.tavernTier }}</div>
					</div>
				</ul>
				<bgs-minions-list
					*ngIf="displayedTier || lockedTier"
					[cards]="(displayedTier || lockedTier).cards"
					[showTribesHighlight]="showTribesHighlight"
					[highlightedMinions]="highlightedMinions"
					[highlightedTribes]="highlightedTribes"
					[tooltipPosition]="tooltipPosition"
				></bgs-minions-list>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None, // Needed to the cdk overlay styling to work
})
export class BattlegroundsMinionsTiersOverlayComponent implements AfterViewInit, OnDestroy {
	private static readonly WINDOW_WIDTH = 1300;

	windowId: string;

	state: BattlegroundsState;
	highlightedTribes: readonly Race[];
	highlightedMinions: readonly string[];
	cardsInGame: readonly ReferenceCard[];
	tiers: readonly Tier[];
	displayedTier: Tier;
	lockedTier: Tier;
	showTribesHighlight: boolean;
	showMinionsList: boolean;
	enableMouseOver: boolean;
	currentTurn: number;
	tooltipPosition: CardTooltipPositionType = 'left';

	private gameInfoUpdatedListener: (message: any) => void;
	private deckSubscription: Subscription;
	private preferencesSubscription: Subscription;
	private previousAvailableRaces: readonly Race[];
	private storeSubscription: Subscription;

	constructor(
		private prefs: PreferencesService,
		private cdr: ChangeDetectorRef,
		private ow: OverwolfService,
		private init_DebugService: DebugService,
		private allCards: AllCardsService,
	) {
		this.init();
	}

	async ngAfterViewInit() {
		this.windowId = (await this.ow.getCurrentWindow()).id;

		const storeBus: BehaviorSubject<BattlegroundsState> = this.ow.getMainWindow().battlegroundsStore;
		this.storeSubscription = storeBus.subscribe(async (newState: BattlegroundsState) => {
			if (!newState) {
				return;
			}
			await this.allCards.initializeCardsDb(CARDS_VERSION);

			if (
				newState?.currentGame?.availableRaces?.length > 0 &&
				(!this.cardsInGame?.length ||
					!arraysEqual(this.previousAvailableRaces, newState.currentGame.availableRaces))
			) {
				await this.updateAvailableCards(newState);
				this.previousAvailableRaces = newState.currentGame.availableRaces;
			}
			//console.log('available cards', this.cardsInGame);
			this.tiers = this.buildTiers();
			this.highlightedTribes = newState.highlightedTribes;
			this.highlightedMinions = newState.highlightedMinions;
			this.currentTurn = newState.currentGame?.currentTurn;
			//console.log('updating tiers', this.tiers, newState, this.cardsInGame);
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		});
		// console.error('debug: remove static init');
		// await this.allCards.initializeCardsDb();
		// this.cardsInGame = getAllCardsInGame([Race.DEMON, Race.DRAGON], this.allCards);
		// this.tiers = this.buildTiers();

		const preferencesEventBus: EventEmitter<any> = this.ow.getMainWindow().preferencesEventBus;
		this.preferencesSubscription = preferencesEventBus.subscribe((event) => {
			this.setDisplayPreferences(event.preferences);
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		});
		this.gameInfoUpdatedListener = this.ow.addGameInfoUpdatedListener(async (res: any) => {
			if (res && res.resolutionChanged) {
				await this.changeWindowSize();
			}
		});
		this.setDisplayPreferences(await this.prefs.getPreferences());
		await this.changeWindowSize();
		await this.updateTooltipPosition();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		this.ow.removeGameInfoUpdatedListener(this.gameInfoUpdatedListener);
		this.deckSubscription?.unsubscribe();
		this.preferencesSubscription?.unsubscribe();
	}

	@HostListener('mousedown', ['$event'])
	dragMove(event: MouseEvent) {
		const path: any[] = event.composedPath();
		// Hack for drop-downs
		if (
			path.length > 2 &&
			path[0].localName === 'div' &&
			path[0].className?.includes('options') &&
			path[1].localName === 'div' &&
			path[1].className?.includes('below')
		) {
			return;
		}

		this.tooltipPosition = 'none';
		// console.log('dragMode');
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		this.ow.dragMove(this.windowId, async (result) => {
			await this.updateTooltipPosition();
			const window = await this.ow.getCurrentWindow();
			if (!window) {
				return;
			}
			await this.prefs.updateBgsMinionsListPosition(window.left, window.top);
			await this.restoreWindowPosition();
		});
	}

	trackByFn(tavernTier: Tier) {
		return tavernTier?.tavernTier;
	}

	onTavernClick(tavernTier: Tier) {
		this.displayedTier = tavernTier;
		if (this.isLocked(tavernTier)) {
			this.lockedTier = undefined;
			this.displayedTier = undefined;
		} else {
			this.lockedTier = tavernTier;
			this.displayedTier = undefined;
		}
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onTavernMouseOver(tavernTier: Tier) {
		if (this.lockedTier || !this.enableMouseOver) {
			return;
		}

		this.displayedTier = tavernTier;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onTavernMouseLeave() {
		if (this.lockedTier) {
			return;
		}
		this.displayedTier = undefined;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	isLocked(tavernTier: Tier) {
		return this.lockedTier && tavernTier && this.lockedTier.tavernTier === tavernTier.tavernTier;
	}

	private updateAvailableCards(state: BattlegroundsState) {
		if (!this.allCards.getCards()?.length) {
			return;
		}

		this.cardsInGame = getAllCardsInGame(state.currentGame.availableRaces, this.allCards);
		// console.debug('cardsInGame', this.cardsInGame, state.currentGame.availableRaces);
	}

	private buildTiers(): readonly Tier[] {
		if (!this.cardsInGame) {
			return [];
		}

		const groupedByTier: { [tierLevel: string]: readonly ReferenceCard[] } = groupByFunction(
			(card: ReferenceCard) => '' + card.techLevel,
		)(this.cardsInGame);
		return Object.keys(groupedByTier).map((tierLevel) => ({
			tavernTier: parseInt(tierLevel),
			cards: groupedByTier[tierLevel],
		}));
	}

	private setDisplayPreferences(preferences: Preferences) {
		this.showMinionsList = FeatureFlags.ENABLE_BG_MINIONS_LIST && preferences.bgsEnableMinionListOverlay;
		this.showTribesHighlight = FeatureFlags.ENABLE_BG_TRIBE_HIGHLIGHT && preferences.bgsShowTribesHighlight;
		this.enableMouseOver = preferences.bgsEnableMinionListMouseOver;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private async changeWindowSize(): Promise<void> {
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}

		const gameWidth = gameInfo.width;
		const height = gameInfo.height;
		const width = BattlegroundsMinionsTiersOverlayComponent.WINDOW_WIDTH;
		await this.ow.changeWindowSize(this.windowId, width, height);
		const dpi = gameInfo.logicalWidth / gameWidth;
		const newLeft = dpi * (gameWidth - width);
		await this.ow.changeWindowPosition(this.windowId, newLeft - 15, 15);
		await this.restoreWindowPosition();
		await this.updateTooltipPosition();
	}

	private async init() {
		await this.allCards.initializeCardsDb(CARDS_VERSION);
	}

	private async restoreWindowPosition(forceTrackerReposition = false): Promise<void> {
		const width = BattlegroundsMinionsTiersOverlayComponent.WINDOW_WIDTH;
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}
		const gameWidth = gameInfo.logicalWidth;
		const dpi = gameWidth / gameInfo.width;
		const prefs = await this.prefs.getPreferences();
		const windowPosition = prefs.bgsMinionsListPosition;
		//console.log('window position', await this.ow.getCurrentWindow(), gameInfo);
		//console.log('loaded tracker position', windowPosition);
		// https://stackoverflow.com/questions/8388440/converting-a-double-to-an-int-in-javascript-without-rounding
		const newLeft =
			windowPosition && windowPosition.left < gameWidth && windowPosition.left > -width && !forceTrackerReposition
				? windowPosition.left || 0
				: gameWidth - width * dpi;
		const newTop =
			windowPosition &&
			windowPosition.top < gameInfo.logicalHeight &&
			windowPosition.top > -300 &&
			!forceTrackerReposition
				? windowPosition.top || 0
				: 0;
		console.log('updating tracker position', newLeft, newTop);
		await this.ow.changeWindowPosition(this.windowId, newLeft, newTop);
		console.log('after window position update', await this.ow.getCurrentWindow());
		// console.log('monitors list', await this.ow.getMonitorsList());
		// console.log('game info', await this.ow.getRunningGameInfo());
		await this.updateTooltipPosition();
	}

	private async updateTooltipPosition() {
		// console.log('updating tooltip position');
		const window = await this.ow.getCurrentWindow();
		if (!window) {
			return;
		}
		if (window.left < 0) {
			this.tooltipPosition = 'right';
		} else {
			this.tooltipPosition = 'left';
		}
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}

interface Tier {
	tavernTier: number;
	cards: readonly ReferenceCard[];
}
