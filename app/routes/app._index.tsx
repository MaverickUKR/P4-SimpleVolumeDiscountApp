//source/app/routes/app.funnel_table.tsx
import { useState, useMemo } from 'react';
import type {SetStateAction} from 'react';
import {
  IndexTable,
  Text,
  Badge,
  Button,
  Icon,
  TextField,
  Pagination,
  Box,
  useBreakpoints
} from '@shopify/polaris';
import { json } from "@remix-run/node";
import { DeleteIcon, ChartHistogramGrowthIcon, SearchIcon } from '@shopify/polaris-icons';
import { useFetcher, useLoaderData, useNavigate } from '@remix-run/react';
import { getAdminContext } from 'app/shopify.server';

type Offer = {
  id: string;
  name: string;
  creationDate: string;
  products: number;
  status: string;
};

export async function loader() {
  // Fetch offers data from the database
  const offers = await prisma.funnel.findMany({
    include: {
      products: true,
    },
  });

  // Map offers to the required format
  const formattedOffers = offers.map((offer) => ({
    id: offer.id.toString(),
    name: offer.name,
    creationDate: new Date(offer.createdAt).toLocaleDateString(),
    products: offer.products.length,
    status: offer.autoLabels ? "Active" : "Inactive",
  }));

  return { offers: formattedOffers };
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const funnelId = parseInt(formData.get('funnelId') as string, 10);

  if (!funnelId) {
    return json({ error: 'Invalid Funnel ID' }, { status: 400 });
  }

  try {
    const adminContext = await getAdminContext(request);
    const admin = adminContext.admin;

    // Найти воронку
    const funnel = await prisma.funnel.findUnique({
      where: { id: funnelId },
      include: { products: true },
    });

    if (!funnel) {
      return json({ error: 'Funnel not found' }, { status: 404 });
    }

    // Удаление всех метафилдов продуктов
    for (const product of funnel.products) {
      const metafieldQuery = `
        query {
          product(id: "${product.shopifyId}") {
            metafields(first: 100) {
              edges {
                node {
                  id
                  key
                  namespace
                }
              }
            }
          }
        }
        `;
      console.log("metafieldQuery", metafieldQuery)
      const metafieldResponse: any = await admin.graphql(metafieldQuery);
      console.log("metafieldResponse", metafieldResponse)
      const metafieldResponseJson = await metafieldResponse.json();
      console.log("metafieldResponseJson", metafieldResponseJson)
      const allMetafields = metafieldResponseJson?.data?.product?.metafields?.edges || [];
      // Фильтруем метафилды
      console.log("allMetafields", allMetafields)
      const metafields = allMetafields.filter(
        (metafield: any) => metafield.node.namespace === "discount_data"
      );
      console.log("metafields", metafields)
      if (metafields.length > 0) {
        const metafieldsToDelete = metafields.map((metafield: any) => ({
          key: metafield.node.key,
          namespace: metafield.node.namespace,
          ownerId: `${product.shopifyId}`,
        }));
        console.log("metafieldsToDelete", metafieldsToDelete)
        const deleteQuery = `
          mutation metafieldsDelete($metafields: [MetafieldIdentifierInput!]!) {
            metafieldsDelete(metafields: $metafields) {
              deletedMetafields {
                key
                namespace
                ownerId
              }
              userErrors {
                field
                message
              }
            }
          }
        `;

        const deleteResponse: any = await admin.graphql(deleteQuery, {
          variables: { metafields: metafieldsToDelete },
        });

        if (deleteResponse?.data?.metafieldsDelete?.userErrors?.length) {
          console.error(
            `Errors while deleting metafields for product ${product.shopifyId}:`,
            deleteResponse.data.metafieldsDelete.userErrors
          );
        } else {
          console.log(
            `Metafields deleted successfully for product ${product.shopifyId}`
          );
        }
      } else {
        console.warn(
          `No metafields found for product ${product.shopifyId} in namespace "discount_data".`
        );
      }
    }

    // Удаление самой воронки
    await prisma.funnel.delete({
      where: { id: funnelId },
    });

    return json({ success: true });
  } catch (error) {
    console.error('Error deleting funnel:', error);
    return json({ error: 'Failed to delete funnel' }, { status: 500 });
  }
}


function OffersTable() {

  const resourceName = {
    singular: 'offer',
    plural: 'offers',
  };

  const { offers } = useLoaderData<{ offers: Offer[] }>();
  const fetcher = useFetcher();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;
  const navigate = useNavigate();

  const filteredOffers = useMemo(
    () => offers.filter((offer) => offer.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [searchQuery, offers]
  );

  const totalPages = Math.ceil(filteredOffers.length / rowsPerPage);
  const displayedOffers = filteredOffers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleDelete = (funnelId: string) => {
    if (confirm('Are you sure you want to delete this funnel?')) {
      fetcher.submit({ funnelId }, { method: "post" });
    }
  };

  const rowMarkup = displayedOffers.map(
    ({ id, name, creationDate, products, status }, index) => (
      <IndexTable.Row id={id} key={id} position={index}>
        <IndexTable.Cell>
          <Icon source={ChartHistogramGrowthIcon} />
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="regular" as="span">
            {name}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>{creationDate}</IndexTable.Cell>
        <IndexTable.Cell>{products}</IndexTable.Cell>
        <IndexTable.Cell>
          <Badge tone="success">{status}</Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Button icon={DeleteIcon} variant="primary" tone="critical" onClick={() => handleDelete(id)}/>
        </IndexTable.Cell>
      </IndexTable.Row>
    )
  );

  const handleSearchChange = (value: SetStateAction<string>) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleCreateFunnelRedirect = () => {
    navigate("/app/create_funnel");
  };

  return (
    <div style={{ margin: "0 30px", overflowX: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: "16px 0" }}>
        <Text variant="headingMd" as="span">Offers list</Text>
        <Button
          variant="primary"
          tone="success"
          onClick={handleCreateFunnelRedirect}
          accessibilityLabel="Create new"
        >
          Create new
        </Button>
      </div>
      <Box paddingInline="300">
      <TextField
        label="Search offers"
        value={searchQuery}
        onChange={handleSearchChange}
        placeholder="Search by funnel name"
        autoComplete="off"
        clearButton
        onClearButtonClick={() => setSearchQuery('')}
        prefix={<Icon source={SearchIcon} />}
      />
      </Box>
        <Box paddingBlock="300">
        <IndexTable
          condensed={useBreakpoints().smDown}
          resourceName={resourceName}
          itemCount={filteredOffers.length}
          headings={[
            { title: '' },
            { title: 'Funnel name' },
            { title: 'Creation date' },
            { title: 'Products' },
            { title: 'Status' },
            { title: 'Actions' },
          ]}
          selectable={false}
        >
          {rowMarkup}
        </IndexTable>
        </Box>

      <Box padding="400" background="bg">
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "16px" }}>
        <Pagination
          hasPrevious={currentPage > 1}
          onPrevious={() => setCurrentPage(currentPage - 1)}
          hasNext={currentPage < totalPages}
          onNext={() => setCurrentPage(currentPage + 1)}
        />
        <Text as="span" variant="bodyMd">
          Page {currentPage} of {totalPages}
        </Text>
        </div>
      </Box>

    </div>
  );
}

export default OffersTable;
// import { useState, useMemo } from 'react';
// import type {SetStateAction} from 'react';
// import {
//   IndexTable,
//   Text,
//   Badge,
//   Button,
//   Icon,
//   TextField,
//   Pagination,
//   Box,
//   useBreakpoints,
// } from '@shopify/polaris';
// import { DeleteIcon, ChartHistogramGrowthIcon, SearchIcon } from '@shopify/polaris-icons';
// import { useFetcher, useLoaderData, useNavigate } from '@remix-run/react';
// import DeleteModal from "../components/funnelDeleteModal/funnelDeleteModal";
// import {funnelAction} from "../api/actions/funnel_table.action";
// import {funnelLoader} from "../api/loaders/funnel_table.loader";

// type Offer = {
//   id: string;
//   name: string;
//   creationDate: string;
//   products: number;
//   status: string;
// };

// export const loader = funnelLoader;
// export const action = funnelAction;

// function OffersTable() {

//   const resourceName = {
//     singular: 'offer',
//     plural: 'offers',
//   };

//   const { offers } = useLoaderData<{ offers: Offer[] }>();
//   const fetcher = useFetcher();
//   const [searchQuery, setSearchQuery] = useState('');
//   const [currentPage, setCurrentPage] = useState(1);
//   const [modalActive, setModalActive] = useState(false);
//   const [funnelToDelete, setFunnelToDelete] = useState<Offer | null>(null);
//   const rowsPerPage = 5;
//   const navigate = useNavigate();

//   const filteredOffers = useMemo(
//     () => offers.filter((offer) => offer.name.toLowerCase().includes(searchQuery.toLowerCase())),
//     [searchQuery, offers]
//   );

//   const totalPages = Math.ceil(filteredOffers.length / rowsPerPage);
//   const displayedOffers = filteredOffers.slice(
//     (currentPage - 1) * rowsPerPage,
//     currentPage * rowsPerPage
//   );

//   const openDeleteModal = (funnel: Offer) => {
//     setFunnelToDelete(funnel);
//     setModalActive(true);
//   };

//   const closeDeleteModal = () => {
//     setModalActive(false);
//     setFunnelToDelete(null);
//   };

//   const confirmDelete = () => {
//     if (funnelToDelete) {
//       fetcher.submit({ funnelId: funnelToDelete.id }, { method: "post" });
//       closeDeleteModal();
//     }
//   };

//   const rowMarkup = displayedOffers.map(
//     ({ id, name, creationDate, products, status }, index) => (
//       <IndexTable.Row id={id} key={id} position={index}>
//         <IndexTable.Cell>
//           <Icon source={ChartHistogramGrowthIcon} />
//         </IndexTable.Cell>
//         <IndexTable.Cell>
//           <Text variant="bodyMd" fontWeight="regular" as="span">
//             {name}
//           </Text>
//         </IndexTable.Cell>
//         <IndexTable.Cell>{creationDate}</IndexTable.Cell>
//         <IndexTable.Cell>{products}</IndexTable.Cell>
//         <IndexTable.Cell>
//           <Badge tone="success">{status}</Badge>
//         </IndexTable.Cell>
//         <IndexTable.Cell>
//           <Button
//           icon={DeleteIcon}
//           variant="primary"
//           tone="critical"
//           onClick={() => openDeleteModal({ id, name, creationDate, products, status })}
//         />
//         </IndexTable.Cell>
//       </IndexTable.Row>
//     )
//   );

//   const handleSearchChange = (value: SetStateAction<string>) => {
//     setSearchQuery(value);
//     setCurrentPage(1);
//   };

//   const handleCreateFunnelRedirect = () => {
//     navigate("/app/create_funnel");
//   };

//   return (
//     <div style={{ margin: "0 30px", overflowX: 'auto' }}>
//       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: "16px 0" }}>
//         <Text variant="headingMd" as="span">Offers list</Text>
//         <Button
//           variant="primary"
//           tone="success"
//           onClick={handleCreateFunnelRedirect}
//           accessibilityLabel="Create new"
//         >
//           Create new
//         </Button>
//       </div>
//       <Box paddingInline="300">
//       <TextField
//         label="Search offers"
//         value={searchQuery}
//         onChange={handleSearchChange}
//         placeholder="Search by funnel name"
//         autoComplete="off"
//         clearButton
//         onClearButtonClick={() => setSearchQuery('')}
//         prefix={<Icon source={SearchIcon} />}
//       />
//       </Box>
//         <Box paddingBlock="300">
//         <IndexTable
//           condensed={useBreakpoints().smDown}
//           resourceName={resourceName}
//           itemCount={filteredOffers.length}
//           headings={[
//             { title: '' },
//             { title: 'Funnel name' },
//             { title: 'Creation date' },
//             { title: 'Products' },
//             { title: 'Status' },
//             { title: 'Actions' },
//           ]}
//           selectable={false}
//         >
//           {rowMarkup}
//         </IndexTable>
//         </Box>

//       <Box padding="400" background="bg">
//       <div style={{ display: "flex", justifyContent: "space-between", marginTop: "16px" }}>
//         <Pagination
//           hasPrevious={currentPage > 1}
//           onPrevious={() => setCurrentPage(currentPage - 1)}
//           hasNext={currentPage < totalPages}
//           onNext={() => setCurrentPage(currentPage + 1)}
//         />
//         <Text as="span" variant="bodyMd">
//           Page {currentPage} of {totalPages}
//         </Text>
//         </div>
//       </Box>
//      <DeleteModal
//         active={modalActive}
//         onClose={closeDeleteModal}
//         onConfirm={confirmDelete}
//         funnelName={funnelToDelete?.name}
//       />
//     </div>
//   );
// }

// export default OffersTable;


// import { useState, useMemo } from 'react';
// import type {SetStateAction} from 'react';
// import {
//   IndexTable,
//   Text,
//   Badge,
//   Button,
//   Icon,
//   TextField,
//   Pagination,
//   Box,
//   useBreakpoints
// } from '@shopify/polaris';
// import { json } from "@remix-run/node";
// import { DeleteIcon, ChartHistogramGrowthIcon, SearchIcon } from '@shopify/polaris-icons';
// import { useFetcher, useLoaderData, useNavigate } from '@remix-run/react';

// type Offer = {
//   id: string;
//   name: string;
//   creationDate: string;
//   products: number;
//   status: string;
// };

// export async function loader() {
//   // Fetch offers data from the database
//   const offers = await prisma.funnel.findMany({
//     include: {
//       products: true,
//     },
//   });

//   // Map offers to the required format
//   const formattedOffers = offers.map((offer) => ({
//     id: offer.id.toString(),
//     name: offer.name,
//     creationDate: new Date(offer.createdAt).toLocaleDateString(),
//     products: offer.products.length,
//     status: offer.autoLabels ? "Active" : "Inactive",
//   }));

//   return { offers: formattedOffers };
// }

// export async function action({ request }: { request: Request }) {
//   const formData = await request.formData();
//   const funnelId = parseInt(formData.get('funnelId') as string, 10);

//   if (!funnelId) {
//     return json({ error: 'Invalid Funnel ID' }, { status: 400 });
//   }

//   try {
//     await prisma.funnel.delete({
//       where: { id: funnelId },
//     });

//     return json({ success: true });
//   } catch (error) {
//     console.error('Error deleting funnel:', error);
//     return json({ error: 'Failed to delete funnel' }, { status: 500 });
//   }
// }

// function OffersTable() {

//   const resourceName = {
//     singular: 'offer',
//     plural: 'offers',
//   };

//   const { offers } = useLoaderData<{ offers: Offer[] }>();
//   const fetcher = useFetcher();
//   const [searchQuery, setSearchQuery] = useState('');
//   const [currentPage, setCurrentPage] = useState(1);
//   const rowsPerPage = 5;
//   const navigate = useNavigate();

//   const filteredOffers = useMemo(
//     () => offers.filter((offer) => offer.name.toLowerCase().includes(searchQuery.toLowerCase())),
//     [searchQuery, offers]
//   );

//   const totalPages = Math.ceil(filteredOffers.length / rowsPerPage);
//   const displayedOffers = filteredOffers.slice(
//     (currentPage - 1) * rowsPerPage,
//     currentPage * rowsPerPage
//   );

//   const handleDelete = (funnelId: string) => {
//     if (confirm('Are you sure you want to delete this funnel?')) {
//       fetcher.submit({ funnelId }, { method: "post" });
//     }
//   };

//   const rowMarkup = displayedOffers.map(
//     ({ id, name, creationDate, products, status }, index) => (
//       <IndexTable.Row id={id} key={id} position={index}>
//         <IndexTable.Cell>
//           <Icon source={ChartHistogramGrowthIcon} />
//         </IndexTable.Cell>
//         <IndexTable.Cell>
//           <Text variant="bodyMd" fontWeight="regular" as="span">
//             {name}
//           </Text>
//         </IndexTable.Cell>
//         <IndexTable.Cell>{creationDate}</IndexTable.Cell>
//         <IndexTable.Cell>{products}</IndexTable.Cell>
//         <IndexTable.Cell>
//           <Badge tone="success">{status}</Badge>
//         </IndexTable.Cell>
//         <IndexTable.Cell>
//           <Button icon={DeleteIcon} variant="primary" tone="critical" onClick={() => handleDelete(id)}/>
//         </IndexTable.Cell>
//       </IndexTable.Row>
//     )
//   );

//   const handleSearchChange = (value: SetStateAction<string>) => {
//     setSearchQuery(value);
//     setCurrentPage(1);
//   };

//   const handleCreateFunnelRedirect = () => {
//     navigate("/app/create_funnel");
//   };

//   return (
//     <div style={{ margin: "0 30px", overflowX: 'auto' }}>
//       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: "16px 0" }}>
//         <Text variant="headingMd" as="span">Offers list</Text>
//         <Button
//           variant="primary"
//           tone="success"
//           onClick={handleCreateFunnelRedirect}
//           accessibilityLabel="Create new"
//         >
//           Create new
//         </Button>
//       </div>
//       <Box paddingInline="300">
//       <TextField
//         label="Search offers"
//         value={searchQuery}
//         onChange={handleSearchChange}
//         placeholder="Search by funnel name"
//         autoComplete="off"
//         clearButton
//         onClearButtonClick={() => setSearchQuery('')}
//         prefix={<Icon source={SearchIcon} />}
//       />
//       </Box>
//         <Box paddingBlock="300">
//         <IndexTable
//           condensed={useBreakpoints().smDown}
//           resourceName={resourceName}
//           itemCount={filteredOffers.length}
//           headings={[
//             { title: '' },
//             { title: 'Funnel name' },
//             { title: 'Creation date' },
//             { title: 'Products' },
//             { title: 'Status' },
//             { title: 'Actions' },
//           ]}
//           selectable={false}
//         >
//           {rowMarkup}
//         </IndexTable>
//         </Box>

//       <Box padding="400" background="bg">
//       <div style={{ display: "flex", justifyContent: "space-between", marginTop: "16px" }}>
//         <Pagination
//           hasPrevious={currentPage > 1}
//           onPrevious={() => setCurrentPage(currentPage - 1)}
//           hasNext={currentPage < totalPages}
//           onNext={() => setCurrentPage(currentPage + 1)}
//         />
//         <Text as="span" variant="bodyMd">
//           Page {currentPage} of {totalPages}
//         </Text>
//         </div>
//       </Box>

//     </div>
//   );
// }

// export default OffersTable;
