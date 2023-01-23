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
import { Entity } from '@firestone-hs/replay-parser';

@Component({
	selector: 'deck',
	styleUrls: ['../../../text.scss', './deck.component.scss'],
	template: `
		<div class="deck">
			<img
				class="cardback-icon"
				src="https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/cardback.png"
			/>
			<div class="count">
				<div class="text">{{ numberOfCards }}</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckComponent implements AfterViewInit {
	_deck: readonly Entity[];
	numberOfCards: number;

	constructor(private elRef: ElementRef, private cdr: ChangeDetectorRef) {}

	@Input() set deck(value: readonly Entity[]) {
		console.debug('[deck] setting deck', value);
		this._deck = value;
		this.numberOfCards = this._deck ? this._deck.length : 0;
	}

	@HostListener('window:resize', ['$event'])
	onResize(event) {
		this.resizeText();
	}

	ngAfterViewInit() {
		setTimeout(() => this.resizeText());
	}

	private resizeText() {
		try {
			const el = this.elRef.nativeElement.querySelector('.deck');
			if (!el) {
				setTimeout(() => this.resizeText());
				return;
			}
			const fontSize = 0.5 * el.getBoundingClientRect().width;
			const textEl = this.elRef.nativeElement.querySelector('.count');
			textEl.style.fontSize = fontSize + 'px';
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
		} catch (e) {
			console.error('[deck] Exception in resizeText', e);
		}
	}
}
