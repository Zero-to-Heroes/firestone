import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { ArenaMulliganGuideService } from '@firestone/arena/common';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { OverwolfService } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';

@Component({
	selector: 'arena-mulligan-deck-widget-wrapper',
	styleUrls: ['./arena-mulligan-deck-widget-wrapper.component.scss'],
	template: `
		<arena-mulligan-deck
			class="widget"
			*ngIf="showWidget$ | async"
			cdkDrag
			[cdkDragDisabled]="!draggable"
			(cdkDragStarted)="startDragging()"
			(cdkDragReleased)="stopDragging()"
			(cdkDragEnded)="dragEnded($event)"
		></arena-mulligan-deck>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaMulliganDeckWidgetWrapperComponent
	extends AbstractWidgetWrapperComponent
	implements AfterContentInit
{
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) => 300;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) => gameHeight / 2;
	protected positionUpdater = (left: number, top: number) =>
		this.prefs.updateConstructedMulliganDeckWidgetPosition(left, top);
	protected positionExtractor = async (prefs: Preferences) => prefs.constructedMulliganDeckWidgetPosition;
	protected getRect = () => this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect();
	protected bounds = {
		left: -50,
		right: -50,
		top: -50,
		bottom: -50,
	};

	showWidget$: Observable<boolean>;

	constructor(
		protected readonly ow: OverwolfService,
		protected readonly el: ElementRef,
		protected readonly prefs: PreferencesService,
		protected readonly renderer: Renderer2,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly mulliganGuide: ArenaMulliganGuideService,
	) {
		super(ow, el, prefs, renderer, store, cdr);
	}

	async ngAfterContentInit() {
		await this.mulliganGuide.isReady();

		this.showWidget$ = this.mulliganGuide.mulliganAdvice$$.pipe(
			this.mapData((advice) => !!advice),
			this.handleReposition(),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
