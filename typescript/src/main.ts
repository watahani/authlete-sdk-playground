import { Authlete } from "@authlete/typescript-sdk";

async function main(): Promise<void> {
  console.log("Authlete SDK Playground (TypeScript)");
  const serviceId = process.env.AUTHLETE_SERVICE_APIKEY;

  if (!serviceId) {
    throw new Error("AUTHLETE_SERVICE_APIKEY is not set.");
  }

  const bearer = process.env.AUTHLETE_SERVICE_ACCESSTOKEN;
  if (!bearer) {
    throw new Error("AUTHLETE_SERVICE_ACCESSTOKEN is not set.");
  }
  
  const serverURL = process.env.AUTHLETE_BASE_URL;
  if (!serverURL) {
    throw new Error("AUTHLETE_BASE_URL is not set.");
  }

  const authlete = new Authlete({
    bearer,
    serverURL,
    debugLogger: console, //for debugging purposes
  });

  // Example: List Clients  
  const response = await authlete.client.list({serviceId});
  response.clients?.forEach((client) => {
    console.log(`Client ID: ${client.clientId}, Name: ${client.clientName}`);
  });
}

main().catch((error) => {
  console.error("Authlete SDK call failed:", error);
  process.exitCode = 1;
});
