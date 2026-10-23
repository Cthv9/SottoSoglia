# Changelog

Il formato segue [Keep a Changelog](https://keepachangelog.com/it/1.1.0/). Le versioni seguono il [Semantic Versioning](https://semver.org/lang/it/).

## [Unreleased]

## [1.1.0] - 2026-10-23

### Changed
- Pubblicazione tramite GitHub Actions. L'anteprima dello sviluppo è disponibile su `/preview/`, separata dalla versione in uso.
- Service worker: il nome della cache è generato a ogni build, così ogni aggiornamento viene scaricato. Le pagine e il codice si caricano dalla rete prima della cache.
- Accessibilità: lo zoom è di nuovo consentito e gli input hanno un'etichetta.
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
