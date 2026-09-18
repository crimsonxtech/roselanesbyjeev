import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = "Roselanes by Jeev <contact@roselanesbyjeev.in>";

type Service = {
  name: string;
  qty: number;
};

type EventItem = {
  id: number;
  label: string;
  date: string;
  venue: string;
  services: Service[];
};

type AddOnItem = {
  id: number;
  name: string;
  qty: number;
};

type Body = {
  client: {
    name: string;
    phone: string;
    email: string;
    budget: string;
  };
  events: EventItem[];
  addOns: AddOnItem[];
  price: number;
  deliverables: string[];
  terms: string[];
  note?: string;
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function money(value: number) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function renderEvents(events: EventItem[]) {
  return events.map((event, index) => `
    <div style="margin:0 0 18px;border:1px solid rgba(131,17,50,.12);border-radius:14px;overflow:hidden;background:#fff;">
      <div style="padding:14px 18px;background:#831132;color:#eeddb8;font:19px Georgia,serif;">
        Event ${index + 1} — ${escapeHtml(event.label)}
      </div>
      <div style="padding:16px 18px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr>
            <td style="width:50%;padding:0 10px 12px 0;vertical-align:top;">
              <div style="font:10px Arial,sans-serif;text-transform:uppercase;letter-spacing:1.1px;color:#8a6d58;">Date</div>
              <div style="margin-top:4px;font:14px Arial,sans-serif;color:#3f0a18;">${escapeHtml(event.date)}</div>
            </td>
            <td style="width:50%;padding:0 0 12px 10px;vertical-align:top;">
              <div style="font:10px Arial,sans-serif;text-transform:uppercase;letter-spacing:1.1px;color:#8a6d58;">Venue</div>
              <div style="margin-top:4px;font:14px Arial,sans-serif;color:#3f0a18;">${escapeHtml(event.venue)}</div>
            </td>
          </tr>
        </table>
        <div style="margin:5px 0 7px;font:10px Arial,sans-serif;text-transform:uppercase;letter-spacing:1.1px;color:#8a6d58;">Selected services</div>
        ${event.services.map((service) => `
          <div style="padding:8px 0;border-bottom:1px solid rgba(131,17,50,.07);font:14px Arial,sans-serif;color:#3f0a18;">
            ${escapeHtml(service.name)}
            <span style="float:right;color:#831132;font-weight:600;">× ${service.qty}</span>
          </div>
        `).join("")}
      </div>
    </div>
  `).join("");
}

function renderList(items: string[]) {
  return items.map((item) => {
    const [heading, ...body] = item.split("\n");
    const description = body.join("\n").trim();

    return `
      <div style="margin:0 0 24px;">
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.4;font-weight:700;color:#831132;">
          ${escapeHtml(heading)}
        </div>
        ${
          description
            ? `<div style="margin-top:6px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:#4d3c34;">
                ${escapeHtml(description).replace(/\n/g, "<br>")}
              </div>`
            : ""
        }
      </div>
    `;
  }).join("");
}

function renderAddOns(items: AddOnItem[]) {
  if (!items?.length) return "";
  return `
    <h2 style="margin-top:30px;font:22px Georgia,serif;font-weight:400;color:#831132;">Add-ons</h2>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
      ${items.map((item) => `
        <tr>
          <td style="padding:0 0 9px;font:14px Arial,sans-serif;line-height:1.55;color:#3f0a18;">
            ${escapeHtml(item.name)}
            <span style="float:right;color:#831132;font-weight:600;">× ${item.qty}</span>
          </td>
        </tr>
      `).join("")}
    </table>
  `;
}


export async function POST(request: Request) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { success: false, error: "RESEND_API_KEY is not configured." },
        { status: 500 },
      );
    }

    const body = (await request.json()) as Body;

    if (!body?.client?.name || !body?.client?.email) {
      return NextResponse.json(
        { success: false, error: "Client details are missing." },
        { status: 400 },
      );
    }

    if (!Number.isFinite(body.price) || body.price <= 0) {
      return NextResponse.json(
        { success: false, error: "A valid quotation price is required." },
        { status: 400 },
      );
    }

    if (!Array.isArray(body.events) || body.events.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one event is required." },
        { status: 400 },
      );
    }

    const events = body.events.map((event) => ({
      ...event,
      services: Array.isArray(event.services) ? event.services : [],
    }));

const html = `
  <!doctype html>
  <html>
    <body style="margin:0;background:#f7ede0;padding:28px 12px;">
      <div style="max-width:720px;margin:0 auto;background:#fff;border:1px solid rgba(131,17,50,.12);border-radius:18px;overflow:hidden;">
        <div style="padding:32px 30px;background:#2b0510;text-align:center;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.2;font-weight:700;color:#eeddb8;">Roselanes by Jeev</div>
          <div style="margin-top:9px;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:1.4;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:#f7ede0;">Luxé wedding and lifestyle photography</div>
        </div>

        <div style="padding:30px;">
          <p style="margin:0 0 6px;font:11px Arial,sans-serif;text-transform:uppercase;letter-spacing:1.4px;color:#8a6d58;">Quotation</p>
          <h1 style="margin:0 0 16px;font:32px Georgia,serif;font-weight:400;color:#831132;">
            Dear ${escapeHtml(body.client.name)},
          </h1>

          <p style="margin:0 0 22px;font:15px Arial,sans-serif;line-height:1.7;color:#4d3c34;">
            Thank you for choosing Roselanes by Jeev. Based on the requirements submitted through our website, we have prepared the following quotation for your wedding celebrations.
          </p>

          <div style="margin:0 0 25px;padding:20px;border:1px solid rgba(131,17,50,.13);border-radius:14px;background:#fffaf5;">
            <div style="font:10px Arial,sans-serif;text-transform:uppercase;letter-spacing:1.2px;color:#8a6d58;">Quoted amount</div>
            <div style="margin-top:5px;font:36px Georgia,serif;color:#831132;">${money(body.price)}</div>
          </div>

          <!-- DELIVERABLES -->
          <h2 style="margin:32px 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:25px;line-height:1.3;font-weight:700;color:#2b0510;">
            Deliverables
          </h2>

          <div style="margin:0 0 26px;">
            <h3 style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:1.3;font-weight:700;color:#831132;text-align:center;">
              PHOTOS
            </h3>

            <div style="padding:0 2px;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.4;font-weight:700;color:#831132;">
                ${escapeHtml((body.deliverables?.[0] || "").split("\n")[0])}
              </div>
              <div style="margin-top:6px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:#4d3c34;">
                ${escapeHtml((body.deliverables?.[0] || "").split("\n").slice(1).join("\n")).replace(/\n/g, "<br>")}
              </div>
            </div>
          </div>

          <div style="margin:0 0 26px;">
            <h3 style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:1.3;font-weight:700;color:#831132;text-align:center;">
              VIDEOS
            </h3>

            <div style="padding:0 2px;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.4;font-weight:700;color:#831132;">
                ${escapeHtml((body.deliverables?.[1] || "").split("\n")[0])}
              </div>
              <div style="margin-top:6px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:#4d3c34;">
                ${escapeHtml((body.deliverables?.[1] || "").split("\n").slice(1).join("\n")).replace(/\n/g, "<br>")}
              </div>

              <div style="margin-top:22px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.4;font-weight:700;color:#831132;">
                ${escapeHtml((body.deliverables?.[2] || "").split("\n")[0])}
              </div>
              <div style="margin-top:6px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:#4d3c34;">
                ${escapeHtml((body.deliverables?.[2] || "").split("\n").slice(1).join("\n")).replace(/\n/g, "<br>")}
              </div>
            </div>
          </div>

          ${
            body.deliverables?.[3]
              ? `<div style="margin:0 0 30px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#6b5a50;">
                  ${escapeHtml(body.deliverables[3])}
                </div>`
              : ""
          }

          <!-- TERMS -->
          <h2 style="margin:32px 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:25px;line-height:1.3;font-weight:700;color:#2b0510;">
            Terms and Conditions
          </h2>

          <div>
            ${renderList(body.terms || [])}
          </div>

          <p style="margin:30px 0 0;font:14px Arial,sans-serif;line-height:1.7;color:#4d3c34;">
            To confirm your booking, please contact us on <strong>+91 95500 44475</strong>. Our team will assist you with the confirmation and next steps.
          </p>

          <div style="margin-top:30px;padding-top:20px;border-top:1px solid rgba(131,17,50,.1);">
            <div style="font:23px Georgia,serif;color:#831132;">Roselanes by Jeev</div>
            <div style="margin-top:4px;font:12px Arial,sans-serif;color:#8a6d58;">Luxé wedding and lifestyle photography</div>
          </div>
        </div>
      </div>
    </body>
  </html>
`;

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: [body.client.email],
      subject: "Quotation — Roselanes by Jeev",
      html,
    });

    if (result.error) {
      return NextResponse.json(
        { success: false, error: result.error.message || "Resend failed." },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true, id: result.data?.id });
  } catch (error) {
    console.error("Quotation confirmation route error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected error.",
      },
      { status: 500 },
    );
  }
}
