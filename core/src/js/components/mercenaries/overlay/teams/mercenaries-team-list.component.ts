import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { Zone } from '@firestone-hs/reference-data';
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
				[tooltipPosition]="tooltipPosition"
			></mercenaries-team-mercenary>
		</perfect-scrollbar>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesTeamListComponent {
	@Input() tooltipPosition: boolean;

	@Input() set team(value: MercenariesBattleTeam) {
		console.debug('set team', value);
		this.mercenaries = [...value.mercenaries].sort((a, b) => {
			if (a.zone === Zone.PLAY && b.zone !== Zone.PLAY) {
				return -1;
			} else if (a.zone !== Zone.PLAY && b.zone === Zone.PLAY) {
				return 1;
			}

			if (a.zone === Zone.SETASIDE && b.zone !== Zone.SETASIDE) {
				return -1;
			} else if (a.zone !== Zone.SETASIDE && b.zone === Zone.SETASIDE) {
				return 1;
			}

			if (a.isDead < b.isDead) {
				return -1;
			} else if (a.isDead > b.isDead) {
				return 1;
			}

			if (a.zonePosition < b.zonePosition) {
				return -1;
			} else if (a.zonePosition > b.zonePosition) {
				return 1;
			}
			return 0;
		});
		console.debug('mercenaries', this.mercenaries);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr?.detectChanges();
		}
	}

	mercenaries: readonly BattleMercenary[];

	constructor(private readonly cdr: ChangeDetectorRef) {}
}
