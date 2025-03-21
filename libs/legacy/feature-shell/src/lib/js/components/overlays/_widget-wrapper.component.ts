import { CdkDragEnd } from '@angular/cdk/drag-drop';
import { ChangeDetectorRef, Directive, ElementRef, HostListener, Renderer2, ViewRef } from '@angular/core';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { sleep } from '@services/utils';
import { Observable, UnaryFunction, pipe } from 'rxjs';
import { distinctUntilChanged, switchMap } from 'rxjs/operators';

// https://stackoverflow.com/questions/62222979/angular-9-decorators-on-abstract-base-class
@Directive()
export abstract class AbstractWidgetWrapperComponent extends AbstractSubscriptionComponent {
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

	protected debug = false;

	constructor(
		protected readonly ow: OverwolfService,
		protected readonly el: ElementRef,
		protected readonly prefs: PreferencesService,
		protected readonly renderer: Renderer2,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(cdr);
		this.init();
	}

	private async init() {
		await waitForReady(this.prefs);
		this.prefs.preferences$$
			.pipe(this.mapData((prefs) => prefs.lockWidgetPositions))
			.subscribe((lockWidgetPositions) => {
				this.draggable = !lockWidgetPositions;
				if (!(this.cdr as ViewRef).destroyed) {
					this.cdr.detectChanges();
				}
			});
	}

	protected handleReposition(): UnaryFunction<Observable<boolean>, Observable<boolean>> {
		return pipe(
			distinctUntilChanged(),
			switchMap(async (visible: boolean) => {
				if (visible) {
					const repositioned = await this.reposition();
				}
				return visible;
			}),
			this.mapData((visible) => visible),
		);
	}

	private repositioning: boolean;
	protected async reposition(cleanup: () => void = null): Promise<{ left: number; top: number }> {
		this.debug && console.debug('repositioning', this.repositioning);
		if (this.repositioning) {
			return;
		}
		this.repositioning = true;
		const prefs = await this.prefs.getPreferences();
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			console.warn('missing game info', gameInfo);
			this.repositioning = false;
			return;
		}
		this.debug && console.debug('gameInfo', gameInfo);
		const gameWidth = gameInfo.width;
		const gameHeight = gameInfo.height;
		const dpi = gameInfo.logicalWidth / gameInfo.width;

		// First position the widget based on the prefs
		// For static widgets, we can decide to not use javascript positioning and do everything with CSS
		let positionFromPrefs = this.positionExtractor ? await this.positionExtractor(prefs, this.prefs) : null;
		if (!positionFromPrefs && this.defaultPositionLeftProvider && this.defaultPositionTopProvider) {
			positionFromPrefs = {
				left: this.defaultPositionLeftProvider(gameWidth, gameHeight, dpi),
				top: this.defaultPositionTopProvider(gameWidth, gameHeight, dpi),
			};
		}
		this.debug && console.debug('positionFromPrefs', positionFromPrefs, this.forceKeepInBounds);
		if (positionFromPrefs) {
			this.renderer.setStyle(this.el.nativeElement, 'left', positionFromPrefs.left + 'px');
			this.renderer.setStyle(this.el.nativeElement, 'top', positionFromPrefs.top + 'px');

			// Then make sure it fits inside the bounds
			// Don't await it to avoid blocking the process (since the first time the widget doesn't exist)
			if (this.forceKeepInBounds) {
				this.keepInBounds(gameWidth, gameHeight, positionFromPrefs);
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
	): Promise<{ left: number; top: number }> {
		// return;
		let widgetRect = this.getRect();
		while (!(widgetRect = this.getRect())?.width) {
			await sleep(500);
		}
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
		this.debug && console.debug('boundPositionFromPrefs', boundPositionFromPrefs);

		this.renderer.setStyle(this.el.nativeElement, 'left', boundPositionFromPrefs.left + 'px');
		this.renderer.setStyle(this.el.nativeElement, 'top', boundPositionFromPrefs.top + 'px');
		return boundPositionFromPrefs;
	}

	startDragging() {
		// Do nothing for now
	}

	async stopDragging() {
		// Do nothing for now
	}

	async dragEnded(event: CdkDragEnd) {
		const newPosition = {
			x: this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect().left,
			y: this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect().top,
		};
		await this.positionUpdater(newPosition.x, newPosition.y);
		this.reposition(() => event.source._dragRef.reset());
	}

	@HostListener('window:window-resize')
	async onResize(): Promise<void> {
		await this.doResize();
		await this.reposition();
	}

	protected async doResize() {
		// Do nothing, only for children
	}
}
