import { Injectable } from '@angular/core';
import { Http } from "@angular/http";

const SUBSCRIPTION_STATUS_ENDPOINT_GET = 'https://rpeze8ckdl.execute-api.us-west-2.amazonaws.com/Prod/subscriptions';

declare var overwolf;

@Injectable()
export class AdService {

    constructor(private http: Http) { }

    public async shouldDisplayAds(): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            overwolf.profile.getCurrentUser((user) => {
                let username = user.username;
                if (!username) {
                    console.log('user not logged in', user);
                    resolve(true);
                    return;
                }
                console.log('contacting subscription API');
                this.http.get(`${SUBSCRIPTION_STATUS_ENDPOINT_GET}/${user.user.userId}/${username}`).subscribe((res) => {
                    console.log('retrieved sub status for', username, res);
                    resolve(false);
                }, (error) => {
                    console.log('no subscription, showign ads', error);
                    resolve(true);
                });
            });
        });
    }

}
