import { Upgrade } from './upgrade';

export interface CriticalUpgrade extends Upgrade {
	additionalPourcent: number;
	updateMaxCritical: number;
}

export class CriticalClick implements CriticalUpgrade {
	public static readonly id = 'criticalClick';
	public readonly id = CriticalClick.id;
	public readonly name = 'Critical Click';
	public readonly unlockAt = 10000;
	public readonly unlockAtIsAcps = false;
	public readonly baseCost = 8000;
	public readonly costMultiplier = 1.8;
	public readonly maxPurchases = 5;
	public readonly additionalPourcent = 10;
	public readonly updateMaxCritical = 5;
}
