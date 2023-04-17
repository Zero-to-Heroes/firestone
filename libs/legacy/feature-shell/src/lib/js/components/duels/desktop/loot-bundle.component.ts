import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { uuid } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { VisualDeckCard } from '../../../models/decktracker/visual-deck-card';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { Option } from './option';

@Component({
	selector: 'loot-bundle',
	styleUrls: [
		`../../../../css/global/menu.scss`,
		`../../../../css/component/duels/desktop/loot-bundle.component.scss`,
	],
	template: `
		<div class="loot-bundle">
			<div class="cards">
				<li class="card-container" *ngFor="let card of cards">
					<deck-card class="card" [card]="card" *ngIf="card"></deck-card>
				</li>
			</div>
			<div class="header">{{ bundleName }}</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LootBundleComponent {
	@Input() set option(value: Option) {
		if (!value) {
			return;
		}

		this.bundleName = this.allCards.getCard(value.cardId)?.name;
		this.cards = value.contents.map((cardId) => {
			const card = this.allCards.getCard(cardId);
			return cardId == '0'
				? null
				: VisualDeckCard.create({
						cardId: cardId,
						cardName: this.i18n.getCardName(card.id),
						manaCost: card.cost,
						internalEntityIds: [uuid()],
				  });
		});
	}

	bundleName: string;
	cards: readonly VisualDeckCard[];

	constructor(private readonly allCards: CardsFacadeService, private readonly i18n: LocalizationFacadeService) {}
}
