# SottoSoglia

Calcolatrice per le spese mensili: inserisci le spese con un tag, imposta una soglia e vedi quanto resta. Funziona offline e i dati restano sul tuo dispositivo.

**App in uso:** https://cthv9.github.io/SottoSoglia/
**Anteprima dello sviluppo:** https://cthv9.github.io/SottoSoglia/preview/ (con banner in alto)

## Funzioni

- Spese con importo, tag e metodo di pagamento (carta, conto, PayPal, Revolut).
- Spese ricorrenti con data di fine, riportate dal mese precedente.
- Esclusione di una spesa dal totale, selezione multipla con somma.
- Filtri per tag, metodo di pagamento, ricorrenza ed esclusione.
- Navigazione tra i mesi con le frecce, e riepilogo di tutti i mesi toccando il mese in alto.
- Esportazione e importazione CSV del mese visualizzato.
- Tema automatico, chiaro o scuro.
- Installabile come app dalla schermata Home, funziona offline.

## Installazione

- **iPhone o iPad:** apri il link in Safari, tocca Condividi, poi *Aggiungi a schermata Home*.
- **Android:** apri il link in Chrome, poi *Installa app* dal menu.

## Privacy

Nessun account, nessun tracciamento, nessun dato inviato a server. Le spese sono salvate nel browser del dispositivo. Dettagli in [PRIVACY.md](PRIVACY.md).

## Sviluppo

Il progetto non ha build né dipendenze. Per provarlo in locale:

```bash
python3 -m http.server 8000
```

poi apri `http://localhost:8000`.

### Flusso di lavoro

- `main` è la versione in uso. Non si committa direttamente.
- Lo sviluppo avviene sul branch `ccr-7690d7fe-l4wzjz`. Ogni push pubblica l'anteprima su `/preview/`.
- Un push su `main` pubblica la versione in uso.

Dettagli in [CONTRIBUTING.md](CONTRIBUTING.md). Conformità CRA e AI Act in [COMPLIANCE.md](COMPLIANCE.md). Segnalazione di vulnerabilità in [SECURITY.md](SECURITY.md).

## Licenza

Tutti i diritti riservati. Vedi [LICENSE](LICENSE).
