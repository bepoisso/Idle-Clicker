import * as vscode from 'vscode';
import { ShopViewState } from './shopViewProvider';

export interface ViewHandlers {
	onClick: (amount: number) => void;
	onRequestState: () => void;
	onPurchase?: (id: string) => void;
}

export class IdleClickerView {
	private view?: vscode.WebviewView;

	constructor(private readonly extensionUri: vscode.Uri) {}

	public attach(webviewView: vscode.WebviewView, handlers: ViewHandlers): void {
		this.view = webviewView;
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this.extensionUri]
		};

		webviewView.webview.html = this.getHtml(webviewView.webview);
		webviewView.webview.onDidReceiveMessage((message: { type?: string; amount?: number; id?: string }) => {
			if (message?.type === 'click') {
				handlers.onClick(message.amount ?? 1);
			}
			if (message?.type === 'requestState') {
				handlers.onRequestState();
			}
			if (message?.type === 'purchase' && message.id) {
				handlers.onPurchase?.(message.id);
			}
		});

		handlers.onRequestState();
	}

	public display(
		count: number,
		currentCps: number,
		critical = false,
		shopState?: ShopViewState
	): void {
		this.view?.webview.postMessage({
			type: 'state',
			count,
			cps: currentCps,
			critical,
			shop: shopState
		});
	}

	private getHtml(webview: vscode.Webview): string {
		const nonce = getNonce();

		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<style nonce="${nonce}">
		:root {
			color-scheme: light;
		}
		body {
			margin: 0;
			height: 100vh;
			display: flex;
			align-items: center;
			justify-content: center;
			font-family: "Segoe UI", sans-serif;
			background: transparent;
		}
		.container {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 12px;
			text-align: center;
		}
		.tabs {
			position: relative;
			display: flex;
			width: 220px;
			padding: 4px;
			border-radius: 999px;
			background: #f1f1f1;
			gap: 0;
		}
		.tabs.shop .tab-slider {
			transform: translateX(100%);
		}
		.tab {
			flex: 1;
			position: relative;
			z-index: 1;
			border: none;
			background: transparent;
			padding: 6px 0;
			font-weight: 600;
			cursor: pointer;
		}
		.tab-slider {
			position: absolute;
			top: 4px;
			bottom: 4px;
			left: 4px;
			width: calc(50% - 4px);
			border-radius: 999px;
			background: #ffffff;
			box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
			transition: transform 0.2s ease;
		}
		.panel {
			display: none;
			flex-direction: column;
			align-items: center;
			gap: 12px;
			width: 100%;
		}
		.panel.active {
			display: flex;
		}
		.shop-list {
			display: flex;
			flex-direction: column;
			gap: 8px;
			width: 220px;
		}
		.shop-item {
			border: 1px solid #e0e0e0;
			border-radius: 8px;
			padding: 8px;
			text-align: left;
			background: #ffffff;
		}
		.shop-title {
			font-weight: 700;
			margin-bottom: 4px;
		}
		.shop-meta {
			font-size: 12px;
			opacity: 0.7;
			margin-bottom: 6px;
		}
		.shop-status {
			font-size: 12px;
			font-weight: 600;
		}
		.shop-action {
			margin-top: 6px;
			border: none;
			border-radius: 6px;
			padding: 6px 10px;
			font-weight: 600;
			cursor: pointer;
		}
		.shop-action:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
		.shop-empty {
			font-size: 12px;
			opacity: 0.6;
		}
		.count {
			font-size: 24px;
			font-weight: 700;
		}
		.cps {
			font-size: 14px;
			font-weight: 600;
		}
		.critical {
			font-size: 14px;
			font-weight: 700;
			color: #c0392b;
			opacity: 0;
			transform: translateY(-4px);
			transition: opacity 0.2s ease, transform 0.2s ease;
		}
		.critical.active {
			opacity: 1;
			transform: translateY(0);
		}
		.circle {
			width: 120px;
			height: 120px;
			border-radius: 50%;
			background: #ffb347;
			border: 2px solid #7a4e00;
			box-shadow: 0 6px 0 #cc8a2c;
			cursor: pointer;
			transition: transform 0.05s ease, box-shadow 0.05s ease;
		}
		.circle:active {
			transform: translateY(4px);
			box-shadow: 0 2px 0 #cc8a2c;
		}
		.label {
			font-size: 12px;
			opacity: 0.7;
		}
	</style>
</head>
<body>
	<div class="container">
		<div id="tabs" class="tabs">
			<div class="tab-slider"></div>
			<button id="tab-clicker" class="tab" type="button">Clicker</button>
			<button id="tab-shop" class="tab" type="button">Shop</button>
		</div>
		<div id="panel-clicker" class="panel active">
			<div id="count" class="count">0</div>
			<div id="cps" class="cps">CPS: 0</div>
			<div id="critical" class="critical">CRIT!</div>
			<button id="circle" class="circle" aria-label="Click the circle"></button>
			<div class="label">Click or type to score</div>
		</div>
		<div id="panel-shop" class="panel">
			<div id="shop-list" class="shop-list"></div>
			<div id="shop-empty" class="shop-empty">No upgrades yet.</div>
		</div>
	</div>
	<script nonce="${nonce}">
		const vscode = acquireVsCodeApi();
		const countEl = document.getElementById('count');
		const cpsEl = document.getElementById('cps');
		const criticalEl = document.getElementById('critical');
		const circleEl = document.getElementById('circle');
		const tabsEl = document.getElementById('tabs');
		const tabClicker = document.getElementById('tab-clicker');
		const tabShop = document.getElementById('tab-shop');
		const panelClicker = document.getElementById('panel-clicker');
		const panelShop = document.getElementById('panel-shop');
		const shopListEl = document.getElementById('shop-list');
		const shopEmptyEl = document.getElementById('shop-empty');
		const cpsUpdateMs = 250;
		const requestState = () => vscode.postMessage({ type: 'requestState' });

		const setActiveTab = (tab) => {
			const isShop = tab === 'shop';
			tabsEl.classList.toggle('shop', isShop);
			panelClicker.classList.toggle('active', !isShop);
			panelShop.classList.toggle('active', isShop);
		};

		const renderShop = (shop) => {
			const items = shop && shop.items ? shop.items : [];
			shopListEl.textContent = '';
			shopEmptyEl.style.display = items.length ? 'none' : 'block';

			for (const item of items) {
				const row = document.createElement('div');
				row.className = 'shop-item';

				const title = document.createElement('div');
				title.className = 'shop-title';
				title.textContent = item.name;

				const meta = document.createElement('div');
				meta.className = 'shop-meta';
				meta.textContent =
					'Cost: ' +
					item.cost +
					' | Level: ' +
					item.level +
					'/' +
					item.maxPurchases +
					' | Unlock at: ' +
					item.unlockAt;

				const status = document.createElement('div');
				status.className = 'shop-status';
				if (item.maxed) {
					status.textContent = 'Maxed';
				} else if (item.purchased) {
					status.textContent = 'Purchased';
				} else if (item.unlocked) {
					status.textContent = 'Unlocked';
				} else {
					status.textContent = 'Locked';
				}

				row.appendChild(title);
				row.appendChild(meta);
				row.appendChild(status);

				if (item.unlocked && !item.maxed) {
					const button = document.createElement('button');
					button.className = 'shop-action';
					button.textContent = item.canPurchase ? 'Buy' : 'Need more';
					button.disabled = !item.canPurchase;
					button.addEventListener('click', () => {
						vscode.postMessage({ type: 'purchase', id: item.id });
					});
					row.appendChild(button);
				}

				shopListEl.appendChild(row);
			}
		};

		circleEl.addEventListener('click', () => {
			vscode.postMessage({ type: 'click' });
		});

		tabClicker.addEventListener('click', () => setActiveTab('clicker'));
		tabShop.addEventListener('click', () => setActiveTab('shop'));

		window.addEventListener('message', (event) => {
			const message = event.data;
			if (message && message.type === 'state') {
				countEl.textContent = String(message.count);
				cpsEl.textContent = 'CPS: ' + message.cps;
				criticalEl.classList.toggle('active', Boolean(message.critical));
				renderShop(message.shop);
			}
		});

		requestState();
		setActiveTab('clicker');
		setInterval(requestState, cpsUpdateMs);
	</script>
</body>
</html>`;
	}
}

export class IdleClickerViewProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'idleClicker.view';

	constructor(private readonly view: IdleClickerView, private readonly handlers: ViewHandlers) {}

	public resolveWebviewView(webviewView: vscode.WebviewView): void {
		this.view.attach(webviewView, this.handlers);
	}
}

function getNonce(): string {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}

	return text;
}
