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
import { Preferences } from '../../models/preferences';
import { OverwolfService } from '../../services/overwolf.service';
import { PreferencesService } from '../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';

@Component({
	selector: 'mercs-opponent-team-widget-wrapper',
	styleUrls: ['../../../css/component/overlays/decktracker-player-widget-wrapper.component.scss'],
	template: `
		<mercenaries-opponent-team
			class="widget"
			*ngIf="showWidget$ | async"
			cdkDrag
			(cdkDragStarted)="startDragging()"
			(cdkDragReleased)="stopDragging()"
			(cdkDragEnded)="dragEnded($event)"
		></mercenaries-opponent-team>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercsOpponentTeamWidgetWrapperComponent
	extends AbstractWidgetWrapperComponent
	implements AfterContentInit {
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) => 0;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) => 50;
	protected positionUpdater = (left: number, top: number) =>
		this.prefs.updateMercenariesTeamOpponentPosition(left, top);
	protected positionExtractor = async (prefs: Preferences) => prefs.mercenariesOpponentTeamOverlayPosition;
	protected getRect = () => this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect();
	protected isWidgetVisible = () => this.visible;
	protected bounds = {
		left: -100,
		right: -100,
		top: -50,
		bottom: -50,
	};

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
			this.store.listenPrefs$((prefs) => prefs.mercenariesEnableOpponentTeamWidget),
			this.store.listenMercenaries$(
				([state, prefs]) => state?.opponentClosedManually,
				([state, prefs]) => !!state?.opponentTeam?.mercenaries?.length,
			),
		).pipe(
			// tap((info) => console.debug('info', info)),
			this.mapData(([[displayFromPrefs], [playerClosedManually, hasTeamMercs]]) => {
				return displayFromPrefs && !playerClosedManually && hasTeamMercs;
			}),
		);
		this.showWidget$.pipe(distinctUntilChanged(), takeUntil(this.destroyed$)).subscribe((show) => {
			this.visible = show;
			this.reposition();
		});
	}
}
