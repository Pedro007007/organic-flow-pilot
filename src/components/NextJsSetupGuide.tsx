import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const codeSnippets = {
  apiRoute: `// app/api/publish/route.ts
import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // 1. Verify the webhook secret
  const secret = req.headers.get('x-webhook-secret');
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();

  // 2. Handle ping action (for testing connectivity)
  if (body.action === 'ping') {
    return NextResponse.json({ ok: true, message: 'pong' });
  }

  // 3. Store or update content in your DB / CMS
  // await db.upsertPost(body);

  // 4. Trigger ISR revalidation
  const path = req.headers.get('x-revalidate-path');
  const tag = req.headers.get('x-revalidate-tag');

  if (path) revalidatePath(path);
  if (tag) revalidateTag(tag);

  return NextResponse.json({ revalidated: true, path, tag });
}`,
  envFile: `# .env.local
WEBHOOK_SECRET=your-shared-secret-here`,
  pageComponent: `// app/blog/[slug]/page.tsx
import { notFound } from 'next/navigation';

export const revalidate = 3600; // fallback: revalidate every hour

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);
  if (!post) return notFound();

  return (
    <article>
      <h1>{post.seo_title || post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}`,
};

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 px-2 text-xs">
      {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
};

const CodeBlock = ({ title, code }: { title: string; code: string }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-foreground/80">{title}</span>
      <CopyButton text={code} />
    </div>
    <pre className="bg-background border border-border rounded-md p-3 text-xs font-mono overflow-x-auto text-foreground/80 whitespace-pre-wrap">
      {code}
    </pre>
  </div>
);

const NextJsSetupGuide = () => {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors w-full">
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        Next.js ISR Setup Guide
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3 space-y-4 pl-6">
        <p className="text-xs text-foreground/70">
          Set up your Next.js project to receive published content and trigger on-demand ISR revalidation.
        </p>

        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-foreground">Step 1: Add your webhook secret</h4>
          <CodeBlock title=".env.local" code={codeSnippets.envFile} />
        </div>

        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-foreground">Step 2: Create the API route</h4>
          <p className="text-xs text-foreground/70">
            This route verifies the shared secret, handles ping tests, and triggers <code className="text-primary">revalidatePath()</code> / <code className="text-primary">revalidateTag()</code>.
          </p>
          <CodeBlock title="app/api/publish/route.ts" code={codeSnippets.apiRoute} />
        </div>

        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-foreground">Step 3: Create the blog page</h4>
          <CodeBlock title="app/blog/[slug]/page.tsx" code={codeSnippets.pageComponent} />
        </div>

        <div className="rounded-md bg-primary/5 border border-primary/20 p-3">
          <p className="text-xs text-foreground/80">
            <strong>How it works:</strong> When you publish content here, this app sends a POST to your webhook URL with revalidation headers.
            Your Next.js API route verifies the secret, stores the content, and calls <code className="text-primary">revalidatePath()</code> to instantly refresh the cached page.
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default NextJsSetupGuide;
