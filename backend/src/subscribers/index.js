class PrintfulSubscriber {
  constructor({ printfulFulfillmentService, eventBusService }) {
    this.printfulFulfillmentService_ = printfulFulfillmentService;

    // eventBusService.subscribe("product.created", this.handleProductCreated);

    eventBusService.subscribe(
      "printful.product_updated",
      this.handleWebhookEvent
    );
  }

  handleWebhookEvent = async (data) => {
    switch (data.type) {
      case "product_updated": {
        await this.printfulFulfillmentService_.upsertProductInMedusa(data.data);
      }
      case "package_shipped": {
        await this.printfulFulfillmentService_.createShipment(data.data);
      }
      default:
        return;
    }
  };
}

export default PrintfulSubscriber;
