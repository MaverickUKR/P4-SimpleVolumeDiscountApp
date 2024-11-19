import { json, redirect } from "@remix-run/node";
import { useLoaderData, useSubmit } from "@remix-run/react";
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
  Banner,
} from "@shopify/polaris";
import { getAdminContext } from "app/shopify.server";
import SavingsChartWidget from "app/components/widgetLayout/widgetLayout";

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

export const loader = async ({ params }: { params: { funnelId?: string } }) => {
  const funnelId = params.funnelId;

  if (!funnelId) {
    return json({ error: "Funnel ID is required", discountLevels: [] }, { status: 400 });
  }

  const funnel = await prisma.funnel.findUnique({
    where: { id: parseInt(funnelId, 10) },
    include: {
      discountLevels: {
        orderBy: { volume: "asc" },
      },
    },
  });

  if (!funnel) {
    return json({ error: "Funnel not found", discountLevels: [] }, { status: 404 });
  }

  const discountLevels = funnel.discountLevels.map((level) => ({
    id: level.id,
    volume: level.volume,
    discount: level.discount,
    description: level.description,
    label: level.label,
  }));

  return json({ discountLevels, name: funnel.name, autoLabels: funnel.autoLabels });
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
            volume: level.volume,
            discount: level.discount,
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

export default function CreateFunnel() {
  const { discountLevels, name: initialName, autoLabels: initialAutoLabels } =
    useLoaderData<{ discountLevels: DiscountLevel[]; name: string; autoLabels: boolean }>();
    console.log("Loaded Data:", { discountLevels, initialName, initialAutoLabels });
    if (!discountLevels) {
      throw new Error("Discount levels are missing in loader data.");
    }
  const [offerName, setOfferName] = useState<string>(initialName || "");
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [autoLabels, setAutoLabels] = useState<boolean>(initialAutoLabels);
  const [localDiscountLevels, setLocalDiscountLevels] = useState<DiscountLevel[]>(discountLevels || []);
  const [conflictProducts, setConflictProducts] = useState<
  { product: Product; funnel: { name: string } }[]
>([]);

  const submit = useSubmit();

  const handleAddDiscountLevel = () => {
    setLocalDiscountLevels([
      ...localDiscountLevels,
      { id: 0, volume: 0, discount: 0, description: "", label: "- 0 %" },
    ]);
  };

  const handleRemoveDiscountLevel = (index: number) => {
    setLocalDiscountLevels(localDiscountLevels.filter((_, i) => i !== index));
  };

  const updateDiscountLevel = (index: number, field: keyof DiscountLevel, value: string) => {
    const updatedLevels = localDiscountLevels.map((level, i) =>
      i === index
        ? {
            ...level,
            [field]: field === "volume" || field === "discount" ? parseFloat(value) : value,
            // Обновляем label автоматически только если autoLabels включен и редактируется discount
            label: autoLabels && field === "discount" ? `- ${value} %` : level.label,
          }
        : level
    );
    setLocalDiscountLevels(updatedLevels);
  };

  async function selectProduct() {
    try {
      const products = await window.shopify.resourcePicker({
        type: "product",
        action: "select",
        multiple: true,
        selectionIds: selectedProducts.map((product) => ({ id: product.id })),
      });

      if (products && products.length > 0) {
        const newProducts = products.map((product: any) => ({
          id: product.id,
          name: product.title,
          imageUrl: product.images?.[0]?.originalSrc || "",
        }));

        // Отправляем запрос к API для проверки конфликтов
        const response = await fetch("/api/checkProductConflicts", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            productIds: JSON.stringify(newProducts.map((p) => p.id)),
          }),
        });

        const { conflicts } = await response.json();

        if (conflicts.length > 0) {
          // Если есть конфликты, показываем предупреждение
          setConflictProducts(
            conflicts.map((conflict: { id: string; funnelName: string }) => ({
              product: newProducts.find((p) => p.id === conflict.id)!,
              funnel: { name: conflict.funnelName },
            }))
          );
        } else {
          // Если конфликтов нет, добавляем продукты
          setSelectedProducts((prevProducts) => {
            const mergedProducts = [...prevProducts, ...newProducts];
            const uniqueProducts = Array.from(
              new Map(mergedProducts.map((product) => [product.id, product])).values()
            );
            return uniqueProducts;
          });
        }
      }
    } catch (error) {
      console.error("Error selecting products:", error);
    }
  }



  // async function selectProduct() {
  //   try {
  //     const products = await window.shopify.resourcePicker({
  //       type: "product",
  //       action: "select",
  //       multiple: true,
  //       selectionIds: selectedProducts.map((product) => ({ id: product.id })), // Передаем объект с id
  //     });

  //     if (products && products.length > 0) {
  //       const newProducts = products.map((product: any) => ({
  //         id: product.id,
  //         name: product.title,
  //         imageUrl: product.images?.[0]?.originalSrc || "",
  //       }));

  //       // Обновляем список продуктов, удаляя дубли
  //       setSelectedProducts((prevProducts) => {
  //         const mergedProducts = [...prevProducts, ...newProducts];
  //         // Удаляем дубли по id
  //         const uniqueProducts = Array.from(
  //           new Map(mergedProducts.map((product) => [product.id, product])).values()
  //         );
  //         return uniqueProducts;
  //       });
  //     }
  //   } catch (error) {
  //     console.error("Error selecting products:", error);
  //   }
  // }

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


// import { json, redirect } from "@remix-run/node";
// import { useSubmit } from "@remix-run/react";
// import prisma from "../db.server";
// import { useState } from "react";
// import {
//   Page,
//   Card,
//   TextField,
//   Button,
//   Checkbox,
//   Box,
//   Text,
//   Thumbnail,
//   PageActions,
//   InlineStack,
//   BlockStack,
// } from "@shopify/polaris";
// import { getAdminContext } from "app/shopify.server";
// import SavingsChartWidget from "app/components/widgetLayout/widgetLayout";

// type DiscountLevel = {
//   volume: string;
//   discount: string;
//   description: string;
//   label: string;
// };

// type Product = {
//   id: string;
//   name: string;
//   imageUrl: string;
// };

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
//     // Проверяем и добавляем недостающие продукты по shopifyId
//     for (const product of selectedProducts) {
//       await prisma.product.upsert({
//         where: { shopifyId: product.id }, // Ищем по shopifyId
//         update: {}, // Ничего не обновляем
//         create: {
//           shopifyId: product.id, // Привязываем Shopify ID
//           title: product.name,
//           images: [product.imageUrl],
//           shopId: existingShop.id, // Привязываем к текущему магазину
//         },
//       });
//     }

//     // Создаем Funnel
//     await prisma.funnel.create({
//       data: {
//         name: name as string,
//         autoLabels: autoLabels as boolean,
//         products: {
//           create: selectedProducts.map((product: { id: string }) => ({
//             product: {
//               connect: { shopifyId: product.id }, // Связываем по shopifyId
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

//     return redirect("/app/funnel_table");
//   } catch (error) {
//     console.error("Error creating funnel:", error);
//     return json({ error: "Failed to create funnel" }, { status: 500 });
//   }
// }

// export default function CreateFunnel() {
//   const [offerName, setOfferName] = useState<string>("");
//   const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
//   const [discountLevels, setDiscountLevels] = useState<DiscountLevel[]>([
//     { volume: "3", discount: "5", description: "5% discount", label: "-5%" },
//     { volume: "5", discount: "10", description: "10% discount", label: "-10%" },
//     { volume: "10", discount: "15", description: "15% discount", label: "-15%" },
//   ]);
//   const [autoLabels, setAutoLabels] = useState<boolean>(true);

//   const submit = useSubmit();

//   async function selectProduct() {
//     try {
//       const products = await window.shopify.resourcePicker({
//         type: "product",
//         action: "select",
//         multiple: true,
//         selectionIds: selectedProducts.map((product) => ({ id: product.id })), // Передаем объект с id
//       });

//       if (products && products.length > 0) {
//         const newProducts = products.map((product: any) => ({
//           id: product.id,
//           name: product.title,
//           imageUrl: product.images?.[0]?.originalSrc || "",
//         }));

//         // Обновляем список продуктов, удаляя дубли
//         setSelectedProducts((prevProducts) => {
//           const mergedProducts = [...prevProducts, ...newProducts];
//           // Удаляем дубли по id
//           const uniqueProducts = Array.from(
//             new Map(mergedProducts.map((product) => [product.id, product])).values()
//           );
//           return uniqueProducts;
//         });
//       }
//     } catch (error) {
//       console.error("Error selecting products:", error);
//     }
//   }

//   const handleRemoveDiscountLevel = (index: number) => {
//     setDiscountLevels(discountLevels.filter((_, i) => i !== index));
//   };

//   const handleAddDiscountLevel = () => {
//     setDiscountLevels([
//       ...discountLevels,
//       { volume: "", discount: "", description: "", label: "" },
//     ]);
//   };

//   const updateDiscountLevel = (index: number, field: keyof DiscountLevel, value: string) => {
//     const updatedLevels = discountLevels.map((level, i) =>
//       i === index ? { ...level, [field]: value } : level
//     );
//     setDiscountLevels(updatedLevels);
//   };

//   const handleSubmit = (event: React.FormEvent) => {
//     event.preventDefault();

//     const formData = new FormData();
//     formData.append("name", offerName);
//     formData.append("autoLabels", JSON.stringify(autoLabels));
//     formData.append("selectedProducts", JSON.stringify(selectedProducts));
//     formData.append("discountLevels", JSON.stringify(discountLevels));

//     submit(formData, { method: "post" });
//   };

//   return (
//     <Page title="Create Funnel">
//       <SavingsChartWidget
//         discountLevels={[
//           { volume: 3, discount: 5, label: "-5%" },
//           { volume: 5, discount: 10, label: "-10%" },
//           { volume: 10, discount: 15, label: "-15%" },
//         ]}
//       />
//       <form onSubmit={handleSubmit}>
//         <Card>
//           <Box padding="400">
//             <TextField
//               label="Name"
//               value={offerName}
//               onChange={setOfferName}
//               helpText="Enter the offer name"
//               autoComplete="off"
//             />
//           </Box>
//           <Box padding="400">
//             <Text variant="headingMd" as="h2">
//               Apply offer to
//             </Text>
//           </Box>

//           <Box padding="400">
//             {selectedProducts.length > 0 ? (
//               selectedProducts.map((product) => (
//                 <div
//                   key={product.id}
//                   style={{
//                   display:"flex",
//                   alignItems: "center",
//                   gap:"4",
//                   margin:"20px",
//                   justifyContent: "space-between",
//                   paddingBottom: "25px",
//                   borderBottom: "1px solid lightgrey"
//                   }}
//                 >
//                   <div style={{display: "flex", alignItems: "center", gap:"20px"}}>
//                   <Thumbnail source={product.imageUrl} alt={product.name} size="small" />
//                   <Text as="h2">{product.name}</Text>
//                   </div>
//                   <div>
//                   <Button
//                     // icon={DeleteIcon}
//                     tone="critical"
//                     onClick={() => setSelectedProducts((prev) => prev.filter((p) => p.id !== product.id))}
//                     size="micro"
//                     variant="tertiary"
//                   >X</Button>
//                   </div>
//                 </div>
//               ))
//             ) : (
//               <Text as="h2">No products selected. Click "Select Products" to add products.</Text>
//             )}
//             <Box paddingBlock="400">
//               <Button onClick={selectProduct} variant="primary">Select Products</Button>
//             </Box>
//           </Box>
//           <Box padding="400">
//             <Text variant="headingMd" as="h2">
//               Discount Configuration
//             </Text>
//           </Box>
//           <Card>
//           <BlockStack align="center">
//           <InlineStack direction="row" align="space-between">
//             {discountLevels.map((level, index) => (
//               <div
//                 key={index}
//                 style={{
//                   display: "flex",
//                   gap: "8px",
//                   marginBottom: "8px",
//                 }}
//               >
//                <Box paddingBlock="600">
//                 <Button onClick={() => handleRemoveDiscountLevel(index)} size="micro" variant="tertiary">X</Button>
//                </Box>
//                 <Box>
//                 <TextField
//                   label="Volume"
//                   type="number"
//                   value={level.volume}
//                   onChange={(value) => updateDiscountLevel(index, "volume", value)}
//                   autoComplete="off"
//                   helpText="Volume triggering promotion"
//                 />
//                 </Box>
//                 <TextField
//                   label="Discount"
//                   type="number"
//                   value={level.discount}
//                   onChange={(value) => updateDiscountLevel(index, "discount", value)}
//                   autoComplete="off"
//                   helpText="Discount value in %"
//                 />
//                 <TextField
//                   label="Description"
//                   value={level.description}
//                   onChange={(value) => updateDiscountLevel(index, "description", value)}
//                   autoComplete="off"
//                   helpText="Description for this volume discount"
//                 />
//                 <TextField
//                   label="Label"
//                   value={level.label}
//                   onChange={(value) => updateDiscountLevel(index, "label", value)}
//                   autoComplete="off"
//                   disabled={autoLabels}
//                   helpText="Discount label"
//                 />
//               </div>
//             ))}
//               <Button onClick={handleAddDiscountLevel} variant="primary">Add more</Button>
//               <Checkbox
//                 label="Automatic labels (recommended)"
//                 checked={autoLabels}
//                 onChange={(newChecked) => setAutoLabels(newChecked)}
//               />
//             </InlineStack>
//             </BlockStack>
//           </Card>
//         </Card>
//         <PageActions
//          primaryAction={
//         <Button submit variant="primary" tone="success">
//          Create
//         </Button>
//         }
//         />
//       </form>
//     </Page>
//   );
// }
