import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const purposeMap: Record<string, string> = {
  enquiry: "New Enquiry",
  business: "Business Enquiry",
  careers: "Career Enquiry",
  other: "General Enquiry",
};

const purposeLabelMap: Record<string, string> = {
  enquiry: "For Enquiry",
  business: "For Business",
  careers: "For Careers",
  other: "Other",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const email = String(body.email ?? "").trim();
    const purpose = String(body.purpose ?? "").trim();
    const message = String(body.message ?? "").trim();

    // ---------------------------------------------------------
    // Validation
    // ---------------------------------------------------------

    if (!name || !phone || !email || !purpose) {
      return NextResponse.json(
        {
          success: false,
          message: "Please fill in all required fields.",
        },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid email address.",
        },
        { status: 400 }
      );
    }

    if (!purposeMap[purpose]) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid enquiry type.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // Email data
    // ---------------------------------------------------------

    const purposeLabel = purposeLabelMap[purpose];
    const subject = `${purposeMap[purpose]} — ${name}`;

    const safeName = escapeHtml(name);
    const safePhone = escapeHtml(phone);
    const safeEmail = escapeHtml(email);
    const safePurpose = escapeHtml(purposeLabel);
    const safeMessage = escapeHtml(message).replace(/\n/g, "<br />");

    // ---------------------------------------------------------
    // Send email through Resend
    // ---------------------------------------------------------

    const { data, error } = await resend.emails.send({
      from: "Roselanes by Jeev <contact@roselanesbyjeev.in>",
      to: ["roselanesbyjeev@gmail.com"],
      replyTo: email,
      subject,

      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

  <title>${escapeHtml(subject)}</title>

  <link
    href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Manrope:wght@400;500;600;700&display=swap"
    rel="stylesheet"
  />
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f7ede0;
    font-family:'Manrope',Arial,Helvetica,sans-serif;
    color:#000000;
  "
>
  <div
    style="
      width:100%;
      padding:40px 20px;
      box-sizing:border-box;
      background:#f7ede0;
    "
  >

    <!-- EMAIL CARD -->
    <div
      style="
        width:100%;
        max-width:680px;
        margin:0 auto;
        background:#ffffff;
        border:1px solid rgba(131,17,50,.14);
        overflow:hidden;
      "
    >

      <!-- HEADER -->
      <div
        style="
          padding:38px 38px 34px;
          background:#831132;
          color:#ffffff;
        "
      >

        <!-- Brand -->
        <div
          style="
            margin-bottom:28px;
            font-family:'Manrope',Arial,Helvetica,sans-serif;
            font-size:10px;
            font-weight:700;
            letter-spacing:3px;
            text-transform:uppercase;
            color:#d2b885;
          "
        >
          ROSELanes BY JEEV
        </div>

        <!-- Gold rule -->
        <div
          style="
            width:42px;
            height:2px;
            margin-bottom:22px;
            background:#d2b885;
          "
        ></div>

        <!-- Purpose -->
        <div
          style="
            font-family:'Cormorant Garamond',Georgia,serif;
            font-size:36px;
            line-height:1.05;
            font-weight:500;
            color:#ffffff;
          "
        >
          ${escapeHtml(purposeMap[purpose])}
        </div>

        <div
          style="
            margin-top:12px;
            font-family:'Manrope',Arial,Helvetica,sans-serif;
            font-size:11px;
            font-weight:600;
            letter-spacing:1.8px;
            text-transform:uppercase;
            color:#d2b885;
          "
        >
          ${escapeHtml(purposeLabel)}
        </div>

      </div>


      <!-- MAIN CONTENT -->
      <div
        style="
          padding:38px;
          background:#ffffff;
        "
      >

        <!-- CONTACT DETAILS -->
        <div
          style="
            margin-bottom:32px;
            padding-bottom:28px;
            border-bottom:1px solid rgba(131,17,50,.14);
          "
        >

          <div
            style="
              margin-bottom:18px;
              font-family:'Manrope',Arial,Helvetica,sans-serif;
              font-size:10px;
              font-weight:700;
              letter-spacing:2px;
              text-transform:uppercase;
              color:#831132;
            "
          >
            Contact Details
          </div>

          <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            border="0"
            style="border-collapse:collapse;"
          >

            <tr>
              <td
                style="
                  padding:7px 0;
                  width:110px;
                  vertical-align:top;
                  font-family:'Manrope',Arial,Helvetica,sans-serif;
                  font-size:12px;
                  font-weight:600;
                  color:#831132;
                "
              >
                Name
              </td>

              <td
                style="
                  padding:7px 0;
                  font-family:'Manrope',Arial,Helvetica,sans-serif;
                  font-size:14px;
                  font-weight:600;
                  color:#000000;
                "
              >
                ${safeName}
              </td>
            </tr>

            <tr>
              <td
                style="
                  padding:7px 0;
                  vertical-align:top;
                  font-family:'Manrope',Arial,Helvetica,sans-serif;
                  font-size:12px;
                  font-weight:600;
                  color:#831132;
                "
              >
                Phone
              </td>

              <td
                style="
                  padding:7px 0;
                  font-family:'Manrope',Arial,Helvetica,sans-serif;
                  font-size:14px;
                  color:#000000;
                "
              >
                ${safePhone}
              </td>
            </tr>

            <tr>
              <td
                style="
                  padding:7px 0;
                  vertical-align:top;
                  font-family:'Manrope',Arial,Helvetica,sans-serif;
                  font-size:12px;
                  font-weight:600;
                  color:#831132;
                "
              >
                Email
              </td>

              <td
                style="
                  padding:7px 0;
                  font-family:'Manrope',Arial,Helvetica,sans-serif;
                  font-size:14px;
                  color:#000000;
                  word-break:break-word;
                "
              >
                ${safeEmail}
              </td>
            </tr>

            <tr>
              <td
                style="
                  padding:7px 0;
                  vertical-align:top;
                  font-family:'Manrope',Arial,Helvetica,sans-serif;
                  font-size:12px;
                  font-weight:600;
                  color:#831132;
                "
              >
                Purpose
              </td>

              <td
                style="
                  padding:7px 0;
                  font-family:'Manrope',Arial,Helvetica,sans-serif;
                  font-size:14px;
                  color:#000000;
                "
              >
                ${safePurpose}
              </td>
            </tr>

          </table>
        </div>


        <!-- MESSAGE -->
        <div>

          <div
            style="
              margin-bottom:16px;
              font-family:'Manrope',Arial,Helvetica,sans-serif;
              font-size:10px;
              font-weight:700;
              letter-spacing:2px;
              text-transform:uppercase;
              color:#831132;
            "
          >
            Message
          </div>

          <div
            style="
              padding:22px 22px 22px 24px;
              background:#f7ede0;
              border-left:3px solid #d2b885;
              font-family:'Manrope',Arial,Helvetica,sans-serif;
              font-size:14px;
              line-height:1.8;
              color:#000000;
            "
          >
            ${
              safeMessage ||
              '<span style="color:#831132;opacity:.55;">No message provided.</span>'
            }
          </div>

        </div>

      </div>

    </div>

  </div>
</body>
</html>
`,
    });

    // ---------------------------------------------------------
    // Resend error
    // ---------------------------------------------------------

    if (error) {
      console.error("Resend error:", error);

      return NextResponse.json(
        {
          success: false,
          message: "Unable to send your enquiry. Please try again later.",
        },
        { status: 500 }
      );
    }

    // ---------------------------------------------------------
    // Success
    // ---------------------------------------------------------

    return NextResponse.json({
      success: true,
      message: "Your enquiry has been sent successfully.",
      id: data?.id,
    });
  } catch (error) {
    console.error("Contact API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong. Please try again later.",
      },
      { status: 500 }
    );
  }
}