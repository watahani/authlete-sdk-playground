# Authlete  TypeScript SDK Playground

This sdk playground will help you test TypeScript samples for the [Authlete API](https://docs.authlete.com/en/shared/2.3.0#overview).
Currently, this sdk playground supports Authlete version 2.

This project uses [openapi-for-typescript](https://github.com/authlete/openapi-for-typescript/tree/main).

## Cloning the authlete-sdk-playground Repo

Clone the `authlete-sdk-playground` repository using the following command:

```
git clone https://github.com/kerinkhan/authlete-sdk-playground.git
```

## Configure the  .env file

Configure the values in the .env file to match your Authlete Credentials. You can find this file under authlete-sdk-playground/typescript

```
# In the Authlete web console, navigate to the your services tab and copy your api key and secret
API_KEY=YOUR_API_KEY
API_SECRET=YOUR_API_SECRET
API_TOKEN=YOUR_API_TOKEN


# In the Authlete web console, navigate to the your account tab and copy your api key and secret
ACCOUNT_API_KEY=Your_ACCOUNT_API_KEY
ACCOUNT_API_SECRET=YOUR_ACCOUNT_API_KEY
```
## Start Express Server

Once you have Configured your values, you can now start the server. Use the following command to start the server:

```
npx nodemon src/index.ts
```

This will allow you to change your code and the build at the same time.

You can also use docker to build your server and project. To use docker, go to authlete-sdk-playground/.devcontainer
/TypeScript. Use the following command to start the docker container:

```
docker compose up --build
```

##  Response in browser

To view the API Response for list of services, click on http://localhost:3000/. Your express.js server should be up and running.
