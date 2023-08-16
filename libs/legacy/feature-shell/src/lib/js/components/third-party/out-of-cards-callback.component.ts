import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter } from '@angular/core';
import { ApiRunner, OverwolfService } from '@firestone/shared/framework/core';
import { DebugService } from '../../services/debug.service';
import { OutOfCardsToken } from '../../services/mainwindow/out-of-cards.service';

@Component({
	selector: 'out-of-cards-callback',
	styleUrls: [],
	template: ` <div class="root"></div> `,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
// Unused
export class OutOfCardsCallbackComponent implements AfterViewInit {
	private stateUpdater: EventEmitter<any>;

	constructor(private debugService: DebugService, private ow: OverwolfService, private api: ApiRunner) {}

	async ngAfterViewInit() {
		const windowId = (await this.ow.getCurrentWindow()).id;
		await this.ow.bringToFront(windowId);

		this.stateUpdater = this.ow.getMainWindow().outOfCardsAuthUpdater;
		if (!this.stateUpdater) {
			setTimeout(() => this.ngAfterViewInit(), 100);
			return;
		}

		const queryParams = new URLSearchParams(window.location.search);
		const code = queryParams.get('code');
		console.debug('[ooc-auth] received code', code, window.location);
		if (code) {
			const token: OutOfCardsToken = await generateToken(code, this.api);
			if (token) {
				this.stateUpdater.next(token);
			}
			window.close();
		} else {
			console.debug('[ooc-auth] no code, redirecting to login page');
			this.ow.openUrlInDefaultBrowser(
				`https://outof.games/oauth/authorize/?client_id=oqEn7ONIAOmugFTjFQGe1lFSujGxf3erhNDDTvkC&response_type=code&scope=hearthcollection&redirect_uri=https://www.firestoneapp.com/oog-login.html`,
			);
			this.ow.closeWindow(windowId);
			// window.location.replace(
			// 	`https://outof.games/oauth/authorize/?client_id=oqEn7ONIAOmugFTjFQGe1lFSujGxf3erhNDDTvkC&response_type=code&scope=hearthcollection&redirect_uri=https://www.firestoneapp.com/oog-login.html`,
			// );
		}
	}
}

export const generateToken = async (code: string, api: ApiRunner): Promise<OutOfCardsToken> => {
	const requestString = `code=${code}&grant_type=authorization_code&redirect_uri=https://www.firestoneapp.com/oog-login.html&client_id=oqEn7ONIAOmugFTjFQGe1lFSujGxf3erhNDDTvkC`;
	const token: OutOfCardsToken = await api.callPostApi('https://outof.games/oauth/token/', requestString, {
		contentType: 'application/x-www-form-urlencoded',
	});
	if (!token) {
		return null;
	}

	const tokenWithExpiry: OutOfCardsToken = {
		...token,
		expires_timestamp: Date.now() + 1000 * token.expires_in,
	};
	return tokenWithExpiry;
};
