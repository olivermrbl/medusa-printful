const createWebhooks = async (container) => {
  const printfulFulfillmentService = container.resolve(
    "printfulFulfillmentService"
  );

  await printfulFulfillmentService.createWebhooks();
};

export default createWebhooks;
