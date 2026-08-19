# PIDIEFFE

Powered by RAdebug.

# PIDIEFFE

Web app statica stile toolbox PDF, con design originale.

## Funzioni operative lato browser
- Unisci PDF
- Dividi PDF
- Comprimi PDF (rasterizzazione lossy)
- PDF -> JPG
- JPG/PNG/WebP -> PDF
- Ruota PDF
- Numeri di pagina
- Filigrana testuale
- Estrai pagine
- Riordina pagine

## Richiedono backend
- Protezione PDF con password
- Sblocco PDF protetto

## Avvio
Per i moduli JavaScript è consigliato usare un piccolo server locale:

```bash
python -m http.server 8000
```

Poi apri http://localhost:8000/pdf_toolbox_site/ se stai servendo la cartella /mnt/data, oppure http://localhost:8000 se avvii il server dentro la cartella del progetto.

Le librerie pdf-lib, PDF.js e jsPDF vengono caricate via CDN, quindi serve connessione internet al primo caricamento.

## Novità v3
- Miniature reali delle pagine PDF nello strumento Organizza PDF
- Drag & drop nativo per riordinare le pagine
- Numerazione della nuova posizione aggiornata in tempo reale
- Esportazione del PDF nel nuovo ordine scelto visualmente
