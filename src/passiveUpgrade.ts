import { Upgrade } from './upgrade';

export interface PassiveUpgrade extends Upgrade {
	cpsPerPurchase: number;
}

export class AutoClickUpgrade implements PassiveUpgrade {
	public static readonly id = 'autoClick';
	public readonly id = AutoClickUpgrade.id;
	public readonly name = 'Auto Clicker';
	public readonly unlockAt = 400;
	public readonly unlockAtIsAcps = false;
	public readonly baseCost = 500;
	public readonly costMultiplier = 1.35;
	public readonly maxPurchases = 25;
	public readonly cpsPerPurchase = 1;
}

export class MiniBotUpgrade implements PassiveUpgrade {
	public static readonly id = 'miniBot';
	public readonly id = MiniBotUpgrade.id;
	public readonly name = 'Mini Bot';
	public readonly unlockAt = 15000;
	public readonly unlockAtIsAcps = false;
	public readonly baseCost = 12000;
	public readonly costMultiplier = 1.42;
	public readonly maxPurchases = 20;
	public readonly cpsPerPurchase = 5;
}

export class ScriptEngineUpgrade implements PassiveUpgrade {
	public static readonly id = 'scriptEngine';
	public readonly id = ScriptEngineUpgrade.id;
	public readonly name = 'Script Engine';
	public readonly unlockAt = 120000;
	public readonly unlockAtIsAcps = false;
	public readonly baseCost = 95000;
	public readonly costMultiplier = 1.48;
	public readonly maxPurchases = 15;
	public readonly cpsPerPurchase = 40;
}

export class AiWorkerUpgrade implements PassiveUpgrade {
	public static readonly id = 'aiWorker';
	public readonly id = AiWorkerUpgrade.id;
	public readonly name = 'AI Worker';
	public readonly unlockAt = 1500000;
	public readonly unlockAtIsAcps = false;
	public readonly baseCost = 1000000;
	public readonly costMultiplier = 1.55;
	public readonly maxPurchases = 10;
	public readonly cpsPerPurchase = 350;
}

