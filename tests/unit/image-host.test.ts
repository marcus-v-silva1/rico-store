import { describe, expect, it } from "vitest";
import { isLoopbackUrl } from "@/lib/image-host";

describe("isLoopbackUrl", () => {
  it("reconhece o Supabase local", () => {
    expect(isLoopbackUrl("http://127.0.0.1:54321/storage/v1/object/public/produtos/a/b.jpg")).toBe(true);
    expect(isLoopbackUrl("http://localhost:54321/x.png")).toBe(true);
    expect(isLoopbackUrl("http://[::1]:54321/x.png")).toBe(true);
  });
  it("não pega hosts públicos nem caminhos locais", () => {
    expect(isLoopbackUrl("https://abc.supabase.co/storage/v1/object/public/produtos/a.jpg")).toBe(false);
    expect(isLoopbackUrl("https://localhost.example.com/a.jpg")).toBe(false);
    expect(isLoopbackUrl("/images/hero.jpg")).toBe(false);
    expect(isLoopbackUrl("")).toBe(false);
  });
});
