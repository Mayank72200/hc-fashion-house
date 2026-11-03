// v1.10.31 — Single WhatsApp opener used by Dashboard, ClientsView,
// InvoiceGenerator (share button + payment reminder). Prior to this the
// same snippet — sanitize phone, encode message, build the link, open it —
// was inlined at every call site. When a bug showed up ("phone with + prefix
// breaks the link") it had to be fixed in every copy. Now: one function, one
// bug fix spot.
//
// The message goes to WhatsApp Desktop through a whatsapp:// link, which the
// browser hands to the app on this PC: nothing is sent to any web server,
// and the user still presses Send inside WhatsApp. The message is also put
// on the clipboard, because a web page cannot tell whether WhatsApp opened
// (when it is not installed the browser does nothing); it can then be pasted
// into the chat by hand.
//
// Kept intentionally narrow: only the hand-off. Caller composes the
// message because those legitimately differ (Dashboard has rich
// payment-status caption, ClientsView has a minimal blurb, invoice-form
// has totals). Attempting to unify the message text would collapse three
// UX-tuned strings into one lowest-common-denominator string.
import { toast } from '../components/Toast';

/**
 * Phone number for a WhatsApp link: digits only, with the country code.
 * WhatsApp wants no +, spaces, dashes or parens. Indian numbers written the
 * local way get 91 in front: 10 digits ("98765 43210"), or 11 digits with
 * the leading 0 ("098765 43210"); a "00" international prefix is dropped.
 * Any other number is passed on as typed, digits only.
 * Empty / undefined → empty string (caller picks the no-phone link).
 */
export function sanitizeWhatsAppPhone(phone) {
  if (!phone) return '';
  let digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits.length === 10 ? `91${digits}` : digits;
}

/**
 * The whatsapp:// link for a phone (optional) and a prefilled message.
 * Without a phone, WhatsApp asks which chat to send it to.
 */
export function buildWhatsAppLink(phone, message) {
  const clean = sanitizeWhatsAppPhone(phone);
  const text = encodeURIComponent(message || '');
  return clean ? `whatsapp://send?phone=${clean}&text=${text}` : `whatsapp://send?text=${text}`;
}

/**
 * Copy text to the clipboard. Resolves true when it worked, false when the
 * browser refused; never throws. The Clipboard API first (allowed on this
 * local address), then the older select-and-copy way.
 */
export async function copyTextToClipboard(text) {
  const value = String(text ?? '');
  try {
    if (window.isSecureContext && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch { /* refused, e.g. the page lost focus: try the old way */ }
  try {
    const active = document.activeElement;
    const area = document.createElement('textarea');
    area.value = value;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    if (active && typeof active.focus === 'function') active.focus({ preventScroll: true });
    return ok;
  } catch {
    return false;
  }
}

/**
 * Hand a message to WhatsApp Desktop for the given phone (optional), and
 * copy it to the clipboard as the fallback.
 *
 * The link opens in this tab, not a new one: an app link loads no page, so
 * the current invoice / modal / draft stays as it is, and no empty tab is
 * left behind when WhatsApp is not installed.
 *
 * One toast says what happened. A caller that reads `result.message` right
 * after the await shows it in its own toast (worded with its own context),
 * and then this function shows none; otherwise this function shows it.
 * `{ notify: false }` never shows it here. Never rejects.
 *
 * @param {string|null|undefined} phone — recipient phone; empty → WhatsApp asks for the chat
 * @param {string} message — plain text (WhatsApp caption); may include *bold*
 * @param {{ notify?: boolean }} [options]
 * @returns {Promise<{ link: string, phone: string, copied: boolean, opened: boolean,
 *   message: string, type: 'info' | 'error' }>}
 *   `opened` means the link was handed to the browser; whether WhatsApp
 *   really opened cannot be known from the page. `message` / `type` are the
 *   toast text and kind.
 */
export async function openWhatsAppShare(phone, message, { notify = true } = {}) {
  const text = String(message || '');
  // Copy first: an "Open WhatsApp?" prompt takes the focus away from the
  // page, and the clipboard only takes text from the focused page.
  const copied = text ? await copyTextToClipboard(text) : false;
  let link = '';
  let opened = false;
  try {
    link = buildWhatsAppLink(phone, text);
    window.location.assign(link);
    opened = true;
  } catch { /* blocked by the browser: the copied message is the fallback */ }
  const [note, type] = opened && copied ? ['Opening WhatsApp… The message is also copied: if WhatsApp does not open, open it and paste the message (Ctrl+V).', 'info']
    : opened ? ['Opening WhatsApp… If nothing opens, WhatsApp Desktop is not installed on this PC.', 'info']
      : copied ? ['Message copied — open WhatsApp and paste it into the chat (Ctrl+V).', 'info']
        : ['Could not open WhatsApp or copy the message.', 'error'];
  const result = { link, phone: sanitizeWhatsAppPhone(phone), copied, opened, type };
  let taken = false;
  Object.defineProperty(result, 'message', { enumerable: true, get() { taken = true; return note; } });
  // A timer, so the awaiting caller runs first and can take the message.
  if (notify) setTimeout(() => { if (!taken) toast(note, type, type === 'error' ? 5000 : 8000); }, 0);
  return result;
}
