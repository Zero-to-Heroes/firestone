import { Injectable } from '@angular/core';

@Injectable()
export class HsPublicEventsListener {

	public static readonly REPLAY_UPLOADED = 'publicevents-replay-uploaded';

	constructor() {
	}
}
