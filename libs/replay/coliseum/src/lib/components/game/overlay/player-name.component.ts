import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostListener,
	Input,
	ViewRef,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { playerName } from '../../../assets/player_name';

@Component({
	selector: 'player-name',
	styleUrls: ['./player-name.component.scss'],
	template: `
		<div
			class="player-name"
			[ngClass]="{ active: _active }"
			cardElementResize
			[fontSizeRatio]="0.08"
			[keepOpacity]="true"
		>
			<div class="background" [innerHTML]="svg"></div>
			<div class="text" resizeTarget>
				<span>{{ _name }}</span>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerNameComponent {
	_name: string;
	_active: boolean;
	svg: SafeHtml;

	constructor(private domSanitizer: DomSanitizer, private cdr: ChangeDetectorRef, private elRef: ElementRef) {
		this.svg = this.domSanitizer.bypassSecurityTrustHtml(playerName);
	}

	@Input() set name(value: string) {
		console.debug('[player-name] setting player name', value);
		this._name = value;
	}

	@Input() set active(value: boolean) {
		console.debug('[player-name] setting player active', value);
		this._active = value;
	}

	@HostListener('window:resize', ['$event'])
	onResize(event) {
		this.resizeText();
	}

	private resizeText() {
		try {
			const el = this.elRef.nativeElement.querySelector('.player-name');
			if (!el) {
				setTimeout(() => this.resizeText());
				return;
			}
			const fontSize = 0.17 * el.getBoundingClientRect().height;
			const textEl = this.elRef.nativeElement.querySelector('.text');
			textEl.style.fontSize = fontSize + 'px';
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
		} catch (e) {
			console.error('[player-name] Exception in resizeText', e);
		}
	}
}
