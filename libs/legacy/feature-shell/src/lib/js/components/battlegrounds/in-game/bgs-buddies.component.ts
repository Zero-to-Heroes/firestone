// import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
// import { LocalizationFacadeService } from '../../../services/localization-facade.service';

// @Component({
// 	selector: 'bgs-buddies',
// 	styleUrls: [
// 		`../../../../css/global/reset-styles.scss`,
// 		`../../../../css/component/battlegrounds/in-game/bgs-buddies.component.scss`,
// 	],
// 	template: `
// 		<div class="buddies-container">
// 			<div
// 				class="title"
// 				[owTranslate]="'battlegrounds.in-game.opponents.buddies-title'"
// 				*ngIf="_buddies?.length"
// 			></div>
// 			<div class="buddies" *ngIf="_buddies?.length">
// 				<div class="buddy" *ngFor="let buddy of _buddies; trackBy: trackByFn">
// 					<img class="icon" [src]="buddy.imageUrl" [helpTooltip]="buddy.tooltip" />
// 					<div class="label">{{ buddy.text }}</div>
// 				</div>
// 			</div>
// 			<div
// 				class="subtitle"
// 				*ngIf="!_buddies?.length"
// 				[owTranslate]="'battlegrounds.in-game.opponents.buddies-empty-state'"
// 			></div>
// 		</div>
// 	`,
// 	changeDetection: ChangeDetectionStrategy.OnPush,
// })
// export class BgsBuddiesComponent {
// 	_buddies: readonly Buddy[] = [];
// 	@Input() buddiesTitle = this.i18n.translateString('battlegrounds.in-game.opponents.buddies-title');

// 	@Input() set buddies(value: readonly number[]) {
// 		this._buddies = [...(value ?? [])]
// 			.map((turn, index) => {
// 				const imageRoot = `https://static.zerotoheroes.com/hearthstone/asset/firestone/images`;
// 				return {
// 					imageUrl:
// 						index > 0
// 							? `${imageRoot}/bgs_buddies_meter_frame_golden.png`
// 							: `${imageRoot}/bgs_buddies_meter_frame.png`,
// 					text: this.i18n.translateString('battlegrounds.in-game.opponents.buddy-text', { turn: turn }),
// 					tooltip:
// 						index > 0
// 							? this.i18n.translateString('battlegrounds.in-game.opponents.buddy-tooltip-golden', {
// 									turn: turn,
// 							  })
// 							: this.i18n.translateString('battlegrounds.in-game.opponents.buddy-tooltip', {
// 									turn: turn,
// 							  }),
// 				};
// 			})
// 			.reverse();
// 	}

// 	trackByFn(index, item: Buddy) {
// 		return index;
// 	}

// 	constructor(private readonly i18n: LocalizationFacadeService) {}
// }

// interface Buddy {
// 	readonly imageUrl: string;
// 	readonly text: string;
// 	readonly tooltip: string;
// }
