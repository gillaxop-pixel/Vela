import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/imagine")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: { prompt?: string };
        try {
          body = (await request.json()) as { prompt?: string };
        } catch {
          return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
        }

        const prompt = (body.prompt ?? "").trim().slice(0, 1200);
        if (prompt.length < 3) {
          return Response.json({ ok: false, error: "Prompt too short" }, { status: 400 });
        }

        // Pollinations free image generation (no API key required)
        // Encode the prompt for the URL
        const encoded = encodeURIComponent(prompt);
        // Use flux model, decent quality, no watermark on basic use
        const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?model=flux&width=1024&height=768&nologo=true&enhance=true`;

        // Pollinations returns the image directly. We just return the URL.
        // Optional: do a HEAD request to check availability, but not required.
        return Response.json({
          ok: true,
          url: imageUrl,
        });
      },
    },
  },
});
