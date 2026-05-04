import { CardIds } from '@firestone-hs/reference-data';

/** Starship-adjacent card ids shared by selectors and the next-starship-launch counter. No counter imports — avoids barrel → CounterDefinition circular load. */
export const EXTENDED_STARSHIP_CARDS: readonly CardIds[] = [
	CardIds.Starport_SC_403,
	CardIds.StarshipSchematic_GDB_102,
	CardIds.ScroungingShipwright_GDB_876,
	CardIds.SalvageTheBunker_SC_404,
	CardIds.LiftOff_SC_410,
	CardIds.WaywardProbe_SC_500,
];
