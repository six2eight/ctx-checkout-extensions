import { useState } from "react";
import { redirect } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Select,
  Checkbox,
  Button,
  BlockStack,
  InlineStack,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { syncReviewsMetafield } from "../models/reviews.server";

export const loader = async ({ request, params }) => {
  const { session } = await authenticate.admin(request);

  const review = await prisma.review.findFirst({
    where: { id: params.id, shop: session.shop },
  });

  if (!review) {
    throw redirect("/app");
  }

  return { review };
};

export const action = async ({ request, params }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  const id = params.id;
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    await prisma.review.deleteMany({ where: { id, shop } });
    await syncReviewsMetafield(admin, shop);
    return redirect("/app");
  }

  const rating = Math.min(5, Math.max(1, Number(formData.get("rating")) || 5));
  await prisma.review.updateMany({
    where: { id, shop },
    data: {
      author: String(formData.get("author") || "").trim(),
      rating,
      body: String(formData.get("body") || "").trim(),
      avatarUrl: String(formData.get("avatarUrl") || "").trim() || null,
      imageUrl: String(formData.get("imageUrl") || "").trim() || null,
      source: String(formData.get("source") || "Google").trim() || "Google",
      verified: formData.get("verified") === "true",
      published: formData.get("published") === "true",
    },
  });

  await syncReviewsMetafield(admin, shop);

  return redirect("/app");
};

const RATING_OPTIONS = [5, 4, 3, 2, 1].map((n) => ({
  label: `${"★".repeat(n)} (${n})`,
  value: String(n),
}));

export default function EditReview() {
  const { review } = useLoaderData();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [author, setAuthor] = useState(review.author);
  const [rating, setRating] = useState(String(review.rating));
  const [body, setBody] = useState(review.body);
  const [avatarUrl, setAvatarUrl] = useState(review.avatarUrl || "");
  const [imageUrl, setImageUrl] = useState(review.imageUrl || "");
  const [source, setSource] = useState(review.source);
  const [verified, setVerified] = useState(review.verified);
  const [published, setPublished] = useState(review.published);

  function handleSave() {
    submit(
      {
        intent: "update",
        author,
        rating,
        body,
        avatarUrl,
        imageUrl,
        source,
        verified: verified ? "true" : "false",
        published: published ? "true" : "false",
      },
      { method: "post" }
    );
  }

  function handleDelete() {
    submit({ intent: "delete" }, { method: "post" });
  }

  return (
    <Page
      title="Edit review"
      backAction={{ content: "Reviews", url: "/app" }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <FormLayout>
              <FormLayout.Group>
                <TextField
                  label="Reviewer name"
                  value={author}
                  onChange={setAuthor}
                  autoComplete="off"
                  requiredIndicator
                />
                <Select
                  label="Rating"
                  options={RATING_OPTIONS}
                  value={rating}
                  onChange={setRating}
                />
              </FormLayout.Group>
              <TextField
                label="Review text"
                value={body}
                onChange={setBody}
                autoComplete="off"
                multiline={3}
                requiredIndicator
              />
              <FormLayout.Group>
                <TextField
                  label="Reviewer photo URL"
                  value={avatarUrl}
                  onChange={setAvatarUrl}
                  autoComplete="off"
                  placeholder="https://…"
                />
                <TextField
                  label="Product image URL"
                  value={imageUrl}
                  onChange={setImageUrl}
                  autoComplete="off"
                  placeholder="https://…"
                />
              </FormLayout.Group>
              <FormLayout.Group>
                <TextField
                  label="Source"
                  value={source}
                  onChange={setSource}
                  autoComplete="off"
                />
                <Checkbox
                  label="Verified reviewer"
                  checked={verified}
                  onChange={setVerified}
                />
                <Checkbox
                  label="Published"
                  checked={published}
                  onChange={setPublished}
                />
              </FormLayout.Group>
              <InlineStack align="space-between">
                <Button
                  variant="primary"
                  onClick={handleSave}
                  loading={isSubmitting}
                  disabled={!author.trim() || !body.trim()}
                >
                  Save changes
                </Button>
                <Button tone="critical" onClick={handleDelete}>
                  Delete review
                </Button>
              </InlineStack>
            </FormLayout>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
