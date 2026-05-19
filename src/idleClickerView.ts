import * as vscode from 'vscode';

export interface ViewHandlers {
	onClick: (amount: number) => void;
	onRequestState: () => void;
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
		});

		handlers.onRequestState();
	}

	public display(
		count: number,
		currentCps: number,
		critical = false
	): void {
		this.view?.webview.postMessage({
			type: 'state',
			count,
			cps: currentCps,
			critical
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
		body {
			margin: 0;
			height: 100vh;
			display: flex;
			align-items: center;
			justify-content: center;
			font-family: "Space Grotesk", "IBM Plex Sans", "Segoe UI", sans-serif;
			background: var(--vscode-editor-background);
			color: var(--vscode-editor-foreground);
		}
		.container {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 16px;
			text-align: center;
			width: 100%;
			padding: 12px;
			box-sizing: border-box;
		}
		.count {
			font-size: 24px;
			font-weight: 700;
		}
		.cps {
			font-size: 14px;
			font-weight: 600;
			opacity: 0.9;
		}
		.critical {
			font-size: 14px;
			font-weight: 700;
			color: var(--vscode-editorWarning-foreground, #ff0000);
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
			background: radial-gradient(circle at 30% 30%,
				var(--vscode-button-background),
				color-mix(in srgb, var(--vscode-button-background) 70%, #000 30%)
			);
			border: 2px solid color-mix(in srgb, var(--vscode-button-background) 50%, #000 50%);
			box-shadow:
				0 8px 14px rgba(0, 0, 0, 0.25),
				inset 0 6px 12px rgba(255, 255, 255, 0.2),
				inset 0 -8px 16px rgba(0, 0, 0, 0.25);
			cursor: pointer;
			transition: transform 0.05s ease, box-shadow 0.05s ease;
		}
		.circle:active {
			transform: translateY(4px);
			box-shadow:
				0 3px 6px rgba(0, 0, 0, 0.2),
				inset 0 4px 8px rgba(255, 255, 255, 0.2),
				inset 0 -4px 8px rgba(0, 0, 0, 0.25);
		}
		.circle.pulse {
			animation: pulse 0.22s ease-out;
		}
		@keyframes pulse {
			0% {
				transform: scale(1);
				filter: brightness(1);
			}
			50% {
				transform: scale(1.06);
				filter: brightness(1.12);
			}
			100% {
				transform: scale(1);
				filter: brightness(1);
			}
		}
		.label {
			font-size: 12px;
			opacity: 0.7;
		}
	</style>
</head>
<body>
	<div class="container">
		<div id="count" class="count">0</div>
		<div id="cps" class="cps">CPS: 0</div>
		<div id="critical" class="critical">CRIT!</div>
		<button id="circle" class="circle" aria-label="Click the circle"></button>
		<div class="label">Click or type to score</div>
	</div>
	<script nonce="${nonce}">
		const vscode = acquireVsCodeApi();
		const countEl = document.getElementById('count');
		const cpsEl = document.getElementById('cps');
		const criticalEl = document.getElementById('critical');
		const circleEl = document.getElementById('circle');
		const cpsUpdateMs = 250;
		const requestState = () => vscode.postMessage({ type: 'requestState' });
		let lastCount = 0;

		const formatNumber = (value) => {
			if (!Number.isFinite(value)) {
				return '0';
			}
			const abs = Math.abs(value);
			const sign = value < 0 ? '-' : '';
			if (abs < 1000) {
				return sign + Math.floor(abs).toString();
			}
			const units = [
				{ value: 1e12, suffix: 'T' },
				{ value: 1e9, suffix: 'B' },
				{ value: 1e6, suffix: 'M' },
				{ value: 1e3, suffix: 'K' }
			];
			for (const unit of units) {
				if (abs >= unit.value) {
					const scaled = abs / unit.value;
					let decimals = 0;
					if (scaled < 10) {
						decimals = 2;
					} else if (scaled < 100) {
						decimals = 1;
					}
					const factor = Math.pow(10, decimals);
					const trimmed = Math.floor(scaled * factor) / factor;
					const text = trimmed.toFixed(decimals);
					return sign + text + unit.suffix;
				}
			}
			return sign + Math.floor(abs).toString();
		};

		circleEl.addEventListener('click', () => {
			vscode.postMessage({ type: 'click' });
		});

		window.addEventListener('message', (event) => {
			const message = event.data;
			if (message && message.type === 'state') {
				countEl.textContent = formatNumber(message.count);
				cpsEl.textContent = 'production: ' + formatNumber(message.cps) + '/s';
				criticalEl.classList.toggle('active', Boolean(message.critical));
				if (message.count > lastCount) {
					circleEl.classList.remove('pulse');
					void circleEl.offsetWidth;
					circleEl.classList.add('pulse');
				}
				lastCount = message.count;
			}
		});

		requestState();
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
