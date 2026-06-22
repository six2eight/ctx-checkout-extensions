import prisma from "../db.server";

const SHOP_ID_QUERY = `#graphql
  query ShopId {
    shop {
      id
    }
  }
`;

const METAFIELDS_SET = `#graphql
  mutation SetReviews($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      userErrors {
        field
        message
      }
    }
  }
`;

/**
 * Write the shop's published reviews into an app-owned ($app) metafield on the
 * Shop, as a JSON array. The checkout extension reads this metafield directly
 * (no network call). Call this after any review create/update/delete/publish.
 */
export async function syncReviewsMetafield(admin, shop) {
  // Never let a metafield-write problem break the admin page — log and move on.
  try {
    const reviews = await prisma.review.findMany({
      where: { shop, published: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const value = JSON.stringify(
      reviews.map((review) => ({
        id: review.id,
        author: review.author,
        rating: review.rating,
        body: review.body,
        avatarUrl: review.avatarUrl,
        imageUrl: review.imageUrl,
        source: review.source,
        verified: review.verified,
        createdAt: review.createdAt.toISOString(),
      })),
    );

    const shopResponse = await admin.graphql(SHOP_ID_QUERY);
    const shopJson = await shopResponse.json();
    const shopId = shopJson?.data?.shop?.id;
    if (!shopId) {
      console.error("syncReviewsMetafield: could not read shop id", shopJson);
      return;
    }

    const response = await admin.graphql(METAFIELDS_SET, {
      variables: {
        // Namespace is omitted on purpose: it defaults to the app-reserved
        // ($app) namespace, which is what the extension reads.
        metafields: [
          {
            ownerId: shopId,
            key: "reviews",
            type: "json",
            value,
          },
        ],
      },
    });

    const result = await response.json();
    const errors = result?.data?.metafieldsSet?.userErrors;
    if (errors && errors.length) {
      console.error("metafieldsSet userErrors", JSON.stringify(errors));
    } else if (result?.errors) {
      console.error("metafieldsSet GraphQL errors", JSON.stringify(result.errors));
    } else {
      console.log("syncReviewsMetafield: wrote", reviews.length, "reviews");
    }
  } catch (err) {
    if (err && typeof err === "object" && "status" in err) {
      // admin.graphql() threw a Response — log the body for diagnosis
      try {
        const body = await err.clone().text();
        console.error(`syncReviewsMetafield HTTP ${err.status}:`, body);
      } catch {
        console.error("syncReviewsMetafield failed (no body):", err.status);
      }
    } else {
      console.error("syncReviewsMetafield failed:", err);
    }
  }
}
