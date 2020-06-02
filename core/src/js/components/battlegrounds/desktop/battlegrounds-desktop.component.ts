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
						<span class="title">Battlegrounds in-game app is now live! </span>
						<span class="subtitle"
							>Our new Battlegrounds in-game feature is now available and will appear once you start a
							match! It uses your second screen (if you have one) for a better experience and can be
							easily controlled with hotkeys (Alt + B by default)</span
						>
						<span class="subtitle"
							>Coming soon: personal stats and the ability to review all past match stats!</span
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
