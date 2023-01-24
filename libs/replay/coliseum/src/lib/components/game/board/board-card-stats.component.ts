import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, ViewRef } from '@angular/core';
import { CardType } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';

@Component({
	selector: 'board-card-stats',
	styleUrls: ['../../../text.scss', './board-card-stats.component.scss', '../card/card-stats-colors.scss'],
	template: `
		<div class="card-stats {{ _cardType }}" *ngIf="hasStats">
			<div class="stat {{ attackClass }}">
				<div class="stat-value">
					<svg viewBox="0 0 20 20">
						<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">{{ _attack }}</text>
					</svg>
				</div>
			</div>
			<div class="stat {{ healthClass }}">
				<div class="stat-value">
					<svg viewBox="0 0 20 20">
						<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">{{ healthLeft }}</text>
					</svg>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardCardStatsComponent {
	hasStats: boolean;

	attackClass: string | undefined;
	healthClass: string | undefined;
	healthLeft: number;

	_attack: number | undefined;
	_cardType: string;

	private _cardId: string;
	private _health: number | undefined;
	private _damage: number;

	constructor(private cards: AllCardsService, private cdr: ChangeDetectorRef, private elRef: ElementRef) {}

	@Input() set cardId(cardId: string) {
		this._cardId = cardId;
		this.updateStats();
	}

	@Input() set attack(attack: number | undefined) {
		this._attack = attack;
		this.updateStats();
	}

	@Input() set health(health: number | undefined) {
		this._health = health;
		this.updateStats();
	}

	@Input() set damage(damage: number | undefined) {
		this._damage = damage ?? 0;
		this.updateStats();
	}

	@Input() set cardType(cardType: CardType) {
		this._cardType = cardType ? CardType[cardType]?.toLowerCase() : '';
	}

	private updateStats() {
		this.attackClass = undefined;
		this.healthClass = undefined;
		this.hasStats = false;

		if (!this._cardId) {
			return;
		}
		const originalCard = this.cards.getCard(this._cardId);

		if (this._attack == null) {
			this._attack = originalCard.attack;
		}
		if (this._health == null) {
			this._health = originalCard.health;
		}
		if (this._damage == null) {
			this._damage = 0;
		}
		this.hasStats =
			(originalCard.attack ?? 0) > 0 ||
			(originalCard.health ?? 0) > 0 ||
			(originalCard.durability ?? 0) > 0 ||
			(originalCard.armor ?? 0) > 0;

		this.healthLeft = (this._health ?? 0) - this._damage;
		this.updateAttackClass(originalCard);
		this.updateHealthClass(originalCard);
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	private updateAttackClass(originalCard) {
		this.attackClass = 'attack';
		if ((this._attack ?? 0) > originalCard.attack) {
			this.attackClass += ' buff';
		} else if ((this._attack ?? 0) < originalCard.attack) {
			this.attackClass += ' debuff';
		}
	}

	private updateHealthClass(originalCard) {
		this.healthClass = 'health';
		if (this.healthLeft > originalCard.health) {
			this.healthClass += ' buff';
		}
		if (this._damage > 0) {
			this.healthClass += ' damaged';
		}
	}

	private resizeText() {
		try {
			const el = this.elRef.nativeElement.querySelector('.card-stats');
			if (!el) {
				setTimeout(() => this.resizeText());
				return;
			}
			const fontSize = 0.2 * el.getBoundingClientRect().width;
			const textEl = this.elRef.nativeElement.querySelector('.card-stats');
			textEl.style.fontSize = fontSize + 'px';
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
		} catch (e) {
			console.error('[board-card-stats] Exception in resizeText', e);
		}
	}
}
