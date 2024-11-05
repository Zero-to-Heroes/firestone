import { BgsCompAdvice } from '@firestone-hs/content-craetor-input';
import { Race } from '@firestone-hs/reference-data';

export interface ExtendedBgsCompAdvice extends BgsCompAdvice {
	readonly minionIcon: string;
	readonly tribes: readonly Race[];
}
