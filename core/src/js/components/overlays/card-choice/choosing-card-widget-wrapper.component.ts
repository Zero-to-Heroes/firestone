/* eslint-disable @typescript-eslint/no-empty-function */
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
import { ReferenceCard, SceneMode } from '@firestone-hs/reference-data';
import {} from 'jszip';
import {} from 'lodash';
import { combineLatest, Observable } from 'rxjs';
import { CardsFacadeService } from '../../../services/cards-facade.service';
import { CardsHighlightFacadeService } from '../../../services/decktracker/card-highlight/cards-highlight-facade.service';
import { OverwolfService } from '../../../services/overwolf.service';
import { PreferencesService } from '../../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { uuid } from '../../../services/utils';
import { AbstractWidgetWrapperComponent } from '../_widget-wrapper.component';

@Component({
	selector: 'choosing-card-widget-wrapper',
	styleUrls: ['../../../../css/component/overlays/card-choice/choosing-card-widget-wrapper.component.scss'],
	template: `
		<ng-container *ngIf="showWidget$ | async">
			<div
				class="choosing-card-container items-{{ value.options?.length }}"
				*ngIf="{ options: options$ | async } as value"
			>
				<choosing-card-option
					class="option-container"
					*ngFor="let option of value.options"
					[option]="option"
				></choosing-card-option>
			</div>
		</ng-container>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChoosingCardWidgetWrapperComponent extends AbstractWidgetWrapperComponent implements AfterContentInit {
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number, dpi: number) => 0;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number, dpi: number) => gameHeight * 0.28;
	protected positionUpdater = null;
	protected positionExtractor = null;
	protected getRect = () => this.el.nativeElement.querySelector('.board-container')?.getBoundingClientRect();

	showWidget$: Observable<boolean>;
	options$: Observable<readonly CardChoiceOption[]>;

	windowWidth: number;
	windowHeight: number;

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
			this.store.listen$(
				([main, nav, prefs]) => main.currentScene,
				// Show from prefs
				([main, nav, prefs]) => prefs.overlayEnableDiscoverHelp,
			),
			this.store.listenDeckState$((deckState) => deckState?.playerDeck?.currentOptions),
		).pipe(
			this.mapData(([[currentScene, displayFromPrefs], [currentOptions]]) => {
				if (!displayFromPrefs) {
					return false;
				}

				// We explicitely don't check for null, so that if the memory updates are broken
				// we still somehow show the info
				if (currentScene !== SceneMode.GAMEPLAY) {
					return false;
				}

				if (!currentOptions?.length) {
					return false;
				}

				return true;
			}),
			this.handleReposition(),
		);
		this.options$ = this.store
			.listenDeckState$((state) => state.playerDeck?.currentOptions)
			.pipe(
				this.mapData(([options]) => {
					return (
						options?.map((o) => {
							return {
								cardId: o.cardId,
								entityId: o.entityId,
							};
						}) ?? []
					);
				}),
			);
	}

	protected async doResize(): Promise<void> {
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}
		const gameHeight = gameInfo.height;
		this.windowWidth = gameHeight * 1.12;
		this.windowHeight = gameHeight * 0.4;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}

@Component({
	selector: 'choosing-card-option',
	styleUrls: ['../../../../css/component/overlays/card-choice/choosing-card-widget-wrapper.component.scss'],
	template: ` <div class="option" (mouseenter)="onMouseEnter($event)" (mouseleave)="onMouseLeave($event)"></div> `,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChoosingCardOptionComponent {
	@Input() set option(value: CardChoiceOption) {
		this._option = value;
		this._referenceCard = this.allCards.getCard(value?.cardId);
		this.registerHighlight();
	}

	_option: CardChoiceOption;

	private _referenceCard: ReferenceCard;
	private side: 'player' | 'opponent' = 'player';
	private _uniqueId: string;

	constructor(
		private readonly cardsHighlightService: CardsHighlightFacadeService,
		private readonly allCards: CardsFacadeService,
	) {}

	registerHighlight() {
		this._uniqueId && this.cardsHighlightService.unregister(this._uniqueId, this.side);
		this._uniqueId = this._uniqueId || uuid();
		this.cardsHighlightService.register(
			this._uniqueId,
			{
				referenceCardProvider: () => this._referenceCard,
				// We don't react to highlights, only trigger them
				deckCardProvider: () => null,
				zoneProvider: () => null,
				highlightCallback: () => {},
				unhighlightCallback: () => {},
			},
			'player',
		);
	}

	onMouseEnter(event: MouseEvent) {
		this.cardsHighlightService?.onMouseEnter(this._option?.cardId, this.side, null);
	}

	onMouseLeave(event: MouseEvent) {
		this.cardsHighlightService?.onMouseLeave(this._option?.cardId);
	}
}

export interface CardChoiceOption {
	readonly cardId: string;
	readonly entityId: number;
}
