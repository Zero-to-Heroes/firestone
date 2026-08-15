import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostListener,
	NgZone,
	Optional,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { CardIds, getTribeName, Race } from '@firestone-hs/reference-data';
import {
	DARK_DISCOVERY_GUARANTEED_TYPE_TURN,
	DARK_DISCOVERY_TEN_PLUS_TURN,
	DarkGiftMinionView,
	DarkGiftReasonKey,
	evaluateDarkGifts,
	EvaluatedDarkGift,
	filterDarkDiscoveryMinions,
	formatDarkGiftText,
	getDarkDiscoveryTurnFloor,
} from '@firestone/battlegrounds/core';
import { BgsDarkGiftOverlayService, DarkGiftLiveContext } from '@firestone/battlegrounds/services';
import { CardMousedOverService } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import {
	CardsFacadeService,
	ILocalizationService,
	OverwolfService,
	waitForReady,
} from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest, Observable, of, timer } from 'rxjs';
import { distinctUntilChanged, map, switchMap, takeUntil } from 'rxjs/operators';

interface DarkGiftOverlayVm {
	readonly turnLabel: string;
	readonly canGoPrev: boolean;
	readonly canGoNext: boolean;
	readonly usesLabel: string | null;
	readonly guaranteedEnabled: boolean;
	readonly showGuaranteedType: boolean;
	readonly tribeTabs: readonly { tribe: Race; name: string; disabledTooltip: string | null }[];
	readonly selectedTribe: Race | null;
	readonly minions: readonly DarkGiftMinionCard[];
	readonly gifts: readonly DarkGiftRow[];
}

interface DarkGiftMinionCard {
	readonly cardId: string;
	readonly image: string | null;
	readonly hovered: boolean;
}

interface DarkGiftRow {
	readonly cardId: string;
	readonly name: string;
	readonly text: string | null;
	readonly computedValue: string | null;
	readonly compatible: boolean;
	readonly hasCondition: boolean;
	readonly conditionTooltip: string | null;
}

@Component({
	standalone: false,
	selector: 'bgs-dark-gift-overlay',
	styleUrls: ['./bgs-dark-gift-overlay.component.scss'],
	template: `
		<div
			class="dark-gift-overlay battlegrounds-theme"
			*ngIf="vm$ | async as vm"
			(mouseenter)="onPanelEnter()"
			(mouseleave)="onPanelLeave()"
			(mousedown)="onPanelMouseDown($event)"
		>
			<div class="header">
				<div class="title" [fsTranslate]="'battlegrounds.in-game.dark-gifts.title'"></div>
				<div class="turn-nav">
					<button class="nav-button" [disabled]="!vm.canGoPrev" (click)="goPrev()">‹</button>
					<div class="turn-label">{{ vm.turnLabel }}</div>
					<button class="nav-button" [disabled]="!vm.canGoNext" (click)="goNext()">›</button>
				</div>
				<div class="uses" *ngIf="vm.usesLabel">{{ vm.usesLabel }}</div>
			</div>
			<div class="filters" *ngIf="vm.tribeTabs.length">
				<div
					class="filter-button-wrap"
					*ngFor="let tribe of vm.tribeTabs"
					[helpTooltip]="tribe.disabledTooltip"
				>
					<button
						class="filter-button tribe"
						[disabled]="!vm.guaranteedEnabled"
						[ngClass]="{ selected: vm.showGuaranteedType && vm.selectedTribe === tribe.tribe }"
						(click)="selectTribe(tribe.tribe)"
					>
						<span class="tribe-name">{{ tribe.name }}</span>
						<span class="guaranteed-hint">{{
							'battlegrounds.in-game.dark-gifts.guaranteed' | fsTranslate
						}}</span>
					</button>
				</div>
				<button
					class="filter-button"
					[ngClass]="{ selected: !vm.showGuaranteedType }"
					(click)="setShowGuaranteed(false)"
				>
					{{ 'battlegrounds.in-game.dark-gifts.others' | fsTranslate }}
				</button>
			</div>
			<div class="body">
				<div class="minions">
					<div
						class="minion"
						*ngFor="let minion of vm.minions; trackBy: trackByCardId"
						[ngClass]="{ hovered: minion.hovered }"
						(mouseenter)="hoverMinion(minion.cardId)"
					>
						<img class="card" *ngIf="minion.image" [src]="minion.image" />
					</div>
				</div>
				<div class="gifts">
					<div
						class="gift"
						*ngFor="let gift of vm.gifts; trackBy: trackByCardId"
						[ngClass]="{ greyed: !gift.compatible }"
					>
						<div class="name">
							<span>{{ gift.name }}</span>
							<div
								class="condition-icon"
								*ngIf="gift.hasCondition"
								inlineSVG="assets/svg/info.svg"
								[helpTooltip]="gift.conditionTooltip"
							></div>
						</div>
						<div class="text">
							<span *ngIf="gift.text" [innerHTML]="gift.text"></span>
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsDarkGiftOverlayComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	vm$: Observable<DarkGiftOverlayVm | null>;

	private readonly selectedTurn$$ = new BehaviorSubject<number | null>(null);
	private readonly userTenPlus$$ = new BehaviorSubject(false);
	private readonly showGuaranteed$$ = new BehaviorSubject(true);
	private readonly selectedTribe$$ = new BehaviorSubject<Race | null>(null);
	private readonly hoveredMinion$$ = new BehaviorSubject<string | null>(null);
	private readonly panelHovered$$ = new BehaviorSubject(false);
	private readonly dismissed$$ = new BehaviorSubject(false);
	private lastTribeLog: string | null = null;
	private unlistenMouseDown: (() => void) | null = null;
	private unlistenGlobalMouseDown: (() => void) | null = null;
	private ignoreNextGlobalClick = false;
	private globalClickTimer: ReturnType<typeof setTimeout> | null = null;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly overlay: BgsDarkGiftOverlayService,
		private readonly prefs: PreferencesService,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: ILocalizationService,
		private readonly mouseOver: CardMousedOverService,
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
		private readonly ngZone: NgZone,
		@Optional() private readonly ow: OverwolfService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.overlay, this.prefs, this.mouseOver);
		await this.allCards.waitForReady();

		this.unlistenMouseDown = this.renderer.listen('window', 'mousedown', (event: MouseEvent) =>
			this.onWindowMouseDown(event),
		);
		this.unlistenGlobalMouseDown = this.listenForGlobalMouseDown();

		this.overlay.buttonHovered$$.pipe(distinctUntilChanged(), takeUntil(this.destroyed$)).subscribe((hovered) => {
			if (hovered) {
				this.dismissed$$.next(false);
			}
		});

		const buttonHovered$ = this.mouseOver.mousedOverCard$$.pipe(
			map((card) => {
				if (card?.CardId === CardIds.DarkDiscoveryToken_BG36_Button_DarkGift) {
					return 'button';
				}
				return card?.CardId ? 'other' : 'none';
			}),
			distinctUntilChanged(),
			switchMap((state) => {
				if (state === 'button') {
					return of(true);
				}
				if (state === 'other') {
					return of(false);
				}
				return timer(300).pipe(map(() => false));
			}),
		);

		this.overlay.context$$.pipe(this.mapData((context) => context)).subscribe((context) => {
			if (!context) {
				this.panelHovered$$.next(false);
				this.dismissed$$.next(false);
			}
		});

		this.vm$ = combineLatest([
			buttonHovered$,
			this.panelHovered$$,
			this.dismissed$$,
			this.overlay.context$$,
			this.prefs.preferences$$.pipe(
				this.mapData((prefs) => prefs.bgsEnableDarkGiftOverlay && prefs.bgsFullToggle),
			),
			this.selectedTurn$$,
			this.userTenPlus$$,
			this.showGuaranteed$$,
			this.selectedTribe$$,
			this.hoveredMinion$$,
		]).pipe(
			this.mapData(
				([
					buttonHovered,
					panelHovered,
					dismissed,
					context,
					pref,
					selectedTurn,
					userTenPlus,
					showGuaranteed,
					selectedTribe,
					hoveredCardId,
				]) => {
					if (!pref || !context || dismissed || (!buttonHovered && !panelHovered)) {
						return null;
					}
					return this.buildVm(
						context,
						selectedTurn,
						userTenPlus,
						showGuaranteed,
						selectedTribe,
						hoveredCardId,
					);
				},
				null,
				0,
			),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}

	@HostListener('window:beforeunload')
	override ngOnDestroy() {
		this.unlistenMouseDown?.();
		this.unlistenMouseDown = null;
		this.unlistenGlobalMouseDown?.();
		this.unlistenGlobalMouseDown = null;
		if (this.globalClickTimer != null) {
			clearTimeout(this.globalClickTimer);
			this.globalClickTimer = null;
		}
		super.ngOnDestroy();
	}

	onPanelEnter() {
		this.panelHovered$$.next(true);
	}

	onPanelLeave() {
		this.panelHovered$$.next(false);
		this.hoveredMinion$$.next(null);
	}

	onPanelMouseDown(event: MouseEvent) {
		this.markClickInsideTooltip();
		event.stopPropagation();
	}

	private listenForGlobalMouseDown(): (() => void) | null {
		if (this.ow?.isOwEnabled()) {
			const handler = (data: { onGame?: boolean }) => {
				if (!data?.onGame) {
					return;
				}
				this.ngZone.run(() => this.dismiss());
			};
			this.ow.addMouseDownListener(handler);
			return () => this.ow.removeMouseDownListener(handler);
		}
		const api = (
			window as unknown as {
				electronAPI?: { onFsOverlayMouseDown?: (callback: () => void) => () => void };
			}
		).electronAPI;
		if (!api?.onFsOverlayMouseDown) {
			return null;
		}
		return api.onFsOverlayMouseDown(() => this.onGlobalMouseDown());
	}

	private onGlobalMouseDown() {
		this.ngZone.run(() => {
			if (this.dismissed$$.value) {
				return;
			}
			const panel = (this.el.nativeElement as HTMLElement).querySelector('.dark-gift-overlay');
			if (!panel) {
				return;
			}
			if (this.globalClickTimer != null) {
				clearTimeout(this.globalClickTimer);
			}
			this.globalClickTimer = setTimeout(() => {
				this.globalClickTimer = null;
				if (this.ignoreNextGlobalClick) {
					this.ignoreNextGlobalClick = false;
					return;
				}
				this.dismiss();
			}, 50);
		});
	}

	private onWindowMouseDown(event: MouseEvent) {
		const panel = (this.el.nativeElement as HTMLElement).querySelector('.dark-gift-overlay');
		if (!panel) {
			return;
		}
		if (this.isInsideTooltipArea(event, panel)) {
			this.markClickInsideTooltip();
			return;
		}
		this.dismiss();
	}

	private markClickInsideTooltip() {
		this.ignoreNextGlobalClick = true;
	}

	private dismiss() {
		this.dismissed$$.next(true);
		this.panelHovered$$.next(false);
		this.hoveredMinion$$.next(null);
	}

	private isInsideTooltipArea(event: MouseEvent, panel: Element): boolean {
		const path = (typeof event.composedPath === 'function' ? event.composedPath() : []) as EventTarget[];
		const nodes = path.length ? path : event.target != null ? [event.target] : [];
		return nodes.some((node) => {
			if (node === panel) {
				return true;
			}
			if (!(node instanceof Element)) {
				return false;
			}
			if (panel.contains(node)) {
				return true;
			}
			return !!node.closest('.cdk-overlay-pane, .cdk-overlay-connected-position-bounding-box, help-tooltip');
		});
	}

	goPrev() {
		const context = this.overlay.context$$.value;
		if (!context) {
			return;
		}
		const { turn, isTenPlus } = this.resolveTurn(context, this.selectedTurn$$.value, this.userTenPlus$$.value);
		const turnFloor = getDarkDiscoveryTurnFloor(context.currentTurn);
		if (isTenPlus && context.currentTurn < DARK_DISCOVERY_TEN_PLUS_TURN) {
			this.userTenPlus$$.next(false);
			this.selectedTurn$$.next(Math.max(turnFloor, DARK_DISCOVERY_TEN_PLUS_TURN - 1));
			return;
		}
		if (turn > turnFloor) {
			this.userTenPlus$$.next(false);
			this.selectedTurn$$.next(turn - 1);
		}
	}

	goNext() {
		const context = this.overlay.context$$.value;
		if (!context) {
			return;
		}
		const { turn, isTenPlus } = this.resolveTurn(context, this.selectedTurn$$.value, this.userTenPlus$$.value);
		if (isTenPlus) {
			return;
		}
		if (turn >= DARK_DISCOVERY_TEN_PLUS_TURN - 1) {
			this.userTenPlus$$.next(true);
			this.selectedTurn$$.next(DARK_DISCOVERY_TEN_PLUS_TURN);
			return;
		}
		this.selectedTurn$$.next(turn + 1);
	}

	setShowGuaranteed(value: boolean) {
		this.showGuaranteed$$.next(value);
	}

	selectTribe(tribe: Race) {
		const context = this.overlay.context$$.value;
		if (!context) {
			return;
		}
		const { turn, isTenPlus } = this.resolveTurn(context, this.selectedTurn$$.value, this.userTenPlus$$.value);
		if (turn < DARK_DISCOVERY_GUARANTEED_TYPE_TURN && !isTenPlus) {
			return;
		}
		this.selectedTribe$$.next(tribe);
		this.showGuaranteed$$.next(true);
	}

	hoverMinion(cardId: string | null) {
		this.hoveredMinion$$.next(cardId);
	}

	trackByCardId(_index: number, item: { cardId: string }) {
		return item.cardId;
	}

	private buildVm(
		context: DarkGiftLiveContext,
		selectedTurn: number | null,
		userTenPlus: boolean,
		showGuaranteed: boolean,
		selectedTribe: Race | null,
		hoveredCardId: string | null,
	): DarkGiftOverlayVm {
		const resolved = this.resolveTurn(context, selectedTurn, userTenPlus);
		const guaranteedEnabled = resolved.turn >= DARK_DISCOVERY_GUARANTEED_TYPE_TURN || resolved.isTenPlus;
		const disabledTooltip = guaranteedEnabled
			? null
			: this.i18n.translateString('battlegrounds.in-game.dark-gifts.guaranteed-disabled-tooltip', {
					value: DARK_DISCOVERY_GUARANTEED_TYPE_TURN,
				});
		const tribeTabs = context.mostCommonTribes.map((tribe) => ({
			tribe,
			name: getTribeName(tribe, this.i18n),
			disabledTooltip,
		}));
		const effectiveTribe =
			selectedTribe && context.mostCommonTribes.includes(selectedTribe)
				? selectedTribe
				: (context.mostCommonTribes[0] ?? null);
		const visibleMinions = [
			...filterDarkDiscoveryMinions(context.minions, resolved.turn, resolved.isTenPlus, {
				guaranteedTypeEnabled: guaranteedEnabled,
				showGuaranteedType: guaranteedEnabled ? showGuaranteed : false,
				guaranteedTribes: context.mostCommonTribes,
				selectedTribe: effectiveTribe,
			}),
		].sort((a, b) => a.techLevel - b.techLevel || a.cardId.localeCompare(b.cardId));
		const hovered = hoveredCardId ? (visibleMinions.find((m) => m.cardId === hoveredCardId) ?? null) : null;
		const gifts = evaluateDarkGifts(
			{
				...context,
				turn: resolved.turn,
				isTenPlus: resolved.isTenPlus,
			},
			hovered,
			visibleMinions,
		);
		const turnValue = resolved.isTenPlus ? '10+' : `${resolved.turn}`;
		const tribeLog = JSON.stringify({
			currentTurn: context.currentTurn,
			resolvedTurn: resolved.turn,
			isTenPlus: resolved.isTenPlus,
			guaranteedEnabled,
			mostCommonTribes: context.mostCommonTribes,
			tribeTabs: tribeTabs.map((tab) => tab.name),
			selectedTribe: effectiveTribe,
			showGuaranteed,
		});
		if (tribeLog !== this.lastTribeLog) {
			this.lastTribeLog = tribeLog;
		}
		return {
			turnLabel: this.i18n.translateString('battlegrounds.in-game.dark-gifts.turn', { value: turnValue }),
			canGoPrev: resolved.isTenPlus
				? context.currentTurn < DARK_DISCOVERY_TEN_PLUS_TURN
				: resolved.turn > getDarkDiscoveryTurnFloor(context.currentTurn),
			canGoNext: !resolved.isTenPlus,
			usesLabel:
				context.usesLeft != null
					? this.i18n.translateString('battlegrounds.in-game.dark-gifts.uses-left', {
							value: context.usesLeft,
						})
					: null,
			guaranteedEnabled,
			showGuaranteedType: guaranteedEnabled && showGuaranteed,
			tribeTabs,
			selectedTribe: effectiveTribe,
			minions: visibleMinions.map((minion) => this.toCard(minion, hoveredCardId)),
			gifts: gifts.map((gift) => this.toGiftRow(gift)),
		};
	}

	private resolveTurn(
		context: DarkGiftLiveContext,
		selectedTurn: number | null,
		userTenPlus: boolean,
	): { turn: number; isTenPlus: boolean } {
		if (context.currentTurn >= DARK_DISCOVERY_TEN_PLUS_TURN) {
			return { turn: context.currentTurn, isTenPlus: true };
		}
		const turnFloor = getDarkDiscoveryTurnFloor(context.currentTurn);
		const isTenPlus = userTenPlus;
		const turn = isTenPlus ? DARK_DISCOVERY_TEN_PLUS_TURN : Math.max(turnFloor, selectedTurn ?? turnFloor);
		return { turn, isTenPlus };
	}

	private toCard(minion: DarkGiftMinionView, hoveredCardId: string | null): DarkGiftMinionCard {
		return {
			cardId: minion.cardId,
			image: this.i18n.getCardImage(minion.cardId, { isBgs: true }),
			hovered: minion.cardId === hoveredCardId,
		};
	}

	private toGiftRow(gift: EvaluatedDarkGift): DarkGiftRow {
		const ref = this.allCards.getCard(gift.cardId);
		return {
			cardId: gift.cardId,
			name: ref?.name ?? gift.cardId,
			text: formatDarkGiftText(ref?.text ?? null, gift.computedValue),
			computedValue: gift.computedValue,
			compatible: gift.compatible,
			hasCondition: gift.hasCondition || !!gift.reason,
			conditionTooltip: this.conditionTooltip(gift),
		};
	}

	private conditionTooltip(gift: EvaluatedDarkGift): string | null {
		const key = gift.reason ?? gift.condition;
		return key ? this.reasonText(key) : null;
	}

	private reasonText(reason: DarkGiftReasonKey): string {
		return this.i18n.translateString(`battlegrounds.in-game.dark-gifts.reason.${reason}`);
	}
}
