<p align="center">
  <a href="https://www.medusajs.com">
    <img alt="Medusa" src="https://user-images.githubusercontent.com/7554214/153162406-bf8fd16f-aa98-4604-b87b-e13ab4baf604.png" width="100" />
  </a>
</p>
<h1 align="center">
  Medusa <> Printful
</h1>

<h4 align="center">
  <a href="https://github.com/medusajs/admin">Medusa Admin</a> |
  <a href="https://www.medusajs.com">Website</a> |
  <a href="https://www.medusajs.com/blog">Blog</a> |
  <a href="https://www.linkedin.com/company/medusa-commerce">LinkedIn</a> |
  <a href="https://twitter.com/medusajs">Twitter</a> |
  <a href="https://docs.medusajs.com">Documentation</a> |
  <a href="https://medusajs.notion.site/medusajs/Medusa-Home-3485f8605d834a07949b17d1a9f7eafd">Notion</a>
</h4>

<p align="center">
Medusa is an open-source headless commerce engine empowering developers to do more with less. In this repo, you find Medusa combined with Printful for a powerful customizable setup for on-demand product fulfillment.
</p>
<p align="center">
    <a href="https://www.producthunt.com/posts/medusa"><img src="https://img.shields.io/badge/Product%20Hunt-%231%20Product%20of%20the%20Day-%23DA552E" alt="Product Hunt"></a>
  <a href="https://discord.gg/xpCwq3Kfn8">
    <img src="https://img.shields.io/badge/chat-on%20discord-7289DA.svg" alt="Discord Chat" />
  </a>
  <a href="https://twitter.com/intent/follow?screen_name=medusajs">
    <img src="https://img.shields.io/twitter/follow/medusajs.svg?label=Follow%20@medusajs" alt="Follow @medusajs" />
  </a>
</p>

<h2 align="center">
  **** EXPERIMENTAL ****
</h2>

### Setting up Printful with Medusa
1. **Set up project**
```
git clone https://github.com/olivermrbl/medusa-printful
```
2. **Set up Printful account**
Navigate to [Printful](https://www.printful.com/auth/login) and sign in or create an account
3. **Create a Store**
Choose Stores in the left side bar and create a new one of type **Manual order platform / API**
<img width="600" alt="image" src="https://user-images.githubusercontent.com/59018053/163358557-8f6ffd50-636e-4089-9805-fad25f725f1d.png">
  
4. **Create credentials**
In the left sidebar, choose Settings > API and create an API for the Store created in previous step. Note it down.
<img width="500" alt="Screenshot 2022-04-14 at 11 40 43" src="https://user-images.githubusercontent.com/59018053/163358806-07573a63-336d-410d-aea5-94b750e32b62.png">
 
5. **Set up Medusa**
Navigate to `/backend` (Medusa project) and add the API key to your `.env`.
```
mv .env.template .env 
```
```
...
PRINTFUL_API_KEY=[your-key]
```
6. **Start Medusa**
> At this point, we assume that you have Redis and Postgres running locally. You should have a Postgres DB named `medusa-printful`.

In `/backend`, run the following commands in your terminal to get Medusa up and running:
```shell
yarn

# migrate and seed your database
yarn seed

# start medusa
yarn start
```
Medusa should now be running on `http://localhost:9000`

### Setting up Medusa Admin

We have a prebuilt admin dashboard that you can use to configure and manage your store find it here: [Medusa Admin](https://github.com/medusajs/admin)

1. **Clone this repository**
   ```
   git clone https://github.com/medusajs/admin medusa-admin
   cd medusa-admin
   ```
2. **Install dependencies**
   ```
   yarn install
   ```
3. **Start the development server**
   ```
   yarn start
   ```
4. **Go to [http://localhost:7000](http://localhost:7000)**

Back in your Medusa engine installation directory, you can create your own user for the admin by running:

```
medusa user -e some@email.com -p some-password
```
Alternatively, if you've seeded your server with our dummy data, you can use the following credentials:
```
admin@medusa-test.com // supersecret
```

### Setting up the storefront

In this tutorial, we will be using a simple Next.js storefront. Navigate to `/storefront` and run the following:
```
npm install && npm run dev
```
With your Medusa server and your storefront running, you can open http://localhost:8000 in your browser and view the products in your store, build a cart, add shipping details and pay and complete an order.

### Synchronize products
In order for Printful to sync. products to Medusa, we use webhooks. Those are created on first run of the server. For this to work locally, you need to use a tunnelling service. In this tutorial, we will be using `ngrok`. Make sure you've set that up before proceeding.

1. **Set up `ngrok`**
In a terminal window, start `ngrok` to tunnel traffic to `http://localhost:9000`
```
ngrok http 9000
```
This should give you an https URL. Note it down.
  
<img width="500" alt="image" src="https://user-images.githubusercontent.com/59018053/163358917-9e431e31-615c-4065-b980-0664b3abb3be.png">

2. **Set up Medusa with `ngrok`**
Navigate to `/backend` (Medusa project) and add the URL to your `.env`.
```shell
BACKEND_URL=https://723d386a4a4e.ngrok.io # <- This should be your URL from ngrok
```

3. **Restart your Medusa server**

You should now be ready to syncronize products. Go to you Printful account and create a Product template. Then add the Product to your Printful store created previously. Upon submitting the changes to your store, the product should be syncronized to Medusa. Validate this by going to your Medusa Admin running on `http://localhost:7000`.
                                               
You can now publish the product in your admin, and it should show on the storefront.

### Create an order

Create an order with your Product through the storefront. In Medusa Admin, you should be able to see the order. Upon creating a fulfillment for the product in the order, the integration will create an order in Printful.

**...more to come**
