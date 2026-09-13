import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const INTERNAL_EMAIL = "roselanesbyjeev@gmail.com";
const FROM_EMAIL = "Roselanes by Jeev <contact@roselanesbyjeev.in>";

type ServiceItem = {
  name: string;
  qty: number;
};

type EventItem = {
  label: string;
  date: string;
  venue: string;
  services: ServiceItem[];
};

type AddOnItem = {
  name: string;
  qty: number;
};

type QuoteRequest = {
  name: string;
  phone: string;
  email: string;
  budget: string;
  message?: string;
  events: EventItem[];
  addOns?: AddOnItem[];
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function safeQty(value: unknown): number {
  const qty = Number(value);

  if (!Number.isFinite(qty)) {
    return 1;
  }

  return Math.min(Math.max(Math.floor(qty), 1), 99);
}

function validateQuote(body: unknown): QuoteRequest {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid request.");
  }

  const data = body as Record<string, unknown>;

  const name = text(data.name);
  const phone = text(data.phone);
  const email = text(data.email).toLowerCase();
  const budget = text(data.budget);
  const message = text(data.message);

  if (!name) {
    throw new Error("Name is required.");
  }

  if (!phone) {
    throw new Error("Phone number is required.");
  }

  if (!email) {
    throw new Error("Email address is required.");
  }

  if (!isValidEmail(email)) {
    throw new Error("Please enter a valid email address.");
  }

  if (!budget) {
    throw new Error("Budget is required.");
  }

  if (name.length > 100) {
    throw new Error("Name is too long.");
  }

  if (phone.length > 40) {
    throw new Error("Phone number is too long.");
  }

  if (email.length > 254) {
    throw new Error("Email address is too long.");
  }

  if (budget.length > 150) {
    throw new Error("Budget value is invalid.");
  }

  if (message.length > 3000) {
    throw new Error("Message is too long.");
  }

  if (!Array.isArray(data.events) || data.events.length === 0) {
    throw new Error("At least one event is required.");
  }

  if (data.events.length > 20) {
    throw new Error("Too many events.");
  }

  const events: EventItem[] = data.events.map((event, eventIndex) => {
    if (!event || typeof event !== "object") {
      throw new Error(`Invalid event ${eventIndex + 1}.`);
    }

    const item = event as Record<string, unknown>;

    const label = text(item.label);
    const date = text(item.date);
    const venue = text(item.venue);

    if (!label) {
      throw new Error(`Event ${eventIndex + 1} is missing its name.`);
    }

    if (!date) {
      throw new Error(`Event ${eventIndex + 1} is missing its date.`);
    }

    if (!venue) {
      throw new Error(`Event ${eventIndex + 1} is missing its venue.`);
    }

    if (!Array.isArray(item.services) || item.services.length === 0) {
      throw new Error(`Event ${eventIndex + 1} must have at least one service.`);
    }

    if (label.length > 200) {
      throw new Error(`Event ${eventIndex + 1} name is too long.`);
    }

    if (date.length > 100) {
      throw new Error(`Event ${eventIndex + 1} date is invalid.`);
    }

    if (venue.length > 250) {
      throw new Error(`Event ${eventIndex + 1} venue is too long.`);
    }

    if (item.services.length > 30) {
      throw new Error(`Too many services in event ${eventIndex + 1}.`);
    }

    const services: ServiceItem[] = item.services.map(
      (service, serviceIndex) => {
        if (!service || typeof service !== "object") {
          throw new Error(
            `Invalid service ${serviceIndex + 1} in event ${eventIndex + 1}.`
          );
        }

        const serviceItem = service as Record<string, unknown>;
        const serviceName = text(serviceItem.name);

        if (!serviceName) {
          throw new Error(
            `Service ${serviceIndex + 1} in event ${eventIndex + 1} is invalid.`
          );
        }

        if (serviceName.length > 200) {
          throw new Error(
            `Service ${serviceIndex + 1} in event ${eventIndex + 1} is too long.`
          );
        }

        return {
          name: serviceName,
          qty: safeQty(serviceItem.qty),
        };
      }
    );

    return {
      label,
      date,
      venue,
      services,
    };
  });

  let addOns: AddOnItem[] = [];

  if (Array.isArray(data.addOns)) {
    if (data.addOns.length > 30) {
      throw new Error("Too many add-ons.");
    }

    addOns = data.addOns.map((addOn, index) => {
      if (!addOn || typeof addOn !== "object") {
        throw new Error(`Invalid add-on ${index + 1}.`);
      }

      const item = addOn as Record<string, unknown>;
      const addOnName = text(item.name);

      if (!addOnName) {
        throw new Error(`Add-on ${index + 1} is invalid.`);
      }

      if (addOnName.length > 200) {
        throw new Error(`Add-on ${index + 1} is too long.`);
      }

      return {
        name: addOnName,
        qty: safeQty(item.qty),
      };
    });
  }

  return {
    name,
    phone,
    email,
    budget,
    message,
    events,
    addOns,
  };
}

function renderEventForInternal(event: EventItem, index: number): string {
  const services = event.services
    .map(
      (service) => `
        <tr>
          <td style="
            padding:10px 12px;
            border-bottom:1px solid rgba(131,17,50,.08);
            color:#3f0a18;
            font-family:Arial,sans-serif;
            font-size:14px;
          ">
            ${escapeHtml(service.name)}
          </td>
          <td style="
            padding:10px 12px;
            border-bottom:1px solid rgba(131,17,50,.08);
            color:#831132;
            font-family:Arial,sans-serif;
            font-size:14px;
            text-align:right;
            font-weight:600;
          ">
            ${service.qty}
          </td>
        </tr>
      `
    )
    .join("");

  return `
    <div style="
      margin:0 0 22px;
      border:1px solid rgba(131,17,50,.12);
      border-radius:14px;
      overflow:hidden;
      background:#fff;
    ">
      <div style="
        padding:15px 18px;
        background:#831132;
        color:#eeddb8;
        font-family:Georgia,'Times New Roman',serif;
        font-size:19px;
        letter-spacing:.2px;
      ">
        Event ${index + 1} — ${escapeHtml(event.label)}
      </div>

      <div style="padding:17px 18px 8px;">
        <table
          role="presentation"
          width="100%"
          cellpadding="0"
          cellspacing="0"
          style="border-collapse:collapse;"
        >
          <tr>
            <td style="
              width:50%;
              padding:0 10px 14px 0;
              vertical-align:top;
            ">
              <div style="
                font-family:Arial,sans-serif;
                font-size:11px;
                text-transform:uppercase;
                letter-spacing:1.2px;
                color:#8a6d58;
                margin-bottom:5px;
              ">
                Date
              </div>
              <div style="
                font-family:Arial,sans-serif;
                font-size:14px;
                color:#3f0a18;
              ">
                ${escapeHtml(event.date)}
              </div>
            </td>

            <td style="
              width:50%;
              padding:0 0 14px 10px;
              vertical-align:top;
            ">
              <div style="
                font-family:Arial,sans-serif;
                font-size:11px;
                text-transform:uppercase;
                letter-spacing:1.2px;
                color:#8a6d58;
                margin-bottom:5px;
              ">
                Venue
              </div>
              <div style="
                font-family:Arial,sans-serif;
                font-size:14px;
                color:#3f0a18;
              ">
                ${escapeHtml(event.venue)}
              </div>
            </td>
          </tr>
        </table>

        <div style="
          margin:4px 0 8px;
          font-family:Arial,sans-serif;
          font-size:11px;
          text-transform:uppercase;
          letter-spacing:1.2px;
          color:#8a6d58;
        ">
          Selected Services
        </div>

        <table
          role="presentation"
          width="100%"
          cellpadding="0"
          cellspacing="0"
          style="
            border-collapse:collapse;
            margin-bottom:10px;
          "
        >
          <tr>
            <td style="
              padding:8px 12px;
              background:#f7ede0;
              color:#5c0c24;
              font-family:Arial,sans-serif;
              font-size:11px;
              text-transform:uppercase;
              letter-spacing:1px;
            ">
              Service
            </td>
            <td style="
              padding:8px 12px;
              background:#f7ede0;
              color:#5c0c24;
              font-family:Arial,sans-serif;
              font-size:11px;
              text-transform:uppercase;
              letter-spacing:1px;
              text-align:right;
            ">
              Qty
            </td>
          </tr>
          ${services}
        </table>
      </div>
    </div>
  `;
}

function renderEventForClient(event: EventItem, index: number): string {
  const services = event.services
    .map(
      (service) => `
        <div style="
          padding:8px 0;
          border-bottom:1px solid rgba(131,17,50,.07);
          font-family:Arial,sans-serif;
          font-size:14px;
          color:#3f0a18;
        ">
          ${escapeHtml(service.name)}
          <span style="
            float:right;
            color:#831132;
            font-weight:600;
          ">
            × ${service.qty}
          </span>
        </div>
      `
    )
    .join("");

  return `
    <div style="
      margin:0 0 18px;
      padding:18px;
      border:1px solid rgba(131,17,50,.11);
      border-radius:14px;
      background:#fff;
    ">
      <div style="
        font-family:Georgia,'Times New Roman',serif;
        color:#831132;
        font-size:20px;
        margin-bottom:13px;
      ">
        ${escapeHtml(event.label)}
      </div>

      <table
        role="presentation"
        width="100%"
        cellpadding="0"
        cellspacing="0"
        style="border-collapse:collapse;"
      >
        <tr>
          <td style="
            width:50%;
            padding:0 10px 14px 0;
            vertical-align:top;
          ">
            <div style="
              font-family:Arial,sans-serif;
              font-size:10px;
              text-transform:uppercase;
              letter-spacing:1.1px;
              color:#8a6d58;
              margin-bottom:4px;
            ">
              Date
            </div>
            <div style="
              font-family:Arial,sans-serif;
              font-size:14px;
              color:#3f0a18;
            ">
              ${escapeHtml(event.date)}
            </div>
          </td>

          <td style="
            width:50%;
            padding:0 0 14px 10px;
            vertical-align:top;
          ">
            <div style="
              font-family:Arial,sans-serif;
              font-size:10px;
              text-transform:uppercase;
              letter-spacing:1.1px;
              color:#8a6d58;
              margin-bottom:4px;
            ">
              Venue
            </div>
            <div style="
              font-family:Arial,sans-serif;
              font-size:14px;
              color:#3f0a18;
            ">
              ${escapeHtml(event.venue)}
            </div>
          </td>
        </tr>
      </table>

      <div style="
        margin-top:4px;
        font-family:Arial,sans-serif;
        font-size:11px;
        text-transform:uppercase;
        letter-spacing:1px;
        color:#8a6d58;
      ">
        Services
      </div>

      <div style="margin-top:5px;">
        ${services}
      </div>
    </div>
  `;
}

function renderAddOns(addOns: AddOnItem[]): string {
  if (!addOns.length) {
    return `
      <div style="
        font-family:Arial,sans-serif;
        font-size:14px;
        color:#8a6d58;
      ">
        No additional add-ons selected.
      </div>
    `;
  }

  return addOns
    .map(
      (addOn) => `
        <div style="
          padding:9px 0;
          border-bottom:1px solid rgba(131,17,50,.07);
          font-family:Arial,sans-serif;
          font-size:14px;
          color:#3f0a18;
        ">
          ${escapeHtml(addOn.name)}
          <span style="
            float:right;
            color:#831132;
            font-weight:600;
          ">
            × ${addOn.qty}
          </span>
        </div>
      `
    )
    .join("");
}

function internalEmailHtml(quote: QuoteRequest): string {
  const events = quote.events
    .map((event, index) => renderEventForInternal(event, index))
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Quote Request</title>
</head>

<body style="
  margin:0;
  padding:30px 15px;
  background:#f7ede0;
">
  <div style="
    max-width:680px;
    margin:0 auto;
    background:#ffffff;
    border:1px solid rgba(131,17,50,.12);
    border-radius:18px;
    overflow:hidden;
  ">

    <div style="
      background:#831132;
      padding:30px 28px;
      text-align:center;
    ">
      <div style="
        color:#eeddb8;
        font-family:Georgia,'Times New Roman',serif;
        font-size:30px;
        line-height:1.1;
      ">
        Roselanes by Jeev
      </div>

      <div style="
        margin-top:8px;
        color:#d2b885;
        font-family:Arial,sans-serif;
        font-size:11px;
        text-transform:uppercase;
        letter-spacing:2px;
      ">
        New Quote Request
      </div>
    </div>

    <div style="padding:30px 28px;">

      <div style="
        margin-bottom:25px;
        padding:18px;
        border-left:3px solid #d2b885;
        background:#fdf8f2;
      ">
        <div style="
          color:#831132;
          font-family:Georgia,'Times New Roman',serif;
          font-size:24px;
          margin-bottom:5px;
        ">
          ${escapeHtml(quote.name)}
        </div>

        <div style="
          color:#8a6d58;
          font-family:Arial,sans-serif;
          font-size:13px;
        ">
          A new quotation request has been submitted through the website.
        </div>
      </div>

      <div style="
        margin-bottom:28px;
        font-family:Arial,sans-serif;
      ">
        <div style="
          margin-bottom:12px;
          color:#831132;
          font-family:Georgia,'Times New Roman',serif;
          font-size:20px;
        ">
          Client Details
        </div>

        <table
          role="presentation"
          width="100%"
          cellpadding="0"
          cellspacing="0"
          style="border-collapse:collapse;"
        >
          <tr>
            <td style="
              padding:9px 0;
              width:120px;
              color:#8a6d58;
              font-size:12px;
              text-transform:uppercase;
              letter-spacing:.8px;
            ">
              Name
            </td>
            <td style="
              padding:9px 0;
              color:#3f0a18;
              font-size:14px;
            ">
              ${escapeHtml(quote.name)}
            </td>
          </tr>

          <tr>
            <td style="
              padding:9px 0;
              color:#8a6d58;
              font-size:12px;
              text-transform:uppercase;
              letter-spacing:.8px;
            ">
              Phone
            </td>
            <td style="
              padding:9px 0;
              color:#3f0a18;
              font-size:14px;
            ">
              ${escapeHtml(quote.phone)}
            </td>
          </tr>

          <tr>
            <td style="
              padding:9px 0;
              color:#8a6d58;
              font-size:12px;
              text-transform:uppercase;
              letter-spacing:.8px;
            ">
              Email
            </td>
            <td style="
              padding:9px 0;
              color:#3f0a18;
              font-size:14px;
            ">
              ${escapeHtml(quote.email)}
            </td>
          </tr>

          <tr>
            <td style="
              padding:9px 0;
              color:#8a6d58;
              font-size:12px;
              text-transform:uppercase;
              letter-spacing:.8px;
            ">
              Budget
            </td>
            <td style="
              padding:9px 0;
              color:#831132;
              font-size:14px;
              font-weight:600;
            ">
              ${escapeHtml(quote.budget)}
            </td>
          </tr>
        </table>
      </div>

      <div style="
        margin-bottom:28px;
      ">
        <div style="
          margin-bottom:15px;
          color:#831132;
          font-family:Georgia,'Times New Roman',serif;
          font-size:20px;
        ">
          Requested Events
        </div>

        ${events}
      </div>

      <div style="
        margin-bottom:28px;
        padding:20px;
        border:1px solid rgba(131,17,50,.11);
        border-radius:14px;
        background:#fdf8f2;
      ">
        <div style="
          margin-bottom:12px;
          color:#831132;
          font-family:Georgia,'Times New Roman',serif;
          font-size:20px;
        ">
          Additional Add-ons
        </div>

        ${renderAddOns(quote.addOns || [])}
      </div>

      ${
        quote.message
          ? `
        <div style="
          margin-bottom:10px;
          padding:20px;
          background:#f7ede0;
          border-left:3px solid #d2b885;
          border-radius:4px;
        ">
          <div style="
            margin-bottom:9px;
            color:#831132;
            font-family:Georgia,'Times New Roman',serif;
            font-size:19px;
          ">
            Client Message
          </div>

          <div style="
            color:#4c3b32;
            font-family:Arial,sans-serif;
            font-size:14px;
            line-height:1.7;
            white-space:pre-wrap;
          ">
            ${escapeHtml(quote.message)}
          </div>
        </div>
      `
          : ""
      }

    </div>

    <div style="
      padding:20px 28px;
      background:#3f0a18;
      text-align:center;
    ">
      <div style="
        color:#eeddb8;
        font-family:Georgia,'Times New Roman',serif;
        font-size:15px;
      ">
        Roselanes by Jeev
      </div>

      <div style="
        margin-top:5px;
        color:#d2b885;
        font-family:Arial,sans-serif;
        font-size:11px;
        letter-spacing:.5px;
      ">
        New quotation enquiry
      </div>
    </div>

  </div>
</body>
</html>
`;
}

function clientEmailHtml(quote: QuoteRequest): string {
  const events = quote.events
    .map((event, index) => renderEventForClient(event, index))
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Quote Request Received</title>
</head>

<body style="
  margin:0;
  padding:30px 15px;
  background:#f7ede0;
">
  <div style="
    max-width:680px;
    margin:0 auto;
    background:#ffffff;
    border:1px solid rgba(131,17,50,.12);
    border-radius:18px;
    overflow:hidden;
  ">

    <div style="
      background:#831132;
      padding:32px 28px;
      text-align:center;
    ">
      <div style="
        color:#eeddb8;
        font-family:Georgia,'Times New Roman',serif;
        font-size:30px;
        line-height:1.1;
      ">
        Roselanes by Jeev
      </div>

      <div style="
        margin-top:9px;
        color:#d2b885;
        font-family:Arial,sans-serif;
        font-size:11px;
        text-transform:uppercase;
        letter-spacing:2px;
      ">
        Quote Request Received
      </div>
    </div>

    <div style="padding:30px 28px;">

      <div style="
        margin-bottom:25px;
      ">
        <div style="
          color:#831132;
          font-family:Georgia,'Times New Roman',serif;
          font-size:27px;
          line-height:1.2;
          margin-bottom:10px;
        ">
          Thank you, ${escapeHtml(quote.name)}.
        </div>

        <div style="
          color:#5c4a40;
          font-family:Arial,sans-serif;
          font-size:14px;
          line-height:1.7;
        ">
          We've received your quotation request and all the details you've
          shared with us.
        </div>
      </div>

      <div style="
        margin-bottom:26px;
        padding:19px 20px;
        background:#fdf8f2;
        border-left:3px solid #d2b885;
      ">
        <div style="
          color:#831132;
          font-family:Georgia,'Times New Roman',serif;
          font-size:19px;
          margin-bottom:7px;
        ">
          What happens next?
        </div>

        <div style="
          color:#5c4a40;
          font-family:Arial,sans-serif;
          font-size:14px;
          line-height:1.7;
        ">
          Our team will review your event requirements and get back to you
          within 24 hours.
        </div>
      </div>

      <div style="
        margin-bottom:27px;
      ">
        <div style="
          margin-bottom:14px;
          color:#831132;
          font-family:Georgia,'Times New Roman',serif;
          font-size:21px;
        ">
          Your Event Requirements
        </div>

        ${events}
      </div>

      <div style="
        margin-bottom:27px;
        padding:19px 20px;
        border:1px solid rgba(131,17,50,.11);
        border-radius:14px;
        background:#fff;
      ">
        <table
          role="presentation"
          width="100%"
          cellpadding="0"
          cellspacing="0"
          style="border-collapse:collapse;"
        >
          <tr>
            <td style="
              padding:5px 0;
              color:#8a6d58;
              font-family:Arial,sans-serif;
              font-size:11px;
              text-transform:uppercase;
              letter-spacing:1px;
            ">
              Preferred Budget
            </td>

            <td style="
              padding:5px 0;
              color:#831132;
              font-family:Arial,sans-serif;
              font-size:14px;
              font-weight:600;
              text-align:right;
            ">
              ${escapeHtml(quote.budget)}
            </td>
          </tr>
        </table>
      </div>

      <div style="
        margin-bottom:25px;
        padding:19px 20px;
        border:1px solid rgba(131,17,50,.11);
        border-radius:14px;
        background:#fdf8f2;
      ">
        <div style="
          margin-bottom:12px;
          color:#831132;
          font-family:Georgia,'Times New Roman',serif;
          font-size:19px;
        ">
          Additional Add-ons
        </div>

        ${renderAddOns(quote.addOns || [])}
      </div>

      ${
        quote.message
          ? `
        <div style="
          margin-bottom:25px;
          padding:19px 20px;
          background:#f7ede0;
          border-left:3px solid #d2b885;
        ">
          <div style="
            margin-bottom:9px;
            color:#831132;
            font-family:Georgia,'Times New Roman',serif;
            font-size:19px;
          ">
            Your Message
          </div>

          <div style="
            color:#4c3b32;
            font-family:Arial,sans-serif;
            font-size:14px;
            line-height:1.7;
            white-space:pre-wrap;
          ">
            ${escapeHtml(quote.message)}
          </div>
        </div>
      `
          : ""
      }

      <div style="
        margin-top:30px;
        text-align:center;
        color:#8a6d58;
        font-family:Arial,sans-serif;
        font-size:13px;
        line-height:1.7;
      ">
        We look forward to hearing more about your celebration.
      </div>

    </div>

    <div style="
      padding:22px 28px;
      background:#3f0a18;
      text-align:center;
    ">
      <div style="
        color:#eeddb8;
        font-family:Georgia,'Times New Roman',serif;
        font-size:16px;
      ">
        Roselanes by Jeev
      </div>

      <div style="
        margin-top:7px;
        color:#d2b885;
        font-family:Arial,sans-serif;
        font-size:11px;
        letter-spacing:.5px;
      ">
        Luxury Wedding Photography
      </div>
    </div>

  </div>
</body>
</html>
`;
}

export async function POST(request: Request) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured.");
      return NextResponse.json(
        {
          success: false,
          error: "Email service is not configured.",
        },
        { status: 500 }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body.",
        },
        { status: 400 }
      );
    }

    const quote = validateQuote(body);

    const internalSubject = `New Quote Request — ${quote.name}`;

    const clientSubject =
      "We Received Your Quote Request — Roselanes by Jeev";

    /*
     * Send both emails independently.
     *
     * Internal email:
     * - Goes to Roselanes
     * - replyTo points directly to the client
     *
     * Client email:
     * - Goes to the client
     * - replyTo points back to Roselanes
     */
    const [internalResult, clientResult] = await Promise.all([
      resend.emails.send({
        from: FROM_EMAIL,
        to: [INTERNAL_EMAIL],
        replyTo: quote.email,
        subject: internalSubject,
        html: internalEmailHtml(quote),
      }),

      resend.emails.send({
        from: FROM_EMAIL,
        to: [quote.email],
        replyTo: INTERNAL_EMAIL,
        subject: clientSubject,
        html: clientEmailHtml(quote),
      }),
    ]);

    if (internalResult.error) {
      console.error("Resend internal quote email error:", internalResult.error);

      return NextResponse.json(
        {
          success: false,
          error: "Couldn't send the quotation request.",
        },
        { status: 500 }
      );
    }

    if (clientResult.error) {
      console.error("Resend client quote email error:", clientResult.error);

      return NextResponse.json(
        {
          success: false,
          error: "Couldn't send the confirmation email.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Quote request sent successfully.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Quote API error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong sending your quotation request.",
      },
      { status: 500 }
    );
  }
}