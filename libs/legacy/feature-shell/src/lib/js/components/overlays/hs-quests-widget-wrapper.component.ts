import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
} from '@angular/core';
import { SceneMode } from '@firestone-hs/reference-data';
import { OverwolfService } from '@firestone/shared/framework/core';
import { combineLatest, Observable } from 'rxjs';
import { Preferences } from '../../models/preferences';
import { PreferencesService } from '../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { BG_HEARTHSTONE_SCENES_FOR_QUESTS } from './bgs-quests-widget-wrapper.component';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';

@Component({
	selector: 'hs-quests-widget-wrapper',
	styleUrls: ['../../../css/component/overlays/quests-widget-wrapper.component.scss'],
	template: `
		<hs-quests-widget
			class="widget"
			[activeTheme]="'decktracker'"
			*ngIf="showWidget$ | async"
			cdkDrag
			(cdkDragStarted)="startDragging()"
			(cdkDragReleased)="stopDragging()"
			(cdkDragEnded)="dragEnded($event)"
		></hs-quests-widget>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HsQuestsWidgetWrapperComponent extends AbstractWidgetWrapperComponent implements AfterContentInit {
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) => gameWidth - 200;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) => gameHeight - 200;
	protected positionUpdater = (left: number, top: number) => this.prefs.updateHsQuestsWidgetPosition(left, top);
	protected positionExtractor = async (prefs: Preferences) => prefs.hsQuestsWidgetPosition;
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
				([main, nav, prefs]) => prefs.hsShowQuestsWidget && prefs.enableQuestsWidget,
				([main, nav, prefs]) => prefs.showQuestsInGame,
				([main, nav, prefs]) => prefs.hsShowQuestsWidgetOnHub,
				([main, nav, prefs]) => prefs.hsShowQuestsWidgetOnBg,
			),
		).pipe(
			this.mapData(
				([
					[
						currentScene,
						lastNonGamePlayScene,
						displayFromPrefs,
						showQuestsInGame,
						hsShowQuestsWidgetOnHub,
						hsShowQuestsWidgetOnBg,
					],
				]) => {
					if (!displayFromPrefs) {
						return false;
					}
					const hearthstoneScenes = [
						SceneMode.PVP_DUNGEON_RUN,
						SceneMode.FRIENDLY,
						SceneMode.TOURNAMENT,
						SceneMode.TAVERN_BRAWL,
						SceneMode.COLLECTIONMANAGER,
					];
					if (hearthstoneScenes.includes(currentScene)) {
						return true;
					}

					// Otherwise the quest widget flickers briefly while going into a game
					// because the states are all empty
					const isInHearthstoneMatch =
						currentScene === SceneMode.GAMEPLAY && hearthstoneScenes.includes(lastNonGamePlayScene);
					if (showQuestsInGame && isInHearthstoneMatch) {
						return true;
					}

					if (hsShowQuestsWidgetOnHub && currentScene === SceneMode.HUB) {
						return true;
					}

					if (hsShowQuestsWidgetOnBg && BG_HEARTHSTONE_SCENES_FOR_QUESTS.includes(currentScene)) {
						return true;
					}
					const isInBgMatch =
						currentScene === SceneMode.GAMEPLAY &&
						BG_HEARTHSTONE_SCENES_FOR_QUESTS.includes(lastNonGamePlayScene);
					if (showQuestsInGame && hsShowQuestsWidgetOnBg && isInBgMatch) {
						return true;
					}

					return false;
				},
			),
			this.handleReposition(),
		);
	}
}
