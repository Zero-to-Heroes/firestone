/* eslint-disable @typescript-eslint/no-empty-function */
import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	Inject,
	Input,
	OnDestroy,
} from '@angular/core';
import { CardIds, ReferenceCard } from '@firestone-hs/reference-data';
import { PreferencesService } from '@firestone/shared/common/service';
import { uuidShort } from '@firestone/shared/framework/common';
import { ADS_SERVICE_TOKEN, CardsFacadeService, IAdsService } from '@firestone/shared/framework/core';
import { CardsHighlightFacadeService } from '../../../services/decktracker/card-highlight/cards-highlight-facade.service';
import { CardChoiceOption, NO_HIGHLIGHT_CARD_IDS } from './choosing-card-widget-wrapper.component';

@Component({
	selector: 'choosing-card-option',
	styleUrls: ['./choosing-card-option.component.scss'],
	template: `
		<div class="option" (mouseenter)="onMouseEnter($event)" (mouseleave)="onMouseLeave($event)">
			<div class="flag-container" *ngIf="showFlag">
				<div class="flag" [inlineSVG]="'assets/svg/new_record.svg'"></div>
			</div>
			<div class="flag-container value-container" *ngIf="showValue">
				<div class="value">
					{{ value }}
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChoosingCardOptionComponent implements OnDestroy {
	@Input() set option(value: CardChoiceOption) {
		this._option = value;
		this._referenceCard = this.allCards.getCard(value?.cardId);
		this.shouldHighlight = !NO_HIGHLIGHT_CARD_IDS.includes(value?.cardId as CardIds);

		this.showFlag = value?.flag === 'flag';
		this.showValue = value?.flag === 'value';
		this.value = value.value;
		// this.tooltip = value.tooltip;
		this.registerHighlight();
	}

	@Input() tallOption: boolean;

	_option: CardChoiceOption;
	showFlag: boolean;
	showValue: boolean;
	value: string;
	// tooltip: string;

	private _referenceCard: ReferenceCard;
	private side: 'player' | 'opponent' = 'player';
	private _uniqueId: string;
	private shouldHighlight: boolean;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly cardsHighlightService: CardsHighlightFacadeService,
		private readonly allCards: CardsFacadeService,
		private readonly prefs: PreferencesService,
		@Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
	) {}

	registerHighlight() {
		this._uniqueId && this.cardsHighlightService.unregister(this._uniqueId, this.side);
		this._uniqueId = this._uniqueId || uuidShort();
		if (this.shouldHighlight) {
			this.cardsHighlightService.register(
				this._uniqueId,
				{
					referenceCardProvider: () => this._referenceCard,
					// We don't react to highlights, only trigger them
					deckCardProvider: () => null,
					zoneProvider: () => null,
					highlightCallback: () => {},
					unhighlightCallback: () => {},
					side: () => 'player',
				},
				'player',
			);
		}
	}

	onMouseEnter(event: MouseEvent) {
		if (!this.shouldHighlight) {
			return;
		}
		this.cardsHighlightService?.onMouseEnter(this._option?.cardId, this.side, null, 'discover');
	}

	onMouseLeave(event: MouseEvent) {
		if (!this.shouldHighlight) {
			return;
		}
		this.cardsHighlightService?.onMouseLeave(this._option?.cardId);
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		this.cardsHighlightService?.onMouseLeave(this._option?.cardId);
		this.cardsHighlightService.unregister(this._uniqueId, this.side);
	}
}
