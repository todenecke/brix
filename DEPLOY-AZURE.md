# Brix als Azure Static Web App deployen

## Vorbereitung (bereits erledigt)

- ✅ `staticwebapp.config.json` in `public/` – wird beim Build nach `dist/` kopiert
- ✅ Projekt liegt auf GitHub: https://github.com/todenecke/brix

---

## Schritte im Azure Portal

### 1. Azure Portal öffnen

Gehe zu [https://portal.azure.com](https://portal.azure.com) und melde dich an.

### 2. Static Web App erstellen

1. Oben in der Suche **„Static Web Apps“** eingeben → **Static Web Apps** auswählen
2. **„+ Erstellen“** klicken
3. **„Neues Static Web App mit GitHub erstellen“** oder **„Erstellen“** wählen

### 3. Konfiguration (Tab „Grundlagen“)

| Einstellung | Wert |
|-------------|------|
| **Abonnement** | Dein Azure-Abonnement |
| **Ressourcengruppe** | Neu: z.B. `brix-rg` |
| **Name** | z.B. `brix` (wird Teil der URL) |
| **Plantyp** | **Free** |
| **Quelle** | **GitHub** |
| **Mit GitHub autorisieren** | Klicken und GitHub-Verbindung bestätigen |

### 4. Repository verbinden

| Einstellung | Wert |
|-------------|------|
| **Organisation** | `todenecke` (oder dein GitHub-Username) |
| **Repository** | `brix` |
| **Branch** | `main` |

### 5. Build-Details (wichtig für Vite)

| Einstellung | Wert |
|-------------|------|
| **Build-Voreinstellungen** | **Custom** (oder „Andere“) wählen – nicht React! |
| **App-Speicherort** | `/` (Repository-Root) |
| **API-Speicherort** | *(leer lassen)* |
| **Ausgabespeicherort** | `dist` |

> **Hinweis:** Vite erzeugt die Dateien in `dist`. Der Standardwert „build“ passt zu Create React App, nicht zu Vite.

### 6. Erstellen

- **„Überprüfen + erstellen“** → **„Erstellen“**
- Azure legt die App an und erstellt automatisch einen GitHub Actions Workflow

### 7. Erste Bereitstellung abwarten

- Im Azure Portal unter **Übersicht** siehst du den Link zu deiner App
- Der erste Build dauert ca. 2–5 Minuten
- GitHub Actions: **Repository** → **Actions** – dort den Workflow-Status prüfen
- Wenn der Build erfolgreich ist, ist die App unter der angezeigten URL erreichbar

---

## Nach dem Erstellen: Workflow prüfen

Falls der Build fehlschlägt, prüfe die Datei `.github/workflows/azure-static-web-apps-*.yml`:

- `app_location: '/'`
- `output_location: 'dist'`

Diese Werte legt Azure beim Erstellen fest. Wenn beim Erstellen **Custom** gewählt wurde, sollten sie bereits stimmen.

---

## Nützliche Links

- [Microsoft Docs: React auf Azure Static Web Apps](https://learn.microsoft.com/de-de/azure/static-web-apps/deploy-react)
- [Build-Konfiguration](https://learn.microsoft.com/de-de/azure/static-web-apps/build-configuration)
