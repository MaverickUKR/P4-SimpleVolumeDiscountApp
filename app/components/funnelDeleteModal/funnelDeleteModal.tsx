import { Modal, Text } from "@shopify/polaris";

type DeleteModalProps = {
  active: boolean;
  onClose: () => void;
  onConfirm: () => void;
  funnelName?: string;
};

const DeleteModal: React.FC<DeleteModalProps> = ({
  active,
  onClose,
  onConfirm,
  funnelName,
}) => {
  return (
    <Modal
      open={active}
      onClose={onClose}
      title="Delete Funnel"
      primaryAction={{
        content: "Delete",
        destructive: true,
        onAction: onConfirm,
      }}
      secondaryActions={[
        {
          content: "Cancel",
          onAction: onClose,
        },
      ]}
    >
      <Modal.Section>
        <Text as="span">
          Are you sure you want to delete the funnel{" "}
          <strong>{funnelName}</strong>? This action cannot be undone.
        </Text>
      </Modal.Section>
    </Modal>
  );
};

export default DeleteModal;
