import { json, redirect } from "@remix-run/node";
import { useSubmit } from "@remix-run/react";
import prisma from "../db.server";
import { useState } from "react";
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
} from "@shopify/polaris";
import { getAdminContext } from "app/shopify.server";

type DiscountLevel = {
  volume: string;
  discount: string;
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

  const formData = await request.formData();
  console.log("formData:", formData);

  const name = formData.get("name");
  const autoLabels = JSON.parse(formData.get("autoLabels") as string);
  const selectedProducts = JSON.parse(formData.get("selectedProducts") as string);
  const discountLevels = JSON.parse(formData.get("discountLevels") as string);

  console.log("Name:", name);
  console.log("Auto Labels:", autoLabels);
  console.log("Selected Products:", selectedProducts);
  console.log("Discount Levels:", discountLevels);

  if (!name || !selectedProducts || !discountLevels) {
    return json({ error: "Missing required fields" }, { status: 400 });
  }

  // Проверка существования магазина
  let existingShop = await prisma.shop.findUnique({
    where: { shop },
  });

  if (!existingShop) {
    existingShop = await prisma.shop.create({
      data: { shop },
    });
  }

  try {
    // Проверяем и добавляем недостающие продукты по shopifyId
    for (const product of selectedProducts) {
      await prisma.product.upsert({
        where: { shopifyId: product.id }, // Ищем по shopifyId
        update: {}, // Ничего не обновляем
        create: {
          shopifyId: product.id, // Привязываем Shopify ID
          title: product.name,
          images: [product.imageUrl],
          shopId: existingShop.id, // Привязываем к текущему магазину
        },
      });
    }

    // Создаем Funnel
    await prisma.funnel.create({
      data: {
        name: name as string,
        autoLabels: autoLabels as boolean,
        products: {
          create: selectedProducts.map((product: { id: string }) => ({
            product: {
              connect: { shopifyId: product.id }, // Связываем по shopifyId
            },
          })),
        },
        discountLevels: {
          create: discountLevels.map((level: DiscountLevel) => ({
            volume: parseInt(level.volume, 10),
            discount: parseFloat(level.discount),
            description: level.description,
            label: level.label,
          })),
        },
      },
    });

    return redirect("/app/funnel_table");
  } catch (error) {
    console.error("Error creating funnel:", error);
    return json({ error: "Failed to create funnel" }, { status: 500 });
  }
}


// export async function action({ request }: { request: Request }) {
//   const adminContext = await getAdminContext(request);
//   const shop = adminContext.session.shop;

//   const formData = await request.formData();
//   console.log("formData:", formData);

//   const name = formData.get("name");
//   const autoLabels = JSON.parse(formData.get("autoLabels") as string);
//   const selectedProducts = JSON.parse(formData.get("selectedProducts") as string);
//   const discountLevels = JSON.parse(formData.get("discountLevels") as string);

//   console.log("Name:", name);
//   console.log("Auto Labels:", autoLabels);
//   console.log("Selected Products:", selectedProducts);
//   console.log("Discount Levels:", discountLevels);

//   if (!name || !selectedProducts || !discountLevels) {
//     return json({ error: "Missing required fields" }, { status: 400 });
//   }

//   // Проверка существования магазина
//   let existingShop = await prisma.shop.findUnique({
//     where: { shop },
//   });

//   if (!existingShop) {
//     existingShop = await prisma.shop.create({
//       data: { shop },
//     });
//   }

//   try {
//     // Сначала проверьте и добавьте недостающие продукты
//     for (const product of selectedProducts) {
//       await prisma.product.upsert({
//         where: { id: product.id },
//         update: {}, // Ничего не обновляем
//         create: {
//           id: product.id,
//           title: product.name,
//           images: [product.imageUrl],
//           shopId: existingShop.id, // Привязываем к текущему магазину
//         },
//       });
//     }

//     // Затем создайте Funnel
//     await prisma.funnel.create({
//       data: {
//         name: name as string,
//         autoLabels: autoLabels as boolean,
//         products: {
//           create: selectedProducts.map((product: { id: string }) => ({
//             product: {
//               connect: { id: product.id },
//             },
//           })),
//         },
//         discountLevels: {
//           create: discountLevels.map((level: DiscountLevel) => ({
//             volume: parseInt(level.volume, 10),
//             discount: parseFloat(level.discount),
//             description: level.description,
//             label: level.label,
//           })),
//         },
//       },
//     });

//     return json({ success: true });
//   } catch (error) {
//     console.error("Error creating funnel:", error);
//     return json({ error: "Failed to create funnel" }, { status: 500 });
//   }
// }

export default function CreateFunnel() {
  const [offerName, setOfferName] = useState<string>("");
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [discountLevels, setDiscountLevels] = useState<DiscountLevel[]>([
    { volume: "3", discount: "5", description: "5% discount", label: "-5%" },
    { volume: "5", discount: "10", description: "10% discount", label: "-10%" },
    { volume: "10", discount: "15", description: "15% discount", label: "-15%" },
  ]);
  const [autoLabels, setAutoLabels] = useState<boolean>(true);

  const submit = useSubmit();

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

  const handleRemoveDiscountLevel = (index: number) => {
    setDiscountLevels(discountLevels.filter((_, i) => i !== index));
  };

  const handleAddDiscountLevel = () => {
    setDiscountLevels([
      ...discountLevels,
      { volume: "", discount: "", description: "", label: "" },
    ]);
  };

  const updateDiscountLevel = (index: number, field: keyof DiscountLevel, value: string) => {
    const updatedLevels = discountLevels.map((level, i) =>
      i === index ? { ...level, [field]: value } : level
    );
    setDiscountLevels(updatedLevels);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const formData = new FormData();
    formData.append("name", offerName);
    formData.append("autoLabels", JSON.stringify(autoLabels));
    formData.append("selectedProducts", JSON.stringify(selectedProducts));
    formData.append("discountLevels", JSON.stringify(discountLevels));

    submit(formData, { method: "post" });
  };

  return (
    <Page title="Create Funnel">
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
            {discountLevels.map((level, index) => (
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
                  type="number"
                  value={level.volume}
                  onChange={(value) => updateDiscountLevel(index, "volume", value)}
                  autoComplete="off"
                  helpText="Volume triggering promotion"
                />
                </Box>
                <TextField
                  label="Discount"
                  type="number"
                  value={level.discount}
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
                  value={level.label}
                  onChange={(value) => updateDiscountLevel(index, "label", value)}
                  autoComplete="off"
                  disabled={autoLabels}
                  helpText="Discount label"
                />
              </div>
            ))}
              <Button onClick={handleAddDiscountLevel} variant="primary">Add more</Button>
              <Checkbox
                label="Automatic labels (recommended)"
                checked={autoLabels}
                onChange={(newChecked) => setAutoLabels(newChecked)}
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
