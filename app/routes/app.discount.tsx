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
import { DeleteIcon, ChartHistogramGrowthIcon, SearchIcon } from '@shopify/polaris-icons';

type Offer = {
  id: string;
  name: string;
  creationDate: string;
  products: number;
  status: string;
};

function OffersTable() {
  const offers: Offer[] = useMemo(
    () => [
      {
        id: '1',
        name: 'ATOP DISCOUNT SCHEDULE - TRANSCEIVERS',
        creationDate: '30/08/2023',
        products: 5,
        status: 'Active',
      },
      {
        id: '2',
        name: 'My first offer',
        creationDate: '19/08/2023',
        products: 10,
        status: 'Active',
      },
      {
        id: '3',
        name: 'My second offer',
        creationDate: '19/09/2023',
        products: 15,
        status: 'Active',
      },
      {
        id: '4',
        name: 'My third offer',
        creationDate: '19/10/2023',
        products: 20,
        status: 'Active',
      },
      {
        id: '5',
        name: 'My forth offer',
        creationDate: '19/11/2023',
        products: 25,
        status: 'Active',
      },
      {
        id: '6',
        name: 'My fifth offer',
        creationDate: '19/012/2023',
        products: 30,
        status: 'Active',
      },
    ],
    []
  );

  const resourceName = {
    singular: 'offer',
    plural: 'offers',
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  // Фильтрация по поисковому запросу
  const filteredOffers = useMemo(
    () =>
      offers.filter((offer) =>
        offer.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [searchQuery, offers]
  );

  // Пагинация
  const totalPages = Math.ceil(filteredOffers.length / rowsPerPage);
  const displayedOffers = filteredOffers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

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
          <Button icon={DeleteIcon} variant="primary" tone="critical" />
        </IndexTable.Cell>
      </IndexTable.Row>
    )
  );

  const handleSearchChange = (value: SetStateAction<string>) => {
    setSearchQuery(value);
    setCurrentPage(1); // Сбросить на первую страницу при новом поиске
  };

  return (
    <div style={{ margin: "0 30px", overflowX: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: "16px 0" }}>
        <Text variant="headingMd" as="span">Offers list</Text>
        <Button
          variant="primary"
          tone="success"
          onClick={() => {}}
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


// import {
//   Card,
//   Page,
//   Layout,
//   Text,
//   Button,
//   ResourceList,
//   Badge,
//   Box
// } from '@shopify/polaris';
// import { DeleteIcon } from '@shopify/polaris-icons';

// function Dashboard() {
//   const offers = [
//     {
//       id: '1',
//       name: 'ATOP DISCOUNT SCHEDULE - TRANSCEIVERS',
//       creationDate: '30/08/2023',
//       products: 5,
//       status: 'Active',
//     },
//     {
//       id: '2',
//       name: 'My first offer',
//       creationDate: '19/08/2023',
//       products: 10,
//       status: 'Active',
//     },
//   ];

//   return (
//     <Page title="Offers Dashboard">
//       <Layout>
//         {/* Top summary section */}
//         {/* <Layout.Section>
//           <Card>
//             <Card>
//               <Text variant="headingLg" as="h3">Total items ordered</Text>
//               <Text variant="bodyMd" as="p" fontWeight="bold">0</Text>
//             </Card>
//           </Card>
//         </Layout.Section>
//         <Layout.Section>
//           <Card>
//             <Card>
//               <Text variant="headingLg" as="h3">Total sales</Text>
//               <Text variant="bodyMd" as="p" fontWeight="bold">0$</Text>
//             </Card>
//           </Card>
//         </Layout.Section>
//         <Layout.Section>
//           <Card>
//             <Card>
//               <Text variant="headingLg" as="h3">Total discounts</Text>
//               <Text variant="bodyMd" as="p" fontWeight="bold">0$</Text>
//             </Card>
//           </Card>
//         </Layout.Section> */}

//         {/* Offers list section */}
//         <Layout.Section>
//           <Box>
//           <Button
//               variant="primary"
//               onClick={() => {}}
//               tone="success"
//               accessibilityLabel="Create new"
//             >
//               Create new
//             </Button>
//           </Box>
//           <Card>
//             <Text variant="headingLg" as="h3">Offers list</Text>
//             <ResourceList
//               resourceName={{ singular: 'offer', plural: 'offers' }}
//               items={offers}
//               renderItem={(offer) => {
//                 const { id, name, creationDate, products, status } = offer;
//                 return (
//                   <ResourceList.Item
//                     onClick={() => {}}
//                     id={id}
//                     accessibilityLabel={`View details for ${name}`}
//                   >
//                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                       <div style={{ flex: 3 }}>
//                         <Text variant="bodyMd" fontWeight="bold" as={'p'}>{name}</Text>
//                       </div>
//                       <div style={{ flex: 1, textAlign: 'center' }}>{creationDate}</div>
//                       <div style={{ flex: 1, textAlign: 'center' }}>{products}</div>
//                       <div style={{ flex: 1, textAlign: 'center' }}>
//                         <Badge tone="success">{status}</Badge>
//                       </div>
//                       <div style={{ flex: 1, textAlign: 'center' }}>
//                         <Button icon={DeleteIcon} variant="primary" tone="critical" />
//                       </div>
//                     </div>
//                   </ResourceList.Item>
//                 );
//               }}
//             />
//           </Card>
//         </Layout.Section>
//       </Layout>
//     </Page>
//   );
// }

// export default Dashboard;
