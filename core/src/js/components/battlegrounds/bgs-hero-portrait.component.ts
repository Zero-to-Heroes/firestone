import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';

@Component({
	selector: 'bgs-hero-portrait',
	styleUrls: [`../../../css/component/battlegrounds/bgs-hero-portrait.component.scss`],
	template: `
		<div class="hero-portrait">
			<img [src]="_icon" class="portrait" />
			<div class="health" [ngClass]="{ 'damaged': _health < _maxHealth }">
				<img src="/Files/assets/images/health.png" class="icon" />
				<div class="value">{{ _health }}</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroPortraitComponent {
	_icon: string;
	_health: number;
	_maxHealth: number;

	@Input() set icon(value: string) {
		this._icon = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set health(value: number) {
		this._health = Math.max(value, 0);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set maxHealth(value: number) {
		this._maxHealth = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	constructor(private readonly cdr: ChangeDetectorRef) {}
}
