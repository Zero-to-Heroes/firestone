import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { GroupedReplays } from '../../models/mainwindow/replays/grouped-replays';
import { GameStat } from '../../models/mainwindow/stats/game-stat';
import { groupByFunction } from '../../services/utils';

@Component({
	selector: 'replays-list-view',
	styleUrls: [`../../../css/component/replays/replays-list-view.component.scss`],
	template: `
		<virtual-scroller
			#scroll
			*ngIf="flatReplays?.length; else emptyState"
			class="replays-list"
			[items]="flatReplays"
			[scrollDebounceTime]="scrollDebounceTime"
			scrollable
			(scrolling)="onScrolling($event)"
		>
			<!-- Because the virtual-scroller needs elements of the same size to work, we can't give it groups -->
			<ng-container *ngFor="let replay of scroll.viewPortItems; trackBy: trackByReplay">
				<div class="header" *ngIf="replay.header">{{ replay.header }}</div>
				<replay-info class="replay" *ngIf="!replay.header" [replay]="replay"></replay-info>
			</ng-container>
		</virtual-scroller>

		<ng-template #emptyState>
			<section class="empty-state">
				<div class="state-container">
					<i class="i-236X165">
						<svg>
							<use xlink:href="assets/svg/sprite.svg#empty_state_replays" />
						</svg>
					</i>
					<span class="title" [owTranslate]="'app.replays.list.empty-state-title'"></span>
					<span class="subtitle" [owTranslate]="'app.replays.list.empty-state-subtitle'"></span>
				</div>
			</section>
		</ng-template>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplaysListViewComponent {
	@Input() set replays(value: readonly GameStat[]) {
		value = value ?? [];
		console.debug('setting replays', value);
		const groupedReplays = this.groupReplays(value);
		console.debug('groupedReplays', groupedReplays);
		this.flatReplays = groupedReplays
			.filter((group) => group?.replays?.length)
			.flatMap((group) => {
				return [
					{
						header: group.header,
					} as HeaderInfo,
					...group.replays,
				];
			});
	}

	flatReplays: readonly (GameStat | HeaderInfo)[] = [];
	scrollDebounceTime = 0;

	constructor(private readonly i18n: LocalizationFacadeService, private readonly cdr: ChangeDetectorRef) {}

	onScrolling(scrolling: boolean) {
		this.scrollDebounceTime = scrolling ? 1000 : 0;
		console.debug('handling scrolling in parent', scrolling, this.scrollDebounceTime);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	trackByReplay(index: number, item: GameStat | HeaderInfo) {
		return (item as GameStat).reviewId ?? (item as HeaderInfo)?.header;
	}

	private groupReplays(replays: readonly GameStat[]): readonly GroupedReplays[] {
		const groupingFunction = (replay: GameStat) => {
			const date = new Date(replay.creationTimestamp);
			return date.toLocaleDateString(this.i18n.formatCurrentLocale(), {
				month: 'short',
				day: '2-digit',
				year: 'numeric',
			});
		};
		const groupByDate = groupByFunction(groupingFunction);
		const replaysByDate = groupByDate(replays);
		return Object.keys(replaysByDate).map((date) => ({
			header: date,
			replays: replaysByDate[date],
		}));
	}
}

export interface HeaderInfo {
	header: string;
}
