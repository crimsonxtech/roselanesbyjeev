"use client";

import type { HeroContent, SiteImage } from "@/lib/site-content";
import { Card, EditorShell, ImageField, NumberField, Row, TextField, useSectionEditor } from "./editor-kit";

const SLOTS = [
  { label: "Main photo", hint: "Large centre photo, shown first in the viewer." },
  { label: "Top-left photo", hint: "Small floating photo." },
  { label: "Bottom-left photo", hint: "Small floating photo." },
  { label: "Right photo", hint: "Small floating photo." },
];

export function HeroEditor({ initial }: { initial: HeroContent }) {
  const ed = useSectionEditor<HeroContent>("hero", initial);
  const c = ed.value;

  const setStat = (i: number, patch: Partial<HeroContent["stats"][number]>) =>
    ed.update({ stats: c.stats.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) });

  const setImage = (i: number, next: SiteImage) =>
    ed.update({ images: c.images.map((img, idx) => (idx === i ? next : img)) });

  return (
    <EditorShell description="The first thing visitors see on the home page." viewHref="/#hero" ed={ed}>
      <Card title="Headline" hint={`Displays as: "${c.headlineItalic} ${c.headlineBrand}" on the first line and "${c.headlineLine2}" on the second.`}>
        <TextField label="Tagline (above the headline)" value={c.tagline} max={70} onChange={(v) => ed.update({ tagline: v })} />
        <Row>
          <TextField label="Small word (italic)" value={c.headlineItalic} max={12} onChange={(v) => ed.update({ headlineItalic: v })} />
          <TextField label="Highlighted word (gold script)" value={c.headlineBrand} max={20} onChange={(v) => ed.update({ headlineBrand: v })} />
        </Row>
        <TextField label="Second line" value={c.headlineLine2} max={20} onChange={(v) => ed.update({ headlineLine2: v })} />
      </Card>

      <Card title="Statistics" hint="Three counters that count up when the page loads. A “+” is added after each number.">
        {c.stats.map((s, i) => (
          <Row key={i}>
            <NumberField label={`Number ${i + 1}`} value={s.value} onChange={(v) => setStat(i, { value: v })} />
            <TextField label={`Label ${i + 1}`} value={s.label} max={20} onChange={(v) => setStat(i, { label: v })} />
          </Row>
        ))}
      </Card>

      <Card title="Buttons" hint="Only the text is editable. The first goes to the quote page, the second scrolls to the portfolio.">
        <Row>
          <TextField label="First button" value={c.primaryCta} max={24} onChange={(v) => ed.update({ primaryCta: v })} />
          <TextField label="Second button" value={c.secondaryCta} max={28} onChange={(v) => ed.update({ secondaryCta: v })} />
        </Row>
      </Card>

      <Card title="Photos" hint="Optimised automatically to WebP (up to 1800 px). Uploads are not live until you press Save.">
        {c.images.map((img, i) => (
          <ImageField
            key={i}
            label={SLOTS[i].label}
            hint={SLOTS[i].hint}
            image={img}
            preset="hero"
            frameClass="aspect-[2/3]"
            onChange={(next) => setImage(i, next)}
            onBusy={ed.trackUpload}
          />
        ))}
      </Card>
    </EditorShell>
  );
}
