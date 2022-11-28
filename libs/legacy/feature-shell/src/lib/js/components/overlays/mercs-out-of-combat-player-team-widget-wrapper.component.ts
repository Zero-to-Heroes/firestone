import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { SceneMode } from '@firestone-hs/reference-data';
import { combineLatest, Observable } from 'rxjs';
import { CardTooltipPositionType } from '../../directives/card-tooltip-position.type';
import { Preferences } from '../../models/preferences';
import { OverwolfService } from '../../services/overwolf.service';
import { PreferencesService } from '../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';

@Component({
	selector: 'mercs-out-of-combat-player-team-widget-wrapper',
	styleUrls: ['../../../css/component/overlays/decktracker-player-widget-wrapper.component.scss'],
	template: `
		<mercenaries-out-of-combat-player-team
			class="widget"
			*ngIf="showWidget$ | async"
			cdkDrag
			(cdkDragStarted)="startDragging()"
			(cdkDragReleased)="stopDragging()"
			(cdkDragEnded)="dragEnded($event)"
			[tooltipPosition]="tooltipPosition"
		></mercenaries-out-of-combat-player-team>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercsOutOfCombatPlayerTeamWidgetWrapperComponent
	extends AbstractWidgetWrapperComponent
	implements AfterContentInit {
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) => gameWidth - 250;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) => 10;
	protected positionUpdater = (left: number, top: number) =>
		this.prefs.updateMercenariesTeamPlayerPosition(left, top);
	protected positionExtractor = async (prefs: Preferences) => prefs.mercenariesPlayerTeamOverlayPosition;
	protected getRect = () => this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect();
	protected bounds = {
		left: -100,
		right: -100,
		top: -50,
		bottom: -50,
	};

	tooltipPosition: CardTooltipPositionType = 'left';

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
			this.store.listen$(([main, nav, prefs]) => main.currentScene),
			this.store.listenPrefs$(
				(prefs) => prefs.mercenariesEnableOutOfCombatPlayerTeamWidget,
				(prefs) => prefs.mercenariesEnableOutOfCombatPlayerTeamWidgetOnVillage,
			),
			this.store.listenMercenariesOutOfCombat$(([state, prefs]) => !!state),
		).pipe(
			this.mapData(([[currentScene], [displayFromPrefs, displayFromPrefsVillage], [hasState]]) => {
				const scenes = [];
				if (displayFromPrefs) {
					scenes.push(SceneMode.LETTUCE_MAP);
				}
				if (displayFromPrefsVillage) {
					scenes.push(SceneMode.LETTUCE_BOUNTY_TEAM_SELECT, SceneMode.LETTUCE_COLLECTION);
				}
				return hasState && scenes.includes(currentScene);
			}),
			this.handleReposition(),
		);
	}

	protected async reposition(cleanup?: () => void): Promise<{ left: number; top: number }> {
		const newPosition = await super.reposition(cleanup);
		if (!newPosition) {
			return;
		}

		this.tooltipPosition = newPosition.left < 400 ? 'right' : 'left';
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		return newPosition;
	}
}
