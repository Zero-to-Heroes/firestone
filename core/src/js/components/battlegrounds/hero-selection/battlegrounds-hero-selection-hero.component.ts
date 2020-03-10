import { ComponentType } from '@angular/cdk/portal';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input } from '@angular/core';
import { BattlegroundsHero } from '../../../models/battlegrounds/old/battlegrounds-hero';
import { GameEvent } from '../../../models/game-event';
import { BattlegroundsEvent } from '../../../services/battlegrounds/events/battlegrounds-event';
import { OverwolfService } from '../../../services/overwolf.service';
import { BattlegroundsHeroInfoComponent } from './battlegrounds-hero-info.component';

@Component({
	selector: 'battlegrounds-hero-selection-hero',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		`../../../../css/global/cdk-overlay.scss`,
		'../../../../css/component/battlegrounds/hero-selection/battlegrounds-hero-selection-hero.component.scss',
	],
	template: `
		<div class="battlegrounds-hero-selection-hero">
			<div
				class="attention-icon-container"
				componentTooltip
				[componentType]="componentType"
				[componentInput]="heroSelection"
			>
				<div class="attention-icon">
					I
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsHeroSelectionHeroComponent {
	heroSelection: BattlegroundsHero;
	componentType: ComponentType<any> = BattlegroundsHeroInfoComponent;

	@Input() set hero(value: BattlegroundsHero) {
		this.heroSelection = value;
	}

	private stateUpdater: EventEmitter<GameEvent | BattlegroundsEvent>;

	constructor(private ow: OverwolfService, private cdr: ChangeDetectorRef) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().battlegroundsUpdater;
		console.log('after leaderboard player overlay init');
		this.cdr.detach();
	}
}
