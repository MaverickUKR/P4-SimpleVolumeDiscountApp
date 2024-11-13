import {
  IndexTable,
  Text,
  Badge,
  Button,
  useBreakpoints,
  Icon,
} from '@shopify/polaris';
import { DeleteIcon, ChartHistogramGrowthIcon } from '@shopify/polaris-icons';
import React from 'react';

function OffersTable() {
  const offers = [
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
  ];

  const resourceName = {
    singular: 'offer',
    plural: 'offers',
  };

  const rowMarkup = offers.map(
    ({ id, name, creationDate, products, status }, index) => (
      <IndexTable.Row id={id} key={id} position={index}>
        <IndexTable.Cell>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Icon source={ChartHistogramGrowthIcon} />
            <Text variant="bodyMd" fontWeight="regular" as="span">
              {name}
            </Text>
          </div>
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
    ),
  );

  return (
    <div style={{margin: "0 30px", overflowX: 'auto'}}>
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
      <div style={{ overflowX: 'auto' }}>
        <style>
          {`
            .Polaris-IndexTable__Table thead th {
              font-weight: bold;
            }
          `}
        </style>
        <IndexTable
          condensed={useBreakpoints().smDown}
          resourceName={resourceName}
          itemCount={offers.length}
          headings={[
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
      </div>
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
