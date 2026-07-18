(() => {
  'use strict';

  const config = window.TSG_LEAD_CONFIG || {};
  const rawEndpoint = String(config.endpoint || '').trim();
  const endpoint = /^https?:\/\//i.test(rawEndpoint) && !/PASTE_GOOGLE_APPS_SCRIPT/i.test(rawEndpoint) ? rawEndpoint : '';
  const whatsappNumber = String(config.whatsappNumber || '18682766878');
  const requestTimeoutMs = Number(config.requestTimeoutMs || 9000);
  const whatsappAutoOpenDelayMs = Number(config.whatsappAutoOpenDelayMs || 1100);
  const queueKey = 'tsgLeadRetryQueueV1';

  const getQueue = () => {
    try { return JSON.parse(localStorage.getItem(queueKey) || '[]'); }
    catch { return []; }
  };

  const setQueue = leads => {
    try { localStorage.setItem(queueKey, JSON.stringify(leads.slice(-50))); }
    catch { /* Storage can be disabled; the form still keeps its WhatsApp handoff. */ }
  };

  const createLeadId = () => {
    const time = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).slice(2, 7).toUpperCase();
    return `TSG-${time}-${random}`;
  };

  const sourcePage = () => {
    const page = location.pathname.split('/').pop() || 'index.html';
    return `${page}${location.hash || ''}`;
  };

  const attribution = () => {
    const params = new URLSearchParams(location.search);
    return {
      sourcePage: sourcePage(),
      utmSource: params.get('utm_source') || '',
      utmCampaign: params.get('utm_campaign') || '',
      utmMedium: params.get('utm_medium') || '',
      referrer: document.referrer || ''
    };
  };

  const postPayload = async payload => {
    if (!endpoint) throw new Error('Lead endpoint is not connected yet.');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
    try {
      await fetch(endpoint, {
        method: 'POST',
        mode: 'no-cors',
        headers: {'Content-Type': 'text/plain;charset=utf-8'},
        body: JSON.stringify(payload),
        signal: controller.signal,
        keepalive: true
      });
    } finally {
      clearTimeout(timeout);
    }
  };

  const queuePayload = payload => {
    const queue = getQueue();
    const withoutDuplicate = queue.filter(item => item.leadId !== payload.leadId);
    withoutDuplicate.push(payload);
    setQueue(withoutDuplicate);
  };

  const submitPayload = async payload => {
    if (!endpoint) return {state: 'not_configured'};
    try {
      await postPayload(payload);
      return {state: 'success'};
    } catch (error) {
      queuePayload(payload);
      return {state: 'queued', error};
    }
  };

  const syncQueue = async () => {
    if (!endpoint || !navigator.onLine) return;
    const queue = getQueue();
    if (!queue.length) return;

    const remaining = [];
    for (const payload of queue) {
      try { await postPayload(payload); }
      catch { remaining.push(payload); }
    }
    setQueue(remaining);
  };

  const recordWhatsAppOpened = leadId => {
    if (!endpoint) return;
    const payload = JSON.stringify({action: 'whatsapp_opened', leadId});
    try {
      const blob = new Blob([payload], {type: 'text/plain;charset=utf-8'});
      if (navigator.sendBeacon?.(endpoint, blob)) return;
    } catch { /* Fall through to fetch. */ }
    fetch(endpoint, {method: 'POST', mode: 'no-cors', headers: {'Content-Type': 'text/plain;charset=utf-8'}, body: payload, keepalive: true}).catch(() => {});
  };

  const makeWhatsAppUrl = payload => {
    const lines = [
      'TSG Booking Request',
      `Lead ID: ${payload.leadId}`,
      '',
      `Name: ${payload.name}`,
      `WhatsApp number: ${payload.whatsapp}`,
      `Email: ${payload.email}`,
      `Adult or child: ${payload.skaterType}`,
      `Location: ${payload.location}`,
      `Package: ${payload.package}`,
      `Rental skates needed: ${payload.rentalsNeeded}`,
      `Preferred day/time: ${payload.preferredTime}`,
      '',
      'Please confirm availability.'
    ];
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(lines.join('\n'))}`;
  };

  const hydrateTrackingFields = form => {
    const values = attribution();
    Object.entries(values).forEach(([name, value]) => {
      let field = form.elements.namedItem(name);
      if (!field) {
        field = document.createElement('input');
        field.type = 'hidden';
        field.name = name;
        form.append(field);
      }
      field.value = value;
    });
  };

  const payloadFromForm = form => {
    hydrateTrackingFields(form);
    const data = new FormData(form);
    const selectedPackage = document.querySelector('input[name="packageChoice"]:checked');
    const locationValue = String(data.get('location') || '');
    const baseTags = String(form.dataset.tags || '').split(',').map(tag => tag.trim()).filter(Boolean);
    if (locationValue) baseTags.push(locationValue.toLowerCase());

    return {
      action: 'lead_submit',
      timestamp: new Date().toISOString(),
      leadId: createLeadId(),
      leadType: form.dataset.leadType || 'email',
      name: String(data.get('name') || '').trim(),
      whatsapp: String(data.get('phone') || '').trim(),
      email: String(data.get('email') || '').trim().toLowerCase(),
      location: locationValue,
      skaterType: String(data.get('skaterType') || ''),
      package: String(selectedPackage?.value || data.get('package') || ''),
      rentalsNeeded: String(data.get('rentals') || ''),
      preferredTime: String(data.get('preferredTime') || '').trim(),
      sourcePage: String(data.get('sourcePage') || sourcePage()),
      utmSource: String(data.get('utmSource') || ''),
      utmCampaign: String(data.get('utmCampaign') || ''),
      utmMedium: String(data.get('utmMedium') || ''),
      referrer: String(data.get('referrer') || ''),
      marketingConsent: data.get('marketingConsent') === 'on' ? 'Yes' : 'No',
      whatsappOpened: 'No',
      status: 'New Lead',
      notes: '',
      tags: [...new Set(baseTags)].join(',')
    };
  };

  const setStatus = (node, state, text) => {
    if (!node) return;
    node.dataset.state = state;
    node.textContent = text;
  };

  const openWhatsApp = (url, leadId) => {
    if (!url) return;
    recordWhatsAppOpened(leadId);
    const opened = window.open(url, '_blank');
    if (opened) opened.opener = null;
    else window.location.href = url;
  };

  const handleForm = form => {
    hydrateTrackingFields(form);
    const status = form.querySelector('[data-form-status]');
    const button = form.querySelector('[type="submit"]');
    const defaultLabel = button?.textContent || 'Submit';

    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (!form.reportValidity()) return;

      const payload = payloadFromForm(form);
      const isBooking = payload.leadType === 'booking';
      const whatsappUrl = isBooking ? makeWhatsAppUrl(payload) : '';

      form.classList.add('is-submitting');
      if (button) { button.disabled = true; button.textContent = isBooking ? 'Saving your request...' : 'Joining the list...'; }
      setStatus(status, '', 'Saving your details securely...');

      const result = await submitPayload(payload);
      form.classList.remove('is-submitting');
      form.classList.add('is-complete');

      if (result.state === 'success') {
        setStatus(status, 'success', isBooking ? 'Request saved. WhatsApp is opening so you can finish your booking.' : 'You are on the TSG update list.');
      } else if (result.state === 'not_configured') {
        setStatus(status, 'queued', isBooking ? 'Google Sheet capture is not connected yet. WhatsApp is opening so your request can still continue.' : 'The update form is not connected yet. Please try again soon.');
      } else {
        setStatus(status, 'queued', isBooking ? 'Sheet save could not be confirmed. WhatsApp is opening so your request can still continue.' : 'You are saved for sync and will be added when the connection returns.');
      }

      if (button) button.textContent = isBooking ? 'Request captured' : 'You are on the list';
      form.querySelectorAll('input,select,button').forEach(control => { control.disabled = true; });

      if (isBooking) {
        const success = form.querySelector('[data-booking-success]');
        const link = form.querySelector('[data-whatsapp-link]');
        if (link) {
          link.href = whatsappUrl;
          link.addEventListener('click', () => recordWhatsAppOpened(payload.leadId), {once: true});
        }
        if (success) success.hidden = false;
        window.setTimeout(() => openWhatsApp(whatsappUrl, payload.leadId), whatsappAutoOpenDelayMs);
      } else {
        form.reset();
      }
    });
  };

  document.querySelectorAll('[data-tsg-lead-form]').forEach(handleForm);
  window.addEventListener('online', syncQueue);
  syncQueue();
})();
