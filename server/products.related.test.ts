import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";

describe("Related Products Feature", () => {
  it("should fetch related products from the same category", async () => {
    const caller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: null,
    });

    // Get a product from Casual category (categoryId: 1)
    const casualProducts = await db.getAllProducts({ categoryId: 1 });
    if (casualProducts.length === 0) {
      console.log("No casual products found, skipping test");
      return;
    }
    const casualProductId = casualProducts[0].id;

    const relatedProducts = await caller.products.getRelated({
      productId: casualProductId,
      limit: 4,
    });

    expect(relatedProducts).toBeDefined();
    expect(Array.isArray(relatedProducts)).toBe(true);
    expect(relatedProducts.length).toBeLessThanOrEqual(4);

    // Verify all related products are from the same category
    const product = await db.getProductById(casualProductId);
    relatedProducts.forEach((relatedProduct) => {
      expect(relatedProduct.categoryId).toBe(product?.categoryId);
    });
  });

  it("should exclude the current product from related products", async () => {
    const caller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: null,
    });

    // Get a product from Casual category
    const casualProducts = await db.getAllProducts({ categoryId: 1 });
    if (casualProducts.length === 0) return;
    const casualProductId = casualProducts[0].id;

    const relatedProducts = await caller.products.getRelated({
      productId: casualProductId,
      limit: 4,
    });

    // Current product should not be in the related products list
    const currentProductInList = relatedProducts.find(
      (p) => p.id === casualProductId
    );
    expect(currentProductInList).toBeUndefined();
  });

  it("should respect the limit parameter", async () => {
    const caller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: null,
    });

    // Get a product from Casual category
    const casualProducts = await db.getAllProducts({ categoryId: 1 });
    if (casualProducts.length === 0) return;
    const casualProductId = casualProducts[0].id;

    const relatedProducts = await caller.products.getRelated({
      productId: casualProductId,
      limit: 2,
    });

    expect(relatedProducts.length).toBeLessThanOrEqual(2);
  });

  it("should return different related products for different categories", async () => {
    const caller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: null,
    });

    // Get products from different categories
    const casualProducts = await db.getAllProducts({ categoryId: 1 });
    const professionalProducts = await db.getAllProducts({ categoryId: 2 });
    
    if (casualProducts.length === 0 || professionalProducts.length === 0) {
      console.log("Not enough products in different categories, skipping test");
      return;
    }

    const casualProductId = casualProducts[0].id;
    const professionalProductId = professionalProducts[0].id;

    const casualRelated = await caller.products.getRelated({
      productId: casualProductId,
      limit: 4,
    });

    const professionalRelated = await caller.products.getRelated({
      productId: professionalProductId,
      limit: 4,
    });

    // Get category IDs
    const casualProduct = await db.getProductById(casualProductId);
    const professionalProduct = await db.getProductById(professionalProductId);

    // Verify categories are different
    expect(casualProduct?.categoryId).not.toBe(professionalProduct?.categoryId);

    // Verify related products are from their respective categories
    if (casualRelated.length > 0) {
      casualRelated.forEach((p) => {
        expect(p.categoryId).toBe(casualProduct?.categoryId);
      });
    }

    if (professionalRelated.length > 0) {
      professionalRelated.forEach((p) => {
        expect(p.categoryId).toBe(professionalProduct?.categoryId);
      });
    }
  });

  it("should throw error for non-existent product", async () => {
    const caller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: null,
    });

    await expect(
      caller.products.getRelated({
        productId: 99999,
        limit: 4,
      })
    ).rejects.toThrow("Product not found");
  });
});
