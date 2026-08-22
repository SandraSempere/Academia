"use client";

import { useState } from "react";
import Link from "next/link";
import { getEmbedUrl } from "@/lib/video-embed";
import { ResourceCard } from "@/components/resource-card";

type AttachmentResource = {
  title: string;
  description?: string | null;
  type: string;
  url?: string | null;
};

type LinkAttachment = {
  href: string;
  label: string;
};

export function VideoEmbed({
  title,
  url,
  className,
  attachment,
  linkAttachment,
}: {
  title: string;
  url: string;
  className?: string;
  attachment?: AttachmentResource;
  linkAttachment?: LinkAttachment;
}) {
  const [open, setOpen] = useState(false);
  const embedUrl = getEmbedUrl(url);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-lg bg-brand-secondary-soft/60 px-3 py-2 text-left text-sm hover:bg-brand-secondary-soft"
      >
        <span>{open ? "▼" : "▶️"}</span>
        <span className="min-w-0 flex-1 truncate">{title}</span>
      </button>
      {open && (
        <div className="mt-2">
          {embedUrl ? (
            <div className="aspect-video overflow-hidden rounded-xl bg-black">
              <iframe
                src={embedUrl}
                title={title}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <p className="text-xs text-foreground/60">
              No se pudo cargar el vídeo aquí.{" "}
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Ábrelo en una pestaña nueva
              </a>
              .
            </p>
          )}
          {attachment && (
            <div className="mt-2">
              <ResourceCard
                title={attachment.title}
                description={attachment.description}
                type={attachment.type}
                url={attachment.url}
              />
            </div>
          )}
          {linkAttachment && (
            <Link
              href={linkAttachment.href}
              className="mt-2 flex items-center justify-between rounded-lg bg-brand-secondary-soft/60 px-3 py-2 text-sm hover:bg-brand-secondary-soft"
            >
              {linkAttachment.label}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
