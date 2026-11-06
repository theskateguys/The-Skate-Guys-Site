# TSG Website Leads setup

This folder contains the Google Apps Script receiver used by the website forms.

## Connect the system

1. Open the **TSG Website Leads** Google Sheet.
2. Choose **Extensions > Apps Script**.
3. Replace the editor contents with `Code.gs` from this folder and save.
4. In **Project Settings > Script properties**, add `TSG_LEADS_SPREADSHEET_ID` with the ID from the Google Sheet URL.
5. Run `setupTSGLeadSystem` once and approve the requested spreadsheet, email and trigger permissions.
6. Choose **Deploy > New deployment > Web app**.
7. Set **Execute as** to yourself and **Who has access** to anyone, then deploy.
8. Copy the `/exec` URL into `assets/lead-config.js` as the `endpoint` value.

## What it does

- Saves every form submission in `Leads`.
- Copies class requests into `Bookings`.
- Adds consented email addresses to `Email Subscribers` with interest and island tags.
- Creates booking reminder rows in `Follow Up Status`.
- Sends an immediate email acknowledgement.
- Runs one daily reminder check for unconfirmed booking leads.
- Records when the pre-filled WhatsApp booking handoff is opened.

The `Email Subscribers` tab is ready for CSV export to Brevo, MailerLite or Mailchimp. Weekly broadcast content should be sent from the chosen email platform so unsubscribe handling and delivery reporting remain reliable.
