export async function onRequestPost(context) {
  const { request, env } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://chainandchisel.art',
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
  let body;
  try { body = await request.json(); } catch { return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), { status: 400, headers: corsHeaders }); }
  const { firstName, lastName, phone, street, city, zip, species, circumference, treeDry, treeGreen, description, turnstileToken } = body;
  if (!firstName || !lastName || !phone || !description) { return new Response(JSON.stringify({ ok: false, error: 'Missing required fields' }), { status: 400, headers: corsHeaders }); }
  const tsRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: turnstileToken || '' }) });
  const tsData = await tsRes.json();
  if (!tsData.success) { return new Response(JSON.stringify({ ok: false, error: 'Human verification failed.' }), { status: 403, headers: corsHeaders }); }
  const treeCondition = [treeDry && 'Dry (sitting for years)', treeGreen && 'Green (freshly cut)'].filter(Boolean).join(', ') || 'Not specified';
  const emailText = 'New carving request from chainandchisel.art

CONTACT
-------
Name:  ' + firstName + ' ' + lastName + '
Phone: ' + phone + '

ADDRESS
-------
Street: ' + (street||'Not provided') + '
City:   ' + (city||'Not provided') + '
ZIP:    ' + (zip||'Not provided') + '

TREE / MATERIAL
---------------
Species:       ' + (species||'Not specified') + '
Circumference: ' + (circumference||'Not specified') + '
Condition:     ' + treeCondition + '

PROJECT DESCRIPTION
-------------------
' + description;
  const emailRes = await fetch('https://api.mailchannels.net/tx/v1/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ personalizations: [{ to: [{ email: 'info@chainandchisel.art', name: 'Chain & Chisel' }] }], from: { email: 'noreply@chainandchisel.art', name: 'Chain & Chisel Website' }, subject: 'New Carving Request from ' + firstName + ' ' + lastName, content: [{ type: 'text/plain', value: emailText }] }) });
  if (!emailRes.ok && emailRes.status !== 202) { return new Response(JSON.stringify({ ok: false, error: 'Failed to send email.' }), { status: 500, headers: corsHeaders }); }
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders });
}
export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': 'https://chainandchisel.art', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' } });
}