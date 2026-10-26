import { createFileRoute, notFound } from "@tanstack/react-router";
import { getEbook } from "@/lib/ebooks";
import { pageLocaleParam } from "@/lib/i18n";
import { EbookNotFound, EbookPage, ebookHead, claimSearch } from "../ebooks.$slug";

/**
 * The ebook page in every prefixed locale. The book copy itself is English
 * except where a translated edition exists (`localizeEbook`), so a locale
 * without one shows the English title and tagline inside translated chrome —
 * the PDF is English too.
 */
export const Route = createFileRoute("/$lang/ebooks/$slug")({
  validateSearch: claimSearch,
  loader: ({ params }) => {
    if (!pageLocaleParam(params.lang)) throw notFound();
    const book = getEbook(params.slug);
    if (!book) throw notFound();
    return { book };
  },
  head: ({ params, loaderData }) =>
    ebookHead(loaderData?.book, pageLocaleParam(params.lang) ?? "en"),
  notFoundComponent: EbookNotFound,
  component: LocalizedEbookRoutePage,
});

function LocalizedEbookRoutePage() {
  const { book } = Route.useLoaderData();
  return <EbookPage book={book} />;
}
