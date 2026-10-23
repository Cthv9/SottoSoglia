# Come contribuire

Il progetto è pubblicato per trasparenza, ma tutti i diritti sono riservati (vedi [LICENSE](LICENSE)). Le segnalazioni di bug e le proposte sono benvenute tramite Issue. Le modifiche al codice vanno concordate prima.

## Flusso di lavoro

1. Apri una Issue per il bug o la funzione.
2. Lavora sul branch di sviluppo `ccr-7690d7fe-l4wzjz`, mai direttamente su `main`.
3. Ogni push pubblica l'anteprima su `/preview/` con banner in alto. Testala lì prima di chiedere un merge.
4. Apri una PR verso `main`, compila il template, attendi che la CI sia verde.
5. Dopo il merge, la versione in uso si aggiorna da sola tramite GitHub Pages.

## Messaggi di commit

Formato breve, in italiano o in inglese, con un prefisso di tipo:

- `fix:` correzione di un bug
- `feat:` nuova funzione
- `refactor:` modifica interna senza cambi visibili
- `docs:` documentazione
- `ci:` workflow e configurazione

## Versioni

Le versioni seguono il [Semantic Versioning](https://semver.org/lang/it/). Per una release: aggiungi la sezione in `CHANGELOG.md`, poi crea il tag `v<versione>`. La Action di release crea la Release con le note.
