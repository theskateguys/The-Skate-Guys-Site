# Google Sheets Lead Capture Setup

This setup captures booking form submissions before the visitor is sent to WhatsApp. The site does not collect personal details invisibly; it only sends the details a visitor submits through a form.

## Current Website Flow

1. Visitor opens `book.html`.
2. Visitor submits the booking form.
3. The website sends the lead payload to the Google Apps Script Web App endpoint.
4. The page shows a thank-you state.
5. WhatsApp opens with a pre-filled booking message.
6. If the Google Sheet save is unavailable, the WhatsApp handoff still opens so the booking request is not blocked.

## Google Sheet

Create a Google Sheet named:

```text
TSG Website Leads
```

Use these tabs:

```text
Leads
Bookings
Email Subscribers
Follow Up Status
```

The Apps Script in `automation/google-apps-script/Code.gs` creates and maintains the headers for these tabs.

## Main Leads Columns

```text
Timestamp
Lead ID
Name
WhatsApp
Email
Location
Adult/Child
Package
Rentals Needed
Preferred Time
Source Page
UTM Source
UTM Campaign
Marketing Consent
WhatsApp Opened
Status
Notes
Tags
Lead Type
UTM Medium
Referrer
```

Expected statuses:

```text
New Lead
WhatsApp Opened
Replied
Confirmed
Paid
No Response
Follow Up Needed
```

## Deploy The Apps Script Web App

1. Open the `TSG Website Leads` Google Sheet.
2. Go to `Extensions > Apps Script`.
3. Replace the editor contents with `automation/google-apps-script/Code.gs`.
4. Save the script.
5. In Apps Script, open `Project Settings > Script properties`.
6. Add a property named `TSG_LEADS_SPREADSHEET_ID`.
7. Paste the Sheet ID from the Google Sheet URL as the property value.
8. Run `setupTSGLeadSystem` once and approve the requested permissions.
9. Go to `Deploy > New deployment`.
10. Choose `Web app`.
11. Set `Execute as` to yourself.
12. Set access to `Anyone`.
13. Deploy and copy the Web App `/exec` URL.

## Connect The Website

Open `assets/lead-config.js` and replace:

```js
endpoint: 'PASTE_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE',
```

with the deployed `/exec` URL:

```js
endpoint: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',
```

Keep the placeholder in source control until the real deployment URL is ready to commit.

## Submitted Booking Fields

The booking form sends:

```text
Name
WhatsApp number
Email
Adult or child
Trinidad or Tobago
Package selected
Rental skates needed
Preferred day/time
Marketing consent
Source page
UTM source
UTM campaign
Timestamp
```

The form also sends a Lead ID, tags, UTM medium, referrer, WhatsApp opened status, and default status for organizing follow-up.

## Privacy Wording

Use this positioning on the site and in internal notes:

```text
We track anonymous website visits and collect customer details only when someone submits a booking or email form.
```

Do not describe the system as tracking all customers personally. The booking form consent checkbox is optional and is only for follow-up marketing updates.

## Fallback Behavior

If the Apps Script endpoint is not connected, times out, or fails, the page still opens WhatsApp with the pre-filled booking request. That keeps the customer journey moving while protecting the lead-capture system from blocking bookings.
