import * as vscode from 'vscode';
import { Game } from './game';

export class DebugViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'clicker.debugView';

    private _view?: vscode.WebviewView;
    private _game?: Game;

    constructor(
        private readonly _extensionUri: vscode.Uri,
    ) { }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this._extensionUri
            ]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(data => {
            if (this._game?.isDebugEnabled()) {
                if (data.command === 'debugAdd') {
                    this._game.debugAdd(data.amount);
                } else if (data.command === 'debugReset') {
                    this._game.debugReset();
                }
            }
        });
    }

    public setGame(game: Game) {
        this._game = game;
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const nonce = getNonce();

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Debug</title>
                <style>
                    .debug-container {
                        padding: 10px;
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                    }
                    button {
                        width: 100%;
                    }
                    input {
                        width: calc(100% - 10px);
                        padding: 5px;
                    }
                </style>
            </head>
            <body>
                <div class="debug-container">
                    <input type="number" id="debug-amount" value="1000" />
                    <button id="debug-add">Add</button>
                    <button id="debug-reset">Reset</button>
                </div>

                <script nonce="${nonce}">
                    const vscode = acquireVsCodeApi();
                    const addAmount = document.getElementById('debug-amount');
                    document.getElementById('debug-add').addEventListener('click', () => {
                        vscode.postMessage({ command: 'debugAdd', amount: parseInt(addAmount.value, 10) });
                    });
                    document.getElementById('debug-reset').addEventListener('click', () => {
                        vscode.postMessage({ command: 'debugReset' });
                    });
                </script>
            </body>
            </html>`;
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
