export interface PreviewMessage {
  to: string;
  imageUrl: string;
  caption: string;
  /** Opaque ids carried by the reply buttons, e.g. `pp:<token>:<postId>:approve`. */
  buttonIds: { approve: string; edit: string; skip: string };
}

export interface MessagingProvider {
  readonly name: "mock" | "whatsapp";
  sendPreview(msg: PreviewMessage): Promise<{ messageId: string }>;
  sendText(to: string, text: string): Promise<{ messageId: string }>;
}

class MockMessaging implements MessagingProvider {
  readonly name = "mock" as const;
  async sendPreview() { return { messageId: `wamid.mock.${Date.now()}` }; }
  async sendText() { return { messageId: `wamid.mock.${Date.now()}` }; }
}

class WhatsAppProvider implements MessagingProvider {
  readonly name = "whatsapp" as const;
  private readonly url = `https://graph.facebook.com/${process.env.META_GRAPH_VERSION || "v21.0"}/${process.env.WA_PHONE_NUMBER_ID}/messages`;

  private async send(payload: Record<string, unknown>): Promise<{ messageId: string }> {
    const res = await fetch(this.url, {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.WA_ACCESS_TOKEN}`, "content-type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
      signal: AbortSignal.timeout(10000),
    });
    const body = (await res.json().catch(() => null)) as { messages?: { id: string }[] } | null;
    const id = body?.messages?.[0]?.id;
    if (!res.ok || !id) throw new Error(`WhatsApp send failed (${res.status})`);
    return { messageId: id };
  }

  /**
   * Business-initiated previews must use a pre-approved utility template with an image header and three
   * quick-reply buttons. Without a template name we fall back to interactive buttons, which only work inside
   * an open 24-hour customer-service window.
   */
  async sendPreview({ to, imageUrl, caption, buttonIds }: PreviewMessage) {
    const template = process.env.WA_TEMPLATE_NAME;
    if (template) {
      return this.send({
        to,
        type: "template",
        template: {
          name: template,
          language: { code: "en" },
          components: [
            { type: "header", parameters: [{ type: "image", image: { link: imageUrl } }] },
            { type: "body", parameters: [{ type: "text", text: caption.slice(0, 900).replace(/\n/g, " ") }] },
            ...(["approve", "edit", "skip"] as const).map((k, index) => ({ type: "button", sub_type: "quick_reply", index: String(index), parameters: [{ type: "payload", payload: buttonIds[k] }] })),
          ],
        },
      });
    }
    return this.send({
      to,
      type: "interactive",
      interactive: {
        type: "button",
        header: { type: "image", image: { link: imageUrl } },
        body: { text: caption.slice(0, 1000) },
        action: { buttons: (["approve", "edit", "skip"] as const).map((k) => ({ type: "reply", reply: { id: buttonIds[k], title: k === "approve" ? "✅ Approve" : k === "edit" ? "✏️ Edit" : "⏭ Skip" } })) },
      },
    });
  }

  sendText(to: string, text: string) {
    return this.send({ to, type: "text", text: { body: text } });
  }
}

export function whatsappConfigured(): boolean {
  return Boolean(process.env.WA_PHONE_NUMBER_ID && process.env.WA_ACCESS_TOKEN && process.env.WA_OWNER_NUMBER);
}

export function getMessaging(live: boolean): MessagingProvider {
  return live && whatsappConfigured() ? new WhatsAppProvider() : new MockMessaging();
}
