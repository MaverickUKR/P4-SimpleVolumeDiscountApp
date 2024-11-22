import { json, redirect } from "@remix-run/node";
import { useActionData, useSubmit } from "@remix-run/react";
import prisma from "../db.server";
import { useEffect, useState } from "react";
import {
  Page,
  Card,
  TextField,
  Button,
  Checkbox,
  Box,
  Text,
  Thumbnail,
  PageActions,
  InlineStack,
  BlockStack,
  Banner,
} from "@shopify/polaris";
import { getAdminContext } from "app/shopify.server";
import SavingsChartWidget from "app/components/widgetLayout/widgetLayout";
import { toJsonVolumeAndDiscount } from "app/utils/toJsonVolumesAndDiscount";

type DiscountLevel = {
  id: number;
  volume: number;
  discount: number;
  description: string;
  label: string;
};

type Product = {
  id: string;
  name: string;
  imageUrl: string;
};

export async function action({ request }: { request: Request }) {
  const adminContext = await getAdminContext(request);
  const shop = adminContext.session.shop;
  const admin = adminContext.admin;

  const formData = await request.formData();

  const name = formData.get("name");
  const autoLabels = JSON.parse(formData.get("autoLabels") as string);
  const selectedProducts = JSON.parse(formData.get("selectedProducts") as string);
  const discountLevels = JSON.parse(formData.get("discountLevels") as string);

  const { metafieldValue } = toJsonVolumeAndDiscount(discountLevels);

  if (!name || !selectedProducts || !discountLevels) {
    return json({ error: "Missing required fields" }, { status: 400 });
  }

  let existingShop = await prisma.shop.findUnique({
    where: { shop },
  });

  if (!existingShop) {
    existingShop = await prisma.shop.create({
      data: { shop },
    });
  }

  const conflictProductsWithFunnels = [];

  for (const product of selectedProducts) {
    const existingProduct = await prisma.product.findUnique({
      where: { shopifyId: product.id },
      include: { funnel: true },
    });

    if (existingProduct && existingProduct.funnel) {
      conflictProductsWithFunnels.push({
        product: {
          id: product.id,
          name: product.name,
          imageUrl: product.imageUrl,
        },
        funnel: { name: existingProduct.funnel.name },
      });
    }
  }

  if (conflictProductsWithFunnels.length > 0) {
    return json({
      error: "Some products are already linked to other funnels.",
      conflictProducts: conflictProductsWithFunnels,
    });
  }

  try {
    // Создаем воронку и добавляем продукты
    const newFunnel = await prisma.funnel.create({
      data: {
        name: name as string,
        shopId: existingShop.id, // Добавляем связь с shopId
        autoLabels: autoLabels as boolean,
        discountLevels: {
          create: discountLevels.map((level: DiscountLevel) => ({
            volume: level.volume,
            discount: level.discount,
            description: level.description,
            label: level.label,
          })),
        },
      },
    });

    for (const product of selectedProducts) {
      await prisma.product.upsert({
        where: { shopifyId: product.id },
        update: { funnelId: newFunnel.id },
        create: {
          shopifyId: product.id,
          title: product.name,
          images: [product.imageUrl],
          shopId: existingShop.id,
          funnelId: newFunnel.id,
        },
      });
    }

    console.log(`Funnel "${newFunnel.name}" created for shop ${shop}.`);

    // Используем Promise.all для выполнения всех запросов GraphQL
    await Promise.all(
      selectedProducts.map(async (product: Product) => {
        const query = `
          mutation {
            metafieldsSet(metafields: [
              {
                namespace: "discount_data",
                key: "volumes_discounts",
                type: "json",
                value: ${JSON.stringify(JSON.stringify(metafieldValue))},
                ownerId: "${product.id}"
              }
            ]) {
              userErrors {
                field
                message
              }
              metafields {
                id
                namespace
                key
                value
              }
            }
          }
        `;
        await admin.graphql(query).catch((error) => {
          console.error(`Error setting metafields for product ${product.id}:`, error);
        });
      })
    );

    return redirect("/app");
  } catch (error) {
    console.error("Error creating funnel:", error);
    return json({ error: "Failed to create funnel" }, { status: 500 });
  }
}


export default function CreateFunnel() {
    const actionData = useActionData<{
      error?: string;
      conflictProducts?: { product: Product; funnel: { name: string } }[];
    }>();

    const [offerName, setOfferName] = useState<string>("");
    const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
    const [autoLabels, setAutoLabels] = useState<boolean>(true);
    const [localDiscountLevels, setLocalDiscountLevels] = useState<DiscountLevel[]>([]);
    const [conflictProducts, setConflictProducts] = useState<
      { product: Product; funnel: { name: string } }[]
    >([]);
    const [labels, setLabels] = useState<string[]>(
      localDiscountLevels.map((level) => level.label)
    );


  const submit = useSubmit();
  useEffect(() => {
    if (autoLabels) {
      setLabels(
        localDiscountLevels.map((level) => `- ${level.discount} %`)
      );
    }
  }, [autoLabels, localDiscountLevels]);

  useEffect(() => {
    if (actionData?.conflictProducts) {
      setConflictProducts(actionData.conflictProducts);
    }
  }, [actionData]);

  const handleAddDiscountLevel = () => {
    setLocalDiscountLevels([
      ...localDiscountLevels,
      { id: 0, volume: 0, discount: 0, description: "", label: "- 0 %" },
    ]);
  };

  const handleRemoveDiscountLevel = (index: number) => {
    setLocalDiscountLevels(localDiscountLevels.filter((_, i) => i !== index));
  };

  const updateDiscountLevel = (
    index: number | null, // Если null, обновляем все уровни
    field: keyof DiscountLevel | "autoLabels",
    value: string | boolean
  ) => {
    const updatedLevels = localDiscountLevels.map((level, i) => {
      if (index !== null && i !== index) return level;

      // Если поле autoLabels, обновляем все лейблы
      if (field === "autoLabels") {
        return {
          ...level,
          label: value && field === "autoLabels" ? `- ${level.discount} %` : level.label,
        };
      }

      return {
        ...level,
        [field]: field === "volume" || field === "discount" ? parseFloat(value as string) : value,
        // Обновляем label, если autoLabels включен и редактируется discount
        label: autoLabels && field === "discount" ? `- ${value} %` : level.label,
      };
    });

    setLocalDiscountLevels(updatedLevels);

    // Если обновляем состояние autoLabels
    if (field === "autoLabels") {
      setAutoLabels(value as boolean);
    }
  };

  async function selectProduct() {
    try {
      const products = await window.shopify.resourcePicker({
        type: "product",
        action: "select",
        multiple: true,
        selectionIds: selectedProducts.map((product) => ({ id: product.id })), // Передаем объект с id
      });

      if (products && products.length > 0) {
        const newProducts = products.map((product: any) => ({
          id: product.id,
          name: product.title,
          imageUrl: product.images?.[0]?.originalSrc || "",
        }));

        // Обновляем список продуктов, удаляя дубли
        setSelectedProducts((prevProducts) => {
          const mergedProducts = [...prevProducts, ...newProducts];
          // Удаляем дубли по id
          const uniqueProducts = Array.from(
            new Map(mergedProducts.map((product) => [product.id, product])).values()
          );
          return uniqueProducts;
        });
      }
    } catch (error) {
      console.error("Error selecting products:", error);
    }
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const formData = new FormData();
    formData.append("name", offerName);
    formData.append("autoLabels", JSON.stringify(autoLabels));
    formData.append("selectedProducts", JSON.stringify(selectedProducts));
    formData.append("discountLevels", JSON.stringify(localDiscountLevels));

    submit(formData, { method: "post" });
  };
  if (!localDiscountLevels) {
    return (
      <Page title="Error">
        <Text as={"h2"}>Error: Discount levels data is missing.</Text>
      </Page>
    );
  }
  return (
    <Page title="Create Funnel">
      <SavingsChartWidget
        discountLevels={localDiscountLevels}
      />
      <form onSubmit={handleSubmit}>
        <Card>
          <Box padding="400">
            <TextField
              label="Name"
              value={offerName}
              onChange={setOfferName}
              helpText="Enter the offer name"
              autoComplete="off"
            />
          </Box>
          <Box padding="400">
            <Text variant="headingMd" as="h2">
              Apply offer to
            </Text>
          </Box>

          <Box padding="400">
            {selectedProducts.length > 0 ? (
              selectedProducts.map((product) => (
                <div
                  key={product.id}
                  style={{
                  display:"flex",
                  alignItems: "center",
                  gap:"4",
                  margin:"20px",
                  justifyContent: "space-between",
                  paddingBottom: "25px",
                  borderBottom: "1px solid lightgrey"
                  }}
                >
                  <div style={{display: "flex", alignItems: "center", gap:"20px"}}>
                  <Thumbnail source={product.imageUrl} alt={product.name} size="small" />
                  <Text as="h2">{product.name}</Text>
                  </div>
                  <div>
                  <Button
                    // icon={DeleteIcon}
                    tone="critical"
                    onClick={() => setSelectedProducts((prev) => prev.filter((p) => p.id !== product.id))}
                    size="micro"
                    variant="tertiary"
                  >X</Button>
                  </div>
                </div>
              ))
            ) : (
              <Text as="h2">No products selected. Click "Select Products" to add products.</Text>
            )}
            <Box padding="400">
            {conflictProducts.length > 0 && (
              <Card>
                <Banner
                  title="Some products are already in use"
                  tone="warning"
                >
                  <Text as={"h2"}>
                    These products are already used in another offer:
                  </Text>
                  <ul>
                    {conflictProducts.map(({ product, funnel }) => (
                      <li key={product.id}>
                        <strong>{product.name}</strong> is already linked to the offer{" "}
                        <strong>{funnel.name}</strong>.
                      </li>
                    ))}
                  </ul>
                  <Button onClick={() => setConflictProducts([])} variant="plain">
                    Dismiss
                  </Button>
                </Banner>
              </Card>
            )}
          </Box>

            <Box paddingBlock="400">
              <Button onClick={selectProduct} variant="primary">Select Products</Button>
            </Box>
          </Box>
          <Box padding="400">
            <Text variant="headingMd" as="h2">
              Discount Configuration
            </Text>
          </Box>
          <Card>
          <BlockStack align="center">
          <InlineStack direction="row" align="space-between">
            {localDiscountLevels.map((level, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
               <Box paddingBlock="600">
                <Button onClick={() => handleRemoveDiscountLevel(index)} size="micro" variant="tertiary">X</Button>
               </Box>
                <Box>
                <TextField
                  label="Volume"
                  min="1"
                  type="number"
                  value={level.volume.toString()}
                  onChange={(value) => updateDiscountLevel(index, "volume", value)}
                  autoComplete="off"
                  helpText="Volume triggering promotion"
                />
                </Box>
                <TextField
                  label="Discount"
                  min="1"
                  type="number"
                  value={level.discount.toString()}
                  onChange={(value) => updateDiscountLevel(index, "discount", value)}
                  autoComplete="off"
                  helpText="Discount value in %"
                />
                <TextField
                  label="Description"
                  value={level.description}
                  onChange={(value) => updateDiscountLevel(index, "description", value)}
                  autoComplete="off"
                  helpText="Description for this volume discount"
                />
                <TextField
                  label="Label"
                  value={labels[index]}
                  onChange={(value) => {
                    if (!autoLabels) {
                      setLabels((prev) =>
                        prev.map((label, i) => (i === index ? value : label))
                      );
                    }
                  }}
                  autoComplete="off"
                  helpText="Discount label"
                  disabled={autoLabels}
                />
              </div>
            ))}
              <Button onClick={handleAddDiscountLevel} variant="primary">Add more</Button>
              <Checkbox
                label="Automatic labels (recommended)"
                checked={autoLabels}
                onChange={(newChecked) => {
                  setAutoLabels(newChecked);
                  if (newChecked) {
                    setLabels(localDiscountLevels.map((level) => `- ${level.discount} %`));
                  }
                }}
              />
            </InlineStack>
            </BlockStack>
          </Card>
        </Card>
        <PageActions
         primaryAction={
        <Button submit variant="primary" tone="success">
         Create
        </Button>
        }
        />
      </form>
    </Page>
  );
}
