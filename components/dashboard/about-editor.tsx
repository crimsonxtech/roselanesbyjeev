"use client";

import type { AboutContent } from "@/lib/site-content";
import { Card, EditorShell, ImageField, Row, TextField, useSectionEditor } from "./editor-kit";

export function AboutEditor({ initial }: { initial: AboutContent }) {
  const ed = useSectionEditor<AboutContent>("about", initial);
  const c = ed.value;

  return (
    <EditorShell description="The About section of the home page." viewHref="/#about" ed={ed}>
      <Card title="Heading" hint={`Displays as: "${c.headingItalic} ${c.headingBrand}".`}>
        <Row>
          <TextField label="First word (italic)" value={c.headingItalic} max={20} onChange={(v) => ed.update({ headingItalic: v })} />
          <TextField label="Highlighted word (gold script)" value={c.headingBrand} max={30} onChange={(v) => ed.update({ headingBrand: v })} />
        </Row>
      </Card>

      <Card title="Founder" hint="The photo is cropped to the portrait frame (5:8) automatically, centred on the face.">
        <ImageField
          label="Founder photo"
          hint="Tall portrait photos work best."
          image={c.image}
          preset="about"
          frameClass="aspect-[5/8]"
          onChange={(image) => ed.update({ image })}
          onBusy={ed.trackUpload}
        />
        <Row>
          <TextField label="Name" value={c.founderName} max={40} onChange={(v) => ed.update({ founderName: v })} />
          <TextField label="Title" value={c.founderTitle} max={60} onChange={(v) => ed.update({ founderTitle: v })} />
        </Row>
      </Card>

      <Card title="Text" hint="The page scales the text to fit beside the photo, so very long text will appear smaller.">
        <TextField label="Introduction" multiline rows={6} value={c.intro} max={700} onChange={(v) => ed.update({ intro: v })} />
        <TextField label="Story" multiline rows={7} value={c.story} max={800} onChange={(v) => ed.update({ story: v })} />
        <TextField label="Closing quote" multiline rows={3} value={c.quote} max={220} onChange={(v) => ed.update({ quote: v })} />
      </Card>

      <Card title="Buttons" hint="Only the text is editable. The first scrolls to Contact, the second to the portfolio.">
        <Row>
          <TextField label="First button" value={c.primaryCta} max={24} onChange={(v) => ed.update({ primaryCta: v })} />
          <TextField label="Second button" value={c.secondaryCta} max={28} onChange={(v) => ed.update({ secondaryCta: v })} />
        </Row>
      </Card>
    </EditorShell>
  );
}
