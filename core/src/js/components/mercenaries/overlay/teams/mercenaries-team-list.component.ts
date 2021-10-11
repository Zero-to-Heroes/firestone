import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { BattleMercenary, MercenariesBattleTeam } from '../../../../models/mercenaries/mercenaries-battle-state';

@Component({
	selector: 'mercenaries-team-list',
	styleUrls: [
		'../../../../../css/global/components-global.scss',
		`../../../../../css/global/scrollbar-decktracker-overlay.scss`,
		'../../../../../css/component/decktracker/overlay/dim-overlay.scss',
		'../../../../../css/component/mercenaries/overlay/teams/mercenaries-team-list.component.scss',
	],
	template: `
		<perfect-scrollbar class="team-list">
			<div class="list-background"></div>
			<mercenaries-team-mercenary
				*ngFor="let mercenary of mercenaries"
				[mercenary]="mercenary"
			></mercenaries-team-mercenary>
		</perfect-scrollbar>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesTeamListComponent {
	@Input() set team(value: MercenariesBattleTeam) {
		console.debug('set team', value);
		this.mercenaries = value.mercenaries;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr?.detectChanges();
		}
	}

	mercenaries: readonly BattleMercenary[];

	constructor(private readonly cdr: ChangeDetectorRef) {}
}
