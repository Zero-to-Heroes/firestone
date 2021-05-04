import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter } from '@angular/core';
import { DebugService } from '../../services/debug.service';
import { OverwolfService } from '../../services/overwolf.service';

@Component({
	selector: 'twitch-auth-callback',
	styleUrls: [],
	template: ` <div class="root">Successfully logged in to Twitch, you can now close this window</div> `,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TwitchAuthCallbackComponent implements AfterViewInit {
	private stateUpdater: EventEmitter<any>;

	constructor(private debugService: DebugService, private ow: OverwolfService) {}

	ngAfterViewInit() {
		console.log('handling twitch auth callback');
		this.stateUpdater = this.ow.getMainWindow().twitchAuthUpdater;
		if (!this.stateUpdater) {
			setTimeout(() => this.ngAfterViewInit(), 100);
			return;
		}
		const hash = window.location.hash;
		const hashAsObject: any = hash
			.substring(1)
			.split('&')
			.map((v) => v.split('='))
			.reduce((pre, [key, value]) => ({ ...pre, [key]: value }), {});
		console.log('hash is', hashAsObject);
		// const accessToken = hashAsObject.access_token;
		// const idToken = hashAsObject.id_token;
		this.stateUpdater.next(hashAsObject);
		// TODO: close
		window.close();
	}
}
