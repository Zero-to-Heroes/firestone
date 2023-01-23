import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostListener,
	Input,
	ViewRef,
} from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';

@Component({
	selector: 'coin-cost',
	styleUrls: ['../../../text.scss', '../card/card-cost-colors.scss', './coin-cost.component.scss'],
	template: `
		<div class="coin-cost {{ costClass }}">
			<img src="https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/battlegrounds/coin_mana.png" />
			<div class="cost">{{ _cost }}</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoinCostComponent implements AfterViewInit {
	_cost: number;
	costClass: string | undefined;

	private _cardId: string | undefined;

	constructor(private cards: AllCardsService, private elRef: ElementRef, private cdr: ChangeDetectorRef) {}

	@Input() set cardId(cardId: string | undefined) {
		this._cardId = cardId;
		this.updateCost();
	}

	@Input() set cost(cost: number) {
		this._cost = cost;
		this.updateCost();
	}

	@HostListener('window:resize', ['$event'])
	onResize(event) {
		this.resizeText();
	}

	ngAfterViewInit() {
		setTimeout(() => this.resizeText());
	}

	private updateCost() {
		if (!this._cardId) {
			return;
		}
		this.costClass = undefined;
		const originalCard = this.cards.getCard(this._cardId);
		const originalCost: number = originalCard.cost ?? 0;

		if (this._cost == null) {
			this._cost = originalCost;
		}

		if (this._cost < originalCost) {
			this.costClass = 'lower-cost';
		} else if (this._cost > originalCost) {
			this.costClass = 'higher-cost';
		}
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	private resizeText() {
		try {
			const el = this.elRef.nativeElement.querySelector('.coin-cost');
			if (!el) {
				setTimeout(() => this.resizeText());
				return;
			}
			const fontSize = 0.6 * el.getBoundingClientRect().width;
			const textEl = this.elRef.nativeElement.querySelector('.cost');
			textEl.style.fontSize = fontSize + 'px';
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
		} catch (e) {
			console.error('[coin-cost] Exception in resizeText', e);
		}
	}
}
