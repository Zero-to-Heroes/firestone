import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'battlegrounds-desktop',
	styleUrls: [
		`../../../../css/component/app-section.component.scss`,
		`../../../../css/component/battlegrounds/desktop/battlegrounds-desktop.component.scss`,
	],
	template: `
		<div class="app-section battlegrounds">
			<section class="main divider">
				<with-loading [isLoading]="false">
					<div class="content empty-state">
						<i>
							<svg>
								<use xlink:href="/Files/assets/svg/sprite.svg#empty_state_tracker" />
							</svg>
						</i>
						<span class="title">Battlegrounds in-game app is now live!</span>
						<span class="subtitle"
							>Start a run to play with it, and further stats will be coming along soon</span
						>
					</div>
				</with-loading>
			</section>
			<section class="secondary"></section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsDesktopComponent {}
