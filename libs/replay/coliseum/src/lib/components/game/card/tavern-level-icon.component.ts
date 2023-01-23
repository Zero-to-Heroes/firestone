import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	selector: 'tavern-level-icon',
	styleUrls: ['./tavern-level-icon.component.scss'],
	template: `
		<div class="tavern-level-icon">
			<img
				class="banner"
				src="https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/battlegrounds/tavern_banner.png"
			/>
			<div class="level">
				<img
					*ngFor="let number of stars"
					src="https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/battlegrounds/tavern_star.png"
				/>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TavernLevelIconComponent {
	stars: readonly number[];

	@Input() set level(value: number) {
		this.stars = Array(value)
			.fill(0)
			.map((x, i) => i);
	}
}
