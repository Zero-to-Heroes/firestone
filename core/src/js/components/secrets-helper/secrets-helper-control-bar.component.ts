import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	selector: 'secrets-helper-control-bar',
	styleUrls: [
		'../../../css/global/components-global.scss',
		'../../../css/component/secrets-helper/secrets-helper-control-bar.component.scss',
	],
	template: `
		<div class="control-bar">
			<div class="title">Secrets Helper</div>
			<div class="controls">
				<control-close [windowId]="windowId"></control-close>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecretsHelperControlBarComponent {
	@Input() windowId: string;
	// closeHandler: () => void;

	// private deckUpdater: EventEmitter<GameEvent>;

	// constructor(private readonly ow: OverwolfService) {
	// 	this.deckUpdater = this.ow.getMainWindow().deckUpdater;
	// 	this.closeHandler = () =>
	// 		this.deckUpdater.next(
	// 			Object.assign(new GameEvent(), {
	// 				type: this.closeEvent,
	// 			} as GameEvent),
	// 		);
	// }
}
