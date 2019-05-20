import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions } from "@angular/http";

declare var overwolf: any;
declare var AWS: any;

@Injectable()
export class HsPublicEventsListener {

	public static readonly REPLAY_UPLOADED = 'publicevents-replay-uploaded';

	constructor(private http: Http) {
	}
}
