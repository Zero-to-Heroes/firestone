import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
} from '@angular/core';
import { DeckState, GameState, GameStateFacadeService } from '@firestone/game-state';
import { SceneService } from '@firestone/memory';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { OverwolfService } from '@firestone/shared/framework/core';
import { AbstractMaxResourcesWidgetWrapperComponent } from './abstract-max-resources-widget-wrapper.component';

@Component({
	standalone: false,
	selector: 'opponent-max-resources-widget-wrapper',
	styleUrls: ['./opponent-max-resources-widget-wrapper.component.scss'],
	template: `
		<max-resources-widget
			*ngIf="showWidget$ | async"
			class="widget scalable"
			[style.opacity]="(opacity$ | async) ?? 1"
			[maxResources]="maxResources$ | async"
			[showHorizontally]="showHorizontally$ | async"
			cdkDrag
			[cdkDragDisabled]="!draggable"
			(cdkDragStarted)="startDragging()"
			(cdkDragReleased)="stopDragging()"
			(cdkDragEnded)="dragEnded($event)"
		></max-resources-widget>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpponentMaxResourcesWidgetWrapperComponent
	extends AbstractMaxResourcesWidgetWrapperComponent
	implements AfterContentInit
{
	protected override prefName: keyof Preferences = 'showOpponentMaxResourcesWidget';
	protected override positionPrefName: keyof Preferences = 'opponentMaxResourcesWidgetPosition';
	protected override alwaysOnPrefName: keyof Preferences = 'opponentMaxResourcesWidgetAlwaysOn';
	protected override scalePrefName: keyof Preferences = 'opponentMaxResourcesWidgetScale';

	protected override deckExtractor: (gameState: GameState) => DeckState = (gameState) => gameState.opponentDeck;
	protected override defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) =>
		gameWidth / 2 + gameHeight * 0.22;
	protected override defaultPositionTopProvider = (gameWidth: number, gameHeight: number) => gameHeight * 0.09;

	constructor(
		protected readonly ow: OverwolfService,
		protected readonly el: ElementRef,
		protected readonly prefs: PreferencesService,
		protected readonly renderer: Renderer2,
		protected readonly cdr: ChangeDetectorRef,
		protected readonly scene: SceneService,
		protected readonly gameState: GameStateFacadeService,
	) {
		super(ow, el, prefs, renderer, cdr, scene, gameState);
	}
}
