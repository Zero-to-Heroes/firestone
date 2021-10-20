import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	OnDestroy,
	ViewEncapsulation,
	ViewRef,
} from '@angular/core';
import { Race, ReferenceCard } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { Observable, Subscription } from 'rxjs';
import { map, takeUntil, tap } from 'rxjs/operators';
import { CardTooltipPositionType } from '../../../directives/card-tooltip-position.type';
import { getAllCardsInGame } from '../../../services/battlegrounds/bgs-utils';
import { DebugService } from '../../../services/debug.service';
import { OverwolfService } from '../../../services/overwolf.service';
import { PreferencesService } from '../../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { groupByFunction } from '../../../services/utils';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

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
			<div class="tiers-container" *ngIf="showMinionsList$ | async">
				<ng-container *ngIf="{ tiers: tiers$ | async, currentTurn: currentTurn$ | async } as value">
					<div class="logo-container" *ngIf="value.currentTurn">
						<div class="background-main-part"></div>
						<div class="background-second-part"></div>
						<div class="turn-number">Turn {{ value.currentTurn }}</div>
					</div>
					<ul class="tiers">
						<div
							class="tier"
							*ngFor="let currentTier of value.tiers; trackBy: trackByFn"
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
						*ngFor="let tier of value.tiers; trackBy: trackByFn"
						class="minions-list"
						[ngClass]="{
							'active':
								tier.tavernTier === displayedTier?.tavernTier ||
								tier.tavernTier === lockedTier?.tavernTier
						}"
						[cards]="tier.cards"
						[showTribesHighlight]="showTribesHighlight$ | async"
						[highlightedMinions]="highlightedMinions$ | async"
						[highlightedTribes]="highlightedTribes$ | async"
						[tooltipPosition]="tooltipPosition"
					></bgs-minions-list>
				</ng-container>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None, // Needed to the cdk overlay styling to work
})
export class BattlegroundsMinionsTiersOverlayComponent
	extends AbstractSubscriptionComponent
	implements AfterViewInit, OnDestroy {
	private static readonly WINDOW_WIDTH = 1300;

	tiers$: Observable<readonly Tier[]>;
	highlightedTribes$: Observable<readonly Race[]>;
	highlightedMinions$: Observable<readonly string[]>;
	currentTurn$: Observable<number>;
	showTribesHighlight$: Observable<boolean>;
	showMinionsList$: Observable<boolean>;

	private windowId: string;
	private enableMouseOver: boolean;

	displayedTier: Tier;
	lockedTier: Tier;
	tooltipPosition: CardTooltipPositionType = 'left';

	private gameInfoUpdatedListener: (message: any) => void;
	private prefSubscription: Subscription;

	constructor(
		private readonly init_DebugService: DebugService,
		private readonly prefs: PreferencesService,
		private readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly allCards: CardsFacadeService,
		private readonly store: AppUiStoreFacadeService,
	) {
		super();
		this.tiers$ = this.store
			.listenBattlegrounds$(([main, prefs]) => main.currentGame.availableRaces)
			.pipe(
				takeUntil(this.destroyed$),
				map(([races]) => {
					const cardsInGame = getAllCardsInGame(races, this.allCards);
					return this.buildTiers(cardsInGame);
				}),
			);
		this.highlightedTribes$ = this.store
			.listenBattlegrounds$(([main, prefs]) => main.highlightedTribes)
			.pipe(
				takeUntil(this.destroyed$),
				map(([tribes]) => tribes),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
			);
		this.highlightedMinions$ = this.store
			.listenBattlegrounds$(([main, prefs]) => main.highlightedMinions)
			.pipe(
				takeUntil(this.destroyed$),
				map(([tribes]) => tribes),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
			);
		this.currentTurn$ = this.store
			.listenBattlegrounds$(([main, prefs]) => main.currentGame?.currentTurn)
			.pipe(
				takeUntil(this.destroyed$),
				map(([currentTurn]) => currentTurn),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
			);
		this.showTribesHighlight$ = this.store
			.listenBattlegrounds$(([main, prefs]) => prefs.bgsShowTribesHighlight)
			.pipe(
				takeUntil(this.destroyed$),
				map(([info]) => info),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
			);
		this.showMinionsList$ = this.store
			.listenBattlegrounds$(([main, prefs]) => prefs.bgsEnableMinionListOverlay)
			.pipe(
				takeUntil(this.destroyed$),
				map(([info]) => info),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
			);
		this.prefSubscription = this.store
			.listenBattlegrounds$(([main, prefs]) => prefs.bgsEnableMinionListMouseOver)
			.pipe(takeUntil(this.destroyed$))
			.subscribe(([info]) => (this.enableMouseOver = info));
	}

	async ngAfterViewInit() {
		this.windowId = (await this.ow.getCurrentWindow()).id;
		this.gameInfoUpdatedListener = this.ow.addGameInfoUpdatedListener(async (res: any) => {
			if (res && res.resolutionChanged) {
				await this.changeWindowSize();
			}
		});
		await this.changeWindowSize();
		await this.updateTooltipPosition();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		super.ngOnDestroy();
		this.ow.removeGameInfoUpdatedListener(this.gameInfoUpdatedListener);
		this.prefSubscription?.unsubscribe();
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

	private buildTiers(cardsInGame: readonly ReferenceCard[]): readonly Tier[] {
		if (!cardsInGame?.length) {
			return [];
		}

		const groupedByTier: { [tierLevel: string]: readonly ReferenceCard[] } = groupByFunction(
			(card: ReferenceCard) => '' + card.techLevel,
		)(cardsInGame);
		return Object.keys(groupedByTier).map((tierLevel) => ({
			tavernTier: parseInt(tierLevel),
			cards: groupedByTier[tierLevel],
		}));
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
		await this.ow.changeWindowPosition(this.windowId, newLeft, newTop);

		await this.updateTooltipPosition();
	}

	private async updateTooltipPosition() {
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
