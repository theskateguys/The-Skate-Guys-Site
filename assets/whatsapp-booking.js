(() => {
  'use strict';

  const form = document.getElementById('bookingForm');
  if (!form) return;

  const count = form.elements.namedItem('participantCount');
  const participantList = form.querySelector('[data-participants]');
  const template = document.getElementById('participantTemplate');
  const status = form.querySelector('[data-form-status]');
  const prepared = form.querySelector('[data-booking-success]');
  const preview = form.querySelector('[data-message-preview]');
  const whatsappLink = form.querySelector('[data-whatsapp-link]');
  const submit = form.querySelector('[type="submit"]');
  const participants = [];
  let preparedValues = '';

  const value = name => form.elements.namedItem(name).value.trim();
  const field = (participant, name) => participant.querySelector(`[data-field="${name}"]`);
  const participantValue = (participant, name) => field(participant, name).value.trim();

  const setStatus = (message, state = '') => {
    status.textContent = message;
    status.dataset.state = state;
  };

  const invalidate = (message = '') => {
    const wasPrepared = Boolean(preparedValues);
    preparedValues = '';
    whatsappLink.removeAttribute('href');
    prepared.hidden = true;
    preview.textContent = '';
    submit.textContent = 'Prepare WhatsApp Request';
    setStatus(message || (wasPrepared ? 'Details changed. Prepare your request again before opening WhatsApp.' : ''));
  };

  const toggleFields = (container, active) => {
    container.hidden = !active;
    container.querySelectorAll('input, select').forEach(control => {
      control.disabled = !active;
      control.required = active;
      control.setCustomValidity('');
    });
  };

  const syncParticipant = participant => {
    const age = field(participant, 'age');
    toggleFields(participant.querySelector('[data-guardian]'), age.value !== '' && age.validity.valid && age.valueAsNumber < 18);
    toggleFields(participant.querySelector('[data-rental-size]'), participantValue(participant, 'rentals') === 'Yes');
  };

  const syncParticipants = () => {
    const total = count.valueAsNumber;
    if (!Number.isInteger(total) || total < 1 || total > 20) return;

    // Detached fieldsets stay in memory so changing the count back restores edits.
    while (participants.length < total) {
      const participant = template.content.firstElementChild.cloneNode(true);
      const number = participants.length + 1;
      participant.querySelector('[data-participant-number]').textContent = number;
      participant.querySelectorAll('[data-field]').forEach(control => {
        control.name = `participant${number}_${control.dataset.field}`;
        control.id = control.name;
        control.autocomplete = 'off';
      });
      participants.push(participant);
    }

    participants.forEach((participant, index) => {
      if (index < total) {
        if (participant.parentElement !== participantList) participantList.append(participant);
        syncParticipant(participant);
      } else {
        participant.remove();
      }
    });
  };

  const setDateMinimum = () => {
    const parts = new Intl.DateTimeFormat('en', {
      timeZone: 'America/Port_of_Spain', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date());
    const part = type => parts.find(item => item.type === type).value;
    form.elements.namedItem('preferredDate').min = `${part('year')}-${part('month')}-${part('day')}`;
  };

  const validateDetails = () => {
    form.querySelectorAll('input, select').forEach(control => {
      control.setCustomValidity('');
      if (control.disabled) return;
      if (control.required && !control.value.trim()) {
        control.setCustomValidity('Please complete this field.');
      } else if (control.type === 'tel') {
        const phone = control.value.trim();
        const digits = phone.replace(/\D/g, '');
        if (!/^\+?[\d\s().-]+$/.test(phone) || digits.length < 7 || digits.length > 15) {
          control.setCustomValidity('Enter a valid contact number with 7 to 15 digits, including the country code if needed.');
        }
      }
    });
  };

  const currentValues = () => JSON.stringify(Array.from(form.querySelectorAll('input, select'))
    .filter(control => !control.disabled)
    .map(control => [control.name, control.value]));

  const makeMessage = () => {
    const total = count.valueAsNumber;
    const lines = [
      'TSG Booking Request',
      '',
      `Contact name: ${value('name')}`,
      `WhatsApp number: ${value('phone')}`,
      `Island: ${value('location')}`,
      `Preferred area: ${value('preferredArea')}`,
      `Preferred date: ${value('preferredDate')}`,
      `Preferred time (Trinidad & Tobago): ${value('preferredTime')}`,
      `Participants: ${total}`,
      'Single session: TT$80 per person / 75 minutes / skate rental included',
      `Session total: TT$${total * 80}`
    ];

    participants.slice(0, total).forEach((participant, index) => {
      const get = name => participantValue(participant, name);
      lines.push('', `Participant ${index + 1}`, `Age: ${get('age')}`, `Experience: ${get('experience')}`, `Rental skates needed: ${get('rentals')}`);
      if (get('rentals') === 'Yes') lines.push(`Skate size: ${get('skateSize')} (${get('sizeSystem')})`);
      if (Number(get('age')) < 18) lines.push(`Guardian name: ${get('guardianName')}`, `Guardian WhatsApp: ${get('guardianPhone')}`);
    });

    lines.push('',
      'Please check coach, location and skate availability for this appointment request.',
      'I understand this request is not a confirmed booking. Deposit preferred; payment on arrival by arrangement. Please discuss payment with me after checking availability.'
    );
    return lines.join('\n');
  };

  const handleEdit = event => {
    if (!event.target.matches('input, select')) return;
    event.target.setCustomValidity('');
    invalidate();
    if (event.target === count) syncParticipants();
    const participant = event.target.closest('.participant');
    if (participant) syncParticipant(participant);
  };

  form.addEventListener('input', handleEdit);
  form.addEventListener('change', handleEdit);
  form.addEventListener('invalid', () => {
    invalidate('Please check the highlighted fields, then prepare your request again.');
    status.dataset.state = 'error';
  }, true);

  form.addEventListener('submit', event => {
    event.preventDefault();
    invalidate();
    syncParticipants();
    setDateMinimum();
    validateDetails();
    if (!form.reportValidity()) return;

    const message = makeMessage();
    preview.textContent = message;
    whatsappLink.href = `https://wa.me/18682766878?text=${encodeURIComponent(message)}`;
    preparedValues = currentValues();
    prepared.hidden = false;
    submit.textContent = 'Update WhatsApp Request';
    setStatus('Message prepared on this page only. Nothing has been sent.', 'ready');
    prepared.focus();
  });

  whatsappLink.addEventListener('click', event => {
    setDateMinimum();
    if (!preparedValues || preparedValues !== currentValues() || !form.checkValidity()) {
      event.preventDefault();
      invalidate('Please prepare your current details again before opening WhatsApp.');
      submit.focus();
    }
  });

  form.querySelector('[data-edit-request]').addEventListener('click', () => {
    invalidate('Your details are still here. After editing, prepare your request again.');
    form.elements.namedItem('name').focus();
  });

  syncParticipants();
  setDateMinimum();
  form.hidden = false;
})();
