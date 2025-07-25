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
import { SceneService } from '@firestone/memory';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { OverwolfService } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';
import { BG_HEARTHSTONE_SCENES_FOR_QUESTS } from './bgs-quests-widget-wrapper.component';

@Component({
	standalone: false,
	selector: 'hs-quests-widget-wrapper',
	styleUrls: ['../../../css/component/overlays/quests-widget-wrapper.component.scss'],
	template: `
		<hs-quests-widget
			class="widget"
			[activeTheme]="'decktracker'"
			*ngIf="showWidget$ | async"
			cdkDrag
			[cdkDragDisabled]="!draggable"
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
		private readonly scene: SceneService,
	) {
		super(ow, el, prefs, renderer, cdr);
	}

	async ngAfterContentInit() {
		await this.scene.isReady();

		this.showWidget$ = combineLatest([
			this.scene.currentScene$$,
			this.scene.lastNonGamePlayScene$$,
			this.store.listen$(
				// Show from prefs
				([main, nav, prefs]) => prefs.hsShowQuestsWidget && prefs.enableQuestsWidget,
				([main, nav, prefs]) => prefs.showQuestsInGame,
				([main, nav, prefs]) => prefs.hsShowQuestsWidgetOnHub,
				([main, nav, prefs]) => prefs.hsShowQuestsWidgetOnBg,
			),
		]).pipe(
			this.mapData(
				([
					currentScene,
					lastNonGamePlayScene,
					[displayFromPrefs, showQuestsInGame, hsShowQuestsWidgetOnHub, hsShowQuestsWidgetOnBg],
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
						SceneMode.DRAFT,
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

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
