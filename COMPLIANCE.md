# Conformità: Cyber Resilience Act e AI Act

Questo documento descrive come SottoSoglia si colloca rispetto al Cyber Resilience Act (CRA, Regolamento UE 2024/2847) e all'AI Act (Regolamento UE 2024/1689). Non è una consulenza legale: l'ambito di applicazione va confermato con un professionista, in particolare per la versione distribuita tramite store.

## Descrizione del prodotto

- **Nome:** SottoSoglia (PWA, distribuita come sito con GitHub Pages).
- **Funzione:** gestione locale delle spese mensili.
- **Architettura:** HTML, CSS e JavaScript senza build e senza dipendenze runtime. Nessun server, nessuna connessione di rete per i dati.
- **Componenti di terze parti:** nessuno a runtime. Le uniche dipendenze sono quelle di sviluppo e CI (GitHub Actions, esbuild, html-validate), fissate nei workflow.

## CRA

### Ambito

La PWA è un prodotto con elementi digitali. Il CRA si applica a chi lo immette sul mercato dell'UE nell'ambito di un'attività commerciale. Se la versione per lo store (con acquisto in-app) è distribuita a fini commerciali, il perimetro si estende anche a questa PWA. La verifica resta da fare.

### Date rilevanti

- **11 settembre 2026:** obblighi di segnalazione di vulnerabilità e incidenti attivamente sfruttati (art. 14), con notifica al CSIRT designato.
- **11 dicembre 2027:** requisiti essenziali di cibersicurezza per la progettazione e la fabbricazione (allegato I), obblighi di supporto e aggiornamento.

### Stato dei requisiti

| Requisito | Stato |
|---|---|
| Nessuna vulnerabilità nota alla distribuzione | Verifica continua: CodeQL su ogni push, Dependabot sulle Action, scansione dei segreti |
| Accesso ai dati protetto, nessuna trasmissione non necessaria | Nessun invio di dati; CSP che limita le connessioni a `self` |
| Dati personali minimizzati | Solo le spese, salvate localmente; vedi [PRIVACY.md](PRIVACY.md) |
| Riduzione della superficie di attacco | Nessun backend, nessuna dipendenza runtime, nessun permesso del dispositivo |
| Aggiornamenti di sicurezza distribuiti | Deploy da `main` a ogni push; Release con tag per la tracciabilità |
| Gestione delle vulnerabilità | Segnalazione privata e processo in [SECURITY.md](SECURITY.md) |
| Distinta dei componenti (SBOM) | Vuota a runtime. Le Action sono fissate per versione in `.github/workflows` |
| Periodo di supporto dichiarato | Supporto dell'ultima versione pubblicata da `main`. Il periodo va definito e pubblicato |
| Informazioni per l'utente | README e Info nell'app; contatto di sicurezza in SECURITY.md |

### Da fare prima della scadenza

- Definire e pubblicare il periodo di supporto.
- Preparare la procedura di notifica al CSIRT per le vulnerabilità sfruttate attivamente, con le scadenze dell'art. 14.
- Verificare con un consulente se la PWA rientra nel perimetro commerciale.

## AI Act

SottoSoglia non contiene sistemi di intelligenza artificiale né modelli di IA. Non usa tecniche di apprendimento automatico, non prende decisioni automatizzate e non rientra nelle categorie a rischio dell'AI Act.

Questo documento va riesaminato se si aggiunge una funzione di IA, anche solo un suggerimento automatico sulle categorie di spesa.

## GDPR

Non viene trasmesso nessun dato personale. Vedi [PRIVACY.md](PRIVACY.md).

## Revisione

Questo documento viene aggiornato a ogni release che cambia il comportamento, la distribuzione o il supporto del prodotto.
