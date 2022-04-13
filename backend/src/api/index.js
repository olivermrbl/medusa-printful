import { Router } from "express";
import cors from "cors";
import { Validator } from "medusa-core-utils";
import { projectConfig } from "../../medusa-config";
import bodyParser from "body-parser";

export default () => {
  const router = Router();

  const corsOptions = {
    origin: projectConfig.store_cors.split(","),
    credentials: true,
  };

  router.options("/printful/shipping-rates", cors(corsOptions));
  router.post(
    "/printful/shipping-rates",
    cors(corsOptions),
    async (req, res) => {
      const schema = Validator.object().keys({
        shipping_address: Validator.object().keys({
          address1: Validator.string(),
          city: Validator.string(),
          country_code: Validator.string(),
        }),
        items: Validator.array().items(
          Validator.object().keys({
            quantity: Validator.number(),
            external_variant_id: Validator.string(),
          })
        ),
      });

      const printfulService = req.scope.resolve("printfulFulfillmentService");

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

      const shippingOptions = await printfulService.getShippingRates();

      res.json({
        message: "Welcome to Medusa!",
      });
    }
  );

  router.options("/printful/hook", cors(corsOptions));
  router.post(
    "/printful/hook",
    cors(corsOptions),
    bodyParser.json(),
    async (req, res) => {
      console.log("Data: ", req.body);

      const schema = Validator.object().keys({
        type: Validator.string(),
        created: Validator.number(),
        retries: Validator.number(),
        store: Validator.number(),
        data: Validator.object(),
      });

      const { value, error } = schema.validate(req.body);

      if (error) {
        throw error;
      }

      const eventBus = req.scope.resolve("eventBusService");

      eventBus.emit("printful.product_updated", value);

      res.sendStatus(200);
    }
  );

  return router;
};
