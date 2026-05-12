import { Upgrade } from './upgrade';

export interface GlobalMultiplierUpgrade extends Upgrade {
	productionmultiplier: number;
}

export class EnergyDrink implements GlobalMultiplierUpgrade {
	public static readonly id = 'energyDrink';
	public readonly id = EnergyDrink.id;
	public readonly name = 'Energy Drink';
	public readonly unlockAt = 50000;
	public readonly unlockAtIsAcps = false;
	public readonly baseCost = 40000;
	public readonly costMultiplier = 2;
	public readonly maxPurchases = 4;
	public readonly productionmultiplier = 1.5;
}

export class GpuCluster implements GlobalMultiplierUpgrade {
	public static readonly id = 'gpuCluster';
	public readonly id = GpuCluster.id;
	public readonly name = 'GPU Cluster';
	public readonly unlockAt = 5000000;
	public readonly unlockAtIsAcps = false;
	public readonly baseCost = 4000000;
	public readonly costMultiplier = 2.5;
	public readonly maxPurchases = 3;
	public readonly productionmultiplier = 3;
}
