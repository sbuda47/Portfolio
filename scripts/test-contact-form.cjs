// Exercise the actual contact handler without sending enquiries or solving CAPTCHA.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/main.js'), 'utf8');
const start = source.indexOf('/* Contact form: native POST');
const end = source.indexOf('// A source is attached only after Play:', start);
assert.ok(start >= 0 && end > start, 'Contact handler boundaries must exist');
const handler = source.slice(start, end);

function element(value = '') {
  const attributes = new Map();
  const listeners = new Map();
  const classes = new Set();
  return {
    value, disabled: false, textContent: '', focused: false,
    setAttribute: (key, value) => attributes.set(key, value),
    getAttribute: (key) => attributes.get(key) ?? null,
    removeAttribute: (key) => attributes.delete(key),
    addEventListener: (type, callback) => listeners.set(type, callback),
    dispatch(type) {
      const event = { target: this, defaultPrevented: false,
        preventDefault() { this.defaultPrevented = true; } };
      listeners.get(type)?.(event);
      return event;
    },
    focus() { this.focused = true; },
    classList: { add: (name) => classes.add(name), remove: (name) => classes.delete(name),
      contains: (name) => classes.has(name) },
  };
}

function fixture({ present = true } = {}) {
  const form = element();
  form.method = 'post';
  form.setAttribute('action', 'https://formspree.io/f/xwlvobrr');
  const name = element('Test engineer');
  const email = element('test@example.com');
  const message = element('A non-sensitive test message.');
  const button = element();
  const status = element();
  const fields = { '#cf-name': name, '#cf-email': email, '#cf-message': message,
    '[type="submit"]': button };
  form.querySelector = (selector) => selector === '[aria-invalid="true"]'
    ? [name, email, message].find((field) => field.getAttribute('aria-invalid') === 'true')
    : fields[selector];
  form.reset = () => { throw new Error('Never erase input before provider confirmation'); };
  const window = element();
  vm.runInNewContext(handler, {
    document: { getElementById: (id) => id === 'contactForm' ? (present ? form : null) : status },
    window,
    fetch() { throw new Error('Native CAPTCHA handoff must not use AJAX'); },
  });
  return { form, name, email, message, button, status, window };
}

test('valid input permits native POST without claiming success or clearing fields', () => {
  const f = fixture();
  assert.equal(f.form.dispatch('submit').defaultPrevented, false);
  assert.equal(f.button.disabled, true);
  assert.equal(f.form.getAttribute('aria-busy'), 'true');
  assert.match(f.status.textContent, /Continuing to Formspree/);
  assert.doesNotMatch(f.status.textContent, /has been sent/);
  assert.equal(f.message.value, 'A non-sensitive test message.');
});

test('whitespace-only name and message block submission and focus the first error', () => {
  const f = fixture();
  f.name.value = '   ';
  f.message.value = '\n\t';
  assert.equal(f.form.dispatch('submit').defaultPrevented, true);
  assert.equal(f.name.focused, true);
  assert.equal(f.message.getAttribute('aria-invalid'), 'true');
  assert.equal(f.button.disabled, false);
  assert.match(f.status.textContent, /Please check/);
});

test('invalid email is rejected and blur clears a corrected error', () => {
  const f = fixture();
  f.email.value = 'broken@';
  f.email.dispatch('blur');
  assert.equal(f.email.getAttribute('aria-invalid'), 'true');
  assert.equal(f.form.dispatch('submit').defaultPrevented, true);
  assert.equal(f.email.focused, true);
  f.email.value = 'valid@example.com';
  f.email.dispatch('blur');
  assert.equal(f.email.getAttribute('aria-invalid'), null);
});

test('correcting validation errors permits the next submission', () => {
  const f = fixture();
  f.name.value = ' ';
  assert.equal(f.form.dispatch('submit').defaultPrevented, true);
  f.name.value = 'Sibusiso';
  assert.equal(f.form.dispatch('submit').defaultPrevented, false);
  assert.equal(f.name.getAttribute('aria-invalid'), null);
  assert.equal(f.status.classList.contains('text-brandYellow'), false);
});

test('foreign or changed endpoints and GET are blocked', () => {
  for (const action of ['https://evil.example/f/xwlvobrr', 'http://formspree.io/f/xwlvobrr',
    'https://formspree.io/f/anotherform', null]) {
    const f = fixture();
    f.form.setAttribute('action', action);
    assert.equal(f.form.dispatch('submit').defaultPrevented, true);
    assert.equal(f.button.disabled, false);
    assert.match(f.status.textContent, /not configured correctly/);
  }
  const f = fixture();
  f.form.method = 'get';
  assert.equal(f.form.dispatch('submit').defaultPrevented, true);
});

test('repeat submits are blocked until a page is restored', () => {
  const f = fixture();
  assert.equal(f.form.dispatch('submit').defaultPrevented, false);
  assert.equal(f.form.dispatch('submit').defaultPrevented, true);
  f.window.dispatch('pageshow');
  assert.equal(f.button.disabled, false);
  assert.equal(f.form.getAttribute('aria-busy'), null);
  assert.match(f.status.textContent, /Only send again/);
  assert.equal(f.name.value, 'Test engineer');
  assert.equal(f.message.value, 'A non-sensitive test message.');
  assert.equal(f.form.dispatch('submit').defaultPrevented, false);
});

test('initial pageshow does not erase validation feedback', () => {
  const f = fixture();
  f.message.value = '';
  f.form.dispatch('submit');
  f.window.dispatch('pageshow');
  assert.match(f.status.textContent, /Please check/);
});

test('international names and markup-like messages stay unchanged', () => {
  const f = fixture();
  f.name.value = 'José 李';
  f.message.value = '<script>not rendered</script>';
  assert.equal(f.form.dispatch('submit').defaultPrevented, false);
  assert.equal(f.name.value, 'José 李');
  assert.equal(f.message.value, '<script>not rendered</script>');
});

test('shared script safely skips pages with no contact form', () => {
  assert.doesNotThrow(() => fixture({ present: false }));
});

test('HTML keeps native POST, same-tab flow, honeypot and accessible handoff note', () => {
  const html = fs.readFileSync(path.join(root, 'contact.html'), 'utf8');
  const form = html.match(/<form\b[^>]*id="contactForm"[^>]*>/)?.[0];
  assert.ok(form);
  assert.match(form, /method="POST"/);
  assert.match(form, /action="https:\/\/formspree\.io\/f\/xwlvobrr"/);
  assert.match(form, /aria-describedby="contactFormNote"/);
  assert.doesNotMatch(form, /target=|novalidate/);
  assert.match(html, /type="hidden" name="_gotcha" value=""/);
  assert.match(html, /Continue to Formspree/);
  assert.doesNotMatch(html, /name="_next"|recaptcha\/api\.js/);
});
