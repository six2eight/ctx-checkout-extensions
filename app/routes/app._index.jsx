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
  Text,
  Avatar,
  Badge,
  EmptyState,
  Divider,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { syncReviewsMetafield } from "../models/reviews.server";

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds >= 31536000) return `${Math.floor(seconds / 31536000)}y ago`;
  if (seconds >= 2592000) return `${Math.floor(seconds / 2592000)}mo ago`;
  if (seconds >= 86400) return `${Math.floor(seconds / 86400)}d ago`;
  if (seconds >= 3600) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds >= 60) return `${Math.floor(seconds / 60)}m ago`;
  return "just now";
}

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);

  const reviews = await prisma.review.findMany({
    where: { shop: session.shop },
    orderBy: { createdAt: "desc" },
  });

  // Keep the checkout metafield in sync with the database (also backfills
  // reviews created before metafield syncing existed).
  await syncReviewsMetafield(admin, session.shop);

  return {
    reviews: reviews.map((review) => ({
      ...review,
      createdAt: review.createdAt.toISOString(),
      timeAgo: timeAgo(review.createdAt),
    })),
  };
};

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create") {
    const rating = Math.min(5, Math.max(1, Number(formData.get("rating")) || 5));
    await prisma.review.create({
      data: {
        shop,
        author: String(formData.get("author") || "").trim(),
        rating,
        body: String(formData.get("body") || "").trim(),
        avatarUrl: String(formData.get("avatarUrl") || "").trim() || null,
        imageUrl: String(formData.get("imageUrl") || "").trim() || null,
        source: String(formData.get("source") || "Google").trim() || "Google",
        verified: formData.get("verified") === "true",
        published: true,
      },
    });
  } else if (intent === "delete") {
    await prisma.review.deleteMany({
      where: { id: String(formData.get("id")), shop },
    });
  } else if (intent === "togglePublish") {
    await prisma.review.updateMany({
      where: { id: String(formData.get("id")), shop },
      data: { published: formData.get("published") === "true" },
    });
  }

  await syncReviewsMetafield(admin, shop);

  return redirect("/app");
};

const RATING_OPTIONS = [5, 4, 3, 2, 1].map((n) => ({
  label: `${"★".repeat(n)} (${n})`,
  value: String(n),
}));

export default function Index() {
  const { reviews } = useLoaderData();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [author, setAuthor] = useState("");
  const [rating, setRating] = useState("5");
  const [body, setBody] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [source, setSource] = useState("Google");
  const [verified, setVerified] = useState(true);

  const canSave = author.trim() && body.trim();

  function handleCreate() {
    submit(
      {
        intent: "create",
        author,
        rating,
        body,
        avatarUrl,
        imageUrl,
        source,
        verified: verified ? "true" : "false",
      },
      { method: "post" }
    );
    setAuthor("");
    setRating("5");
    setBody("");
    setAvatarUrl("");
    setImageUrl("");
    setSource("Google");
    setVerified(true);
  }

  return (
    <Page title="Reviews">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Add a review
              </Text>
              <FormLayout>
                <FormLayout.Group>
                  <TextField
                    label="Reviewer name"
                    value={author}
                    onChange={setAuthor}
                    autoComplete="off"
                    placeholder="John Kimjon"
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
                  placeholder="The equipment looks brand new and performs flawlessly…"
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
                </FormLayout.Group>
                <InlineStack>
                  <Button
                    variant="primary"
                    onClick={handleCreate}
                    disabled={!canSave}
                    loading={isSubmitting}
                  >
                    Add review
                  </Button>
                </InlineStack>
              </FormLayout>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card padding="0">
            <BlockStack gap="0">
              <div style={{ padding: "var(--p-space-400)" }}>
                <Text as="h2" variant="headingMd">
                  Published reviews ({reviews.length})
                </Text>
              </div>
              <Divider />
              {reviews.length === 0 ? (
                <EmptyState
                  heading="No reviews yet"
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>Add your first review above — it will appear at checkout.</p>
                </EmptyState>
              ) : (
                reviews.map((review, index) => (
                  <div key={review.id}>
                    {index > 0 && <Divider />}
                    <div style={{ padding: "var(--p-space-400)" }}>
                      <InlineStack
                        align="space-between"
                        blockAlign="center"
                        gap="400"
                        wrap={false}
                      >
                        <InlineStack gap="300" blockAlign="center" wrap={false}>
                          <Avatar
                            customer
                            size="md"
                            name={review.author}
                            source={review.avatarUrl || undefined}
                          />
                          <BlockStack gap="100">
                            <InlineStack gap="200" blockAlign="center">
                              <Text as="span" variant="bodyMd" fontWeight="semibold">
                                {review.author}
                              </Text>
                              <Text as="span" tone="subdued" variant="bodySm">
                                {review.timeAgo}
                              </Text>
                              {review.published ? (
                                <Badge tone="success">Published</Badge>
                              ) : (
                                <Badge>Hidden</Badge>
                              )}
                            </InlineStack>
                            <Text as="span" tone="subdued" variant="bodySm">
                              {"★".repeat(review.rating)}
                              {"☆".repeat(5 - review.rating)} · {review.source}
                            </Text>
                            <Text as="p" variant="bodyMd">
                              {review.body.length > 140
                                ? `${review.body.slice(0, 140)}…`
                                : review.body}
                            </Text>
                          </BlockStack>
                        </InlineStack>
                        <InlineStack gap="200" wrap={false}>
                          <Button url={`/app/reviews/${review.id}`}>Edit</Button>
                          <Button
                            onClick={() =>
                              submit(
                                {
                                  intent: "togglePublish",
                                  id: review.id,
                                  published: review.published ? "false" : "true",
                                },
                                { method: "post" }
                              )
                            }
                          >
                            {review.published ? "Hide" : "Publish"}
                          </Button>
                          <Button
                            tone="critical"
                            variant="primary"
                            onClick={() =>
                              submit(
                                { intent: "delete", id: review.id },
                                { method: "post" }
                              )
                            }
                          >
                            Delete
                          </Button>
                        </InlineStack>
                      </InlineStack>
                    </div>
                  </div>
                ))
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
