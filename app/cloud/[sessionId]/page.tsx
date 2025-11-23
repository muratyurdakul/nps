"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Image from "next/image";

type Vote = {
  score: number;
};

export default function NpsOutputPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [votes, setVotes] = useState<Vote[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!sessionId) return;

    const colRef = collection(db, "sessions", sessionId, "votes");
    const unsub = onSnapshot(colRef, (snapshot) => {
      const list: Vote[] = snapshot.docs
        .map((doc) => doc.data() as { score?: number })
        .filter((d) => typeof d.score === "number")
        .map((d) => ({ score: d.score! }));
      setVotes(list);
    });

    return () => unsub();
  }, [sessionId]);

  const stats = useMemo(() => {
    const total = votes.length;
    if (total === 0)
      return { total, detractors: 0, passives: 0, promoters: 0, nps: 0 };

    let detractors = 0,
      passives = 0,
      promoters = 0;

    for (const v of votes) {
      if (v.score <= 6) detractors++;
      else if (v.score <= 8) passives++;
      else promoters++;
    }

    const nps =
      total === 0 ? 0 : Math.round(((promoters - detractors) / total) * 100);

    return { total, detractors, passives, promoters, nps };
  }, [votes]);

  const { total, detractors, passives, promoters, nps } = stats;

  const size = 360;
  const strokeWidth = 32;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (nps + 100) / 200;
  const offset = circumference * (1 - Math.min(1, Math.max(0, progress)));

  const npsColor =
    total === 0
      ? "#64748b"
      : nps < 0
      ? "#f97373"
      : nps < 50
      ? "#facc15"
      : "#22c55e";

  const separatorColor = "rgba(226,232,240,0.35)";

  return (
    <main
      style={{
        width: "100vw",
        height: "100vh",
        background: "#0f172a",
        color: "white",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Başlık */}
      <header
        style={{
          padding: "14px 20px 10px",
          fontSize: 24,
          fontWeight: 700,
          textAlign: "center",
          borderBottom: "1px solid rgba(148,163,184,0.3)",
        }}
      >
        AI x Product Management
        <span
          style={{
            display: "block",
            fontSize: 16,
            fontWeight: 500,
            marginTop: 2,
            color: "#cbd5f5",
          }}
        >
          The New Paradigm
        </span>
      </header>

      {/* Orta alan: Sol QR | Separator | Sağ NPS */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "stretch",
          justifyContent: "center",
          padding: 24,
          gap: 24,
        }}
      >
        {/* SOL YARIM: QR */}
        <div
          style={{
            flex: 1,
            position: "relative",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* QR kod tam ortada */}
          <div
            style={{
              padding: 20,
              borderRadius: 24,
              background:
                "radial-gradient(circle at top, #1e293b, #020617 65%)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
            }}
          >
            <Image
              src="/nps-qr.png"
              alt="Scan QR code to give feedback"
              width={260}
              height={260}
              style={{
                display: "block",
                borderRadius: 20,
              }}
            />
          </div>

          {/* Text QR'ın üstünde, merkezden biraz yukarıda, tek satır */}
          <p
            style={{
              position: "absolute",
              bottom: "50%", // QR merkezdeyken bunun üstte kalması için
              transform: "translateY(-24px)",
              fontSize: 20,
              fontWeight: 700,
              color: "#ffffff",
              textAlign: "center",
              whiteSpace: "nowrap",
            }}
          >
            Scan QR code to give feedback
          </p>
        </div>

        {/* ORTA SEPERATÖR + hashtag */}
        <div
          style={{
            width: "auto",
            display: "flex",
            alignItems: "center",
            height: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              height: "100%",
              gap: 40, // hashtag ile çizgi arasında daha fazla boşluk
            }}
          >
            {/* hashtag seperatörün üstünde */}
            <div
              style={{
                color: separatorColor,
                fontSize: 38,
                fontWeight: 800,
                fontStyle: "italic",
                textAlign: "center",
                marginBottom: 8, // ekstra boşluk
              }}
            >
              #promptToProduct
            </div>
            <div
              style={{
                width: 2,
                height: "60%", // biraz daha kısa çizgi
                background: separatorColor,
                borderRadius: 9999,
                marginTop: 4,
              }}
            />
          </div>
        </div>

        {/* SAĞ YARIM: NPS OUTPUT */}
        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
          >
            <div
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? "scale(1)" : "scale(0.96)",
                transition: "opacity 0.6s ease, transform 0.6s ease",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 32,
              }}
            >
              {/* Net Promoter Score başlık */}
              <div
                style={{
                  marginTop: -10,
                  fontSize: 30,
                  fontWeight: 700,
                  color: "#f1f59",
                }}
              >
                Net Promoter Score
              </div>

              {/* Dev daire */}
              <div style={{ position: "relative", width: size, height: size }}>
                <svg
                  width={size}
                  height={size}
                  style={{ transform: "rotate(-90deg)" }}
                >
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#1e293b"
                    strokeWidth={strokeWidth}
                    fill="none"
                  />
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={npsColor}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                  />
                </svg>

                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: 85,
                      fontWeight: 800,
                      color: npsColor,
                    }}
                  >
                    {total === 0 ? "--" : nps}
                  </span>
                </div>
              </div>

              {/* Breakdown */}
              <div
                style={{
                  display: "flex",
                  gap: 40,
                  textAlign: "center",
                  fontSize: 22,
                }}
              >
                {/* Detractors */}
                <div>
                  <div style={{ color: "#f97373", marginBottom: 2 }}>
                    Detractors
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: "#f97373",
                      marginBottom: 4,
                    }}
                  >
                    (1–6)
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      color: "#f97373",
                      fontSize: 32,
                    }}
                  >
                    {detractors}
                  </div>
                </div>

                {/* Passives */}
                <div>
                  <div style={{ color: "#facc15", marginBottom: 2 }}>
                    Passives
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: "#facc15",
                      marginBottom: 4,
                    }}
                  >
                    (7–8)
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      color: "#facc15",
                      fontSize: 32,
                    }}
                  >
                    {passives}
                  </div>
                </div>

                {/* Promoters */}
                <div>
                  <div style={{ color: "#22c55e", marginBottom: 2 }}>
                    Promoters
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: "#22c55e",
                      marginBottom: 4,
                    }}
                  >
                    (9–10)
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      color: "#22c55e",
                      fontSize: 32,
                    }}
                  >
                    {promoters}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}