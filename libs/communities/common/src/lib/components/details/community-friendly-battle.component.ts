/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @angular-eslint/template/eqeqeq */
/* eslint-disable @angular-eslint/template/no-negated-async */
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { InternalFriendlyBattlePlayer } from './community-friendly-battle-player.component';

@Component({
	standalone: false,
	selector: 'community-friendly-battle',
	styleUrls: [`./community-friendly-battle.component.scss`],
	template: `
		<div class="friendly-battle">
			<community-friendly-battle-player
				class="player first"
				[player]="player"
				[ngClass]="{ won: firstPlayerWon, lost: secondPlayerWon }"
			></community-friendly-battle-player>
			<div class="vs" [fsTranslate]="'app.replays.replay-info.versus'"></div>
			<community-friendly-battle-player
				class="player second"
				[player]="opponent"
				[ngClass]="{ won: secondPlayerWon, lost: firstPlayerWon }"
				[isOpponent]="true"
			></community-friendly-battle-player>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommunityFriendlyBattleComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	player: InternalFriendlyBattlePlayer;
	opponent: InternalFriendlyBattlePlayer;
	firstPlayerWon: boolean;
	secondPlayerWon: boolean;

	@Input() set battle(value: InternalFriendlyBattle) {
		this.player = value.player;
		this.opponent = value.opponent;
		this.firstPlayerWon = value.player.hasWon;
		this.secondPlayerWon = value.opponent.hasWon;
	}

	constructor(protected override readonly cdr: ChangeDetectorRef, private readonly i18n: ILocalizationService) {
		super(cdr);
	}

	async ngAfterContentInit() {
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
}

export interface InternalFriendlyBattle {
	readonly creationDate: string;
	readonly gameMode: string;
	readonly gameFormat: string;
	readonly player: InternalFriendlyBattlePlayer;
	readonly opponent: InternalFriendlyBattlePlayer;
}
