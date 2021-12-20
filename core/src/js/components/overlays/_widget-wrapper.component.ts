import { AfterViewInit, ChangeDetectorRef, Directive, ElementRef, Renderer2 } from '@angular/core';
import { Preferences } from '../../models/preferences';
import { OverwolfService } from '../../services/overwolf.service';
import { PreferencesService } from '../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../abstract-subscription.component';

@Directive()
export abstract class AbstractWidgetWrapperComponent extends AbstractSubscriptionComponent implements AfterViewInit {
	protected abstract defaultPositionLeftProvider: (gameWidth: number, windowWidth: number) => number;
	protected abstract defaultPositionTopProvider: (gameHeight: number, windowHeight: number) => number;
	protected abstract positionUpdater: (left: number, top: number) => Promise<void>;
	protected abstract positionExtractor: (prefs: Preferences) => { left: number; top: number };

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
		const prefs = await this.prefs.getPreferences();
		let positionFromPrefs = this.positionExtractor(prefs);
		console.debug('positionFromPrefs', positionFromPrefs);
		if (!positionFromPrefs) {
			const gameInfo = await this.ow.getRunningGameInfo();
			const gameWidth = gameInfo.width;
			const gameHeight = gameInfo.height;
			const height = gameHeight;
			const width = gameWidth;
			positionFromPrefs = {
				left: this.defaultPositionLeftProvider(width, height),
				top: this.defaultPositionTopProvider(width, height),
			};
			console.debug('built default position', positionFromPrefs);
		}
		this.renderer.setStyle(this.el.nativeElement, 'left', positionFromPrefs.left + 'px');
		this.renderer.setStyle(this.el.nativeElement, 'top', positionFromPrefs.top + 'px');
	}

	startDragging() {
		console.debug('start dragging', this.el.nativeElement);
	}

	stopDragging() {
		const newPosition = {
			x: this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect().left,
			y: this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect().top,
		};
		console.debug('new position', newPosition);
		this.positionUpdater(newPosition.x, newPosition.y);
	}
}
