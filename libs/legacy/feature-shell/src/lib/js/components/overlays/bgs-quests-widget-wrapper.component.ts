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

@Component({
	selector: 'bgs-quests-widget-wrapper',
	styleUrls: ['../../../css/component/overlays/quests-widget-wrapper.component.scss'],
	template: `
		<bgs-quests-widget
			class="widget"
			*ngIf="showWidget$ | async"
			cdkDrag
			[cdkDragDisabled]="!draggable"
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
				([main, nav, prefs]) => prefs.bgsShowQuestsWidget && prefs.enableQuestsWidget,
				([main, nav, prefs]) => prefs.showQuestsInGame,
			),
		]).pipe(
			this.mapData(([currentScene, lastNonGamePlayScene, [displayFromPrefs, showQuestsInGame]]) => {
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

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}

export const BG_HEARTHSTONE_SCENES_FOR_QUESTS = [SceneMode.BACON, SceneMode.BACON_COLLECTION];
