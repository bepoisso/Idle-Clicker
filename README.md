# Idle Clicker

Un clicker idle directement dans VS Code. Clique sur le cercle, tape dans un fichier, et fais monter ton compteur avec des ameliorations, du CPS et des critiques.

## Features

- Clicker dans la vue Explorer
- Shop dans la barre laterale (Activity Bar)
- Debug panel (ajout/reset rapide)
- CPS avec gains lisses (auto-click en ticks)
- Critiques avec chance et multiplicateur
- Multiplicateur global de production
- Gains offline lors de la reconnexion
- Affichage compact des grands nombres

## How to Use

1. Ouvre la vue Explorer.
2. Trouve le panneau Idle Clicker.
3. Clique sur le cercle ou tape dans un editeur pour augmenter le score.
4. Ouvre le Shop dans la barre laterale pour acheter des ameliorations.

## Gameplay

- PassiveUpgrade: simule des clicks et augmente le CPS.
- Critical Hit: augmente la chance de critique et le multiplicateur des gains critiques.
- GlobalMultiplierUpgrade: multiplie toute la production (CPS).
- OfflineUpgrade: donne un pourcentage de la production pendant l'absence.

## Development

- Compile: `npm run compile`
- Watch: `npm run watch`
- Test: `npm test`

## Notes

- Le score et les achats sont sauvegardes via le storage global de VS Code.
- Le Shop et le Debug sont des Webview views separees.

## TODO

- Fix amelioration clicking fail
- Fix update bar
- Add +1 or +production to the button
