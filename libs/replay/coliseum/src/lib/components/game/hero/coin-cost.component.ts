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
import { sleep } from '@firestone/shared/framework/common';

@Component({
	standalone: false,
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
	_cost: number | undefined;
	costClass: string | undefined;

	private _cardId: string | undefined;

	constructor(private cards: AllCardsService, private elRef: ElementRef, private cdr: ChangeDetectorRef) {}

	@Input() set cardId(cardId: string | undefined) {
		this._cardId = cardId;
		this.updateCost();
	}

	@Input() set cost(cost: number | undefined) {
		this._cost = cost;
		this.updateCost();
	}

	@HostListener('window:resize', ['$event'])
	onResize(event) {
		this.resizeText();
	}

	ngAfterViewInit() {
		this.resizeText();
	}

	private updateCost() {
		if (!this._cardId) {
			return;
		}
		this.costClass = undefined;
		const originalCard = this.cards.getCard(this._cardId);
		const originalCost: number | undefined = originalCard.cost;

		if (this._cost == null) {
			this._cost = originalCost;
		}

		if ((this._cost ?? 0) < (originalCost ?? 0)) {
			this.costClass = 'lower-cost';
		} else if ((this._cost ?? 0) > (originalCost ?? 0)) {
			this.costClass = 'higher-cost';
		}
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	private async resizeText() {
		try {
			let previousWidth = undefined;
			// eslint-disable-next-line no-constant-condition
			while (true) {
				const el = this.elRef.nativeElement.querySelector('.coin-cost');
				if (!el) {
					await sleep(10);
					continue;
				}

				const newWidth = el.getBoundingClientRect().width;
				if (newWidth === previousWidth) {
					break;
				}

				const fontSize = 0.6 * newWidth;
				const textEl = this.elRef.nativeElement.querySelector('.cost');
				textEl.style.fontSize = fontSize + 'px';
				previousWidth = newWidth;
				if (!(this.cdr as ViewRef).destroyed) {
					this.cdr.detectChanges();
				}
				await sleep(10);
			}
		} catch (e) {
			console.error('[coin-cost] Exception in resizeText', e);
		}
	}
}
