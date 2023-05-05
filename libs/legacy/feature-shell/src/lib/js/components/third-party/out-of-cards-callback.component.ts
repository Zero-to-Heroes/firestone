import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter } from '@angular/core';
import { OverwolfService } from '@firestone/shared/framework/core';
import { DebugService } from '../../services/debug.service';
import { OutOfCardsService, OutOfCardsToken } from '../../services/mainwindow/out-of-cards.service';

@Component({
	selector: 'out-of-cards-callback',
	styleUrls: [],
	template: ` <div class="root"></div> `,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutOfCardsCallbackComponent implements AfterViewInit {
	private stateUpdater: EventEmitter<any>;

	constructor(private debugService: DebugService, private ow: OverwolfService, private ooc: OutOfCardsService) {}

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
		if (code) {
			const token: OutOfCardsToken = await this.ooc.generateToken(code);
			if (token) {
				this.stateUpdater.next(token);
			}
			window.close();
		} else {
			window.location.replace(
				`https://outof.games/oauth/authorize/?client_id=oqEn7ONIAOmugFTjFQGe1lFSujGxf3erhNDDTvkC&response_type=code&scope=hearthcollection&redirect_uri=https://www.firestoneapp.com/ooc-login.html`,
			);
		}
	}
}
