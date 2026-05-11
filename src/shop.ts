import * as vscode from 'vscode';
import { Upgrade } from './upgrade';

export class Shop {
	private static readonly unlockedKey = 'idleClicker.upgradesUnlocked';
	private static readonly purchaseCountsKey = 'idleClicker.upgradesPurchaseCounts';
	private static readonly legacyPurchasedKey = 'idleClicker.upgradesPurchased';
	private readonly upgrades = new Map<string, Upgrade>();
	private unlockedIds = new Set<string>();
	private purchaseCounts = new Map<string, number>();

	constructor(private readonly globalState: vscode.Memento) {}

	public restore(): void {
		this.unlockedIds = new Set(
			this.globalState.get<string[]>(Shop.unlockedKey, [])
		);
		const rawCounts = this.globalState.get<Record<string, number>>(
			Shop.purchaseCountsKey,
			{}
		);
		this.purchaseCounts = new Map(
			Object.entries(rawCounts).map(([id, count]) => [id, Math.max(0, count)])
		);
		const legacyPurchased = this.globalState.get<string[]>(
			Shop.legacyPurchasedKey,
			[]
		);
		if (!this.purchaseCounts.size && legacyPurchased.length) {
			for (const id of legacyPurchased) {
				this.purchaseCounts.set(id, 1);
			}
			this.persistPurchaseCounts();
		}
	}

	public register(upgrade: Upgrade): void {
		this.upgrades.set(upgrade.id, upgrade);
	}

	public registerMany(upgrades: Upgrade[]): void {
		for (const upgrade of upgrades) {
			this.register(upgrade);
		}
	}

	public getAll(): Upgrade[] {
		return Array.from(this.upgrades.values());
	}

	public getUnlocked(): Upgrade[] {
		return this.getAll().filter((upgrade) => this.unlockedIds.has(upgrade.id));
	}

	public isUnlocked(id: string): boolean {
		return this.unlockedIds.has(id);
	}

	public isPurchased(id: string): boolean {
		return this.getPurchaseCount(id) > 0;
	}

	public getPurchaseCount(id: string): number {
		return this.purchaseCounts.get(id) ?? 0;
	}

	public getMaxPurchases(id: string): number {
		const upgrade = this.upgrades.get(id);
		return upgrade ? upgrade.maxPurchases : 0;
	}

	public getCurrentCost(id: string): number | null {
		const upgrade = this.upgrades.get(id);
		if (!upgrade) {
			return null;
		}

		const level = this.getPurchaseCount(id);
		const cost = upgrade.baseCost * Math.pow(upgrade.costMultiplier, level);
		return Math.ceil(cost);
	}

	public updateUnlocks(currentCount: number): void {
		let changed = false;
		for (const upgrade of this.upgrades.values()) {
			if (!this.unlockedIds.has(upgrade.id) && currentCount >= upgrade.unlockAt) {
				this.unlockedIds.add(upgrade.id);
				changed = true;
			}
		}

		if (changed) {
			this.persistUnlocked();
		}
	}

	public canPurchase(id: string, currentCount: number): boolean {
		const upgrade = this.upgrades.get(id);
		if (!upgrade) {
			return false;
		}

		const level = this.getPurchaseCount(id);
		const cost = this.getCurrentCost(id);
		if (cost === null) {
			return false;
		}

		return (
			this.unlockedIds.has(id) &&
			level < upgrade.maxPurchases &&
			currentCount >= cost
		);
	}

	public tryPurchase(id: string, currentCount: number): number | null {
		const upgrade = this.upgrades.get(id);
		if (!upgrade) {
			return null;
		}

		const cost = this.getCurrentCost(id);
		if (cost === null) {
			return null;
		}

		if (!this.canPurchase(id, currentCount)) {
			return null;
		}

		const level = this.getPurchaseCount(id) + 1;
		this.purchaseCounts.set(id, level);
		this.persistPurchaseCounts();
		return cost;
	}

	private persistUnlocked(): void {
		void this.globalState.update(
			Shop.unlockedKey,
			Array.from(this.unlockedIds.values())
		);
	}

	private persistPurchaseCounts(): void {
		const payload: Record<string, number> = {};
		for (const [id, count] of this.purchaseCounts.entries()) {
			payload[id] = count;
		}
		void this.globalState.update(Shop.purchaseCountsKey, payload);
	}
}
