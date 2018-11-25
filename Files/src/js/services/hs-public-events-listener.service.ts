import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions } from "@angular/http";

declare var overwolf: any;
declare var AWS: any;

@Injectable()
export class HsPublicEventsListener {

	public static readonly REPLAY_UPLOADED = 'publicevents-replay-uploaded';

	constructor(private http: Http) {
		let port = 4766;

		// setTimeout(() => {
		// 	overwolf.web.createServer(port, serverInfo => {
		// 	    if (serverInfo.status == "error") {
		// 	        console.log("Failed to create server");
		// 	        return;
		// 	    } 
		// 	    else {
		// 	        let server = serverInfo.server;
		// 	        server.onRequest.addListener((info) => this.onRequest(info));

		// 	        server.listen(info => {
		// 	            console.log("Server listening status on port ", port, info);
		// 	        });

		// 			let headers = new Headers({ 'Content-Type': 'text/plain' });
		// 	    	let options = new RequestOptions({ headers: headers });
		// 	        let registerRequest = {
		// 	        	requestType: 'register',
		// 	        	callbackUrl: 'http://localhost:' + port
		// 	        }
		// 	        this.http
		// 	        		.post('http://localhost:4765', registerRequest, options)
		// 					.map((res) => res.json())
		// 					.subscribe((success) => console.log('success', success), (error) => console.log('error', error));
		// 	    }
		// 	});
		// }, 1000)
	}

	private onRequest(info) {
	    // console.log('request: ', info);
	    // info = { "content": "{'hello': 'world'}", "contentType": "application/json", "url": "http://localhost:59873/"}
	}
}
