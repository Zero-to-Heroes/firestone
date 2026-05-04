import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { MercenariesBattleStateFacadeService } from '@firestone/mercenaries/common';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { CardTooltipPositionType } from '@firestone/shared/common/view';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';

@Component({
	standalone: false,
	selector: 'mercs-player-team-widget-wrapper',
	styleUrls: ['../../../css/component/overlays/decktracker-player-widget-wrapper.component.scss'],
	template: `
		<mercenaries-player-team
			class="widget"
			*ngIf="showWidget$ | async"
			cdkDrag
			[cdkDragDisabled]="!draggable"
			(cdkDragStarted)="startDragging()"
			(cdkDragReleased)="stopDragging()"
			(cdkDragEnded)="dragEnded($event)"
			[tooltipPosition]="tooltipPosition"
		></mercenaries-player-team>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercsPlayerTeamWidgetWrapperComponent extends AbstractWidgetWrapperComponent implements AfterContentInit {
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
		protected readonly cdr: ChangeDetectorRef,
		private readonly mercenariesBattleStateFacade: MercenariesBattleStateFacadeService,
	) {
		super(ow, el, prefs, renderer, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs, this.mercenariesBattleStateFacade);

		this.showWidget$ = combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.mercenariesEnablePlayerTeamWidget)),
			this.mercenariesBattleStateFacade.store$$.pipe(this.mapData((state) => state?.playerClosedManually)),
			this.mercenariesBattleStateFacade.store$$.pipe(
				this.mapData((state) => !!state?.playerTeam?.mercenaries?.length),
			),
		]).pipe(
			this.mapData(([displayFromPrefs, playerClosedManually, hasTeamMercs]) => {
				return displayFromPrefs && !playerClosedManually && hasTeamMercs;
			}),
			this.handleReposition(),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.markForCheck();
		}
	}

	protected async reposition(cleanup?: () => void): Promise<{ left: number; top: number }> {
		const newPosition = await super.reposition(cleanup);
		if (!newPosition) {
			return;
		}

		this.tooltipPosition = newPosition.left < 400 ? 'right' : 'left';
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
		return newPosition;
	}
}
