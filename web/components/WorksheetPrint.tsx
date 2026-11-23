"use client";

import { ArrowLeftIcon, FileTextIcon } from "@radix-ui/react-icons";
import { Button, Callout, Text } from "@radix-ui/themes";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, errorText } from "@/lib/api";
import { answerText, CIRCLED, type WorksheetFull } from "@/lib/types";

/** A4 paper view of a worksheet; the browser's print dialog saves it as PDF. */
export function WorksheetPrint({ id }: { id: number }) {
  const [w, setW] = useState<WorksheetFull | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    api<WorksheetFull>(`/worksheets/${id}`).then(
      (x) => {
        setW(x);
        document.title = `${x.title} · 문제곳간`;
      },
      (e) => setError(errorText(e)),
    );
  }, [id]);
  return (
    <>
      <div className="print-bar">
        <Button variant="ghost" color="gray" asChild>
          <Link href={`/worksheets/${id}`}>
            <ArrowLeftIcon /> 문제지 고치기
          </Link>
        </Button>
        <Text size="2" color="gray" className="print-hint" style={{ marginLeft: "auto" }}>
          인쇄 창에서 대상을 &apos;PDF로 저장&apos;으로 고르면 PDF가 돼요
        </Text>
        <Button onClick={() => window.print()} disabled={!w} style={{ marginLeft: "auto" }}>
          <FileTextIcon /> 인쇄 · PDF로 저장
        </Button>
      </div>
      {error && (
        <Callout.Root color="red" m="4" role="alert">
          <Callout.Text>{error}</Callout.Text>
        </Callout.Root>
      )}
      {w && (
        <article className="paper">
          <header className="head">
            <div>
              <h1>{w.title}</h1>
              {w.subtitle && <div>{w.subtitle}</div>}
            </div>
            <div style={{ textAlign: "right", fontSize: "9.5pt" }}>
              {w.problems.length}문항
              <br />
              이름 ________________
            </div>
          </header>
          <ol className="q-list" data-cols={w.columns}>
            {w.problems.map((p, i) => (
              <li key={p.id} className="q">
                <span className="no">{i + 1}.</span>
                <div>
                  <p>{p.stem}</p>
                  {p.type === "multiple" && (
                    <ol>
                      {p.choices.map((c, j) => (
                        <li key={j}>
                          {CIRCLED[j]} {c}
                        </li>
                      ))}
                    </ol>
                  )}
                  {p.type === "ox" && <p style={{ marginTop: 4 }}>( O / X )</p>}
                  {(p.type === "short" || p.type === "essay") && <div className="space" style={{ height: p.type === "essay" ? "34mm" : "12mm" }} />}
                </div>
              </li>
            ))}
          </ol>
          {w.withAnswers && (
            <section className="answers">
              <header className="head">
                <h1>정답과 해설</h1>
                <div>{w.title}</div>
              </header>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: "10mm" }}>번호</th>
                    <th style={{ width: "40mm" }}>정답</th>
                    <th>해설</th>
                  </tr>
                </thead>
                <tbody>
                  {w.problems.map((p, i) => (
                    <tr key={p.id}>
                      <td>{i + 1}</td>
                      <td style={{ whiteSpace: "pre-wrap" }}>{answerText(p) || "—"}</td>
                      <td style={{ whiteSpace: "pre-wrap" }}>{p.explanation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </article>
      )}
    </>
  );
}
