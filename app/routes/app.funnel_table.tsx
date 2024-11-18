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
  // const offers: Offer[] = useMemo(
  //   () => [
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
  //     {
  //       id: '3',
  //       name: 'My second offer',
  //       creationDate: '19/09/2023',
  //       products: 15,
  //       status: 'Active',
  //     },
  //     {
  //       id: '4',
  //       name: 'My third offer',
  //       creationDate: '19/10/2023',
  //       products: 20,
  //       status: 'Active',
  //     },
  //     {
  //       id: '5',
  //       name: 'My forth offer',
  //       creationDate: '19/11/2023',
  //       products: 25,
  //       status: 'Active',
  //     },
  //     {
  //       id: '6',
  //       name: 'My fifth offer',
  //       creationDate: '19/012/2023',
  //       products: 30,
  //       status: 'Active',
  //     },
  //   ],
  //   []
  // );

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
