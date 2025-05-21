import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Input,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { SceneMode } from '@firestone-hs/reference-data';
import { SceneService } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { Observable, takeUntil } from 'rxjs';
import { CounterInstance } from './_counter-definition-v2';
import { AbstractWidgetWrapperComponent } from './widget-wrapper.component';

@Component({
	selector: 'grouped-counters-wrapper',
	styleUrls: ['./grouped-counters-wrapper.component.scss'],
	template: `
		<grouped-counters
			class="widget"
			*ngIf="(showWidget$ | async) && (playerCounters?.length || opponentCounters?.length)"
			[style.opacity]="(opacity$ | async) ?? 1"
			[playerCounters]="playerCounters"
			[opponentCounters]="opponentCounters"
			cdkDrag
			[cdkDragDisabled]="!draggable"
			(cdkDragStarted)="startDragging()"
			(cdkDragReleased)="stopDragging()"
			(cdkDragEnded)="dragEnded($event)"
		></grouped-counters>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupedCountersWrapperComponent extends AbstractWidgetWrapperComponent implements AfterContentInit {
	opacity$: Observable<number | null>;
	showWidget$: Observable<boolean>;

	@Input() playerCounters: readonly CounterInstance<any>[];
	@Input() opponentCounters: readonly CounterInstance<any>[];

	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) =>
		gameWidth * 0.5 + gameHeight * 0.3;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) => gameHeight * 0.1;
	protected positionUpdater = async (left: number, top: number) =>
		this.prefs.updatePrefs('groupedCountersPosition', { left, top });
	protected positionExtractor = async () => {
		const prefs = await this.prefs.getPreferences();
		console.debug('groupedCountersPosition', prefs.groupedCountersPosition);
		return prefs.groupedCountersPosition;
	};
	protected getRect = () => this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect();

	constructor(
		public override readonly el: ElementRef,
		protected override readonly ow: OverwolfService,
		protected override readonly prefs: PreferencesService,
		protected override readonly renderer: Renderer2,
		protected override readonly cdr: ChangeDetectorRef,
		private readonly scene: SceneService,
	) {
		super(cdr, ow, el, prefs, renderer);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs, this.scene);

		this.showWidget$ = this.scene.currentScene$$.pipe(
			this.mapData((scene) => scene === SceneMode.GAMEPLAY),
			takeUntil(this.destroyed$),
			this.handleReposition(),
		);
		this.opacity$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => (prefs.globalWidgetOpacity ?? 100) / 100),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
