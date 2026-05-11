import * as vscode from 'vscode';
import { IdleClickerView, IdleClickerViewProvider } from './idleClickerView';
import { AutoClickUpgrade } from './autoClickUpgrade';
import { ShopViewProvider } from './shopViewProvider';
import { Shop } from './shop';
import { Upgrade } from './upgrade';

export interface GameApi {
	restore(): void;
	getNumber(): number;
	getCps(): number;
	isCriticalActive(): boolean;
	getShop(): Shop;
	registerUpgrade(upgrade: Upgrade): void;
	purchaseUpgrade(id: string): boolean;
	click(amount: number): void;
	getViewProvider(): IdleClickerViewProvider;
	getViewType(): string;
}

export class Game implements GameApi {

	private static readonly countKey = 'idleClicker.count';
	private static readonly criticalChance = 0.005;
	private static readonly criticalMultiplier = 2;
	private static readonly criticalDisplayMs = 600;
	private static readonly cpsWindowMs = 1000;
	private count = 0;
	private readonly globalState: vscode.Memento;
	private readonly shop: Shop;
	private readonly shopViewProvider: ShopViewProvider;
	private readonly view: IdleClickerView;
	private readonly viewProvider: IdleClickerViewProvider;
	private readonly autoClickUpgrade: AutoClickUpgrade;
	private autoClicksPerSecond = 0;
	private autoClickInterval?: ReturnType<typeof setInterval>;
	private cpsEvents: Array<{ time: number; amount: number }> = [];
	private cpsTotal = 0;
	private lastCriticalAt = 0;

	constructor(context: vscode.ExtensionContext) {
		this.globalState = context.globalState;
		this.shop = new Shop(this.globalState);
		this.shopViewProvider = new ShopViewProvider(this.shop);
		this.autoClickUpgrade = new AutoClickUpgrade();
		this.shop.register(this.autoClickUpgrade);
		this.view = new IdleClickerView(context.extensionUri);
		this.viewProvider = new IdleClickerViewProvider(this.view, {
			onClick: (amount) => this.click(amount),
			onRequestState: () => this.updateView(),
			onPurchase: (id) => this.purchaseUpgrade(id)
		});
		this.startAutoClickTimer();
	}

	public restore(): void {
		this.count = this.globalState.get<number>(Game.countKey, 0);
		this.shop.restore();
		this.shop.updateUnlocks(this.count);
		this.cpsEvents = [];
		this.cpsTotal = 0;
		this.lastCriticalAt = 0;
		this.refreshAutoClickRate();
	}

	public getNumber(): number {
		return this.count;
	}

	public getCps(): number {
		this.pruneCps();
		return this.cpsTotal;
	}

	public isCriticalActive(): boolean {
		if (this.lastCriticalAt === 0) {
			return false;
		}

		return Date.now() - this.lastCriticalAt <= Game.criticalDisplayMs;
	}

	public getShop(): Shop {
		return this.shop;
	}

	public getViewProvider(): IdleClickerViewProvider {
		return this.viewProvider;
	}

	public getViewType(): string {
		return IdleClickerViewProvider.viewType;
	}

	public registerUpgrade(upgrade: Upgrade): void {
		this.shop.register(upgrade);
		this.shop.updateUnlocks(this.count);
		this.refreshAutoClickRate();
		this.updateView();
	}

	public purchaseUpgrade(id: string): boolean {
		const cost = this.shop.tryPurchase(id, this.count);
		if (cost === null) {
			return false;
		}

		this.count -= cost;
		void this.globalState.update(Game.countKey, this.count);
		this.refreshAutoClickRate();
		this.updateView();
		return true;
	}

	public click(amount: number): void {
		if (amount <= 0) {
			return;
		}

		const gain = this.applyCritical(amount);
		this.count += gain;
		void this.globalState.update(Game.countKey, this.count);
		this.shop.updateUnlocks(this.count);
		this.recordCps(gain);
		this.updateView();
	}

	private refreshAutoClickRate(): void {
		const level = this.shop.getPurchaseCount(this.autoClickUpgrade.id);
		this.autoClicksPerSecond = level * this.autoClickUpgrade.cpsPerPurchase;
	}

	private startAutoClickTimer(): void {
		if (this.autoClickInterval) {
			return;
		}

		this.autoClickInterval = setInterval(() => {
			if (this.autoClicksPerSecond > 0) {
				this.click(this.autoClicksPerSecond);
			}
		}, 1000);
	}

	private updateView(): void {
		const shopState = this.shopViewProvider.getState(this.count);
		this.view.display(this.getNumber(), this.getCps(), this.isCriticalActive(), shopState);
	}

	private recordCps(amount: number): void {
		const now = Date.now();
		this.cpsEvents.push({ time: now, amount });
		this.cpsTotal += amount;
		this.pruneCps(now);
	}

	private pruneCps(now = Date.now()): void {
		const cutoff = now - Game.cpsWindowMs;
		while (this.cpsEvents.length && this.cpsEvents[0].time < cutoff) {
			const event = this.cpsEvents.shift();
			if (event) {
				this.cpsTotal -= event.amount;
			}
		}
	}

	private applyCritical(amount: number): number {
		if (Math.random() < Game.criticalChance) {
			this.lastCriticalAt = Date.now();
			return amount * Game.criticalMultiplier;
		}

		return amount;
	}
}
