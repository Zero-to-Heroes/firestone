import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewEncapsulation } from '@angular/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';

@Component({
	standalone: false,
	selector: 'battlegrounds-root',
	styleUrls: [
		`../../../../../../../shared/styles/src/lib/styles/ngx-tooltips.scss`,
		`./battlegrounds-root.component.scss`,
	],
	encapsulation: ViewEncapsulation.None, // FIXME: not sure that's needed
	template: `
		<ng-container>
			<section class="menu-bar">
				<div class="first">
					<div class="navigation">
						<i class="i-117X33 gold-theme logo">
							<svg class="svg-icon-fill">
								<use xlink:href="assets/svg/sprite.svg#logo" />
							</svg>
						</i>
						<menu-selection-bgs></menu-selection-bgs>
					</div>
				</div>
				<hotkey class="exclude-dbclick" [hotkeyName]="'battlegrounds'"></hotkey>
				<div class="controls exclude-dbclick">
					<control-bug></control-bug>
					<control-settings [settingsApp]="'battlegrounds'"></control-settings>
					<control-discord></control-discord>
					<control-website></control-website>
					<control-minimize></control-minimize>
					<control-maximize></control-maximize>
					<control-close [closeAll]="true"></control-close>
				</div>
			</section>
			<battlegrounds-content> </battlegrounds-content>
		</ng-container>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsRootComponent extends AbstractSubscriptionComponent {
	constructor(protected readonly cdr: ChangeDetectorRef) {
		super(cdr);
	}
}
