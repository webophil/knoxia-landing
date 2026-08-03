const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]);

export default async function handler(request, response) {
  if (request.method !== "POST") return response.status(405).json({ error: "Method not allowed" });
  const body = typeof request.body === "string" ? JSON.parse(request.body) : (request.body || {});
  const { firstName = "", lastName = "", email = "", subject = "", message = "", company = "", startedAt = "" } = body;
  const fields = [firstName, lastName, email, subject, message].map((value) => String(value).trim());
  if (company || (startedAt && Date.now() - Number(startedAt) < 1000)) return response.status(400).json({ error: "Invalid request" });
  if (fields.some((value) => !value) || !/^\S+@\S+\.\S+$/.test(fields[2]) || fields[3].length > 160 || fields[4].length > 5000) return response.status(400).json({ error: "Invalid form data" });

  const { MAILJET_API_KEY, MAILJET_SECRET_KEY, MAILJET_FROM_EMAIL, CONTACT_RECIPIENT_EMAIL } = process.env;
  if (![MAILJET_API_KEY, MAILJET_SECRET_KEY, MAILJET_FROM_EMAIL, CONTACT_RECIPIENT_EMAIL].every(Boolean)) return response.status(503).json({ error: "Contact service unavailable" });

  const name = `${fields[0]} ${fields[1]}`;
  const text = `New KnoXia contact message\n\nFrom: ${name} <${fields[2]}>\nSubject: ${fields[3]}\n\n${fields[4]}`;
  try {
    const mailjet = await fetch("https://api.mailjet.com/v3.1/send", {
      method: "POST",
      headers: { Authorization: `Basic ${Buffer.from(`${MAILJET_API_KEY}:${MAILJET_SECRET_KEY}`).toString("base64")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ Messages: [{ From: { Email: MAILJET_FROM_EMAIL, Name: "KnoXia" }, To: [{ Email: CONTACT_RECIPIENT_EMAIL }], ReplyTo: { Email: fields[2], Name: name }, Subject: `[KnoXia] ${fields[3]}`, TextPart: text, HTMLPart: `<p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(fields[2])}&gt;</p><p><strong>Subject:</strong> ${escapeHtml(fields[3])}</p><p>${escapeHtml(fields[4]).replace(/\n/g, "<br>")}</p>` }] })
    });
    if (!mailjet.ok) throw new Error("Mailjet request failed");
    return response.status(200).json({ ok: true });
  } catch {
    return response.status(502).json({ error: "Unable to send message" });
  }
}