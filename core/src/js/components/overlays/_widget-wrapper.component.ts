import { CdkDragEnd } from '@angular/cdk/drag-drop';
import { AfterViewInit, ChangeDetectorRef, Directive, ElementRef, HostListener, Renderer2 } from '@angular/core';
import { Preferences } from '../../models/preferences';
import { OverwolfService } from '../../services/overwolf.service';
import { PreferencesService } from '../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../abstract-subscription.component';

// https://stackoverflow.com/questions/62222979/angular-9-decorators-on-abstract-base-class
@Directive()
export abstract class AbstractWidgetWrapperComponent extends AbstractSubscriptionComponent implements AfterViewInit {
	protected abstract defaultPositionLeftProvider: (gameWidth: number, gameHeight: number, dpi: number) => number;
	protected abstract defaultPositionTopProvider: (gameWidth: number, gameHeight: number, dpi: number) => number;
	protected abstract positionUpdater: (left: number, top: number) => Promise<void>;
	protected abstract positionExtractor: (
		prefs: Preferences,
		prefService?: PreferencesService,
	) => Promise<{ left: number; top: number }>;
	protected abstract getRect: () => { left: number; top: number; width: number; height: number };
	protected abstract isWidgetVisible: () => boolean;
	protected bounds = {
		left: -20,
		top: -20,
		right: -20,
		bottom: -20,
	};

	constructor(
		protected readonly ow: OverwolfService,
		protected readonly el: ElementRef,
		protected readonly prefs: PreferencesService,
		protected readonly renderer: Renderer2,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	async ngAfterViewInit() {
		this.reposition();
	}

	protected async reposition(cleanup: () => void = null): Promise<{ left: number; top: number }> {
		if (!this.isWidgetVisible()) {
			// console.debug('widget is not visible');
			return;
		}

		const prefs = await this.prefs.getPreferences();
		let positionFromPrefs = this.positionExtractor ? await this.positionExtractor(prefs, this.prefs) : null;
		console.debug('positionFromPrefs', positionFromPrefs);
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			console.warn('missing game info', gameInfo);
			return;
		}
		const gameWidth = gameInfo.width;
		const gameHeight = gameInfo.height;
		const dpi = gameInfo.logicalWidth / gameInfo.width;
		if (!positionFromPrefs) {
			positionFromPrefs = {
				left: this.defaultPositionLeftProvider(gameWidth, gameHeight, dpi),
				top: this.defaultPositionTopProvider(gameWidth, gameHeight, dpi),
			};
			console.debug('built default position', positionFromPrefs);
		}
		const widgetRect = this.getRect();
		if (!widgetRect?.width) {
			console.debug(
				'no widget, starting again',
				this.constructor.name,
				this.isWidgetVisible(),
				this.isWidgetVisible,
			);
			setTimeout(() => this.reposition(), 500);
			return;
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
		console.debug(
			'bound position from prefs',
			boundPositionFromPrefs,
			this.bounds,
			gameHeight - widgetRect.height - this.bounds.bottom,
			gameHeight,
			widgetRect,
		);

		this.renderer.setStyle(this.el.nativeElement, 'left', boundPositionFromPrefs.left + 'px');
		this.renderer.setStyle(this.el.nativeElement, 'top', boundPositionFromPrefs.top + 'px');
		if (cleanup) {
			cleanup();
		}
		return boundPositionFromPrefs;
	}

	startDragging() {
		console.debug('start dragging', this.el.nativeElement);
	}

	async stopDragging() {
		// Do nothing for now
	}

	async dragEnded(event: CdkDragEnd) {
		console.debug('drag ended', event);
		const newPosition = {
			x: this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect().left,
			y: this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect().top,
		};
		console.debug('new position', newPosition);
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
