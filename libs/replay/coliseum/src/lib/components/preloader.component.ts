import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Input,
	OnDestroy,
	OnInit,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { preloader } from '../assets/preloader';

@Component({
	selector: 'preloader',
	styleUrls: ['./preloader.component.scss'],
	template: `
		<div class="preloader" [innerHTML]="svg"></div>
		<figure class="preloader-quote">
			<blockquote class="preloader-quote-text" [innerHTML]="quote"></blockquote>
			<figcaption class="preloader-quote-author">
				<strong>{{ cardName }}</strong>
			</figcaption>
		</figure>
		<div class="status">{{ _status }}</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreloaderComponent implements OnInit, AfterViewInit, OnDestroy {
	_status: string | null;
	svg: SafeHtml | null;
	quote: string;
	cardName: string;

	@Input() set status(value: string | null) {
		const wasInError = this._status === 'error';
		this._status = value;
		if (value === 'error') {
			this.quote =
				'An error occured while parsing the replay. Please contact the support on <a href="https://twitter.com/ZerotoHeroes_HS" target="_blank">Twitter</a> or <a href="https://discord.gg/4Gpavvt" target="_blank">Discord</a>';
			this.cardName = 'Alarm-o-Bot';
			this.svg = null;
			if (this.interval) {
				clearInterval(this.interval);
			}
			this.cdr.detectChanges();
		} else if (wasInError) {
			this.startQuoteCarousel();
		}
	}

	private cardsWithQuotes: any[];
	private interval;

	constructor(
		private domSanitizer: DomSanitizer,
		private cards: CardsFacadeService,
		private cdr: ChangeDetectorRef,
	) {}

	async ngOnInit() {
		this.cardsWithQuotes = this.cards.getCards().filter((card) => card.flavor);
		this.startQuoteCarousel();
	}

	private startQuoteCarousel() {
		if (this.interval) {
			clearInterval(this.interval);
		}
		this.chooseRandomQuote();
		this.interval = setInterval(() => this.chooseRandomQuote(), 7000);
	}

	ngAfterViewInit() {
		this.svg = this.domSanitizer.bypassSecurityTrustHtml(preloader);
	}

	private chooseRandomQuote() {
		if (!this.cardsWithQuotes) {
			return;
		}
		try {
			if (this._status === 'error') {
				return;
			}
			const card = this.cardsWithQuotes[Math.floor(Math.random() * this.cardsWithQuotes.length)];
			this.quote = card.flavor;
			this.cardName = card.name;
			this.cdr.detectChanges();
		} catch (e) {
			console.error('[preloader] could not load quote', e);
		}
	}

	ngOnDestroy() {
		if (this.interval) {
			clearInterval(this.interval);
		}
	}
}
