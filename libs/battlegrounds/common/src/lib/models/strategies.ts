import { BgsHeroCurve, BgsHeroCurveStep } from '../services/bgs-meta-hero-strategies.service';

export interface Strategy {
	readonly date: string;
	readonly summary: string;
	readonly curves?: readonly LocalizedBgsHeroCurve[];
	readonly author: {
		readonly name: string;
		readonly tooltip: string;
		readonly link?: string;
	};
}

export interface LocalizedBgsHeroCurve extends BgsHeroCurve {
	readonly steps: readonly LocalizedBgsHeroCurveStep[];
}

export interface LocalizedBgsHeroCurveStep extends BgsHeroCurveStep {
	readonly turnLabel: string;
	readonly goldLabel: string;
	readonly localizedActions: readonly string[];
}
