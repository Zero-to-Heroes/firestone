import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { MatchDetail } from '@firestone/mainwindow/common';
import { ReplayLoadService } from '@firestone/replay/replay-parser';

@Component({
	standalone: false,
	selector: 'game-replay',
	styleUrls: [`../../../css/component/replays/game-replay.component.scss`],
	template: `
		<div class="coliseum-container">
			<fs-coliseum
				class="external-player"
				[replayXml]="_replayXml"
				[reviewId]="reviewId"
				[decklist]="decklist"
			></fs-coliseum>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameReplayComponent {
	_replayXml: string;
	reviewId: string;
	decklist: string;

	constructor(
		private readonly cdr: ChangeDetectorRef,
		private readonly replayLoad: ReplayLoadService,
	) {}

	@Input() set replay(value: MatchDetail) {
		this.setReplay(value);
	}

	private async setReplay(value: MatchDetail) {
		if (!value?.replayInfo) {
			return;
		}

		console.log('[game-replay] setting game', value.replayInfo.reviewId);
		this.decklist = value.replayInfo.playerDecklist;
		console.debug('[game-replay] setting decklist', this.decklist, value);
		this.loadReview(value.replayInfo.reviewId);
	}

	private async loadReview(reviewId: string) {
		const loaded = await this.replayLoad.loadReplayXml(reviewId);
		if (!loaded?.replayXml) {
			console.error('[game-replay] could not load replay xml', reviewId);
			return;
		}
		this._replayXml = loaded.replayXml;
		this.reviewId = reviewId;
		if (!this.decklist && loaded.playerDecklist) {
			this.decklist = loaded.playerDecklist;
		}
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.markForCheck();
		}
	}
}
