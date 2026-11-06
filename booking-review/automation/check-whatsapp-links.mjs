// Static source checks only. No browser, network, submissions or messages.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const directUrl = 'https://wa.me/18682766878';
const groupUrl = 'https://chat.whatsapp.com/KO19GyeuQfi3K1FEJ5GKLi';
const groupCounts = { 'index.html': 1, 'book.html': 0, 'merch.html': 0, 'elite.html': 1 };
const textContent = html => html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

for (const [file, expectedGroups] of Object.entries(groupCounts)) {
  const html = await readFile(new URL(file, root), 'utf8');
  const anchors = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].map(match => ({
    href: /\bhref="([^"]*)"/i.exec(match[1])?.[1],
    label: textContent(match[2])
  }));
  let groups = 0;
  let direct = 0;
  let bookings = 0;
  for (const { href, label } of anchors) {
    if (/whatsapp|wa\.me/i.test(href || '')) {
      const url = new URL(href.replace(/&amp;/g, '&'));
      if (url.hostname === 'chat.whatsapp.com') {
        assert.equal(href, groupUrl, `${file}: group destination`);
        assert.equal(label, 'View Group Invite', `${file}: group label`);
        groups++;
      } else {
        assert.equal(url.origin + url.pathname, directUrl, `${file}: direct destination`);
        assert.equal(url.hash, '', `${file}: no direct URL fragment`);
        assert.ok([...url.searchParams.keys()].every(key => key === 'text'), `${file}: prefill only`);
        assert.ok(!url.search || /^\?text=[A-Za-z0-9%_.!~*'()-]*$/.test(url.search), `${file}: encoded prefill`);
        direct++;
      }
    }
    if (label === 'Book a Class' || label === 'Book a Class ->' || label === 'Start Your Booking') {
      assert.equal(href, 'book.html', `${file}: booking stays on form path`);
      bookings++;
    }
  }
  assert.equal(groups, expectedGroups, `${file}: community invitation count`);
  assert.ok(direct > 0, `${file}: direct contact available`);
  if (file !== 'book.html') assert.ok(bookings > 0, `${file}: booking form entry available`);
  assert.match(html, /TT\$80/);
  assert.match(html, /75.minute/i);
  assert.match(html, /skate rental included/i);
  assert.match(html, /by appointment/i);
  assert.doesNotMatch(html, /tally\.(?:so|forms)/i);
  if (file === 'index.html') {
    assert.match(html, /<a class="path-card reveal" href="https:\/\/wa\.me\/18682766878"[^>]*><div class="path-icon">04<\/div><h3>Contact TSG<\/h3>/);
  }
  if (file === 'book.html') {
    assert.match(html, /id="bookingForm" data-tsg-lead-form data-lead-type="booking"/);
    assert.match(html, /data-whatsapp-link href="#"/);
    assert.match(html, /Class requests start with this form\./);
    assert.match(html, /Opening WhatsApp alone does not send your request or confirm a class\./);
  }
  console.log(`PASS ${file}: ${direct} direct contacts, ${groups} group invites, ${bookings} booking links`);
}
