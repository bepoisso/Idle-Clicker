import * as vscode from 'vscode';
import { Game } from './game';
import { DebugViewProvider } from './debugView';
import { ShopSidebarViewProvider } from './shopView';

export function activate(context: vscode.ExtensionContext) {
	const game = new Game(context);
	game.restore();
	const viewProvider = game.getViewProvider();
	const shopSidebarProvider = new ShopSidebarViewProvider(context.extensionUri);
	const debugViewProvider = new DebugViewProvider(context.extensionUri);
	shopSidebarProvider.setGame(game);
	debugViewProvider.setGame(game);
	game.setShopSidebarViewProvider(shopSidebarProvider);

	// Register the Explorer view that hosts the game UI.
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(game.getViewType(), viewProvider)
	);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			ShopSidebarViewProvider.viewType,
			shopSidebarProvider
		)
	);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			DebugViewProvider.viewType,
			debugViewProvider
		)
	);

	// Increment the counter whenever the user types in any text document.
	context.subscriptions.push(
		vscode.workspace.onDidChangeTextDocument((event) => {
			if (!event.contentChanges.length) {
				return;
			}

			let increment = 0;
			for (const change of event.contentChanges) {
				if (change.text.length > 0) {
					increment += 1;
				}
			}

			game.click(increment);
		})
	);
}

export function deactivate() {}
