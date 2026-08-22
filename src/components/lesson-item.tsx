import { VideoEmbed } from "@/components/video-embed";
import { LinkifiedText } from "@/components/linkified-text";

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

type LessonItemProps = {
  title: string;
  videoUrl?: string | null;
  body?: string | null;
  resource?: AttachmentResource;
  linkResource?: LinkAttachment;
};

export function LessonItem({ title, videoUrl, body, resource, linkResource }: LessonItemProps) {
  if (videoUrl) {
    return (
      <VideoEmbed title={title} url={videoUrl} attachment={resource} linkAttachment={linkResource} />
    );
  }

  if (body) {
    return (
      <details className="rounded-lg bg-brand-secondary-soft/60 px-3 py-2 text-sm">
        <summary className="cursor-pointer">{title}</summary>
        <div className="mt-2">
          <LinkifiedText text={body} />
        </div>
      </details>
    );
  }

  return (
    <div className="rounded-lg bg-brand-secondary-soft/60 px-3 py-2 text-sm text-foreground/70">
      {title}
    </div>
  );
}
