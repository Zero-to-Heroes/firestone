import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2
} from '@angular/core';
import { SceneMode } from '@firestone-hs/reference-data';
import { combineLatest, Observable } from 'rxjs';
import { Preferences } from '../../models/preferences';
import { OverwolfService } from '../../services/overwolf.service';
import { PreferencesService } from '../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';

@Component({
	selector: 'bgs-quests-widget-wrapper',
	styleUrls: ['../../../css/component/overlays/quests-widget-wrapper.component.scss'],
	template: `
		<bgs-quests-widget
			class="widget"
			*ngIf="showWidget$ | async"
			cdkDrag
			(cdkDragStarted)="startDragging()"
			(cdkDragReleased)="stopDragging()"
			(cdkDragEnded)="dragEnded($event)"
		></bgs-quests-widget>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsQuestsWidgetWrapperComponent extends AbstractWidgetWrapperComponent implements AfterContentInit {
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) => gameWidth - 200;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) => gameHeight - 200;
	protected positionUpdater = (left: number, top: number) => this.prefs.updateBgsQuestsWidgetPosition(left, top);
	protected positionExtractor = async (prefs: Preferences) => prefs.bgsQuestsWidgetPosition;
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

	ngAfterContentInit(): void {
		this.showWidget$ = combineLatest(
			this.store.listen$(
				([main, nav, prefs]) => main.currentScene,
				([main, nav, prefs]) => main.lastNonGamePlayScene,
				// Show from prefs
				([main, nav, prefs]) => prefs.bgsShowQuestsWidget && prefs.enableQuestsWidget,
				([main, nav, prefs]) => prefs.showQuestsInGame,
			),
		).pipe(
			this.mapData(([[currentScene, lastNonGamePlayScene, displayFromPrefs, showQuestsInGame]]) => {
				if (!displayFromPrefs) {
					return false;
				}
				const hearthstoneScenes = BG_HEARTHSTONE_SCENES_FOR_QUESTS;
				const isInHearthstoneMatch =
					currentScene === SceneMode.GAMEPLAY && hearthstoneScenes.includes(lastNonGamePlayScene);
				return (
					// Otherwise the quest widget flickers briefly while going into a game
					// because the states are all empty
					(showQuestsInGame && isInHearthstoneMatch) || hearthstoneScenes.includes(currentScene)
				);
			}),
			this.handleReposition(),
		);
	}
}

export const BG_HEARTHSTONE_SCENES_FOR_QUESTS = [SceneMode.BACON, SceneMode.BACON_COLLECTION];
