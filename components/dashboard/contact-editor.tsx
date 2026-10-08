"use client";

import type { ContactContent } from "@/lib/site-content";
import { Card, EditorShell, Row, TextField, useSectionEditor } from "./editor-kit";

export function ContactEditor({ initial }: { initial: ContactContent }) {
  const ed = useSectionEditor<ContactContent>("contact", initial);
  const c = ed.value;
  const set = (patch: Partial<ContactContent>) => ed.update(patch);

  return (
    <EditorShell description="The Contact section of the home page." viewHref="/#contact" ed={ed}>
      <Card title="Heading" hint={`Displays as: "${c.headingItalic} ${c.headingBrand}".`}>
        <Row>
          <TextField label="First part (italic)" value={c.headingItalic} max={30} onChange={(v) => set({ headingItalic: v })} />
          <TextField label="Highlighted part (gold script)" value={c.headingBrand} max={40} onChange={(v) => set({ headingBrand: v })} />
        </Row>
      </Card>

      <Card title="Studio address">
        <TextField label="Location" value={c.studioTitle} max={60} onChange={(v) => set({ studioTitle: v })} />
        <Row>
          <TextField label="Line 1" value={c.studioLine1} max={60} onChange={(v) => set({ studioLine1: v })} />
          <TextField label="Line 2" value={c.studioLine2} max={60} onChange={(v) => set({ studioLine2: v })} />
        </Row>
      </Card>

      <Card title="Email">
        <TextField
          label="Email address shown on the site"
          type="email"
          value={c.email}
          max={254}
          hint="Display only. Where form enquiries are delivered is set in your contact API route."
          onChange={(v) => set({ email: v })}
        />
      </Card>

      <Card title="Phone and WhatsApp">
        <Row>
          <TextField label="Phone number" type="tel" value={c.phone} max={20} placeholder="+91 95500 44475" hint="Include the country code." onChange={(v) => set({ phone: v })} />
          <TextField label="Phone link text" value={c.phoneLabel} max={30} onChange={(v) => set({ phoneLabel: v })} />
        </Row>
        <Row>
          <TextField label="WhatsApp number" type="tel" value={c.whatsapp} max={24} placeholder="919550044475" hint="Country code first, digits only." onChange={(v) => set({ whatsapp: v })} />
          <TextField label="WhatsApp link text" value={c.whatsappLabel} max={30} onChange={(v) => set({ whatsappLabel: v })} />
        </Row>
        <TextField label="Message pre-filled in WhatsApp" multiline rows={3} value={c.whatsappMessage} max={300} onChange={(v) => set({ whatsappMessage: v })} />
      </Card>

      <Card title="Instagram">
        <TextField label="Profile link" type="url" value={c.instagramUrl} max={200} placeholder="https://www.instagram.com/yourname/" onChange={(v) => set({ instagramUrl: v })} />
        <Row>
          <TextField label="Handle" value={c.instagramHandle} max={40} onChange={(v) => set({ instagramHandle: v })} />
          <TextField label="Caption" value={c.instagramLabel} max={40} onChange={(v) => set({ instagramLabel: v })} />
        </Row>
      </Card>

      <Card title="Reply note" hint="Small line with the green dot. Leave empty to hide the text.">
        <TextField label="Text" value={c.replyNote} max={80} onChange={(v) => set({ replyNote: v })} />
      </Card>
    </EditorShell>
  );
}
