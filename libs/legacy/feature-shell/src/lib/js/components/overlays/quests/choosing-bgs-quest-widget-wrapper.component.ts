/* eslint-disable @typescript-eslint/no-empty-function */
import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { BgsInGameQuestsService, BgsQuestCardChoiceOption } from '@firestone/battlegrounds/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { OverwolfService } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractWidgetWrapperComponent } from '../_widget-wrapper.component';

@Component({
	selector: 'choosing-bgs-quest-widget-wrapper',
	styleUrls: ['./choosing-bgs-quest-widget-wrapper.component.scss'],
	template: `
		<div class="container" *ngIf="showWidget$ | async">
			<div
				class="choosing-card-container items-{{ value.options?.length }}"
				*ngIf="{ options: options$ | async } as value"
			>
				<!-- TODO: premium stuff -->
				<choosing-card-bgs-quest-option
					class="option-container"
					*ngFor="let option of value.options"
					[option]="option"
				></choosing-card-bgs-quest-option>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChoosingBgsQuestWidgetWrapperComponent extends AbstractWidgetWrapperComponent implements AfterContentInit {
	protected defaultPositionLeftProvider = null;
	protected defaultPositionTopProvider = null;
	protected positionUpdater = null;
	protected positionExtractor = null;
	protected getRect = null;

	showWidget$: Observable<boolean>;
	options$: Observable<readonly BgsQuestCardChoiceOption[]>;

	windowWidth: number;
	windowHeight: number;

	constructor(
		protected readonly ow: OverwolfService,
		protected readonly el: ElementRef,
		protected readonly prefs: PreferencesService,
		protected readonly renderer: Renderer2,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly quests: BgsInGameQuestsService,
	) {
		super(ow, el, prefs, renderer, store, cdr);
	}

	async ngAfterContentInit() {
		await this.quests.isReady();

		this.showWidget$ = this.quests.showWidget$$.pipe(
			this.mapData((showWidget) => showWidget),
			this.handleReposition(),
		);
		this.options$ = this.quests.questStats$$.pipe(this.mapData((options) => options));

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
