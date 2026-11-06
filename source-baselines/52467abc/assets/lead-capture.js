(() => {
  'use strict';
  const config = window.TSG_LEAD_CONFIG || {};
  const rawEndpoint = String(config.endpoint || '').trim();
  const endpoint = /^https:\/\//i.test(rawEndpoint) && !/PASTE_GOOGLE_APPS_SCRIPT/i.test(rawEndpoint) ? rawEndpoint : '';
  const whatsappNumber = String(config.whatsappNumber || '18682766878');
  const offer = 'Single session: TT$80 per person / 75 minutes / skate rental included';

  const attribution = () => {
    const params = new URLSearchParams(location.search);
    return {
      sourcePage: `${location.pathname.split('/').pop() || 'index.html'}${location.hash || ''}`,
      utmSource: params.get('utm_source') || '', utmCampaign: params.get('utm_campaign') || '',
      utmMedium: params.get('utm_medium') || '', referrer: document.referrer || ''
    };
  };

  const postPayload = async payload => {
    if (!endpoint) return 'not_configured';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Number(config.requestTimeoutMs || 25000));
    try {
      // A simple CORS POST can expose an acknowledgement when the backend permits it.
      // A CORS/redirect failure is uncertain: the POST may already have been stored.
      const response = await fetch(endpoint, {
        method: 'POST', mode: 'cors', headers: {'Content-Type': 'text/plain;charset=utf-8'},
        body: JSON.stringify(payload), signal: controller.signal
      });
      if (response.type === 'opaque' || !response.ok) return 'unverified';
      const acknowledgement = await response.json();
      if (acknowledgement.ok === true && acknowledgement.leadId === payload.leadId &&
          ['New Lead', 'duplicate_ignored'].includes(acknowledgement.status)) return 'saved';
      return 'unverified';
    } catch { return controller.signal.aborted ? 'timed_out' : 'failed'; }
    finally { clearTimeout(timeout); }
  };

  const recordWhatsAppOpened = leadId => {
    if (!endpoint) return;
    fetch(endpoint, {
      method: 'POST', mode: 'no-cors', headers: {'Content-Type': 'text/plain;charset=utf-8'},
      body: JSON.stringify({action: 'whatsapp_opened', leadId}), keepalive: true
    }).catch(() => {});
  };

  const initParticipants = form => {
    const container = form.querySelector('[data-participants]');
    if (!container) return;
    const count = form.elements.namedItem('participantCount');
    const template = document.getElementById('participantTemplate');
    // Keep removed rows in memory so changing the count back does not erase details.
    const rows = [];
    const render = () => {
      if (!count.validity.valid) return;
      const total = Number(count.value);
      while (rows.length < total) {
        const row = template.content.firstElementChild.cloneNode(true);
        const index = rows.length;
        row.querySelector('[data-participant-number]').textContent = index + 1;
        row.querySelectorAll('[data-field]').forEach(input => { input.name = `participant${index}_${input.dataset.field}`; });
        rows.push(row);
      }
      rows.forEach((row, index) => { if (index < total) container.append(row); else row.remove(); });
    };
    count.addEventListener('input', render);
    container.addEventListener('input', event => {
      const row = event.target.closest('.participant');
      const age = row.querySelector('[data-field="age"]');
      const rental = row.querySelector('[data-field="rentals"]').value === 'Yes';
      const child = age.value !== '' && Number(age.value) < 18;
      [['[data-rental-size]', rental], ['[data-guardian]', child]].forEach(([selector, enabled]) => {
        const group = row.querySelector(selector);
        group.hidden = !enabled;
        group.querySelectorAll('input,select').forEach(input => { input.disabled = !enabled; input.required = enabled; });
      });
    });
    const parts = new Intl.DateTimeFormat('en', {timeZone: 'America/Port_of_Spain', year: 'numeric', month: '2-digit', day: '2-digit'}).formatToParts(new Date());
    const datePart = name => parts.find(part => part.type === name).value;
    form.elements.namedItem('preferredDate').min = `${datePart('year')}-${datePart('month')}-${datePart('day')}`;
    render();
  };

  const payloadFromForm = form => {
    const data = new FormData(form);
    const get = name => String(data.get(name) || '').trim();
    const isBooking = form.dataset.leadType === 'booking';
    const participants = isBooking ? [...form.querySelectorAll('.participant')].map(row => {
      const field = name => row.querySelector(`[data-field="${name}"]`).value.trim();
      const rentals = field('rentals');
      const age = Number(field('age'));
      return {
        age, experience: field('experience'), rentals,
        skateSize: rentals === 'Yes' ? field('skateSize') : '', sizeSystem: rentals === 'Yes' ? field('sizeSystem') : '',
        guardianName: age < 18 ? field('guardianName') : '', guardianPhone: age < 18 ? field('guardianPhone') : ''
      };
    }) : [];
    return {
      action: 'lead_submit', leadType: isBooking ? 'booking' : 'email',
      name: get('name'), whatsapp: get('phone'), email: get('email').toLowerCase(),
      location: get('location'), package: isBooking ? offer : '',
      preferredArea: get('preferredArea'), preferredDate: get('preferredDate'), preferredTime: get('preferredTime'),
      participantCount: participants.length, participants,
      skaterType: [...new Set(participants.map(p => p.age < 18 ? 'Child' : 'Adult'))].join(', '),
      rentalsNeeded: participants.some(p => p.rentals === 'Yes') ? 'Yes' : 'No',
      marketingConsent: data.get('marketingConsent') === 'on' ? 'Yes' : 'No', ...attribution(),
      tags: [...new Set([...(form.dataset.tags || '').split(',').filter(Boolean), get('location').toLowerCase()])].filter(Boolean).join(',')
    };
  };

  const makeWhatsAppUrl = payload => {
    const lines = [
      'TSG Booking Request (not confirmed)', `Lead ID: ${payload.leadId}`,
      `Contact: ${payload.name}`, `WhatsApp: ${payload.whatsapp}`, `Email: ${payload.email || 'Not provided'}`,
      `Island: ${payload.location}`, `Preferred area: ${payload.preferredArea}`,
      `Preferred date/time: ${payload.preferredDate} ${payload.preferredTime} (Trinidad & Tobago time)`,
      payload.package, `Participants: ${payload.participantCount}`,
      ...payload.participants.map((p, index) => [
        `Participant ${index + 1}: age ${p.age}; ${p.experience}; rentals ${p.rentals}`,
        p.rentals === 'Yes' ? `Skate size: ${p.skateSize} (${p.sizeSystem})` : 'Bringing own skates',
        p.age < 18 ? `Guardian: ${p.guardianName}; WhatsApp: ${p.guardianPhone}` : ''
      ].filter(Boolean).join('\n')),
      `Marketing consent: ${payload.marketingConsent}`, `Source: ${payload.sourcePage}`,
      `UTM source: ${payload.utmSource || '-'}`, `UTM campaign: ${payload.utmCampaign || '-'}`,
      `Submitted: ${payload.timestamp}`, '',
      'Please check coach, location and skate availability before payment. Deposit preferred; payment on arrival by arrangement.',
      'At least 24 hours notice: the amount paid carries forward as credit.',
      'Less than 24 hours notice or no-show: no automatic credit; genuine emergencies reviewed individually.',
      'TSG/coach cancellation or unsafe weather/venue: full amount paid carries forward as credit, without penalty.',
      'Credit expires one calendar month from the original scheduled session date. If the matching date does not exist, use the last day of that month.',
      'If TSG cannot offer a replacement before expiry, credit is extended to give the client a reasonable opportunity to attend. TSG records the agreed new expiry.',
      'Transfers require TSG approval, subject to participant suitability and skate availability.',
      'Credit rather than refunds.'
    ];
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(lines.join('\n'))}`;
  };

  const handleForm = form => {
    initParticipants(form);
    const status = form.querySelector('[data-form-status]');
    const button = form.querySelector('[type="submit"]');
    const defaultLabel = button.textContent;
    const success = form.querySelector('[data-booking-success]');
    const link = form.querySelector('[data-whatsapp-link]');
    let lastSignature = '';
    let submittedPayload;
    let busy = false;
    let openedLeadId;
    if (link) link.addEventListener('click', () => {
      if (!submittedPayload) return;
      openedLeadId = submittedPayload.leadId;
      // Prefer tracking after delivery to reduce insert races; opening is best-effort telemetry.
      if (!busy) recordWhatsAppOpened(openedLeadId);
    });
    form.addEventListener('input', event => {
      event.target.setCustomValidity?.('');
      if (success) success.hidden = true;
      if (status) status.textContent = '';
    });
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (busy) return;
      form.querySelectorAll('input[required]').forEach(input => {
        input.setCustomValidity(input.value.trim() ? '' : 'Please complete this field.');
      });
      form.querySelectorAll('input[type="tel"]:not(:disabled)').forEach(input => {
        const digits = input.value.replace(/\D/g, '');
        input.setCustomValidity(digits.length >= 7 && digits.length <= 15 ? '' : 'Enter a WhatsApp number with 7 to 15 digits, including country code.');
      });
      if (!form.reportValidity()) return;
      const payload = payloadFromForm(form);
      if (payload.marketingConsent === 'Yes' && !payload.email) {
        status.dataset.state = 'error';
        status.textContent = 'Add your email to receive updates, or untick the optional marketing checkbox.';
        form.elements.namedItem('email').focus();
        return;
      }
      const signature = JSON.stringify(payload);
      busy = true;
      const controls = [...form.querySelectorAll('input,select')].filter(control => !control.disabled);
      controls.forEach(control => { control.disabled = true; });
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
      button.textContent = 'Preparing...';
      status.textContent = 'Preparing your details and attempting website delivery...';
      if (signature !== lastSignature) {
        submittedPayload = {...payload, leadId: `TSG-${crypto.randomUUID()}`, timestamp: new Date().toISOString()};
        // Store only a digest and receipt ID, never participant or contact details.
        // This also makes unchanged retries after a refresh idempotent in this tab.
        try {
          const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(signature)))].map(n => n.toString(16).padStart(2, '0')).join('');
          const key = `tsgSubmission:${payload.leadType}`;
          const previous = JSON.parse(sessionStorage.getItem(key) || 'null');
          if (previous?.digest === digest) {
            submittedPayload.leadId = previous.leadId;
            submittedPayload.timestamp = previous.timestamp;
          } else sessionStorage.setItem(key, JSON.stringify({digest, leadId: submittedPayload.leadId, timestamp: submittedPayload.timestamp}));
        } catch { /* An unchanged retry still keeps its ID in memory if storage is blocked. */ }
        lastSignature = signature;
      }
      const isBooking = submittedPayload.leadType === 'booking';
      if (isBooking) {
        link.href = makeWhatsAppUrl(submittedPayload);
        success.hidden = false;
      }
      status.dataset.state = 'queued';
      status.textContent = 'Website delivery is pending; storage has not been verified.' +
        (isBooking ? ' Your WhatsApp message is ready now. Open WhatsApp and press Send; you do not need to wait here.' : ' You can keep this page open for the delivery result.');
      button.textContent = 'Attempting Website Delivery...';
      // The prepared link is usable before any network work completes.
      const result = await postPayload(submittedPayload);
      if (openedLeadId === submittedPayload.leadId) recordWhatsAppOpened(openedLeadId);
      controls.forEach(control => { control.disabled = false; });
      busy = false;
      button.disabled = false;
      button.removeAttribute('aria-busy');
      status.dataset.state = result === 'saved' ? 'success' : ['failed', 'timed_out'].includes(result) ? 'error' : 'queued';
      status.textContent = result === 'saved' ? 'Your details were saved: the website received a matching storage acknowledgement.' + (isBooking ? ' This is not a confirmed class.' : '')
        : result === 'unverified'
        ? 'Website delivery attempted; storage could not be verified. Your details are still here; you can retry with the same request ID.'
        : ['failed', 'timed_out'].includes(result) ? 'Website delivery could not be verified.' +
          (result === 'timed_out' ? ' The browser timed out; storage may still complete.' : ' The response was unreadable or the connection was interrupted.') +
          ' Your details are still here; you can retry with the same request ID.'
          : 'Website delivery is unavailable. Your details are still here.';
      if (isBooking) {
        status.textContent += ' You must open WhatsApp and press Send on the prepared message to continue with TSG.';
      } else {
        status.textContent += ' Check for a confirmation email, or retry with the same details.';
      }
      button.textContent = `Retry ${isBooking ? 'Website Delivery' : defaultLabel}`;
    });
  };
  document.querySelectorAll('[data-tsg-lead-form]').forEach(handleForm);
})();
