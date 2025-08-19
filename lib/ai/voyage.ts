export type VoyageInputType = 'query' | 'document';

export interface VoyageEmbedOptions {
  apiKey?: string;
  model?: string;
  inputType?: VoyageInputType;
}

export interface VoyageEmbedResponse {
  embedding: number[];
  model: string;
  dimensions: number;
}

// Minimal client for Voyage AI embeddings
export async function embedText(text: string, opts: VoyageEmbedOptions = {}): Promise<VoyageEmbedResponse> {
  const apiKey = opts.apiKey || process.env.VOYAGE_API_KEY;
  if (!apiKey) {
    throw new Error('VOYAGE_API_KEY is not set');
  }

  const model = opts.model || 'voyage-3-large';
  const inputType: VoyageInputType = opts.inputType || 'document';

  const res = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: text,
      input_type: inputType,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Voyage API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  // Expected shape: { data: [{ embedding: number[] }], model: string }
  const embedding: number[] = data?.data?.[0]?.embedding || [];
  return { embedding, model: data?.model || model, dimensions: embedding.length };
}

