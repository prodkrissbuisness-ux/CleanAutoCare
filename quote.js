(() => {
  const form = document.getElementById('quote-form');
  if (!form) return;

  // Starting prices from the menu (light condition), by vehicle. They show next to each vehicle on
  // step 2 and go in the request email as a baseline for the itemized quote. Keep them in line with
  // the homepage menu and the Job Pricer.
  const VEHICLES = ['Coupe or compact', 'Sedan', 'SUV', 'Truck - small cab', 'Truck - crew cab'];
  const PRICES = {
    'Exterior detail': [100, 125, 125, 150, 150],
    'Interior detail': [150, 175, 200, 175, 200],
    'Full detail': [225, 250, 275, 300, 300],
  };
  const NAMES = {
    'Exterior detail': 'The Exterior', 'Interior detail': 'The Interior', 'Full detail': 'The Full Detail',
    'The Reset (deep clean)': 'The Reset', 'Upkeep visit': 'Upkeep',
  };

  const steps = [...form.querySelectorAll('.b-step')];
  const progress = [...document.querySelectorAll('[data-progress]')];
  const err = form.querySelector('.b-error');
  const subject = form.querySelector('#quote-subject');
  const startingField = form.querySelector('#starting-price');
  const newCustomer = form.querySelector('#new-customer');
  const discountField = form.querySelector('#new-customer-discount');
  let i = 0;

  const selected = (name) => form.querySelector(`input[name="${name}"]:checked`)?.value || '';
  const serviceName = (value) => NAMES[value] || value.replace('Waitlist: ', '');
  const isWaitlist = (value) => value.startsWith('Waitlist: ');
  const vehicleLabel = (value) => value.replace(' - ', ', ');
  const priceFor = (service, size) => PRICES[service]?.[VEHICLES.indexOf(size)];

  function summary() {
    const service = selected('service');
    const size = selected('size');
    const price = priceFor(service, size);
    return [serviceName(service), size && vehicleLabel(size), isWaitlist(service) ? 'waitlist' : price && `from $${price}`]
      .filter(Boolean).join(' · ');
  }

  function refresh() {
    const service = selected('service');
    const size = selected('size');
    // Menu-style selected state (also handled by :has() in the CSS; this covers older browsers).
    form.querySelectorAll('.b-option').forEach((option) => option.classList.toggle('is-picked', option.querySelector('input').checked));
    // Each vehicle shows its price for the chosen service.
    form.querySelectorAll('input[name="size"]').forEach((input) => {
      const price = priceFor(service, input.value);
      input.closest('.b-option').querySelector('.b-item-price').textContent = price ? `$${price}` : (isWaitlist(service) ? '' : 'Quoted');
    });
    form.querySelector('#vehicle-service').textContent = serviceName(service);
    form.querySelector('#contact-summary').textContent = summary();
    const values = [serviceName(service), size ? vehicleLabel(size) : '', ''];
    progress.forEach((row, n) => {
      row.lastElementChild.textContent = values[n];
      row.classList.toggle('is-done', n < i);
      row.classList.toggle('is-current', n === i);
    });
  }

  // Funnel tracking for the Meta Pixel and Google Analytics. Each milestone fires once per visit.
  // No contact details are sent, only the service and vehicle.
  const tracked = new Set();
  function track(meta, ga) {
    if (tracked.has(meta)) return;
    tracked.add(meta);
    const params = { service: selected('service'), vehicle: selected('size') };
    if (window.fbq) window.fbq('trackCustom', meta, params);
    if (window.gtag) window.gtag('event', ga, params);
  }

  function show(n, scroll) {
    i = n;
    steps.forEach((step, index) => { step.hidden = index !== n; });
    err.textContent = '';
    refresh();
    if (n === steps.length - 1) track('QuoteContactStep', 'quote_contact_step');
    if (scroll) {
      // Bring the panel into view when the next step would start above or far below the screen.
      const top = form.getBoundingClientRect().top;
      const header = document.querySelector('.site-header');
      const limit = (header ? header.offsetHeight : 0) + 12;
      if (top < limit || top > window.innerHeight * 0.6) {
        form.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      }
    }
  }

  // A menu link on the homepage (?package=…) arrives with that service picked, on the vehicle step.
  const pkg = new URLSearchParams(location.search).get('package');
  const preset = pkg && form.querySelector(`input[name="service"][data-package="${CSS.escape(pkg)}"]`);
  if (preset) preset.checked = true;

  form.addEventListener('change', (event) => {
    const input = event.target;
    if (input.name === 'service' || input.name === 'size') {
      track('QuoteStarted', 'quote_start');
      window.setTimeout(() => show(input.name === 'service' ? 1 : 2, true), 180);
    } else {
      refresh();
    }
  });
  form.addEventListener('click', (event) => {
    if (event.target.closest('[data-back]')) show(Math.max(i - 1, 0), true);
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const invalid = [...steps[2].querySelectorAll('[required]')].find((field) => !field.checkValidity());
    if (invalid) {
      err.textContent = invalid.type === 'checkbox' ? 'Please check the box to agree to texts about your request.' : 'Please add your name and phone number.';
      invalid.focus();
      return;
    }
    const digits = form.elements.phone.value.replace(/\D/g, '');
    if (!(digits.length === 10 || (digits.length === 11 && digits[0] === '1'))) {
      err.textContent = 'Please enter a 10-digit phone number we can reach you at.';
      form.elements.phone.focus();
      return;
    }
    const service = selected('service');
    const size = selected('size');
    const price = priceFor(service, size);
    startingField.value = isWaitlist(service) ? 'Waitlist (spring 2027)' : price ? `$${price} (menu starting price, light condition)` : 'Custom quote';
    discountField.value = newCustomer.checked ? '-$20 first detail' : 'None';
    subject.value = `Clean Auto Care ${isWaitlist(service) ? 'waitlist' : 'request'}: ${serviceName(service)}, ${vehicleLabel(size)}`;

    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    err.textContent = 'Sending your request…';
    try {
      const endpoint = form.action.replace('https://formsubmit.co/', 'https://formsubmit.co/ajax/');
      const response = await fetch(endpoint, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) });
      if (!response.ok) throw new Error(`FormSubmit returned ${response.status}`);
      window.location.assign(form.querySelector('[name="_next"]').value);
    } catch (error) {
      submit.disabled = false;
      err.textContent = 'We could not send your request. Please try again, or call or text 608-448-7757.';
    }
  });

  show(preset ? 1 : 0, false);
})();
