export async function parseJsonResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    const text = await res.text();
    if (text.trimStart().startsWith("<!DOCTYPE") || text.trimStart().startsWith("<html")) {
      throw new Error(
        "Server returned HTML instead of JSON. Restart Polaris with: npm run build && npm start",
      );
    }
    throw new Error(text || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}
