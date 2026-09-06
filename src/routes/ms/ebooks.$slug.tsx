import { createFileRoute, notFound } from "@tanstack/react-router";
import { getEbook } from "@/lib/ebooks";
import { EbookNotFound, EbookPage, ebookHead, claimSearch } from "../ebooks.$slug";

export const Route = createFileRoute("/ms/ebooks/$slug")({
  validateSearch: claimSearch,
  loader: ({ params }) => {
    const book = getEbook(params.slug);
    if (!book) throw notFound();
    return { book };
  },
  head: ({ loaderData }) => ebookHead(loaderData?.book, "ms"),
  notFoundComponent: EbookNotFound,
  component: MsEbookRoutePage,
});

function MsEbookRoutePage() {
  const { book } = Route.useLoaderData();
  return <EbookPage book={book} />;
}
