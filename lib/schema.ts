import { z } from "zod";

// The "machine dossier": one file per machine. The app only reads this data, never hard-codes it.
export const SourceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(3),
  publisher: z.string().min(2),
  url: z.string().url().optional(), // missing = link still to be found and checked
});

export const DossierSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/, "id must be a lowercase slug"),
    name: z.string().min(2),
    world: z.enum(["moon", "mars"]),
    location: z.object({
      siteName: z.string().min(2),
      lat: z.number().min(-90).max(90),
      lon: z.number().min(-180).max(180),
    }),
    mission: z.string().min(2),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "use YYYY-MM-DD"),
    status: z.enum(["silent", "active", "lost"]),
    lastContact: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "use YYYY-MM-DD").optional(),
    art: z.enum(["rover-small", "rover", "buggy", "lander-legs", "lander-viking", "lander-solar", "helicopter", "mirror"]),
    learnMore: z.object({ label: z.string().min(3), url: z.string().url() }).optional(),
    // Optional real photo (e.g. NASA public-domain image). The illustration is used until this is set.
    image: z.object({ url: z.union([z.string().url(), z.string().regex(/^\/machines\/[a-z0-9-]+\.(jpg|jpeg|png|webp)$/, "use https://... or /machines/name.jpg")]), alt: z.string().min(5), credit: z.string().min(3), creditUrl: z.string().url().optional(), note: z.string().min(3).max(40).optional() }).optional(), // note = honest label, e.g. ARTIST’S CONCEPT
    // Game step 2 ("listen"): short briefing cards the machine tells BEFORE the challenge. Every clue answer must be findable here.
    learn: z.array(z.object({ title: z.string().min(3), text: z.string().min(30) })).min(3),
    // Game: clue questions players answer to decode the signal. Must come straight from verified facts in this dossier.
    clues: z.array(z.object({
      prompt: z.string().min(10),
      options: z.array(z.string().min(2)).length(3),
      answer: z.number().int().min(0).max(2),
      explain: z.string().min(10),
      card: z.number().int().min(0).max(5), // which briefing card holds the answer (used for the hint)
    })).min(2),
    // Mission replay: key moments in order. Dates may be YYYY, YYYY-MM or YYYY-MM-DD. `fx` triggers a visual effect.
    timeline: z.array(z.object({
      date: z.string().regex(/^\d{4}(-\d{2}(-\d{2})?)?$/, "use YYYY, YYYY-MM or YYYY-MM-DD"),
      tone: z.enum(["arrive", "discover", "trouble", "end", "live"]),
      title: z.string().min(4),
      text: z.string().min(15),
      fx: z.enum(["laser", "dust", "quake", "flight"]).optional(),
    })).min(2),
    // Optional rover/helicopter path (from NASA data) drawn on the surface during replay. None are included yet.
    route: z.array(z.object({ lat: z.number().min(-90).max(90), lon: z.number().min(-180).max(180) })).min(2).optional(),
    summary: z.string().min(20),
    discoveries: z.array(z.string().min(5)).min(1),
    stories: z.object({
      kids: z.string().min(20),
      explorer: z.string().min(20),
      scientist: z.string().min(20),
    }),
    keyNumbers: z.array(z.object({ label: z.string(), value: z.string(), sourceId: z.string() })),
    sources: z.array(SourceSchema).min(1, "every dossier needs at least one source"),
    review: z.object({
      status: z.enum(["draft", "verified"]),
      reviewer: z.string().optional(),
      date: z.string().optional(),
    }),
  })
  .superRefine((d, ctx) => {
    for (let i = 1; i < d.timeline.length; i++)
      if (d.timeline[i].date < d.timeline[i - 1].date) ctx.addIssue({ code: "custom", path: ["timeline", i, "date"], message: "timeline must be in date order" });
    d.clues.forEach((c, i) => { if (c.card >= d.learn.length) ctx.addIssue({ code: "custom", path: ["clues", i, "card"], message: "card index is outside the learn list" }); });
    const ids = new Set(d.sources.map((s) => s.id));
    d.keyNumbers.forEach((k, i) => {
      if (!ids.has(k.sourceId))
        ctx.addIssue({ code: "custom", path: ["keyNumbers", i, "sourceId"], message: `unknown source "${k.sourceId}"` });
    });
    if (d.status !== "active" && !d.lastContact)
      ctx.addIssue({ code: "custom", path: ["lastContact"], message: "silent or lost machines need a lastContact date" });
    if (d.review.status === "verified" && (!d.review.reviewer || !d.review.date))
      ctx.addIssue({ code: "custom", path: ["review"], message: "verified dossiers need a reviewer and a date" });
  });

export type Dossier = z.infer<typeof DossierSchema>;
