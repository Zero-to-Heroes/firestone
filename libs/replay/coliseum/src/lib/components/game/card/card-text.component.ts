import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CardType, GameTag } from '@firestone-hs/reference-data';
import { AllCardsService, Entity } from '@firestone-hs/replay-parser';

@Component({
	selector: 'card-text',
	styleUrls: ['../../../text.scss', './card-text.component.scss'],
	template: `
		<div class="card-text {{ _cardType }}" [ngClass]="{ premium: premium }" *ngIf="text">
			<div
				class="text"
				[fittext]="true"
				[minFontSize]="2"
				[useMaxFontSize]="true"
				[activateOnResize]="false"
				[modelToWatch]="dirtyFlag"
				[innerHTML]="text"
			></div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardTextComponent {
	_cardType: string | null;
	premium: boolean;
	text: SafeHtml | undefined;
	maxFontSize: number;
	dirtyFlag = false;

	private _entity: Entity | undefined;
	private _controller: Entity | undefined;

	constructor(private cards: AllCardsService, private domSanitizer: DomSanitizer, private cdr: ChangeDetectorRef) {
		document.addEventListener('card-resize', (event) => this.resizeText(), true);
	}

	@Input() set entity(value: Entity) {
		// console.debug('[card-text] setting entity', value.tags.toJS());
		this._entity = value;
		this.updateText();
	}

	@Input() set controller(value: Entity | undefined) {
		// console.debug('[card-text] setting controller', value && value.tags.toJS());
		this._controller = value;
		this.updateText();
	}

	private updateText() {
		if (!this._entity) {
			return;
		}
		const cardId = this._entity.cardID;
		this.text = undefined;
		const originalCard = this.cards.getCard(cardId);
		if (!originalCard.text) {
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
			return;
		}

		// There are a few cards whose text is truncated in the json cards export
		let description: string = (originalCard.text || '')
			.replace('\n', '<br/>')
			.replace(/\u00a0/g, ' ')
			.replace(/^\[x\]/, '');
		// E.g. Fatespinner
		if (this._entity.getTag(GameTag.HIDDEN_CHOICE) && description.indexOf('@') !== -1) {
			// console.log('hidden choice', this._entity.tags.toJS(), description);
			description = description.split('@')[this._entity.getTag(GameTag.HIDDEN_CHOICE)];
		}
		// Damage placeholder, influenced by spell damage
		let damageBonus = 0;
		let doubleDamage = 0;
		// console.log('building text for', description);
		if (this._controller) {
			if (this._entity.getCardType() === CardType.SPELL) {
				damageBonus = this._controller.getTag(GameTag.CURRENT_SPELLPOWER) || 0;
				// console.log('damage bonus', damageBonus);
				if (this._entity.getTag(GameTag.RECEIVES_DOUBLE_SPELLDAMAGE_BONUS) === 1) {
					damageBonus *= 2;
				}
				doubleDamage = this._controller.getTag(GameTag.SPELLPOWER_DOUBLE) || 0;
			} else if (this._entity.getCardType() === CardType.HERO_POWER) {
				damageBonus = this._controller.getTag(GameTag.CURRENT_HEROPOWER_DAMAGE_BONUS) || 0;
				doubleDamage = this._controller.getTag(GameTag.HERO_POWER_DOUBLE) || 0;
			}
		}

		description = description
			// Now replace the value, if relevant
			.replace('@', `${this._entity.getTag(GameTag.TAG_SCRIPT_DATA_NUM_1)}`)
			.replace(/\$(\d+)/g, this.modifier(damageBonus, doubleDamage))
			.replace(/#(\d+)/g, this.modifier(damageBonus, doubleDamage));
		// console.log('updated', description, damageBonus, doubleDamage, this._controller, this._entity);
		this.text = this.domSanitizer.bypassSecurityTrustHtml(description);

		// Text is not the same color for premium cards
		this.premium = this._entity.getTag(GameTag.PREMIUM) === 1;

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set cardType(cardType: CardType | undefined) {
		// console.debug('[card-text] setting cardType', cardType);
		this._cardType = !cardType ? null : CardType[cardType]?.toLowerCase();
	}

	private resizeText() {
		this.dirtyFlag = !this.dirtyFlag;
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	private modifier(bonus: number, double: number) {
		return (match, part1) => {
			let value = +part1;
			if (bonus !== 0 || double !== 0) {
				value += bonus;
				value *= Math.pow(2, double);
				// console.log('updated value', value);
				return '*' + value + '*';
			}
			return '' + value;
		};
	}
}
