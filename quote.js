(() => {
  const form = document.getElementById('quote-form');
  if (!form) return;

  // Edit these amounts whenever your basic-detail pricing changes.
  const PRICES = {
    'Coupe or compact': { 'Interior detail': 100, 'Exterior detail': 75, 'Full detail': 150 },
    Sedan: { 'Interior detail': 125, 'Exterior detail': 100, 'Full detail': 175 },
    SUV: { 'Interior detail': 150, 'Exterior detail': 100, 'Full detail': 200 },
    'Truck - small cab': { 'Interior detail': 125, 'Exterior detail': 120, 'Full detail': 230 },
    'Truck - crew cab': { 'Interior detail': 150, 'Exterior detail': 120, 'Full detail': 230 },
  };
  const CONDITION_ADJUSTMENTS = {
    Light: { 'Coupe or compact': 0, Sedan: 0, SUV: 0, 'Truck - small cab': 0, 'Truck - crew cab': 0 },
    Moderate: { 'Coupe or compact': 25, Sedan: 25, SUV: 50, 'Truck - small cab': 50, 'Truck - crew cab': 50 },
    Heavy: { 'Coupe or compact': 50, Sedan: 75, SUV: 100, 'Truck - small cab': 75, 'Truck - crew cab': 100 },
    'Very dirty / pet hair / stains': { 'Coupe or compact': 75, Sedan: 100, SUV: 150, 'Truck - small cab': 125, 'Truck - crew cab': 150 },
  };
  // Ranged add-ons scale with vehicle size. Add-ons not listed here are quoted after review.
  const ADDON_PRICES = {
    'Pet hair removal': { 'Coupe or compact': 30, Sedan: 30, SUV: 60, 'Truck - small cab': 60, 'Truck - crew cab': 60 },
    'Heavy stain treatment': { 'Coupe or compact': 60, Sedan: 60, SUV: 100, 'Truck - small cab': 100, 'Truck - crew cab': 100 },
    'Headlight restoration': 50,
    'Ceramic paint protection (6 weeks)': { 'Coupe or compact': 150, Sedan: 150, SUV: 300, 'Truck - small cab': 300, 'Truck - crew cab': 300 },
  };

  form.classList.add('is-wizard');
  const steps = [...form.querySelectorAll('.q-step')];
  const bar = form.querySelector('.q-progress i');
  const count = form.querySelector('.q-count');
  const err = form.querySelector('.q-error');
  const back = form.querySelector('[data-back]');
  const next = form.querySelector('[data-next]');
  const total = form.querySelector('#quote-total');
  const disclaimer = form.querySelector('#quote-disclaimer');
  const subject = form.querySelector('#quote-subject');
  const baseField = form.querySelector('#base-price');
  const adjustmentField = form.querySelector('#condition-adjustment');
  const estimateField = form.querySelector('#total-estimate');
  const addOnSummary = form.querySelector('#summary-addons');
  let i = 0;

  const PKG = { interior: 'Interior detail', exterior: 'Exterior detail', full: 'Full detail', deep: 'Deep-clean detail' };
  const preselected = PKG[new URLSearchParams(location.search).get('package')];
  if (preselected) {
    const radio = form.querySelector(`input[name="service"][value="${preselected}"]`);
    if (radio) radio.checked = true;
  }

  const selected = (name) => form.querySelector(`input[name="${name}"]:checked`)?.value || '';
  const formatPrice = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  const addOnPrice = (addOn, size) => {
    const price = ADDON_PRICES[addOn];
    return typeof price === 'number' ? price : price?.[size];
  };

  function updateEstimate() {
    const size = selected('size');
    const service = selected('service');
    const condition = selected('condition');
    const amount = PRICES[size]?.[service];
    const adjustment = CONDITION_ADJUSTMENTS[condition]?.[size];
    const selectedAddOns = [...form.querySelectorAll('input[name="addon_options"]:checked')].map((checkbox) => checkbox.value);
    const addOnTotal = selectedAddOns.reduce((sum, addOn) => sum + (addOnPrice(addOn, size) || 0), 0);
    const separatelyQuotedAddOns = selectedAddOns.filter((addOn) => addOnPrice(addOn, size) == null);
    const isCustom = service === 'Deep-clean detail' || amount == null;
    form.querySelector('#summary-size').textContent = size || 'Not selected';
    form.querySelector('#summary-service').textContent = service || 'Not selected';
    form.querySelector('#summary-condition').textContent = selected('condition') || 'Not selected';
    addOnSummary.textContent = selectedAddOns.length
      ? selectedAddOns.map((addOn) => addOnPrice(addOn, size) != null ? `${addOn} (+${formatPrice(addOnPrice(addOn, size))})` : `${addOn} (quoted separately)`).join(', ')
      : 'None selected';

    if (isCustom) {
      total.textContent = 'Custom quote';
      form.querySelector('#summary-base').textContent = 'Custom';
      form.querySelector('#summary-condition-price').textContent = 'Reviewed after inspection';
      baseField.value = 'Custom quote required';
      adjustmentField.value = 'Reviewed after inspection';
      estimateField.value = 'Custom quote required';
      subject.value = 'New accepted Clean Auto Care custom quote request';
      disclaimer.textContent = 'Deep-clean work is quoted after we review the vehicle condition, photos and requested work. No deposit or payment is collected online.';
      return;
    }

    const basePrice = formatPrice(amount);
    const conditionPrice = formatPrice(adjustment || 0);
    const estimate = amount + (adjustment || 0) + addOnTotal;
    const price = formatPrice(estimate);
    total.textContent = price;
    form.querySelector('#summary-base').textContent = basePrice;
    form.querySelector('#summary-condition-price').textContent = adjustment > 0 ? `+${conditionPrice}` : 'Included';
    baseField.value = basePrice;
    adjustmentField.value = adjustment > 0 ? `+${conditionPrice}` : '$0';
    estimateField.value = `${price} estimated total (includes ${formatPrice(addOnTotal)} for selected add-ons)`;
    subject.value = `Accepted Clean Auto Care estimate: ${price} — ${size}`;
    disclaimer.textContent = separatelyQuotedAddOns.length
      ? `This estimate includes ${formatPrice(addOnTotal)} for selected add-ons. ${separatelyQuotedAddOns.join(' and ')} ${separatelyQuotedAddOns.length === 1 ? 'is' : 'are'} priced separately after review. Travel or an in-person inspection may also require an updated estimate. No deposit or payment is collected online.`
      : `This estimate includes ${formatPrice(addOnTotal)} for selected add-ons. Travel or an in-person inspection may require an updated estimate. No deposit or payment is collected online.`;
  }

  function show(n, scroll) {
    i = n;
    steps.forEach((step, index) => { step.hidden = index !== n; });
    bar.style.width = `${((n + 1) / steps.length) * 100}%`;
    count.textContent = '';
    err.textContent = '';
    back.style.visibility = n === 0 ? 'hidden' : 'visible';
    next.style.display = n === steps.length - 1 ? 'none' : '';
    if (n === steps.length - 1) updateEstimate();
    if (scroll) {
      // Only scroll if the top of the form is hidden behind the header; otherwise leave the page alone.
      const header = document.querySelector('.site-header');
      const limit = (header ? header.offsetHeight : 0) + 12;
      const top = form.getBoundingClientRect().top;
      if (top < limit) window.scrollBy({ top: top - limit, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  }

  function validStep() {
    const step = steps[i];
    if (step.dataset.require === 'choice' && !step.querySelector('input:checked')) {
      err.textContent = 'Please choose an option to continue.';
      return false;
    }
    const invalid = [...step.querySelectorAll('[required]')].find((field) => !field.checkValidity());
    if (invalid) {
      err.textContent = 'Please complete the required fields before continuing.';
      invalid.focus();
      return false;
    }
    return true;
  }

  function go(direction) {
    if (direction > 0 && !validStep()) return;
    show(Math.min(Math.max(i + direction, 0), steps.length - 1), true);
  }

  form.addEventListener('click', (event) => {
    if (event.target.closest('[data-next]')) go(1);
    else if (event.target.closest('[data-back]')) go(-1);
  });
  form.addEventListener('change', (event) => {
    if (!event.target.matches('input[type="radio"]')) return;
    updateEstimate();
    if (steps[i]?.dataset.auto !== undefined) {
      window.setTimeout(() => go(1), 180);
    }
  });
  form.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && event.target.tagName === 'INPUT' && event.target.type !== 'submit' && i < steps.length - 1) {
      event.preventDefault();
      go(1);
    }
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const digits = form.elements.phone.value.replace(/\D/g, '');
    if (!(digits.length === 10 || (digits.length === 11 && digits[0] === '1'))) {
      err.textContent = 'Please enter a 10-digit phone number we can reach you at.';
      form.elements.phone.focus();
      return;
    }
    updateEstimate();
    form.querySelector('#addons-joined').value = [...form.querySelectorAll('input[name="addon_options"]:checked')].map((checkbox) => checkbox.value).join(', ') || 'None';
    const submit = form.querySelector('.q-submit');
    submit.disabled = true;
    err.textContent = 'Sending your request…';

    try {
      const endpoint = form.action.replace('https://formsubmit.co/', 'https://formsubmit.co/ajax/');
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      });
      if (!response.ok) throw new Error(`FormSubmit returned ${response.status}`);
      window.location.assign(form.querySelector('[name="_next"]').value);
    } catch (error) {
      submit.disabled = false;
      err.textContent = 'We could not send your request. Please try again, or call or text 608-448-7757.';
    }
  });
  show(0, false);
})();
