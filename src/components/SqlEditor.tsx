"use client";

import { useEffect, useMemo, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { sql, type SQLNamespace } from "@codemirror/lang-sql";
import {
  type Completion,
  type CompletionContext,
} from "@codemirror/autocomplete";
import { EditorView } from "@codemirror/view";

type SqlEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

type SqlSchemaMap = Record<string, string[]>;

function columnCompletions(schema: SqlSchemaMap): Completion[] {
  const byCol = new Map<string, string[]>();
  for (const [table, cols] of Object.entries(schema)) {
    for (const col of cols) {
      const tables = byCol.get(col) ?? [];
      tables.push(table);
      byCol.set(col, tables);
    }
  }
  return [...byCol.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([col, tables]) => ({
      label: col,
      type: "property",
      detail: tables.join(", "),
      boost: 2,
    }));
}

/**
 * lang-sql only exposes columns at the top level for `defaultTable`.
 * We also want every CSV header after SELECT / WHERE, with table detail.
 */
function allColumnsSource(schema: SqlSchemaMap) {
  const options = columnCompletions(schema);
  return (context: CompletionContext) => {
    if (options.length === 0) return null;
    const word = context.matchBefore(/[A-Za-z_][\w]*/);
    if (!word || (word.from === word.to && !context.explicit)) return null;
    return {
      from: word.from,
      options,
      validFor: /^[A-Za-z_][\w]*$/,
    };
  };
}

export function SqlEditor({ value, onChange }: SqlEditorProps) {
  const [sqlSchema, setSqlSchema] = useState<SqlSchemaMap | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/schema");
        const json = (await res.json()) as {
          sqlSchema?: SqlSchemaMap;
        };
        if (!cancelled && json.sqlSchema) {
          setSqlSchema(json.sqlSchema);
        }
      } catch {
        // Editor still works without schema.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const namespace: SQLNamespace = sqlSchema ?? {};

  const extensions = useMemo(() => {
    const support = sql({
      schema: namespace,
      upperCaseKeywords: true,
      // Prefer ledger columns when both tables share names (ticker, price).
      defaultTable: "notes",
    });

    return [
      support,
      ...(sqlSchema
        ? [
            support.language.data.of({
              autocomplete: allColumnsSource(sqlSchema),
            }),
          ]
        : []),
      EditorView.theme({
        "&": {
          fontSize: "13px",
          backgroundColor: "var(--background)",
        },
        ".cm-content": {
          fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
          minHeight: "160px",
          padding: "10px 0",
        },
        ".cm-gutters": {
          backgroundColor: "transparent",
          border: "none",
          color: "var(--muted)",
        },
        ".cm-activeLine": { backgroundColor: "transparent" },
        ".cm-activeLineGutter": { backgroundColor: "transparent" },
        "&.cm-focused": { outline: "none" },
      }),
      EditorView.lineWrapping,
    ];
  }, [namespace, sqlSchema]);

  const loadedHint = sqlSchema
    ? Object.entries(sqlSchema)
        .map(([table, cols]) => `${table}(${cols.join(", ")})`)
        .join(" · ")
    : "Loading schema…";

  return (
    <div className="flex flex-col gap-1.5">
      <div className="overflow-hidden rounded-md border border-line bg-background">
        <CodeMirror
          key={sqlSchema ? "schema-ready" : "schema-pending"}
          value={value}
          height="200px"
          basicSetup={{
            lineNumbers: true,
            foldGutter: false,
            highlightActiveLine: false,
          }}
          extensions={extensions}
          onChange={onChange}
        />
      </div>
      <p className="font-mono text-[11px] leading-snug text-muted">{loadedHint}</p>
    </div>
  );
}
