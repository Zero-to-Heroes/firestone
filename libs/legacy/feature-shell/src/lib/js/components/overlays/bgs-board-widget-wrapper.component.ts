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
import {} from 'jszip';
import { Observable, combineLatest } from 'rxjs';
import { ShopMinion } from '../../services/battlegrounds/bgs-board-highlighter.service';
import { PreferencesService } from '../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';

@Component({
	selector: 'bgs-board-widget-wrapper',
	styleUrls: ['../../../css/component/overlays/bgs-board-widget-wrapper.component.scss'],
	template: `
		<div class="board-container" *ngIf="showWidget$ | async">
			<ul class="board" *ngIf="highlightedMinions$ | async as highlightedMinions">
				<bgs-tavern-minion
					class="tavern-minion"
					*ngFor="let minion of highlightedMinions; trackBy: trackByMinion"
					[minion]="minion"
				></bgs-tavern-minion>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsBoardWidgetWrapperComponent extends AbstractWidgetWrapperComponent implements AfterContentInit {
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number, dpi: number) => gameHeight * 0.15;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number, dpi: number) => gameHeight * 0.3;
	protected positionUpdater = null;
	protected positionExtractor = null;
	protected getRect = () => this.el.nativeElement.querySelector('.board-container')?.getBoundingClientRect();

	showWidget$: Observable<boolean>;
	highlightedMinions$: Observable<readonly ShopMinion[]>;

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
			this.store.listenBattlegrounds$(
				([state]) => state?.inGame,
				([state]) => state?.currentGame?.gameEnded,
			),
		).pipe(
			this.mapData(
				([[currentScene], [inGame, gameEnded]]) => currentScene === SceneMode.GAMEPLAY && inGame && !gameEnded,
			),
			this.handleReposition(),
		);
		this.highlightedMinions$ = this.store
			.highlightedBgsMinions$()
			.pipe(this.mapData((highlightedMinion) => highlightedMinion));
	}

	trackByMinion(index: number, minion: ShopMinion) {
		return minion.entityId;
	}
}
