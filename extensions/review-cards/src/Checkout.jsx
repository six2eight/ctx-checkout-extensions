import "@shopify/ui-extensions/preact";
import { render } from "preact";
import { useState, useEffect } from "preact/hooks";

export default function extension() {
  render(<Extension />, document.body);
}

const GOOGLE_G =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">' +
    '<path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>' +
    '<path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>' +
    '<path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>' +
    '<path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.95 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>' +
    "</svg>"
  );

const SLIDE_INTERVAL = 3500;

function timeAgo(iso) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  const label = (value, name) =>
    `${value} ${name}${value > 1 ? "s" : ""} ago`;
  if (seconds >= 31536000) return label(Math.floor(seconds / 31536000), "year");
  if (seconds >= 2592000) return label(Math.floor(seconds / 2592000), "month");
  if (seconds >= 604800) return label(Math.floor(seconds / 604800), "week");
  if (seconds >= 86400) return label(Math.floor(seconds / 86400), "day");
  if (seconds >= 3600) return label(Math.floor(seconds / 3600), "hour");
  if (seconds >= 60) return label(Math.floor(seconds / 60), "minute");
  return "just now";
}

function StarRating({ rating }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <s-icon
        key={i}
        type={i <= Math.round(rating) ? "star-filled" : "star"}
        tone="warning"
      />
    );
  }
  return (
    <s-stack direction="inline" gap="none">
      {stars}
    </s-stack>
  );
}

function ReviewCard({ review, showGoogleBadge }) {
  const [expanded, setExpanded] = useState(false);
  const body = String(review.body || "");
  const isLong = body.length > 120;
  const text = expanded || !isLong ? body : body.slice(0, 120).trimEnd();

  return (
    <s-box border="base" borderRadius="large" overflow="hidden">
      <s-stack direction="block" gap="none">
        {review.imageUrl ? (
          <s-box blockSize="320px" overflow="hidden">
            <s-image
              src={review.imageUrl}
              alt="Product"
              aspectRatio="0.875"
              objectFit="cover"
              inlineSize="fill"
            />
          </s-box>
        ) : null}
        <s-box padding="base" background="subdued" blockSize="196px" overflow="hidden">
          <s-stack direction="block" gap="small-200">
            <s-stack direction="inline" gap="small-200" alignItems="center">
              {review.avatarUrl ? (
                <s-box
                  inlineSize="36px"
                  blockSize="36px"
                  overflow="hidden"
                  borderRadius="large"
                >
                  <s-image
                    src={review.avatarUrl}
                    alt={review.author}
                    inlineSize="fill"
                    objectFit="cover"
                  />
                </s-box>
              ) : null}
              <s-stack direction="block" gap="none">
                <s-stack direction="inline" gap="small-500" alignItems="center">
                  <s-text type="strong">{review.author}</s-text>
                  {review.verified ? (
                    <s-icon type="check-circle-filled" tone="info" size="small" />
                  ) : null}
                </s-stack>
                <s-paragraph color="subdued">
                  {timeAgo(review.createdAt)}
                </s-paragraph>
              </s-stack>
              {showGoogleBadge && review.source === "Google" ? (
                <s-box inlineSize="20px" blockSize="20px">
                  <s-image
                    src={GOOGLE_G}
                    alt="Google review"
                    inlineSize="fill"
                  />
                </s-box>
              ) : null}
            </s-stack>

            <StarRating rating={review.rating} />

            <s-paragraph>
              {text}
              {isLong && !expanded ? "… " : " "}
              {isLong ? (
                <s-link onClick={() => setExpanded(!expanded)}>
                  {expanded ? "Show less" : "Read more"}
                </s-link>
              ) : null}
            </s-paragraph>
          </s-stack>
        </s-box>
      </s-stack>
    </s-box>
  );
}

function Extension() {
  const settings = shopify.settings.value || {};
  const heading =
    settings.heading == null
      ? "Trusted by Gym Owners & Home Athletes"
      : String(settings.heading);
  const subheading =
    settings.subheading == null
      ? "High-performance new and remanufactured machines — inspected, serviced, and delivered with warranty."
      : String(settings.subheading);
  const showGoogleBadge = settings.show_google_badge !== false;
  const viewAllUrl =
    settings.view_all_url == null ? "" : String(settings.view_all_url).trim();

  const [reviews, setReviews] = useState([]);
  useEffect(() => {
    fetch(
      "https://ctx-checkout-extensions.vercel.app/api/reviews?shop=ctx-home-fitness.myshopify.com"
    )
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setReviews(
            data.map((r) => ({
              author: r.name,
              body: r.text,
              createdAt: r.date,
              rating: r.rating,
              avatarUrl: r.avatar || null,
              imageUrl: Array.isArray(r.images) && r.images.length ? r.images[0] : null,
              source: "Google",
              verified: false,
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (reviews.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % reviews.length);
    }, SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [reviews.length]);

  if (!reviews.length) return null;

  const review = reviews[activeIndex];

  return (
    <s-stack direction="block" gap="base">
      <s-stack direction="block" gap="small-200" alignItems="center">
        {heading ? <s-heading>{heading}</s-heading> : null}
        {subheading ? <s-paragraph>{subheading}</s-paragraph> : null}
        {viewAllUrl ? (
          <s-button href={viewAllUrl} target="_blank" variant="secondary">
            <s-stack direction="inline" gap="small-200" alignItems="center">
              View All
              <s-icon type="arrow-right" />
            </s-stack>
          </s-button>
        ) : null}
      </s-stack>

      <ReviewCard
        key={activeIndex}
        review={review}
        showGoogleBadge={showGoogleBadge}
      />

      {reviews.length > 1 ? (
        <s-stack direction="inline" gap="small-200" justifyContent="center">
          {reviews.map((_, i) => (
            <s-box
              key={i}
              inlineSize={i === activeIndex ? "10px" : "8px"}
              blockSize={i === activeIndex ? "10px" : "8px"}
              borderRadius="max"
              background={i === activeIndex ? "base" : "subdued"}
            />
          ))}
        </s-stack>
      ) : null}
    </s-stack>
  );
}
