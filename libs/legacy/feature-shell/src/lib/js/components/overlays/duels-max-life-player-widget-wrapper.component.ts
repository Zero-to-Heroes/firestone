import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { isDuels } from '../../services/duels/duels-utils';
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
	implements AfterContentInit
{
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) => gameHeight * 0.725;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) => gameHeight * 0.208;
	protected positionUpdater = null;
	protected positionExtractor = null;
	protected getRect = () => this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect();

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

	async ngAfterContentInit() {
		await waitForReady(this.prefs);

		this.showWidget$ = combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.duelsShowMaxLifeWidget2)),
			this.store.listenDeckState$((state) => state?.metadata?.gameType),
		]).pipe(
			this.mapData(([show, [gameType]]) => isDuels(gameType) && ['mouseover', 'blink'].includes(show)),
			this.handleReposition(),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
}
