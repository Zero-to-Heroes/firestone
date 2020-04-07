import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	selector: 'bgs-hero-portrait',
	styleUrls: [`../../../css/component/battlegrounds/bgs-hero-portrait.component.scss`],
	template: `
		<div class="hero-portrait">
			<img [src]="icon" class="portrait" />
			<div class="health" [ngClass]="{ 'damaged': health < maxHealth }">
				<img src="/Files/assets/images/health.png" class="icon" />
				<div class="value">{{ health }}</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroPortraitComponent {
	@Input() icon: string;
	@Input() health: number;
	@Input() maxHealth: number;
}
