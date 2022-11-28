import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable()
export class RealTimeNotificationService {
	private readonly URL = 'https://iej6sdi74d.execute-api.us-west-2.amazonaws.com/prod/get-status';

	public notifications: string[];

	constructor(private http: HttpClient) {}

	public async getStatus(): Promise<string[]> {
		return new Promise<string[]>((resolve) => {
			this.http.get(this.URL).subscribe((res: any) => {
				if (res.ok) {
					const status = JSON.parse(res._body);
					this.notifications = status[0].status;
				}
				resolve(this.notifications);
			});
		});
	}
}
