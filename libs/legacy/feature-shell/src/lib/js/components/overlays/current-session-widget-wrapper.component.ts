import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { isBattlegrounds } from '@firestone-hs/reference-data';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { OverwolfService } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { isBattlegroundsScene } from '../../services/battlegrounds/bgs-utils';
import { SceneService } from '../../services/game/scene.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';

@Component({
	selector: 'current-session-widget-wrapper',
	styleUrls: ['../../../css/component/overlays/decktracker-player-widget-wrapper.component.scss'],
	template: `
		<current-session-widget
			*ngIf="showWidget$ | async"
			class="widget"
			[ngClass]="{ hidden: hidden$ | async }"
			cdkDrag
			(cdkDragStarted)="startDragging()"
			(cdkDragReleased)="stopDragging()"
			(cdkDragEnded)="dragEnded($event)"
		></current-session-widget>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CurrentSessionWidgetWrapperComponent extends AbstractWidgetWrapperComponent implements AfterContentInit {
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) => gameWidth - 500;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) => 10;
	protected positionUpdater = (left: number, top: number) => this.prefs.updateCurrentSessionWidgetPosition(left, top);
	protected positionExtractor = async (prefs: Preferences) => prefs.currentSessionWidgetPosition;
	protected getRect = () => this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect();
	protected bounds = {
		left: -50,
		right: -50,
		top: -50,
		bottom: -50,
	};

	showWidget$: Observable<boolean>;
	hidden$: Observable<boolean>;

	constructor(
		protected readonly ow: OverwolfService,
		protected readonly el: ElementRef,
		protected readonly prefs: PreferencesService,
		protected readonly renderer: Renderer2,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly scene: SceneService,
	) {
		super(ow, el, prefs, renderer, store, cdr);
	}

	async ngAfterContentInit() {
		await this.scene.isReady();
		await this.prefs.isReady();

		const currentGameType$ = this.store
			.listenDeckState$((state) => state?.metadata?.gameType)
			.pipe(this.mapData(([gameType]) => gameType));
		this.showWidget$ = combineLatest([currentGameType$, this.scene.currentScene$$, this.prefs.preferences$$]).pipe(
			this.mapData(
				([gameType, currentScene, prefs]) =>
					prefs.showCurrentSessionWidgetBgs &&
					(isBattlegroundsScene(currentScene) || isBattlegrounds(gameType)),
			),
			this.handleReposition(),
		);
		this.hidden$ = combineLatest(
			this.store.listenPrefs$((prefs) => prefs.hideCurrentSessionWidgetWhenFriendsListIsOpen),
			this.store.listenNativeGameState$((state) => state.isFriendsListOpen),
		).pipe(
			this.mapData(
				([[hideCurrentSessionWidgetWhenFriendsListIsOpen], [isFriendsListOpen]]) =>
					hideCurrentSessionWidgetWhenFriendsListIsOpen && isFriendsListOpen,
			),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
