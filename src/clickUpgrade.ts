import { Upgrade } from './upgrade';

export interface ClickUpgrade extends Upgrade {
	clickPerPurchase: number;
	clickMultiplierPerPurchase: number;
}

export class BetterMouse implements ClickUpgrade {
	public static readonly id = 'betterMouse';
	public readonly id = BetterMouse.id;
	public readonly name = 'Better Mouse';
	public readonly unlockAt = 1000;
	public readonly unlockAtIsAcps = false;
	public readonly baseCost = 750;
	public readonly costMultiplier = 1.3;
	public readonly maxPurchases = 20;
	public readonly clickPerPurchase = 1;
	public readonly clickMultiplierPerPurchase = 1;
}

export class MechanicalKeyboard implements ClickUpgrade {
	public static readonly id = 'mechanicalkeyboard';
	public readonly id = MechanicalKeyboard.id;
	public readonly name = 'Mechanical Keyboard';
	public readonly unlockAt = 20000;
	public readonly unlockAtIsAcps = false;
	public readonly baseCost = 15000;
	public readonly costMultiplier = 1.75;
	public readonly maxPurchases = 5;
	public readonly clickPerPurchase = 0;
	public readonly clickMultiplierPerPurchase = 2;
}
