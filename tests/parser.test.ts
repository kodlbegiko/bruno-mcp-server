import { describe, it, expect } from "vitest";
import { parseBruRequest } from "../src/parser.js";

describe("Bruno request detail parser", () => {
  it("should parse a complete valid .bru request", () => {
    const source = `meta {
  name: Get Users Info
  type: http
  seq: 2
}

post {
  url: https://api.example.com/v1/users
  body: json
  auth: bearer
}

headers {
  Content-Type: application/json
  Authorization: Bearer {{token}}
  ~X-Disabled-Header: unused
  # X-Commented-Header: skipped
  // X-Another-Comment: skipped
}

auth:bearer {
  token: {{token_value}}
}

body:json {
  {
    "active": true
  }
}
`;

    const parsed = parseBruRequest(source);

    expect(parsed.method).toBe("post");
    expect(parsed.url).toBe("https://api.example.com/v1/users");
    expect(parsed.headers).toEqual({
      "Content-Type": "application/json",
      "Authorization": "Bearer {{token}}",
    });
    expect(parsed.auth).toEqual({
      type: "bearer",
      bearer: {
        token: "{{token_value}}",
      },
    });
    expect(parsed.body).toEqual({
      type: "json",
      content: '{\n  "active": true\n}',
    });
    expect(parsed.rawContent).toBe(source);
  });

  it("should handle minimal requests and tolerate missing blocks", () => {
    const source = `meta {
  name: Minimal Request
  type: http
}

get {
  url: http://localhost:3000/ping
  body: none
  auth: none
}
`;
    const parsed = parseBruRequest(source);
    expect(parsed.method).toBe("get");
    expect(parsed.url).toBe("http://localhost:3000/ping");
    expect(parsed.headers).toEqual({});
    expect(parsed.body).toEqual({
      type: "none",
      content: "",
    });
    expect(parsed.auth).toEqual({
      type: "none",
    });
  });
});
