import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { CardPackResult, PackResult } from '@firestone-hs/user-packs';
import { CollectionCardType } from '@legacy-import/src/lib/js/models/collection/collection-card-type.type';
import { LocalizationFacadeService } from '@services/localization-facade.service';

@Component({
	selector: 'pack-display',
	styleUrls: [`../../../css/global/forms.scss`, `../../../css/global/toggle.scss`, `./pack-display.component.scss`],
	template: `
		<div class="pack-display" *ngIf="cards?.length">
			<div
				class="card {{ card.cardType?.toLowerCase() }}"
				*ngFor="let card of cards; let i = index; trackBy: trackByFn"
				[style.left.%]="getLeft(i)"
				[cardTooltip]="card.cardId"
				[cardTooltipType]="card.cardType"
			>
				<img [src]="getCardImage(card.cardId, card.cardType)" />
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PackDisplayComponent {
	@Input() set pack(value: PackResult) {
		this.cards = value.cards;
	}

	cards: readonly CardPackResult[];

	constructor(private readonly cdr: ChangeDetectorRef, private readonly i18n: LocalizationFacadeService) {}

	getLeft(i: number): number {
		const offset = 0;
		const step = 18;
		return offset + i * step;
	}

	trackByFn(index: number, item: CardPackResult) {
		return item.cardId + '' + index;
	}

	getCardImage(cardId: string, cardType: CollectionCardType): string {
		return this.i18n.getCardImage(cardId, { cardType: cardType });
	}
}
