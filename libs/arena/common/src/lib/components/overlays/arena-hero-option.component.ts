import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ArenaHeroOption } from './model';

@Component({
	selector: 'arena-hero-option',
	styleUrls: ['./arena-hero-option.component.scss'],
	template: `
		<div class="option">
			<div class="info-container">
				<div class="tier ">
					<span class="label" [fsTranslate]="'app.arena.draft.hero-tier'"></span>
					<span class="value {{ tier.toLowerCase() }}">{{ tier }}</span>
				</div>
				<div class="winrate">
					<span class="label" [fsTranslate]="'app.arena.draft.hero-winrate'"></span
					><span class="value">{{ winrate }}</span>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaHeroOptionComponent {
	@Input() set hero(value: ArenaHeroOption) {
		console.debug('[arena-hero-option] setting hero', value);
		this.tier = value.tier;
		this.winrate = (100 * value.winrate).toFixed(1) + '%';
	}

	tier: string;
	winrate: string;
}
