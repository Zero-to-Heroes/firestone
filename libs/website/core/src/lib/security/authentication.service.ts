import { Injectable } from '@angular/core';

@Injectable()
export class AuthenticationService {
	public isPremium(): boolean {
		return false;
	}
}
