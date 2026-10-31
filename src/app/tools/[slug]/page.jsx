import { notFound } from "next/navigation";
import { tools } from "@/lib/tools";
import ToolPanel from "@/components/tool-panel";
import ImageBase64 from "@/components/image-base64";
import AesGenerator from "@/components/aes-generator";
import ExtendedTools from "@/components/extended-tools";
import { extendedToolDefinitions } from "@/lib/extended-tools";
import ProductivityTools from "@/components/productivity-tools";
import { productivityTools } from "@/lib/productivity-tools";
export function generateStaticParams() {
  return tools.map((t) => ({ slug: t.slug }));
}
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const tool = tools.find((t) => t.slug === slug);
  return { title: tool?.name, description: tool?.description };
}
export default async function ToolPage({ params }) {
  const { slug } = await params;
  const tool = tools.find((t) => t.slug === slug);
  if (!tool) notFound();
  if (productivityTools.some((t) => t.slug === tool.slug))
    return <ProductivityTools key={tool.slug} tool={tool} />;
  if (extendedToolDefinitions.some((t) => t.slug === tool.slug))
    return <ExtendedTools key={tool.slug} tool={tool} />;
  if (tool.slug === "aes-128") return <AesGenerator />;
  if (tool.slug === "image-base64") return <ImageBase64 />;
  return <ToolPanel key={tool.slug} tool={tool} />;
}
