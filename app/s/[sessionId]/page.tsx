"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  addDoc,
  collection,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const TEST_MODE = false;

export default function NpsInputPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [userId, setUserId] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [existingScore, setExistingScore] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">(
    "idle"
  );

  useEffect(() => {
    if (!sessionId) return;
    const stored = window.localStorage.getItem("npsUserId");
    let uid = stored;
    if (!uid) {
      uid =
        crypto.randomUUID?.() ??
        `u_${Math.random().toString(36).slice(2)}_${Date.now()}`;
      window.localStorage.setItem("npsUserId", uid);
    }
    setUserId(uid);

    const check = async () => {
      const ref = doc(db, "sessions", sessionId, "votes", uid!);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data() as { score?: number };
        if (typeof data.score === "number") {
          setExistingScore(data.score);
          setHasSubmitted(true);
        }
      }
    };

    check();
  }, [sessionId]);

  const handleVote = async (score: number) => {
    if (!sessionId) return;
    if (!TEST_MODE && hasSubmitted) return;

    setStatus("sending");

    try {
      if (TEST_MODE) {
        await addDoc(collection(db, "sessions", sessionId, "votes"), {
          score,
          createdAt: serverTimestamp(),
        });
      } else {
        const ref = doc(db, "sessions", sessionId, "votes", userId!);
        await setDoc(ref, {
          score,
          createdAt: serverTimestamp(),
        });
        setHasSubmitted(true);
      }
      setExistingScore(score);
      setStatus("done");
    } catch (e) {
      console.error(e);
      setStatus("error");
    }
  };

  const disabled =
    status === "sending" || (!TEST_MODE && hasSubmitted);

  // Buton renkleri (boşken: bg #0f172a, text = border rengi)
  const getColors = (num: number, selected: boolean) => {
    let border = "#334155";
    let bg = "#0f172a";
    let text = border;

    if (num <= 6) {
      border = "#ef4444";
      text = border;
      if (selected) {
        bg = border;
        text = "#ffffff";
      }
    } else if (num <= 8) {
      border = "#f97316";
      text = border;
      if (selected) {
        bg = border;
        text = "#ffffff";
      }
    } else {
      border = "#16a34a";
      text = border;
      if (selected) {
        bg = "#22c55e";
        text = "#ffffff";
      }
    }

    return { bg, border, text };
  };

  return (
    <main
      style={{
        height: "100vh",
        overflow: "hidden",
        background: "#0f172a",
        padding: 16,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 500 }}>
        {/* Başlık */}
        <h1
          style={{
            fontSize: 24,
            fontWeight: 700,
            textAlign: "center",
            color: "white",
          }}
        >
          AI x Product Management
          <br />
          <span
            style={{
              fontSize: 18,
              fontWeight: 500,
              color: "#cbd5f5",
            }}
          >
            The New Paradigm
          </span>
        </h1>

        {/* Soru */}
        <p
          style={{
            marginTop: 16,
            marginBottom: 20,
            color: "#cbd5f5",
            fontSize: 14,
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          How likely are you to recommend this session to a friend or
          colleague?
        </p>

                {/* Butonlar */}
        <div
          style={{
            marginTop: 18,
            display: "flex",
            flexWrap: "wrap",          // tek satıra zorlamıyoruz, taşarsa alta iner
            gap: 14,                    // buton aralıkları daha geniş
            justifyContent: "center",
            maxWidth: 460,              // ortada kompakt bir alan
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => {
            const selected = existingScore === num;
            const { bg, border, text } = getColors(num, selected);

            return (
              <button
                key={num}
                onClick={() => handleVote(num)}
                disabled={disabled && !selected}
                style={{
                  minWidth: 52,          // BUTONLAR DAHA BÜYÜK
                  height: 52,
                  borderRadius: "50%",
                  border: `1px solid ${border}`,
                  background: bg,
                  color: text,
                  fontSize: 18,          // sayı daha büyük
                  fontWeight: 600,
                }}
              >
                {num}
              </button>
            );
          })}
        </div>

        {/* Skala açıklaması */}
        <div
          style={{
            marginTop: 10,
            display: "flex",
            justifyContent: "space-between",
            fontSize: 11,
            color: "#94a3b8",
          }}
        >
          <span>1 = Not at all likely</span>
          <span>10 = Extremely likely</span>
        </div>

        {/* Alt bilgi */}
        <div
          style={{
            marginTop: 14,
            textAlign: "center",
            fontSize: 11,
            color: "#6b7280",
          }}
        >
          This poll is anonymous and limited to one response per
          device in the live version.
        </div>

        {TEST_MODE && (
          <div
            style={{
              marginTop: 8,
              textAlign: "center",
              color: "#facc15",
              fontSize: 11,
            }}
          >
            TEST MODE: Multiple submissions allowed.
          </div>
        )}
      </div>
    </main>
  );
}