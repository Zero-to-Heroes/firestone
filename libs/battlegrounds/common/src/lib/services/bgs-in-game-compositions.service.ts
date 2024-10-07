import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class BgsInGameCompositionsService {
	public expandedCompositions$$ = new BehaviorSubject<readonly string[]>([]);
}
