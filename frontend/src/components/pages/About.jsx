import { API_BASE_URL } from "../../config/api";
import { useState } from "react";

function AdminSQLConsole() {
  const [sql, setSql] = useState("SELECT * FROM users");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const runQuery = async () => {
    setLoading(true);
    setErr("");
    setRows([]);

    try {
      const res = await fetch(`${API_BASE_URL}/query`, {       // Call backend API to run SQL
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sql }),
      });

      const body = await res.json();

      if (!res.ok) {
        // body.detail is from FastAPI HTTPException
        throw new Error(body.detail || "Query failed");
      }

      // body.rows should now always be an array if Option A is applied
      if (Array.isArray(body.rows)) {
        setRows(body.rows);
      } else if (body.rows && typeof body.rows === "object") {
        // just in case, defensive
        setRows([body.rows]);
      } else {
        setRows([]);
      }
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  // dynamic headers from the first row
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <div style={{ padding: "1rem", maxWidth: "900px", margin: "0 auto" }}>
      <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "0.5rem" }}>
        Admin SQL Console
      </h2>

      <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "500" }}>
        SQL Command
      </label>
      <textarea
        value={sql}
        onChange={(e) => setSql(e.target.value)}
        style={{
          width: "100%",
          minHeight: "100px",
          fontFamily: "monospace",
          fontSize: "0.9rem",
          padding: "0.75rem",
          border: "1px solid #888",
          borderRadius: "4px",
          resize: "vertical",
          outline: "none",
        }}
      />

      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
        <button
          onClick={runQuery}
          style={{
            backgroundColor: "#1f2937",
            color: "white",
            border: "none",
            padding: "0.5rem 1rem",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: 500,
          }}
          disabled={loading}
        >
          {loading ? "Running..." : "Run SQL"}
        </button>

        <button
          onClick={() => setSql("SELECT * FROM users;")}
          style={{
            backgroundColor: "#e5e7eb",
            color: "#111827",
            border: "1px solid #9ca3af",
            padding: "0.5rem 1rem",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: 500,
          }}
          disabled={loading}
        >
          Load: SELECT users
        </button>

        <button
          onClick={() =>
            setSql(
              "UPDATE users SET user_name = 'New Name' WHERE user_id = 'PUT-UUID-HERE';"
            )
          }
          style={{
            backgroundColor: "#e5e7eb",
            color: "#111827",
            border: "1px solid #9ca3af",
            padding: "0.5rem 1rem",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: 500,
          }}
          disabled={loading}
        >
          Load: UPDATE example
        </button>

        <button
          onClick={() =>
            setSql(
              "INSERT INTO users (user_id, user_name, user_email) VALUES ('UUID-HERE','Peak','peak@example.com');"
            )
          }
          style={{
            backgroundColor: "#e5e7eb",
            color: "#111827",
            border: "1px solid #9ca3af",
            padding: "0.5rem 1rem",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: 500,
          }}
          disabled={loading}
        >
          Load: INSERT example
        </button>
      </div>

      {err && (
        <div
          style={{
            marginTop: "0.75rem",
            color: "#b91c1c",
            backgroundColor: "#fee2e2",
            padding: "0.5rem 0.75rem",
            borderRadius: "4px",
            border: "1px solid #fca5a5",
            fontSize: "0.9rem",
          }}
        >
          Error: {err}
        </div>
      )}

      <div style={{ marginTop: "1rem" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "0.5rem" }}>
          Result
        </h3>

        {rows.length === 0 ? (
          <div
            style={{
              fontSize: "0.9rem",
              color: "#6b7280",
              fontStyle: "italic",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              padding: "1rem",
            }}
          >
            {loading
              ? "Loading..."
              : "No rows returned. (This is normal for INSERT/UPDATE/DELETE.)"}
          </div>
        ) : (
          <div
            style={{
              overflowX: "auto",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
            }}
          >
            <table
              style={{
                borderCollapse: "collapse",
                width: "100%",
                minWidth: "600px",
                fontSize: "0.9rem",
              }}
            >
              <thead style={{ backgroundColor: "#f9fafb" }}>
                <tr>
                  {headers.map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        borderBottom: "1px solid #d1d5db",
                        padding: "0.5rem 0.75rem",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i}>
                    {headers.map((h) => (
                      <td
                        key={h}
                        style={{
                          borderBottom: "1px solid #e5e7eb",
                          verticalAlign: "top",
                          padding: "0.5rem 0.75rem",
                          fontFamily: "monospace",
                        }}
                      >
                        {String(row[h])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminSQLConsole;
