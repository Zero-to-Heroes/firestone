import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
} from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { isDuels } from '../../services/duels/duels-utils';
import { OverwolfService } from '../../services/overwolf.service';
import { PreferencesService } from '../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';

@Component({
	selector: 'duels-max-life-opponent-widget-wrapper',
	styleUrls: ['../../../css/component/overlays/decktracker-player-widget-wrapper.component.scss'],
	template: ` <duels-max-life-widget class="widget" *ngIf="showWidget$ | async"></duels-max-life-widget> `,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsMaxLifeOpponentWidgetWrapperComponent
	extends AbstractWidgetWrapperComponent
	implements AfterContentInit {
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) => gameHeight * 0.725;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) => gameHeight * 0.208;
	protected positionUpdater = null;
	protected positionExtractor = null;
	protected getRect = () => this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect();
	protected isWidgetVisible = () => this.visible;

	private visible: boolean;

	showWidget$: Observable<boolean>;

	constructor(
		protected readonly ow: OverwolfService,
		protected readonly el: ElementRef,
		protected readonly prefs: PreferencesService,
		protected readonly renderer: Renderer2,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(ow, el, prefs, renderer, store, cdr);
	}

	ngAfterContentInit(): void {
		this.showWidget$ = combineLatest(
			this.store.listenPrefs$((prefs) => prefs.duelsShowMaxLifeWidget2),
			this.store.listenDeckState$((state) => state?.metadata?.gameType),
		).pipe(this.mapData(([[show], [gameType]]) => isDuels(gameType) && ['mouseover', 'blink'].includes(show)));
		this.showWidget$.pipe(distinctUntilChanged(), takeUntil(this.destroyed$)).subscribe((show) => {
			this.visible = show;
			this.reposition();
		});
	}
}
