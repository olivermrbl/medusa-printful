import _ from "lodash";
import { FulfillmentService } from "medusa-interfaces";
import { PrintfulClient } from "printful-request";

const backendUrl = process.env.BACKEND_URL || "https://printful.ngrok.io";
const printfulApiKey = process.env.PRINTFUL_API_KEY || "";

class PrintfulFullfilmentService extends FulfillmentService {
  static identifier = "printful";

  constructor({
    manager,
    productService,
    orderService,
    productVariantService,
    shippingProfileService,
  }) {
    super();

    this.productService_ = productService;
    this.orderService_ = orderService;
    this.productVariantService_ = productVariantService;
    this.manager_ = manager;
    this.shippingProfileService_ = shippingProfileService;

    this.printfulClient_ = new PrintfulClient(printfulApiKey);
  }

  getFulfillmentOptions() {
    return [
      { id: "Standard", printful_id: "STANDARD" },
      { id: "Express", printful_id: "PRINTFUL_FAST" },
    ];
  }

  canCalculate() {
    return true;
  }

  validateFulfillmentData(optionData, data, _) {
    return {
      ...optionData,
      ...data,
    };
  }

  validateOption() {
    return true;
  }

  async getShippingRates({ recipient, items }) {
    const rates = await this.printfulClient_
      .post("shipping/rates", { recipient, items })
      .then(({ result }) => result);

    return rates.map((r) => ({
      id: r.name,
      printful_id: r.id,
      name: r.name,
      min_delivery_days: r.minDeliveryDays,
      max_delivery_days: r.maxDeliveryDays,
    }));
  }

  async createWebhooks() {
    const types = [
      "product_updated",
      "order_canceled",
      "order_updated",
      "order_created",
      "package_shipped",
    ];

    const currentConfig = await this.printfulClient_
      .get("webhooks")
      .then(({ result }) => result);

    // if webhooks are already configured, return early
    if (currentConfig.types === types) {
      return;
    }

    const url = `${backendUrl}/printful/hook`;

    try {
      return await this.printfulClient_.post("webhooks", { types, url });
    } catch (error) {
      console.log(error);
    }
  }

  addVariantOptions_(variant, productOptions) {
    const options = productOptions.map((o, i) => ({
      option_id: o.id,
      ...variant.options[i],
    }));
    variant.options = options;

    return variant;
  }

  async upsertProductInMedusa(data) {
    return this.atomicPhase_(async (manager) => {
      const exists = await this.productService_
        .withTransaction(manager)
        .list({ handle: _.kebabCase(data.name) });

      // if the product already exist, we update
      if (exists?.length) {
        // TODO: call update
        return;
      }

      const { sync_product, sync_variants } = await this.printfulClient_
        .get(`store/products/${data.sync_product.id}`)
        .then(({ result }) => result);

      let shippingProfile =
        await this.shippingProfileService_.retrieveDefault();

      const productData = {
        title: sync_product.name,
        handle: _.kebabCase(sync_product.name),
        thumbnail: sync_product.thumbnail_url,
        options: [{ title: "Printful variant" }],
        profile_id: shippingProfile.id,
        metadata: {
          printful_id: sync_product.id,
        },
      };

      const variantsData = sync_variants.map((v) => {
        const varOption = `${v.variant_id}`;

        return {
          title: v.name,
          inventory_quantity: 100,
          manage_inventory: false,
          allow_backorder: true,
          sku: v.sku,
          options: [
            {
              value: varOption,
            },
          ],
          prices: [
            {
              currency_code: v.currency,
              amount: parseInt(v.retail_price, 10) * 100,
            },
          ],
          metadata: {
            printful_id: v.id,
          },
        };
      });

      const product = await this.productService_
        .withTransaction(manager)
        .create(productData);

      let variants = variantsData;

      variants = variants.map((v) =>
        this.addVariantOptions_(v, product.options)
      );

      for (const variant of variants) {
        await this.productVariantService_
          .withTransaction(manager)
          .create(product.id, variant);
      }
    });
  }

  async createFulfillment(methodData, fulfillmentItems, order, fulfillment) {
    const { shipping_address } = order;

    const addr = {
      name: `${shipping_address.first_name} ${shipping_address.last_name}`,
      address1: shipping_address.address_1,
      address2: shipping_address.address_2,
      zip: shipping_address.postal_code,
      city: shipping_address.city,
      state_code: shipping_address.provence,
      country_code: shipping_address.country_code.toUpperCase(),
      phone: shipping_address.phone,
      email: order.email,
    };

    const printfulItems = fulfillmentItems.map((item) => ({
      external_id: item.id,
      sync_variant_id: item.variant.metadata.printful_id,
      quantity: item.quantity,
    }));

    const newOrder = {
      external_id: order.id,
      items: printfulItems,
      recipient: addr,
      shipping: methodData.printful_id,
    };

    return this.printfulClient_
      .post("orders", newOrder)
      .then(({ result }) => result);
  }

  async createShipment(data) {
    const { shipment, order } = data;

    const orderId = order.order.external_id;

    const medusaOrder = await this.orderService_.retrieve(orderId, {
      relations: ["fulfillments"],
    });

    const fulfillment = medusaOrder.fulfillments[0];

    const trackingLinks = [
      {
        url: shipment.tracking_url,
        tracking_number: shipment.tracking_number,
      },
    ];

    return this.orderService_.createShipment(
      orderId,
      fulfillment.id,
      trackingLinks
    );
  }
}

export default PrintfulFullfilmentService;
