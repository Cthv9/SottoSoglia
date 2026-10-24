# Informativa sulla privacy

SottoSoglia è pensata per non raccogliere dati personali.

## Cosa viene salvato, e dove

Tutto resta nel browser del dispositivo, non viene inviato a nessun server.

| Dato | Dove | Scopo |
|---|---|---|
| Spese (importo, tag, data, ricorrenza, esclusione, metodo di pagamento) | IndexedDB del browser | Mostrare e calcolare il totale |
| Soglia mensile, mese delle ricorrenze, tema, stato dell'avviso di installazione | localStorage del browser | Preferenze dell'app |
| File dell'app (HTML, CSS, JavaScript, icone) | Cache del browser | Funzionamento offline |

## Cosa non viene fatto

- Nessun account e nessun login.
- Nessun invio di dati a server esterni.
- Nessun cookie di tracciamento, nessuna analisi di utilizzo, nessuna pubblicità.
- Nessun SDK di terze parti.
- Nessun permesso del dispositivo richiesto (posizione, fotocamera, contatti, notifiche).

L'importazione CSV avviene solo se l'utente sceglie un file. L'esportazione crea un file sul dispositivo, che l'utente può condividere o eliminare.

## Diritti sui dati

- **Accesso:** tutte le spese sono visibili nell'app.
- **Modifica ed eliminazione:** ogni spesa si modifica o si elimina dal proprio menu.
- **Portabilità:** l'esportazione CSV del mese corrente.
- **Cancellazione completa:** i dati si cancellano dalle impostazioni del browser, alla voce dati del sito di SottoSoglia. Disinstallare l'app dalla Home non basta sempre a rimuoverli.

## Titolare e contatti

Titolare del trattamento: DF, sviluppatore indipendente. Per domande sulla privacy usa le Issue del repository: https://github.com/cthv9/sottosoglia/issues. Non inserire dati personali nelle Issue.

Poiché SottoSoglia non trasmette dati al titolare, il titolare non ha accesso ai dati degli utenti.

## Modifiche

Questa informativa viene aggiornata quando cambia il trattamento dei dati. La data dell'ultima modifica è quella del commit in `main`.
