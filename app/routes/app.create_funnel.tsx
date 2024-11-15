import { json } from "@remix-run/node";
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
  Divider,
  Thumbnail,
} from "@shopify/polaris";

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
  const formData = await request.formData();

  const name = formData.get("name");
  const autoLabels = JSON.parse(formData.get("autoLabels") as string);
  const selectedProducts = JSON.parse(formData.get("selectedProducts") as string);
  const discountLevels = JSON.parse(formData.get("discountLevels") as string);

  if (!name || !selectedProducts || !discountLevels) {
    return json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    await prisma.funnel.create({
      data: {
        name: name as string,
        autoLabels,
        products: {
          connect: selectedProducts.map((product: { id: string }) => ({ id: product.id })),
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

    return json({ success: true });
  } catch (error) {
    console.error("Error creating funnel:", error);
    return json({ error: "Failed to create funnel" }, { status: 500 });
  }
}

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
          {/* <Box padding="400">
             {selectedProducts.length > 0 ? (
              selectedProducts.map((product) => (
                <>
                <div
                  key={product.id}
                  style={{
                  display:"flex",
                  alignItems: "center",
                  gap:"4",
                  margin:"20px",
                  justifyContent: "space-between"
                  }}
                >
                  <div style={{display: "flex", alignItems: "center", gap:"20px"}}>
                  <Thumbnail source={product.imageUrl} alt={product.name} size="small"/>
                  <Text as={"span"}>{product.name}</Text>
                  </div>
                  <Button
                    // icon={DeleteIcon}
                    tone="critical"
                    onClick={() => setSelectedProducts((prev) => prev.filter((p) => p.id !== product.id))}
                    size="micro"
                    variant="tertiary"
                  >X</Button>
                  </div>
                  <Divider />
                </>
              ))
            ) : (
              <Text as={"h2"}>No products selected. Click "Select Products" to add products.</Text>
            )}
            <Box paddingBlock="400">
            <Button onClick={selectProduct}>Select Products</Button>
            </Box>
          </Box> */}

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
              <Button onClick={selectProduct}>Select Products</Button>
            </Box>
          </Box>
          <Box padding="400">
            <Text variant="headingMd" as="h2">
              Discount Configuration
            </Text>
          </Box>
          <Card>
            {discountLevels.map((level, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                <TextField
                  label="Volume"
                  type="number"
                  value={level.volume}
                  onChange={(value) => updateDiscountLevel(index, "volume", value)}
                  autoComplete="off"
                />
                <TextField
                  label="Discount"
                  type="number"
                  value={level.discount}
                  onChange={(value) => updateDiscountLevel(index, "discount", value)}
                  autoComplete="off"
                />
                <TextField
                  label="Description"
                  value={level.description}
                  onChange={(value) => updateDiscountLevel(index, "description", value)}
                  autoComplete="off"
                />
                <TextField
                  label="Label"
                  value={level.label}
                  onChange={(value) => updateDiscountLevel(index, "label", value)}
                  autoComplete="off"
                  disabled={autoLabels}
                />
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Button onClick={handleAddDiscountLevel}>Add more</Button>
              <Checkbox
                label="Automatic labels (recommended)"
                checked={autoLabels}
                onChange={(newChecked) => setAutoLabels(newChecked)}
              />
            </div>
          </Card>
        </Card>
        <Box insetInlineEnd="600" paddingBlock="600" position="absolute">
          <Button submit variant="primary" tone="success">
            Create
          </Button>
        </Box>
      </form>
    </Page>
  );
}

// import { json } from "@remix-run/node";
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
//   Divider,
//   Thumbnail,
// } from "@shopify/polaris";
// import { DeleteIcon } from '@shopify/polaris-icons';

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
//   const formData = await request.formData();

//   const name = formData.get("name");
//   const autoLabels = JSON.parse(formData.get("autoLabels") as string);
//   const selectedProducts = JSON.parse(formData.get("selectedProducts") as string);
//   const discountLevels = JSON.parse(formData.get("discountLevels") as string);

//   if (!name || !selectedProducts || !discountLevels) {
//     return json({ error: "Missing required fields" }, { status: 400 });
//   }

//   try {
//     await prisma.funnel.create({
//       data: {
//         name: name as string,
//         autoLabels,
//         products: {
//           connect: selectedProducts.map((product: { id: string }) => ({ id: product.id })),
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
//         action: "add",
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
//       <form onSubmit={handleSubmit}>
//         <Card>
//          <Box padding="400">
//            <TextField
//             label="Name"
//             value={offerName}
//             onChange={setOfferName}
//             helpText="Enter the offer name"
//             autoComplete="off"
//           />
//         </Box>
//           <Box padding="400">
//             <Text variant="headingMd" as="h2">
//               Apply offer to
//             </Text>
//           </Box>
//           <Box padding="400">
//             {selectedProducts.length > 0 ? (
//               selectedProducts.map((product, index) => (
//                 <>
//                 <div
//                   key={product.id}
//                   style={{
//                   display:"flex",
//                   alignItems: "center",
//                   gap:"4",
//                   margin:"20px",
//                   justifyContent: "space-between"
//                   }}
//                 >
//                   <div style={{display: "flex", alignItems: "center", gap:"20px"}}>
//                   <Thumbnail source={product.imageUrl} alt={product.name} size="small"/>
//                   <Text as={"span"}>{product.name}</Text>
//                   </div>
//                   <Button
//                     // icon={DeleteIcon}
//                     tone="critical"
//                     onClick={() =>
//                       setSelectedProducts(
//                         selectedProducts.filter((_, i) => i !== index)
//                       )
//                     }
//                     size="micro"
//                     variant="tertiary"
//                   >X</Button>
//                   </div>
//                   <Divider />
//                 </>
//               ))
//             ) : (
//               <Text as={"h2"}>No products selected. Click "Select Products" to add products.</Text>
//             )}
//             <Box paddingBlock="400">
//             <Button onClick={selectProduct}>Select Products</Button>
//             </Box>
//           </Box>
//           <Box padding="400">
//             <Text variant="headingMd" as="h2">
//               Discount Configuration
//             </Text>
//           </Box>
//           <Card>
//             {discountLevels.map((level, index) => (
//               <div
//                 key={index}
//                 style={{
//                   display: "flex",
//                   gap: "8px",
//                   marginBottom: "8px",
//                 }}
//               >
//                 <TextField
//                   label="Volume"
//                   type="number"
//                   value={level.volume}
//                   onChange={(value) => updateDiscountLevel(index, "volume", value)}
//                   autoComplete="off"
//                 />
//                 {/* <Select
//                   label="Discount Type"
//                   labelHidden
//                   options={[
//                     { label: "%", value: "%" },
//                     { label: "Amount", value: "amount" },
//                   ]}
//                   value={level.discountType}
//                   onChange={(value) =>
//                     updateDiscountLevel(index, "discountType", value)
//                   }
//                 /> */}
//                 <TextField
//                   label="Discount"
//                   type="number"
//                   value={level.discount}
//                   onChange={(value) => updateDiscountLevel(index, "discount", value)}
//                   autoComplete="off"
//                 />
//                 <TextField
//                   label="Description"
//                   value={level.description}
//                   onChange={(value) =>
//                     updateDiscountLevel(index, "description", value)
//                   }
//                   autoComplete="off"
//                 />
//                 <TextField
//                   label="Label"
//                   value={level.label}
//                   onChange={(value) => updateDiscountLevel(index, "label", value)}
//                   autoComplete="off"
//                   disabled={autoLabels}
//                 />
//               </div>
//             ))}
//             <div style={{display:"flex", justifyContent:"space-between"}}>
//               <Button onClick={handleAddDiscountLevel}>Add more</Button>
//               <Checkbox
//                 label="Automatic labels (recommended)"
//                 checked={autoLabels}
//                 onChange={(newChecked) => setAutoLabels(newChecked)}
//               />
//             </div>
//           </Card>
//         </Card>
//         <Box insetInlineEnd="600" paddingBlock="600" position="absolute">
//         <Button submit variant="primary" tone="success">
//           Create
//         </Button>
//         </Box>
//       </form>
//     </Page>
//   );
// }


// // app/routes/funnel.tsx
// import { useState } from "react";
// import { Page, Card, TextField, Button, Select, Checkbox, Box, Text, Divider, Thumbnail, Banner } from "@shopify/polaris";
// import { useSubmit, useActionData } from "@remix-run/react";
// import type { ActionData } from "./funnel";

// type DiscountLevel = {
//   volume: string;
//   discountType: string;
//   discount: string;
//   description: string;
//   label: string;
// };

// type Product = {
//   id: string;
//   name: string;
//   imageUrl: string;
// };

// function CreateFunnel() {
//   const [offerName, setOfferName] = useState<string>("");
//   const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
//   const [discountLevels, setDiscountLevels] = useState<DiscountLevel[]>([
//     { volume: "3", discountType: "%", discount: "5", description: "5% discount", label: "-5%" },
//     { volume: "5", discountType: "%", discount: "10", description: "10% discount", label: "-10%" },
//     { volume: "10", discountType: "%", discount: "15", description: "15% discount", label: "-15%" },
//   ]);
//   const [autoLabels, setAutoLabels] = useState<boolean>(true);

//   const submit = useSubmit();
//   const actionData = useActionData<ActionData>();

//   async function selectProduct() {
//     try {
//       const products = await window.shopify.resourcePicker({
//         type: "product",
//         action: "select",
//         multiple: true,
//       });

//       if (products && products.length > 0) {
//         const selectedItems = products.map((product: any) => ({
//           id: product.id,
//           name: product.title,
//           imageUrl: product.images?.[0]?.originalSrc || "",
//         }));
//         setSelectedProducts(selectedItems);
//       }
//     } catch (error) {
//       console.error("Error selecting products:", error);
//     }
//   }

//   const handleAddDiscountLevel = () => {
//     setDiscountLevels([
//       ...discountLevels,
//       { volume: "", discountType: "%", discount: "", description: "", label: "" },
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
//       {actionData?.error && (
//         <Banner tone="warning" title="Warning">
//           These products are already used in another offer.
//         </Banner>
//       )}
//       {actionData?.success && (
//         <Banner tone="success" title="Success">
//           Funnel created successfully!
//         </Banner>
//       )}

//       <form onSubmit={handleSubmit}>
//         <Card>
//           <Box padding="400">
//             <Text variant="headingMd" as="h2">Selected Products</Text>
//           </Box>
//           <Divider />
//           <Box padding="400">
//             {selectedProducts.length > 0 ? (
//               selectedProducts.map((product, index) => (
//                 <div key={product.id} style={{display:"flex", alignItems:"center", gap:"4", marginBottom:"4"}}>
//                   <Thumbnail source={product.imageUrl} alt={product.name} />
//                   <Text as={"h2"}>{product.name}</Text>
//                   <Button icon="delete" onClick={() => setSelectedProducts(selectedProducts.filter((_, i) => i !== index))} />
//                 </div>
//               ))
//             ) : (
//               <Text as={"h2"}>No products selected. Click "Select Products" to add products.</Text>
//             )}
//             <Button onClick={selectProduct}>Select Products</Button>
//           </Box>
//         </Card>

//         <Card>
//           <Box padding="400">
//             <Text variant="headingMd" as="h2">Discount Configuration</Text>
//           </Box>
//           <Divider />
//           <Card>
//             {discountLevels.map((level, index) => (
//               <div key={index} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
//                 <TextField
//                   label="Volume"
//                   type="number"
//                   value={level.volume}
//                   onChange={(value) => updateDiscountLevel(index, "volume", value)}
//                   autoComplete="off"
//                 />
//                 <Select
//                   label="Discount Type"
//                   labelHidden
//                   options={[{ label: "%", value: "%" }, { label: "Amount", value: "amount" }]}
//                   value={level.discountType}
//                   onChange={(value) => updateDiscountLevel(index, "discountType", value)}
//                 />
//                 <TextField
//                   label="Discount"
//                   type="number"
//                   value={level.discount}
//                   onChange={(value) => updateDiscountLevel(index, "discount", value)}
//                   autoComplete="off"
//                 />
//                 <TextField
//                   label="Description"
//                   value={level.description}
//                   onChange={(value) => updateDiscountLevel(index, "description", value)}
//                   autoComplete="off"
//                 />
//                 <TextField
//                   label="Label"
//                   value={level.label}
//                   onChange={(value) => updateDiscountLevel(index, "label", value)}
//                   autoComplete="off"
//                   disabled={autoLabels}
//                 />
//               </div>
//             ))}
//             <div style={{display:"flex", justifyContent:"space-between"}}>
//               <Button onClick={handleAddDiscountLevel}>Add more</Button>
//               <Checkbox
//                 label="Automatic labels (recommended)"
//                 checked={autoLabels}
//                 onChange={(newChecked) => setAutoLabels(newChecked)}
//               />
//             </div>
//           </Card>
//         </Card>

//         <Button submit variant="primary">Save Funnel</Button>
//       </form>
//     </Page>
//   );
// }

// export default CreateFunnel;


// import { useState } from 'react';
// import {
//   Page,
//   Card,
//   TextField,
//   Button,
//   Select,
//   Banner,
//   DataTable,
//   Checkbox,
//   Badge,
//   Box,
//   Text,
//   Divider,
// } from '@shopify/polaris';
// import {
//   DeleteIcon
// } from '@shopify/polaris-icons';
// // import prisma from "../db.server";

// type DiscountLevel = {
//   volume: string;
//   discountType: string;
//   discount: string;
//   description: string;
//   label: string;
// };

// type Product = {
//   id: string;
//   name: string;
// };

// // type Product = {
// //   id: string;
// //   name: string;
// //   productId?: string;
// //   productVariantId?: string;
// //   productTitle?: string;
// //   productHandle?: string;
// //   productAlt?: string;
// //   productImage?: string;
// // };

// function CreateFunnel() {
//   const [offerName, setOfferName] = useState<string>('');
//   const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
//   const [discountLevels, setDiscountLevels] = useState<DiscountLevel[]>([
//     { volume: '3', discountType: '%', discount: '5', description: '5% discount', label: '-5%' },
//     { volume: '5', discountType: '%', discount: '10', description: '10% discount', label: '-10%' },
//     { volume: '10', discountType: '%', discount: '15', description: '15% discount', label: '-15%' },
//   ]);
//   const [autoLabels, setAutoLabels] = useState<boolean>(true);
//   // const [pickerOpen, setPickerOpen] = useState(false);

//   // Удаление продукта из списка выбранных
//   const removeProduct = (index: number) => {
//     setSelectedProducts((prevProducts) => prevProducts.filter((_, i) => i !== index));
//   };


//     const handleAddDiscountLevel = () => {
//       setDiscountLevels([
//         ...discountLevels,
//         { volume: '', discountType: '%', discount: '', description: '', label: '' },
//       ]);
//     };

//     const handleRemoveDiscountLevel = (index: number) => {
//       setDiscountLevels(discountLevels.filter((_, i) => i !== index));
//     };

//     const updateDiscountLevel = (index: number, field: keyof DiscountLevel, value: string) => {
//       const updatedLevels = discountLevels.map((level, i) =>
//         i === index ? { ...level, [field]: value } : level
//       );
//       setDiscountLevels(updatedLevels);
//     };
//   // // Открытие ResourcePicker для выбора продуктов
//   // const openResourcePicker = () => {
//   //   setPickerOpen(true);
//   // };

//   // // Обработка выбора продукта через ResourcePicker
//   // const handleSelection = (resources: any) => {
//   //   const selectedItems = resources.selection.map((item: any) => ({
//   //     id: item.id,
//   //     name: item.title,
//   //   }));
//   //   setSelectedProducts(selectedItems);
//   //   setPickerOpen(false);
//   // };
//   async function selectProduct() {
//     const products = await window.shopify.resourcePicker({
//       type: "product",
//       action: "select", // customized action verb, either 'select' or 'add',
//       multiple: true,
//     });

//     if (products) {
//       const { images, id, title } = products[0];
//       setSelectedProducts({
//         ...selectedProducts,
//       });
//       console.log(products[0])
//     }
//   }
//   // Обновление уровня скидки по индексу
//   // const updateDiscountLevel = (index: number, field: keyof DiscountLevel, value: string) => {
//   //   setDiscountLevels((prevLevels) =>
//   //     prevLevels.map((level, i) =>
//   //       i === index ? { ...level, [field]: value } : level
//   //     )
//   //   );
//   // };

//   // Сохранение новой воронки в базе данных
//   const createFunnel = async () => {
//     try {
//       await prisma.funnel.create({
//         data: {
//           name: offerName,
//           products: {
//             connect: selectedProducts.map((product) => ({ id: product.id })),
//           },
//           discountLevels: {
//             create: discountLevels.map((level) => ({
//               volume: parseInt(level.volume, 10),
//               discountType: level.discountType,
//               discount: parseFloat(level.discount),
//               description: level.description,
//               label: level.label,
//             })),
//           },
//           autoLabels,
//         },
//       });
//       alert("Funnel created successfully!");
//     } catch (error) {
//       console.error("Error creating funnel:", error);
//     }
//   };

//   // const handleAddDiscountLevel = () => {
//   //   setDiscountLevels([
//   //     ...discountLevels,
//   //     { volume: 0, units: ["%"], discount: "0", description: "", label: "" },
//   //   ]);
//   // };
//   // const handleWeightChange = useCallback(
//   //   (value: string) => setWeight(weight),
//   //   [weight],
//   // );
//   return (
//     <Page title="My first funnel">
//     {/* <ResourcePicker
//         resourceType="Product"
//         open={pickerOpen}
//         onSelection={handleSelection}
//         onCancel={() => setPickerOpen(false)}
//       /> */}
//       <Card>
//         <Box padding="400">
//           <Text variant="headingMd" as="h2">Widget preview</Text>
//         </Box>
//         <Divider />
//         <Box padding="400">
//           <Select
//             label="volumes"
//             options={[{ label: '1', value: '1' }]}
//             onChange={() => {}}
//           />
//           <DataTable
//             columnContentTypes={['text', 'text']}
//             headings={['Quantity', 'Discount per item']}
//             rows={discountLevels.map(level => [
//               level.volume,
//               `${level.discount}%`,
//             ])}
//           />
//         </Box>
//       </Card>

//       <Card>
//         <Box padding="400">
//           <Text variant="headingMd" as="h2">Name</Text>
//         </Box>
//         <Divider />
//         <Box padding="400">
//           <TextField
//             label="Name"
//             value={offerName}
//             onChange={setOfferName}
//             placeholder="Enter the offer name"
//             autoComplete="off"
//           />
//         </Box>
//       </Card>

//       <Card>
//         <Box padding="400">
//           <Text variant="headingMd" as="h2">Apply offer to</Text>
//         </Box>
//         <Divider />
//         <Box padding="400">
//           {selectedProducts.map((product, index) => (
//             <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
//               <Badge>{product.name}</Badge>
//               <Button icon="delete" onClick={() => removeProduct(index)} />
//             </div>
//           ))}
//         <Button onClick={selectProduct} id="select-product">
//           Select product
//         </Button>
//           {/* <Button onClick={() => openResourcePicker()}>Edit products</Button> */}
//           <Banner tone="warning" title="Warning">
//             These products are already used in another offer.
//           </Banner>
//         </Box>
//       </Card>

//       <Card>
//         <Box padding="400">
//           <Text variant="headingMd" as="h2">Discount configuration</Text>
//         </Box>
//         <Divider />
//         {/* <Box padding="400"> */}
//         <Card>
//       {discountLevels.map((level, index) => (
//         <div key={index} style={{ display: 'flex', alignItems: 'end', gap: '8px', marginBottom: '8px' }}>
//           <Button icon={DeleteIcon} onClick={() => handleRemoveDiscountLevel(index)} />

//           <TextField
//             label="Volume"
//             type="number"
//             value={level.volume}
//             onChange={(value) => updateDiscountLevel(index, 'volume', value)}
//             autoComplete="off"
//           />

//           <Select
//             label="Discount Type"
//             labelHidden={true}
//             options={[{ label: '%', value: '%' }, { label: 'Amount', value: 'amount' }]}
//             value={level.discountType}
//             onChange={(value) => updateDiscountLevel(index, 'discountType', value)}
//           />

//           <TextField
//             label="Discount"
//             type="number"
//             value={level.discount}
//             onChange={(value) => updateDiscountLevel(index, 'discount', value)}
//             autoComplete="off"
//           />

//           <TextField
//             label="Description"
//             value={level.description}
//             onChange={(value) => updateDiscountLevel(index, 'description', value)}
//             autoComplete="off"
//           />

//           <TextField
//             label="Label"
//             value={level.label}
//             onChange={(value) => updateDiscountLevel(index, 'label', value)}
//             autoComplete="off"
//             disabled={autoLabels}
//             />
//         </div>
//       ))}
//       <Box>
//       <Button onClick={handleAddDiscountLevel}>Add more</Button>

//       <Checkbox
//         label="Automatic labels (recommended)"
//         checked={autoLabels}
//         onChange={(newChecked) => setAutoLabels(newChecked)}
//       />
//       </Box>
//     </Card>
//       </Card>

//       <Button variant="primary" onClick={() => createFunnel()}>Create</Button>
//     </Page>
//   );
// }

// export default CreateFunnel;

