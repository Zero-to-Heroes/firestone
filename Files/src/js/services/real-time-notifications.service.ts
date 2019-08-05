import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class RealTimeNotificationService {
	private readonly URL = 'https://iej6sdi74d.execute-api.us-west-2.amazonaws.com/prod/get-status';

	public notifications: string[];

	constructor(private http: HttpClient) {
		console.log('init real time notifications');
		this.getStatus();
	}

	private getStatus() {
		console.log('getting status');
		this.http.get(this.URL).subscribe((res: any) => {
			if (res.ok) {
				const status = JSON.parse(res._body);
				this.notifications = status[0].status;
				console.log('received status', this.notifications);
			}
		});
	}
}
