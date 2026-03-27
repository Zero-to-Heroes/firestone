import { Turn } from './turn';

export class MulliganTurn extends Turn {
	public update(newTurn): MulliganTurn {
		return Object.assign(new MulliganTurn(), this, newTurn);
	}
}
