"use client";

import { useState } from "react";
import Link from "next/link";
import { topics } from "@/lib/data";

export default function WritePage() {
  const [title, setTitle] = useState("");
  const [dek, setDek] = useState("");
  const [topic, setTopic] = useState(topics[0].slug);
  const [body, setBody] = useState("");
  const [published, setPublished] = useState(false);

  const words = body.trim() ? body.trim().split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.round(words / 200));
  const activeTopic = topics.find((t) => t.slug === topic)!;

  if (published) {
    return (
      <div className="wrap max-w-[640px] py-24 text-center">
        <div className="text-[72px] mb-4">🎉</div>
        <h1 className="text-[40px] font-bold mb-3">Published!</h1>
        <p className="text-[18px] text-muted mb-8">
          Nice work. In the real app this would hit the publish pipeline
          (trust-based auto-publish, see the LLD). For now, it&apos;s a preview.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/" className="btn btn-purple">
            Back to feed
          </Link>
          <button onClick={() => setPublished(false)} className="btn">
            Keep editing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="chip bg-lime mb-2">✎ Draft</span>
          <h1 className="text-[32px] font-bold">Write a post</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[12px] text-subtle">
            {words} words · {readingTime} min
          </span>
          <button
            onClick={() => title.trim() && setPublished(true)}
            disabled={!title.trim()}
            className="btn btn-purple disabled:opacity-40 disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-pop"
          >
            Publish ✦
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* editor */}
        <section className="card p-6 space-y-4">
          <div>
            <label className="font-mono text-[11px] text-subtle font-bold">
              TITLE
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="The three assumptions destroying your…"
              className="w-full mt-1 text-[26px] font-bold outline-none placeholder:text-[#c3bfe0] bg-transparent"
            />
          </div>
          <div>
            <label className="font-mono text-[11px] text-subtle font-bold">
              SUMMARY
            </label>
            <textarea
              value={dek}
              onChange={(e) => setDek(e.target.value)}
              placeholder="One or two sentences that make someone stop scrolling."
              rows={2}
              className="w-full mt-1 text-[15px] outline-none resize-none placeholder:text-[#c3bfe0] bg-transparent"
            />
          </div>
          <div>
            <label className="font-mono text-[11px] text-subtle font-bold">
              TOPIC
            </label>
            <div className="flex gap-2 flex-wrap mt-2">
              {topics.map((t) => (
                <button
                  key={t.slug}
                  onClick={() => setTopic(t.slug)}
                  className={`chip ${
                    t.slug === topic ? "bg-purple text-white" : "bg-card text-ink"
                  }`}
                >
                  {t.emoji} {t.name}
                </button>
              ))}
            </div>
          </div>
          <div className="border-t-2 border-dashed border-ink/20 pt-4">
            <label className="font-mono text-[11px] text-subtle font-bold">
              BODY
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Start writing. This is your distraction-free editor — just you and the words."
              rows={16}
              className="w-full mt-1 text-[16px] leading-relaxed outline-none resize-none placeholder:text-subtle bg-transparent text-ink"
            />
          </div>
        </section>

        {/* live preview */}
        <section className="card p-8 lg:sticky lg:top-24 self-start">
          <div className="font-mono text-[11px] text-purple font-bold mb-4">
            // live preview
          </div>
          <span className="chip bg-sky text-[#1A1440] mb-4">
            {activeTopic.emoji} {activeTopic.name}
          </span>
          <h2 className="text-[30px] font-bold leading-tight mb-3">
            {title || "Your title appears here"}
          </h2>
          <p className="text-[16px] text-muted mb-6">
            {dek || "Your summary shows up right here to hook the reader."}
          </p>
          <div className="border-t-2 border-ink pt-5 whitespace-pre-wrap text-[16px] leading-relaxed text-body">
            {body || (
              <span className="text-subtle">
                As you type, your post renders here in the Lore reading style.
              </span>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
