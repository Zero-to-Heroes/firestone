import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';

@Component({
	selector: 'bgs-hero-portrait',
	styleUrls: [`../../../css/component/battlegrounds/bgs-hero-portrait.component.scss`],
	template: `
		<div class="hero-portrait">
			<div class="hero-portrait-frame">
				<img class="icon" [src]="heroIcon" />
				<img
					class="frame"
					src="https://static.zerotoheroes.com/hearthstone/asset/firestone/images/bgs_hero_frame.png?v=3"
				/>
				<div class="aspect-ratio"></div>
			</div>
			<div class="health" [ngClass]="{ 'damaged': _health < _maxHealth, 'new': !!heroIcon }" *ngIf="_health">
				<!-- <img src="https://static.zerotoheroes.com/hearthstone/asset/firestone/images/health.png" class="icon" /> -->
				<div class="value">{{ _health }}</div>
			</div>
			<div class="rating" *ngIf="rating != null">
				<div class="value">{{ rating?.toLocaleString('en-US') }}</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroPortraitComponent {
	_health: number;
	_maxHealth: number;
	heroIcon: string;

	@Input() rating: number;

	@Input() set heroCardId(value: string) {
		this.heroIcon = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value}.jpg`;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	/** @deprecated */
	_icon: string;
	/** @deprecated */
	@Input() set icon(value: string) {
		if (value === this._icon) {
			return;
		}
		this._icon = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set health(value: number) {
		if (value === this._health) {
			return;
		}
		this._health = Math.max(value, 0);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set maxHealth(value: number) {
		if (value === this._maxHealth) {
			return;
		}
		this._maxHealth = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	constructor(private readonly cdr: ChangeDetectorRef) {
		// cdr.detach();
	}
}
