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
import { GameNativeStateStoreService } from '@firestone/app/common';
import { GameStateFacadeService } from '@firestone/game-state';
import { SceneService } from '@firestone/memory';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { isBattlegroundsScene } from '../../services/battlegrounds/bgs-utils';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';

const refBounds = {
	left: -50,
	right: -50,
	top: -50,
	bottom: -50,
};

@Component({
	standalone: false,
	selector: 'current-session-widget-wrapper',
	styleUrls: ['./current-session-widget-wrapper.component.scss'],
	template: `
		<div
			class="wrapper"
			[ngClass]="{ hidden: hidden$ | async }"
			cdkDrag
			[cdkDragDisabled]="!draggable"
			(cdkDragStarted)="startDragging()"
			(cdkDragReleased)="stopDragging()"
			(cdkDragEnded)="dragEnded($event)"
		>
			<current-session-widget
				*ngIf="showWidget$ | async"
				class="widget scalable"
				[ngClass]="{ hidden: hidden$ | async }"
			></current-session-widget>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CurrentSessionWidgetWrapperComponent extends AbstractWidgetWrapperComponent implements AfterContentInit {
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) => gameWidth - 500;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) => 10;
	protected positionUpdater = (left: number, top: number) => this.prefs.updateCurrentSessionWidgetPosition(left, top);
	protected positionExtractor = async (prefs: Preferences) => prefs.currentSessionWidgetPosition;
	protected getRect = () => this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect();
	protected bounds = refBounds;

	showWidget$: Observable<boolean>;
	hidden$: Observable<boolean>;

	constructor(
		protected readonly ow: OverwolfService,
		protected readonly el: ElementRef,
		protected readonly prefs: PreferencesService,
		protected readonly renderer: Renderer2,
		protected readonly cdr: ChangeDetectorRef,
		private readonly gameState: GameStateFacadeService,
		private readonly scene: SceneService,
		private readonly gameNativeStore: GameNativeStateStoreService,
	) {
		super(ow, el, prefs, renderer, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.scene, this.prefs, this.gameState, this.gameNativeStore);

		const currentGameType$ = this.gameState.gameState$$.pipe(this.mapData((state) => state?.metadata?.gameType));
		this.showWidget$ = combineLatest([currentGameType$, this.scene.currentScene$$, this.prefs.preferences$$]).pipe(
			this.mapData(
				([gameType, currentScene, prefs]) =>
					prefs.showCurrentSessionWidgetBgs &&
					(isBattlegroundsScene(currentScene) || isBattlegrounds(gameType)),
			),
			this.handleReposition(),
		);
		this.hidden$ = combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.hideCurrentSessionWidgetWhenFriendsListIsOpen)),
			this.gameNativeStore.isFriendsListOpen$$,
		]).pipe(
			this.mapData(
				([hideCurrentSessionWidgetWhenFriendsListIsOpen, isFriendsListOpen]) =>
					hideCurrentSessionWidgetWhenFriendsListIsOpen && isFriendsListOpen,
			),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
