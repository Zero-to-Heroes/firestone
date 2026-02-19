import { Injectable } from '@angular/core';
import { LogListenerService } from './log-listener.service';

@Injectable({ providedIn: 'root' })
export class LogListenerCacheService {
	public cache: { [key: string]: LogListenerService } = {};
}
