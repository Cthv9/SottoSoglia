# Changelog

Il formato segue [Keep a Changelog](https://keepachangelog.com/it/1.1.0/).

## [Unreleased]

### Added
- Navigazione tra i mesi con le frecce accanto al mese in alto. Il mese diverso da oggi ha il bordo evidenziato.
- Riporto delle ricorrenti su richiesta: "Riporta ricorrenti in questo mese" nel menu, e "Riporta le ricorrenti" nei mesi senza voci. Vale per qualsiasi mese visualizzato, anche passato o futuro.
- Riepilogo di tutti i mesi, aperto toccando il mese: totale conteggiato, numero di voci e confronto con la soglia. Il pulsante Oggi riporta al mese corrente.

### Changed
- Aggiunta, importazione, esportazione CSV e "Ripulisci elenco" valgono per il mese visualizzato. Il riporto automatico delle ricorrenti resta legato al mese di oggi.

### Fixed
- Le ricorrenti non si perdono più se non apri l'app per un mese: l'avviso all'apertura cerca il mese più recente che ne ha, invece del solo mese precedente.
- Il testo non si seleziona più fuori dai campi di testo e non compare il menu di sistema ("Cerca sul web"). Prima valeva solo per le righe della lista.

## [1.1.0] - 2026-10-23

### Changed
- Pubblicazione tramite GitHub Actions. L'anteprima dello sviluppo è disponibile su `/preview/`, separata dalla versione in uso.
- Service worker: rete prima, con la cache solo per l'uso offline, così ogni aggiornamento viene scaricato.
- L'anteprima salva i propri dati con un prefisso, separati da quelli in uso.
- Accessibilità: gli input hanno un'etichetta per i lettori di schermo.
- Sicurezza: aggiunta una Content-Security-Policy e una referrer policy.
- Manifest: aggiunti `id` e `lang`.
- Codice: import statici al posto di quelli dinamici, nessun cambio di comportamento.

### Removed
- Riferimenti a file inesistenti in `.gitignore`.

## [1.0.0] - 2026-04-07

Stato precedente, ricostruito dalla cronologia gennaio–aprile 2026. Il progetto non aveva una numerazione prima di questa versione.

### Added
- Metodo di pagamento (carta, conto, PayPal, Revolut), filtri per metodo e colonna `payment_method` nel CSV.
- Spese ricorrenti con data di fine e riporto dal mese precedente.
- Duplicazione delle voci, esclusione dal totale, selezione multipla con somma.
- Esportazione e importazione CSV del mese corrente.
- Tema automatico, chiaro o scuro.
- Installazione come app e funzionamento offline.

### Changed
- Ricerca con ritardo (debounce), gestione unica degli eventi della lista, import CSV in un'unica transazione.

### Fixed
- Zoom automatico su iOS quando si modifica un campo di testo.
