import { CdkDragEnd } from '@angular/cdk/drag-drop';
import { ChangeDetectorRef, Directive, ElementRef, NgZone, OnDestroy, OnInit, Renderer2, ViewRef } from '@angular/core';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { AppInjector, OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { sleep } from '@services/utils';
import { Observable, Subject, Subscription, UnaryFunction, pipe } from 'rxjs';
import { concatMap, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';

// https://stackoverflow.com/questions/62222979/angular-9-decorators-on-abstract-base-class
@Directive()
export abstract class AbstractWidgetWrapperComponent
	extends AbstractSubscriptionComponent
	implements OnInit, OnDestroy
{
	protected abstract defaultPositionLeftProvider: (gameWidth: number, gameHeight: number, dpi: number) => number;
	protected abstract defaultPositionTopProvider: (gameWidth: number, gameHeight: number, dpi: number) => number;
	protected abstract positionUpdater: (left: number, top: number) => Promise<void>;
	protected abstract positionExtractor: (
		prefs: Preferences,
		prefService?: PreferencesService,
	) => Promise<{ left: number; top: number }>;
	protected abstract getRect: () => { left: number; top: number; width: number; height: number };
	protected bounds = {
		left: -20,
		top: -20,
		right: -20,
		bottom: -20,
	};
	protected forceKeepInBounds = true;
	protected draggable = true;

	protected isDragging = false;

	protected debug = false;

	/** Emits when the parent container's size changes (width, height in pixels) */
	private readonly sizeChanges$ = new Subject<{ width: number; height: number }>();
	private readonly keepingInBounds$ = new Subject<{
		gameWidth: number;
		gameHeight: number;
		positionFromPrefs: { left: number; top: number };
	}>();
	private resizeObserver: ResizeObserver | null = null;
	// private gameInfo: GameInfoService;
	private subscriptions: Subscription[] = [];

	private ngZone: NgZone;

	constructor(
		protected readonly ow: OverwolfService,
		protected readonly el: ElementRef,
		protected readonly prefs: PreferencesService,
		protected readonly renderer: Renderer2,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(cdr);
		// this.gameInfo = AppInjector.get(GameInfoService);
		this.ngZone = AppInjector.get(NgZone);
	}

	ngOnInit(): void {
		this.init();
	}

	private async init() {
		await waitForReady(this.prefs);

		this.prefs.preferences$$
			.pipe(this.mapData((prefs) => prefs.lockWidgetPositions))
			.subscribe((lockWidgetPositions) => {
				this.draggable = !lockWidgetPositions;
				if (!(this.cdr as ViewRef).destroyed) {
					this.cdr.markForCheck();
				}
			});

		// Subscribe to size changes
		this.subscriptions.push(
			this.sizeChanges$
				.pipe(
					debounceTime(200),
					distinctUntilChanged((a, b) => a.width === b.width && a.height === b.height),
					takeUntil(this.destroyed$),
				)
				.subscribe(({ width, height }) => {
					this.onResize();
				}),
		);
		this.subscriptions.push(
			this.keepingInBounds$
				.pipe(
					takeUntil(this.destroyed$),
					// Process sequentially so a slow getRect() can't let a newer resize complete first and then be overwritten
					concatMap(async ({ gameWidth, gameHeight, positionFromPrefs }) => {
						let widgetRect = this.getRect();
						while (!(widgetRect = this.getRect())?.width) {
							await sleep(500);
						}
						return this.keepInBounds(gameWidth, gameHeight, positionFromPrefs, widgetRect);
					}),
				)
				.subscribe(),
		);
		// ResizeObserver only fires when the observed element's size changes. The host may have
		// no explicit size (e.g. inline), so it often doesn't change when the window resizes.
		// Listen to window resize and emit current container dimensions.
		this.ngZone.runOutsideAngular(() => {
			window.addEventListener('resize', () => this.ngZone.run(this.emitCurrentSize));
		});
		// Emit initial size and when the element is resized by layout (e.g. parent size)
		this.resizeObserver = new ResizeObserver((entries) => {
			this.ngZone.run(() => this.emitCurrentSize());
		});
		this.resizeObserver.observe(document.body);
		// Initial size after view is ready
		this.emitCurrentSize();

		// await sleep(500);
		// await this.onResize();
	}

	ngOnDestroy(): void {
		window.removeEventListener('resize', this.emitCurrentSize);
		this.resizeObserver?.disconnect();
		this.resizeObserver = null;
		this.sizeChanges$.complete();
		this.subscriptions.forEach((sub) => sub.unsubscribe());
	}

	protected handleReposition(): UnaryFunction<Observable<boolean>, Observable<boolean>> {
		return pipe(
			distinctUntilChanged(),
			switchMap(async (visible: boolean) => {
				if (visible) {
					this.emitCurrentSize();
					// const repositioned = await this.reposition();
				}
				return visible;
			}),
			this.mapData((visible) => visible),
		);
	}

	private repositioning: boolean;
	protected async reposition(cleanup: () => void = null): Promise<{ left: number; top: number }> {
		if (this.repositioning) {
			return;
		}
		this.repositioning = true;
		const prefs = await this.prefs.getPreferences();
		// This is used only in the scope of a full-screen overlay, so the size of the window is the size of the game
		const gameWidth = window.innerWidth;
		const gameHeight = window.innerHeight;
		const dpi = 1;
		// const gameInfo = await this.gameInfo.getRunningGameInfo();
		// if (!gameInfo) {
		// 	// this.debug && console.debug('missing game info', gameInfo);
		// 	console.warn('missing game info', gameInfo);
		// 	this.repositioning = false;
		// 	return;
		// }
		// // this.debug && console.debug('gameInfo', this.constructor.name, gameInfo);
		// const gameWidth = gameInfo.width;
		// const gameHeight = gameInfo.height;
		// const dpi = gameInfo.logicalWidth / gameInfo.width;

		// First position the widget based on the prefs
		// For static widgets, we can decide to not use javascript positioning and do everything with CSS
		let positionFromPrefs = this.positionExtractor ? await this.positionExtractor(prefs, this.prefs) : null;
		if (!positionFromPrefs && this.defaultPositionLeftProvider && this.defaultPositionTopProvider) {
			positionFromPrefs = {
				left: this.defaultPositionLeftProvider(gameWidth, gameHeight, dpi),
				top: this.defaultPositionTopProvider(gameWidth, gameHeight, dpi),
			};
		}
		this.debug &&
			console.debug(
				'positionFromPrefs',
				this.constructor.name,
				positionFromPrefs,
				this.forceKeepInBounds,
				gameWidth,
				gameHeight,
				dpi,
			);
		if (positionFromPrefs) {
			this.renderer.setStyle(this.el.nativeElement, 'left', positionFromPrefs.left + 'px');
			this.renderer.setStyle(this.el.nativeElement, 'top', positionFromPrefs.top + 'px');

			// Then make sure it fits inside the bounds
			// Don't await it to avoid blocking the process (since the first time the widget doesn't exist)
			if (this.forceKeepInBounds) {
				this.keepingInBounds$.next({ gameWidth, gameHeight, positionFromPrefs });
				// this.keepInBounds(gameWidth, gameHeight, positionFromPrefs);
			}
		}

		if (cleanup) {
			cleanup();
		}

		this.repositioning = false;
		return positionFromPrefs;
	}

	private async keepInBounds(
		gameWidth: number,
		gameHeight: number,
		positionFromPrefs: { left: number; top: number },
		widgetRect: { left: number; top: number; width: number; height: number },
	): Promise<{ left: number; top: number }> {
		// Make sure the widget stays in bounds
		const boundPositionFromPrefs = {
			left: Math.min(
				gameWidth - widgetRect.width - this.bounds.right,
				Math.max(this.bounds.left, positionFromPrefs.left),
			),
			top: Math.min(
				gameHeight - widgetRect.height - this.bounds.bottom,
				Math.max(this.bounds.top, positionFromPrefs.top),
			),
		};
		this.debug &&
			console.debug(
				'boundPositionFromPrefs',
				boundPositionFromPrefs,
				gameWidth,
				gameHeight,
				widgetRect.width,
				widgetRect.height,
			);

		this.renderer.setStyle(this.el.nativeElement, 'left', boundPositionFromPrefs.left + 'px');
		this.renderer.setStyle(this.el.nativeElement, 'top', boundPositionFromPrefs.top + 'px');
		return boundPositionFromPrefs;
	}

	startDragging() {
		this.isDragging = true;
	}

	async stopDragging() {
		// So that "click" listeners will still see the dragging = true
		await sleep(50);
		this.isDragging = false;
	}

	async dragEnded(event: CdkDragEnd) {
		const newPosition = {
			x: this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect().left,
			y: this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect().top,
		};
		await this.positionUpdater(newPosition.x, newPosition.y);
		this.reposition(() => event.source._dragRef.reset());
	}

	// @HostListener('window:window-resize')
	async onResize(): Promise<void> {
		await this.doResize();
		await this.reposition();
	}

	protected async doResize() {
		// Do nothing, only for children
	}

	private emitCurrentSize = () => {
		const width = window.innerWidth;
		const height = window.innerHeight;
		this.sizeChanges$.next({ width, height });
	};
}
