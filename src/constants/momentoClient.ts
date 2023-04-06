import {
  CacheGet,
  CreateCache,
  CacheSet,
  CacheClient,
  Configurations,
  CredentialProvider,
} from "@gomomento/sdk";

export const momento = new CacheClient({
  configuration: Configurations.Laptop.v1(),
  credentialProvider: CredentialProvider.fromEnvironmentVariable({
    environmentVariableName: "MOMENTO_AUTH_TOKEN",
  }),
  defaultTtlSeconds: 1800,
});

// main()
//   .then(() => {
//     console.log("success!!");
//   })
//   .catch((e: Error) => {
//     console.error(`Uncaught exception while running example: ${e.message}`);
//     throw e;
//   });
