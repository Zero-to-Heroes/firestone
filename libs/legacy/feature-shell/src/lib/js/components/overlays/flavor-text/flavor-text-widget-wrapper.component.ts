import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { SceneMode } from '@firestone-hs/reference-data';
import { GameStateFacadeService } from '@firestone/game-state';
import { SceneService } from '@firestone/memory';
import { FlavorTextService, PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { combineLatest, Observable } from 'rxjs';

@Component({
	standalone: false,
	selector: 'flavor-text-widget-wrapper',
	styleUrls: ['../../../../css/component/overlays/flavor-text/flavor-text-widget-wrapper.component.scss'],
	template: `
		<flavor-text-widget class="widget" *ngIf="showWidget$ | async"></flavor-text-widget>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlavorTextWidgetWrapperComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	showWidget$: Observable<boolean>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
		private readonly scene: SceneService,
		private readonly gameState: GameStateFacadeService,
		private readonly flavorTextService: FlavorTextService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.scene, this.gameState, this.prefs, this.flavorTextService);

		this.showWidget$ = combineLatest([
			this.scene.currentScene$$,
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.overlayShowFlavorTextOnHover)),
			this.gameState.gameState$$.pipe(
				this.mapData((state) => state.gameStarted && !state.gameEnded),
			),
			this.flavorTextService.flavorText$$,
		]).pipe(
			this.mapData(([currentScene, displayFromPrefs, inGame, flavorText]) => {
				return displayFromPrefs && inGame && currentScene === SceneMode.GAMEPLAY && !!flavorText;
			}),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
