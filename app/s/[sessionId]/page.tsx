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
import Image from "next/image";

const TEST_MODE = true;

function getBucketColor(score: number | null) {
  if (!score) {
    return {
      border: "rgba(248, 250, 252, 0.7)",
      bg: "transparent",
      text: "#e5e7eb",
    };
  }
  if (score <= 6) {
    return {
      border: "#f97373",
      bg: "#b91c1c",
      text: "#ffffff",
    };
  }
  if (score <= 8) {
    return {
      border: "#fbbf24",
      bg: "#c27803",
      text: "#ffffff",
    };
  }
  return {
    border: "#22c55e",
    bg: "#15803d",
    text: "#ffffff",
  };
}

// Basit ama iş gören email kontrolü
function isValidEmail(email: string) {
  // boş değilse email@domain.tld formatına baksın
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function NpsInputPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  // device id + daha önce oy vermiş mi kontrolü (TEST_MODE hariç)
  useEffect(() => {
    if (TEST_MODE || !sessionId) return;
    if (typeof window === "undefined") return;

    const key = `nps_device_${sessionId}`;
    let id = window.localStorage.getItem(key);

    if (!id) {
      const rand =
        (window.crypto && window.crypto.randomUUID
          ? window.crypto.randomUUID()
          : Math.random().toString(36).slice(2)) + "_" + Date.now();
      id = rand;
      window.localStorage.setItem(key, id);
    }
    setDeviceId(id);

    (async () => {
      try {
        const ref = doc(db, "sessions", sessionId, "votes", id!);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data() as { score?: number; email?: string };
          if (typeof data.score === "number") {
            setSelectedScore(data.score);
          }
          if (typeof data.email === "string") {
            setEmail(data.email);
          }
          setHasSubmitted(true);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [sessionId]);

  const handleScoreClick = (score: number) => {
    if (!TEST_MODE && hasSubmitted) return;

    setSelectedScore(score);
    setError(null);

    // Test modda yeni skor seçince tekrar gönderebilsin
    if (TEST_MODE && hasSubmitted) {
      setHasSubmitted(false);
    }
  };

  const handleSend = async () => {
    if (!sessionId || selectedScore == null) return;
    if (isSubmitting) return;
    if (!TEST_MODE && hasSubmitted) return;

    const trimmedEmail = email.trim();

    // Email doluysa formatını kontrol et
    if (trimmedEmail && !isValidEmail(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const votesCol = collection(db, "sessions", sessionId, "votes");

      const payload: any = {
        score: selectedScore,
        createdAt: serverTimestamp(),
      };
      if (trimmedEmail) {
        payload.email = trimmedEmail;
      }

      if (TEST_MODE) {
        await addDoc(votesCol, payload);
        setHasSubmitted(true);
      } else {
        if (!deviceId) {
          throw new Error("Device ID not ready");
        }
        const ref = doc(db, "sessions", sessionId, "votes", deviceId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setHasSubmitted(true);
          setError("You have already submitted feedback from this device.");
        } else {
          await setDoc(ref, payload);
          setHasSubmitted(true);
        }
      }
      } catch (e: any) {
    console.error(e);
    const message =
      e?.message ||
      (typeof e === "string" ? e : "Something went wrong. Please try again.");
    setError(message);
  } finally {
      setIsSubmitting(false);
    }
  };

  const sendColors = getBucketColor(selectedScore);
  const sendDisabled =
    selectedScore == null || isSubmitting || (!TEST_MODE && hasSubmitted);

  const isInitial = selectedScore == null;
  const showThanks = hasSubmitted;

  const borderColor = isInitial
    ? "#ffffff"
    : showThanks
    ? sendColors.border
    : sendColors.border;

  const backgroundColor = isInitial
    ? "transparent"
    : showThanks
    ? "transparent"
    : sendColors.bg;

  const textColor = isInitial
    ? "#ffffff"
    : showThanks
    ? "#e5e7eb"
    : sendColors.text;

  // Alt satır hizalaması için: 7 -> col 2, 8 -> 3, 9 -> 4, 10 -> 5
  const colByScore: Record<number, string> = {
    7: "2 / 3",
    8: "3 / 4",
    9: "4 / 5",
    10: "5 / 6",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        width: "100vw",
        background: "#0f172a",
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px 16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {/* Başlık */}
        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            marginBottom: 4,
          }}
        >
          AI x Product Management
        </h1>
        <p
          style={{
            fontSize: 16,
            color: "#cbd5f5",
          }}
        >
          The New Paradigm
        </p>

        {/* Soru */}
        <p
          style={{
            marginTop: 32,
            fontSize: 20,
            lineHeight: 1.4,
            color: "#e5e7eb",
          }}
        >
          How likely are you to recommend this session to a friend or colleague?
        </p>

        {/* SKOR BUTONLARI – 1–6 üst satır, 7–10 alt satır (6 sütun hizalı) */}
        <div
          style={{
            marginTop: 28,
            width: "100%",
            maxWidth: 420,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {/* Row 1: 1–6 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
              gap: 10,
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => {
              const score = i + 1;
              const bucketColors = getBucketColor(score);
              const isSelected = selectedScore === score;

              return (
                <button
                  key={score}
                  type="button"
                  onClick={() => handleScoreClick(score)}
                  style={{
                    aspectRatio: "1 / 1",
                    borderRadius: 999,
                    border: `2px solid ${bucketColors.border}`,
                    background: isSelected ? bucketColors.bg : "transparent",
                    color: isSelected ? bucketColors.text : bucketColors.border,
                    fontSize: 18,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition:
                      "transform 0.1s ease, box-shadow 0.1s ease, background 0.1s ease",
                    boxShadow: isSelected
                      ? "0 8px 30px rgba(0,0,0,0.4)"
                      : "none",
                  }}
                >
                  {score}
                </button>
              );
            })}
          </div>

          {/* Row 2: 7–10 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
              gap: 10,
            }}
          >
            {Array.from({ length: 4 }).map((_, i) => {
              const score = i + 7;
              const bucketColors = getBucketColor(score);
              const isSelected = selectedScore === score;

              return (
                <button
                  key={score}
                  type="button"
                  onClick={() => handleScoreClick(score)}
                  style={{
                    aspectRatio: "1 / 1",
                    borderRadius: 999,
                    border: `2px solid ${bucketColors.border}`,
                    background: isSelected ? bucketColors.bg : "transparent",
                    color: isSelected ? bucketColors.text : bucketColors.border,
                    fontSize: 18,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition:
                      "transform 0.1s ease, box-shadow 0.1s ease, background 0.1s ease",
                    boxShadow: isSelected
                      ? "0 8px 30px rgba(0,0,0,0.4)"
                      : "none",
                    gridColumn: colByScore[score],
                  }}
                >
                  {score}
                </button>
              );
            })}
          </div>
        </div>

        {/* Alt açıklama */}
        <div
          style={{
            marginTop: 20,
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            maxWidth: 420,
            fontSize: 12,
            color: "#9ca3af",
          }}
        >
          <span>1 = Not at all likely</span>
          <span>10 = Extremely likely</span>
        </div>

        {/* OPTIONAL EMAIL FIELD */}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Type your email address (optional)"
          style={{
            marginTop: 24,
            height: 48,
            width: "100%",
            maxWidth: 360,
            borderRadius: 999,
            border: "1px solid rgba(248,250,252,0.45)",
            background: "rgba(248,250,252,0.06)",
            color: "#e5e7eb",
            padding: "0 18px",
            fontSize: 14,
            outline: "none",
          }}
        />

        {/* SEND butonu */}
        <button
          type="button"
          onClick={handleSend}
          disabled={sendDisabled}
          style={{
            marginTop: 16,
            height: 56,
            width: "100%",
            maxWidth: 360,
            borderRadius: 999,
            border: `3px solid ${borderColor}`,
            background: backgroundColor,
            color: textColor,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            cursor: sendDisabled ? "default" : "pointer",
            fontSize: 16,
            fontWeight: 700,
            opacity: sendDisabled ? 0.9 : 1,
            transition:
              "background 0.15s ease, transform 0.1s ease, box-shadow 0.1s ease, opacity 0.1s ease",
            boxShadow:
              !sendDisabled && !showThanks && !isInitial
                ? "0 10px 30px rgba(0,0,0,0.45)"
                : "none",
          }}
        >
          {showThanks ? (
            <span>Thanks for your feedback</span>
          ) : (
            <>
              <span>SEND</span>
              <Image
                src="/send.png"
                alt="Send"
                width={18}
                height={18}
                style={{ display: "block" }}
              />
            </>
          )}
        </button>

        {/* Hata mesajı */}
        {error && (
          <div
            style={{
              marginTop: 12,
              fontSize: 13,
              color: "#f97373",
            }}
          >
            {error}
          </div>
        )}

        {/* Anonim / tek cevap info */}
        <div
          style={{
            marginTop: 18,
            fontSize: 12,
            color: "#9ca3af",
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          This poll is anonymous and limited to one response per device in the
          live version.
        </div>

        {/* Test mode notu */}
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