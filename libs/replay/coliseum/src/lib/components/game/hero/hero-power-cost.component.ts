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
	selector: 'hero-power-cost',
	styleUrls: ['../../../text.scss', '../card/card-cost-colors.scss', './hero-power-cost.component.scss'],
	template: `
		<div class="hero-power-cost {{ costClass }}" [ngClass]="{ premium: _premium }">
			<div class="cost">{{ _cost }}</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroPowerCostComponent implements AfterViewInit {
	_cost: number | undefined;
	costClass: string | undefined;
	_premium: boolean;

	private _cardId: string;

	constructor(private cards: AllCardsService, private elRef: ElementRef, private cdr: ChangeDetectorRef) {}

	@Input() set cardId(cardId: string) {
		// console.debug('[hero-power-cost] setting cardId', cardId);
		this._cardId = cardId;
		this.updateCost();
	}

	@Input() set cost(cost: number) {
		// console.debug('[hero-power-cost] setting cost', cost);
		this._cost = cost;
		this.updateCost();
	}

	@Input() set premium(premium: boolean) {
		// console.debug('[hero-power-cost] setting premium', premium);
		this._premium = premium;
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

	private resizeText() {
		try {
			const el = this.elRef.nativeElement.querySelector('.hero-power-cost');
			if (!el) {
				setTimeout(() => this.resizeText());
				return;
			}
			const fontSize = 0.8 * el.getBoundingClientRect().width;
			const textEl = this.elRef.nativeElement.querySelector('.cost');
			textEl.style.fontSize = fontSize + 'px';
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
		} catch (e) {
			console.error('[hero-power-cost] Exception in resizeText', e);
		}
	}
}
