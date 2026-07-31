import { useEffect, useMemo, useState } from "react";
import type { AggregationResult } from "./types";

export default function App() {
  const [data, setData] = useState<AggregationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/results");
        const body = (await res.json()) as AggregationResult & { error?: string };
        if (!res.ok) {
          throw new Error(body.error || `Failed to load results (${res.status})`);
        }
        if (!cancelled) setData(body);
      } catch (err) {
        if (!cancelled) {
          setData(null);
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    if (!q) return data.questions;
    return data.questions.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.players?.some((p) => p.toLowerCase().includes(q)),
    );
  }, [data, query]);

  return (
    <div className="app">
      <header className="hero">
        <p className="eyebrow">Codeti take-home</p>
        <h1>Baseball FAQ Aggregator</h1>
        <p className="lede">
          Unique FAQ questions across Baseball-Reference players whose first +
          last names contain exactly three letter &ldquo;a&rdquo;s (case
          insensitive). Player names are normalized out of each question.
        </p>
      </header>

      {loading && <div className="state">Loading aggregation results…</div>}

      {!loading && error && (
        <div className="state error">
          {error}
          <br />
          <br />
          Run <code>npm run scrape</code> to generate{" "}
          <code>data/output/results.json</code>, then restart the API.
        </div>
      )}

      {!loading && data && (
        <>
          <section className="stats" aria-label="Summary stats">
            <div className="stat">
              <strong>{data.totalPlayersMatched}</strong>
              <span>Players matched</span>
            </div>
            <div className="stat">
              <strong>{data.uniqueQuestionCount}</strong>
              <span>Unique questions</span>
            </div>
            <div className="stat">
              <strong>{data.playersWithFaqs}</strong>
              <span>Players with FAQs</span>
            </div>
            <div className="stat">
              <strong>{data.lettersScraped.length}</strong>
              <span>Letters scraped</span>
            </div>
          </section>

          <div className="toolbar">
            <input
              className="search"
              type="search"
              placeholder="Filter questions or player names…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Filter questions"
            />
            <p className="meta">
              Generated {new Date(data.generatedAt).toLocaleString()} · showing{" "}
              {filtered.length}/{data.questions.length}
            </p>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: "4rem" }}>#</th>
                  <th>Question</th>
                  <th style={{ width: "9rem" }}>Player count</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, index) => (
                  <tr key={item.key}>
                    <td className="count">{index + 1}</td>
                    <td className="question">
                      {item.question}
                      {item.players && item.players.length > 0 && (
                        <p className="players">
                          {item.players.slice(0, 8).join(", ")}
                          {item.players.length > 8
                            ? ` +${item.players.length - 8} more`
                            : ""}
                        </p>
                      )}
                    </td>
                    <td className="count">
                      <span className="badge">{item.playerCount}</span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={3}>No questions match that filter.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
