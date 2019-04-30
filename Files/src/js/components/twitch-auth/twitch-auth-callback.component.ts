import { Component, ChangeDetectionStrategy, AfterViewInit, EventEmitter } from '@angular/core';
import { DebugService } from '../../services/debug.service';

declare var overwolf: any;

@Component({
	selector: 'twitch-auth-callback',
	styleUrls: [
	],
	template: `
        <div class="root">
            Successfully logged in to Twitch, this window will auto close
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TwitchAuthCallbackComponent implements AfterViewInit {
    
	private stateUpdater: EventEmitter<any>;

	constructor(private debugService: DebugService) { }

	ngAfterViewInit() {
        console.log('handling twitch auth callback', overwolf.windows.getMainWindow());
		this.stateUpdater = overwolf.windows.getMainWindow().twitchAuthUpdater;
        const hash = window.location.hash;
        const hashAsObject: any = hash.substring(1)
                .split('&')
                .map(v => v.split("="))
                .reduce( (pre, [key, value]) => ({ ...pre, [key]: value }), {} );
        console.log('hash is', hashAsObject);
        // const accessToken = hashAsObject.access_token;
        // const idToken = hashAsObject.id_token;
        this.stateUpdater.next(hashAsObject);
        // TODO: close
        window.close();
	}
}