import { Injectable } from '@angular/core';
import { Entity } from '@firestone/replay/replay-parser';
import { BehaviorSubject } from 'rxjs';

export interface InGameFinalBoard {
	readonly mmr: number;
	readonly heroCardId: string;
	readonly board: readonly Entity[];
}

@Injectable({ providedIn: 'root' })
export class BgsInGameCompositionsService {
	public expandedCompositions$$ = new BehaviorSubject<readonly string[]>([]);
	public finalBoardsByCompId$$ = new BehaviorSubject<ReadonlyMap<string, readonly InGameFinalBoard[]>>(new Map());
}
