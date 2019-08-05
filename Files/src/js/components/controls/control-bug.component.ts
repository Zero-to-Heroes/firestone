import { Component, ChangeDetectionStrategy } from '@angular/core';
import { LogsUploaderService } from '../../services/logs-uploader.service';

@Component({
	selector: 'control-bug',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/controls/controls.scss`,
		`../../../css/component/controls/control-bug.component.scss`,
	],
	template: `
		<button class="i-30 pink-button" (mousedown)="showBugForm()" helpTooltip="Report a bug">
			<svg class="svg-icon-fill">
				<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="/Files/assets/svg/sprite.svg#window-control_bug"></use>
			</svg>
		</button>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlBugComponent {
    
    constructor(private logService: LogsUploaderService) { }

	async showBugForm() {
		try {
			const [appLogs, gameLogs] = await Promise.all([this.logService.uploadAppLogs(), this.logService.uploadGameLogs()]);
			const subject = `Firestone bug report`;
			const body = `Hey, I'd like to report a bug I found in Firestone.
			
			== Bug description ==
			
			(please fill the bug descrition here)
			
			== How I got there == 
			
			(if you have any idea of what might have caused the issue, or what you were doing with the app when the bug occurred)
			
			== Log files ==
			
			App logs key: ${appLogs}
			Game logs key: ${gameLogs ? gameLogs : 'game was not running'}`;
			console.log('Trying to prefill email with', subject, body);
			window.location.href = `mailto:sebastien.tromp@gmail.com?subject=${subject}&body=${body}`;
		} catch (e) {
			console.error('Could not upload all relevant log files', e);
		}
	}
}
